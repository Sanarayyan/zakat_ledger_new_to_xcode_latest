import json
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from threading import Event
from time import monotonic, sleep
from unittest.mock import patch
from uuid import uuid4

from django.core import signing
from django.db import connection, connections
from django.db.models import QuerySet
from django.test import TestCase, TransactionTestCase, override_settings, skipUnlessDBFeature
from django.utils import timezone
from rest_framework.test import APIClient

from . import views
from .authentication import issue_session, token_hash
from .models import AccessSession, ZakatCalculation, AccountDeletionReceipt
from .calculations import calculate
from .views import calculate_cattle_zakat


def run_zakat_calculation(data):
    try:
        return calculate(data, calculate_cattle_zakat)[0], None
    except ValueError as error:
        return None, str(error)


def payload(**changes):
    return {'category': 'money', 'yearType': 'islamic', 'currency': 'INR', 'cash': '10000',
            'goldRate': '100', 'goldRateSource': 'manual', 'goldRateCheckedAt': timezone.now().isoformat(),
            'hasHawl': True, 'requestId': str(uuid4()), **changes}


class DeletionRecoveryTests(TestCase):
    def test_receipt_allows_lost_response_retry_but_cannot_delete_new_account_data(self):
        client = APIClient()
        token, session = issue_session('deletion@example.test', 'deletion-subject')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        operation = str(uuid4())
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': operation}, format='json').status_code, 200)
        self.assertFalse(AccessSession.objects.filter(pk=session.pk).exists())
        self.assertEqual(AccountDeletionReceipt.objects.count(), 1)
        client.credentials()
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': operation}, format='json').status_code, 200)
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': str(uuid4())}, format='json').status_code, 401)
        new_token, new_session = issue_session('deletion@example.test', 'deletion-subject')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_token}')
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': operation}, format='json').status_code, 200)
        self.assertTrue(AccessSession.objects.filter(pk=new_session.pk).exists())

    def test_invalid_or_unauthorized_operation_cannot_create_receipt(self):
        client = APIClient()
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': 'invalid'}, format='json').status_code, 400)
        self.assertEqual(client.delete('/api/account/data/', {'deletionId': str(uuid4())}, format='json').status_code, 401)
        self.assertEqual(AccountDeletionReceipt.objects.count(), 0)

    def test_cloud_failure_rolls_back_data_and_does_not_create_receipt(self):
        from .models import GoogleIdentity
        client = APIClient()
        token, session = issue_session('rollback@example.test', 'rollback-subject')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        # Fault injection exercises the real database transaction; successful responses are never fabricated.
        delete = QuerySet.delete

        def fail_identity_delete(queryset):
            if queryset.model is GoogleIdentity:
                raise RuntimeError('disk unavailable')
            return delete(queryset)

        with patch.object(QuerySet, 'delete', fail_identity_delete):
            with self.assertRaises(RuntimeError):
                client.delete('/api/account/data/', {'deletionId': str(uuid4())}, format='json')
        self.assertTrue(AccessSession.objects.filter(pk=session.pk).exists())
        self.assertFalse(AccountDeletionReceipt.objects.exists())


class AccountDeletionConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.email = 'race@example.test'
        self.save_token, _ = issue_session(self.email, 'race-subject')
        self.delete_token, _ = issue_session(self.email, 'race-subject')
        self.deletion_id = str(uuid4())
        self.assertEqual(self.request(self.save_token, 'post', '/api/calculations/', payload()), 201)

    def request(self, token, method, path, data):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return getattr(client, method)(path, data, format='json').status_code

    def save(self):
        return self.request(self.save_token, 'post', '/api/calculations/', payload())

    def delete(self):
        return self.request(self.delete_token, 'delete', '/api/account/data/', {'deletionId': self.deletion_id})

    @staticmethod
    def run_worker(operation):
        try:
            return operation()
        finally:
            connections.close_all()

    def assert_deleted(self):
        self.assertFalse(ZakatCalculation.objects.filter(user_email=self.email).exists())
        self.assertFalse(AccessSession.objects.filter(user_email=self.email).exists())
        self.assertTrue(AccountDeletionReceipt.objects.filter(pk=self.deletion_id).exists())

    def test_save_authorized_before_deletion_cannot_write_after_it(self):
        authorized, resume = Event(), Event()
        calculate = views.calculate

        def pause_save(*args):
            authorized.set()
            if not resume.wait(10):
                raise TimeoutError('Save was not resumed')
            return calculate(*args)

        with patch.object(views, 'calculate', side_effect=pause_save), ThreadPoolExecutor() as workers:
            save = workers.submit(self.run_worker, self.save)
            try:
                self.assertTrue(authorized.wait(10))
                self.assertEqual(self.delete(), 200)
            finally:
                resume.set()
            self.assertEqual(save.result(timeout=10), 401)
        self.assert_deleted()

    @skipUnlessDBFeature('has_select_for_update')
    def test_deletion_waits_for_write_and_removes_the_committed_save(self):
        written, resume, deleting = Event(), Event(), Event()
        get_or_create = ZakatCalculation.objects.get_or_create
        delete_pid = None

        def pause_after_write(*args, **kwargs):
            result = get_or_create(*args, **kwargs)
            written.set()
            if not resume.wait(10):
                raise TimeoutError('Write transaction was not resumed')
            return result

        def delete_on_worker():
            nonlocal delete_pid
            with connection.cursor() as cursor:
                cursor.execute('SELECT pg_backend_pid()')
                delete_pid = cursor.fetchone()[0]
            deleting.set()
            return self.delete()

        with patch.object(ZakatCalculation.objects, 'get_or_create', side_effect=pause_after_write), ThreadPoolExecutor() as workers:
            save = workers.submit(self.run_worker, self.save)
            try:
                self.assertTrue(written.wait(10))
                deletion = workers.submit(self.run_worker, delete_on_worker)
                self.assertTrue(deleting.wait(10))
                deadline = monotonic() + 5
                while monotonic() < deadline:
                    with connection.cursor() as cursor:
                        cursor.execute('SELECT pg_blocking_pids(%s)', [delete_pid])
                        if cursor.fetchone()[0]:
                            break
                    self.assertFalse(deletion.done(), 'Deletion finished while the save held the account lock')
                    sleep(0.01)
                else:
                    self.fail('PostgreSQL did not report deletion waiting for the save')
            finally:
                resume.set()
            self.assertEqual(save.result(timeout=10), 201)
            self.assertEqual(deletion.result(timeout=10), 200)
        self.assert_deleted()


class CalculationTests(TestCase):
    def test_shared_financial_regressions(self):
        cases = json.loads((Path(__file__).resolve().parents[2] / 'tests/fixtures/zakat_cases.json').read_text())
        for case in cases:
            with self.subTest(case=case['name']):
                result, error = run_zakat_calculation({**payload(), 'cash': '0', **case['input']})
                self.assertIsNone(error)
                for key, expected in case['expected'].items():
                    self.assertEqual(result[key], expected, key)

    def test_invalid_inputs_are_validation_errors(self):
        cases = [[], None, {'cash': 'oops'}, {'cash': '-1'}, {'cash': 'NaN'}, {'cash': 'Infinity'},
                 {'cash': True}, {'cash': {}}, {'cash': '10000000000'}, {'category': 'other'},
                 {'category': []}, {'yearType': []}, {'hasHawl': 'true'}, {'goldRate': 0},
                 {'goldRate': '100.001'}, {'goldRateSource': 'guessed'}, {'goldRateCheckedAt': 'bad'},
                 {'goldRateCheckedAt': (timezone.now() - timedelta(days=2)).isoformat()},
                 {'goldRateCheckedAt': (timezone.now() + timedelta(days=1)).isoformat()},
                 {'category': 'cattle', 'cattle': '3.5'}, {'category': 'cattle', 'cattle': 121, 'cattleType': 'camels'}, {'category': 'cattle', 'cattle': 100, 'cattleType': 'cows'}, {'category': 'cattle', 'cattleType': 'other'},
                 {'category': 'stocks', 'stocksShareType': 'other'}, {'stocksNonHalalPct': 101},
                 {'goldEntries': 'wrong'}, {'goldEntries': [None]},
                 {'goldEntries': [{'weight': '100', 'caliber': '12K'}]}, {'currency': 'USD'}]
        for changes in cases:
            with self.subTest(changes=changes):
                result, error = run_zakat_calculation(payload(**changes) if isinstance(changes, dict) else changes)
                self.assertIsNone(result)
                self.assertTrue(error)


class CalculationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.token, self.session = issue_session('owner@example.test', 'google-subject-owner')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def save(self, **changes):
        return self.client.post('/api/calculations/', payload(**changes), format='json')

    def test_real_database_save_history_and_delete(self):
        saved = self.save()
        self.assertEqual(saved.status_code, 201, saved.data)
        row = ZakatCalculation.objects.get(pk=saved.data['id'])
        self.assertEqual(row.total_zakat, Decimal('250.00'))
        history = self.client.get('/api/calculations/')
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.data['results'][0]['total_zakat'], '250.00')
        self.assertEqual(history.data['total_zakat_saved'], '250.00')
        self.assertEqual(history['Cache-Control'], 'no-store')
        self.assertEqual(history.data['results'][0]['result']['totalZakatPayable'], 250)
        self.assertEqual(self.client.delete(f'/api/calculations/{row.pk}/').status_code, 200)
        self.assertFalse(ZakatCalculation.objects.exists())

    def test_repeat_request_is_idempotent_and_changed_request_is_rejected(self):
        data = payload()
        first = self.client.post('/api/calculations/', data, format='json')
        second = self.client.post('/api/calculations/', data, format='json')
        self.assertEqual(first.data['id'], second.data['id'])
        self.assertEqual(ZakatCalculation.objects.count(), 1)
        data['cash'] = '20000'
        self.assertEqual(self.client.post('/api/calculations/', data, format='json').status_code, 409)

    def test_invalid_request_never_writes_a_record(self):
        for change in [{'cash': 'oops'}, {'goldRate': 0}, {'requestId': 'bad'}]:
            self.assertEqual(self.save(**change).status_code, 400)
        self.assertFalse(ZakatCalculation.objects.exists())

    def test_snapshot_does_not_store_unrelated_personal_fields(self):
        self.save(userEmail='another@example.test', accessToken='must-not-be-stored', recipient='private name')
        row = ZakatCalculation.objects.get()
        self.assertEqual(row.user_email, 'owner@example.test')
        self.assertNotIn('accessToken', row.get_input())
        self.assertNotIn('recipient', row.get_input())

    def test_below_nisab_and_cattle_history(self):
        saved = self.save(cash='10')
        self.assertEqual(saved.data['calculation']['totalZakatPayable'], 0)
        cattle = self.save(category='cattle', cattle='5', cattleType='camels', cash='0', goldRate='0')
        self.assertEqual(cattle.data['calculation']['cattleZakatDue'], '1 Sheep')
        rows = self.client.get('/api/calculations/').data['results']
        self.assertTrue(all(row['total_zakat'] == '0.00' for row in rows))
        self.assertEqual(rows[0]['result']['cattleZakatDue'], '1 Sheep')

    def test_legacy_history_is_corrected_without_rewriting_database(self):
        row = ZakatCalculation.objects.create(user_email='owner@example.test', category='gold',
            total_zakat=125, is_below_nisab=True,
            result_snapshot=json.dumps({'goldZakatAmount': 125, 'totalZakatPayable': 125}))
        response = self.client.get('/api/calculations/').data
        self.assertEqual(response['results'][0]['total_zakat'], '0.00')
        row.refresh_from_db()
        self.assertEqual(row.total_zakat, Decimal('125'))

    def test_legacy_cattle_profit_is_not_hidden_by_animal_threshold(self):
        row = ZakatCalculation.objects.create(user_email='owner@example.test', category='cattle',
            total_zakat=250, gold_rate=100, is_below_nisab=True,
            result_snapshot=json.dumps({'cashValue': 10000, 'cashZakatAmount': 250, 'cattleZakatDue': '0'}))
        result = self.client.get('/api/calculations/').data['results'][0]
        self.assertEqual(result['total_zakat'], '250.00')
        self.assertFalse(result['is_below_nisab'])
        row.refresh_from_db()
        self.assertTrue(row.is_below_nisab)

    def test_other_user_cannot_list_read_or_delete_records(self):
        saved = self.save()
        token, _ = issue_session('other@example.test', 'google-subject-other')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(self.client.get('/api/calculations/?email=owner@example.test').data['count'], 0)
        url = f"/api/calculations/{saved.data['id']}/"
        self.assertEqual(self.client.delete(url).status_code, 404)
        self.assertTrue(ZakatCalculation.objects.filter(pk=saved.data['id']).exists())

    def test_missing_tampered_expired_and_legacy_tokens_are_rejected(self):
        expired, session = issue_session('expired@example.test', 'expired-subject')
        session.expires_at = timezone.now() - timedelta(seconds=1)
        session.save()
        for token in ['', self.token + 'tampered', expired, signing.dumps({'email': 'owner@example.test'}, salt='zakat-ledger-access')]:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            self.assertEqual(self.client.get('/api/calculations/').status_code, 401)
            self.assertEqual(self.client.post('/api/calculations/', payload(), format='json').status_code, 401)
            self.assertEqual(self.client.delete('/api/calculations/1/').status_code, 401)

    def test_logout_revokes_the_real_session(self):
        self.assertNotEqual(self.session.token_hash, self.token)
        self.assertEqual(self.session.token_hash, token_hash(self.token))
        self.assertEqual(self.client.post('/api/auth/logout/').status_code, 200)
        self.assertEqual(self.client.get('/api/calculations/').status_code, 401)

    def test_delete_account_data_is_owner_scoped_and_revokes_all_sessions(self):
        self.save()
        issue_session('owner@example.test', 'google-subject-owner')
        _, other = issue_session('other@example.test', 'google-subject-other')
        self.assertEqual(self.client.delete('/api/account/data/').status_code, 200)
        self.assertFalse(ZakatCalculation.objects.exists())
        self.assertEqual(list(AccessSession.objects.values_list('pk', flat=True)), [other.pk])
        self.assertEqual(self.client.get('/api/calculations/').status_code, 401)

    @override_settings(GOOGLE_CLIENT_IDS=[])
    def test_google_login_fails_closed_without_configuration(self):
        self.assertEqual(self.client.post('/api/auth/google/', {}, format='json').status_code, 503)

    @override_settings(GOOGLE_CLIENT_IDS=['configured.apps.googleusercontent.com'])
    def test_google_login_rejects_missing_and_malformed_credentials(self):
        for credential in [None, 12, {}, '']:
            self.assertEqual(self.client.post('/api/auth/google/', {'credential': credential}, format='json').status_code, 400)


class AuthenticationSecurityTests(TestCase):
    @override_settings(GOOGLE_CLIENT_IDS=['configured.apps.googleusercontent.com'])
    def test_flooding_login_challenge_does_not_lock_out_google_sign_in(self):
        from django.core.cache import cache
        cache.clear()
        client = APIClient()
        codes = [client.post('/api/auth/challenge/').status_code for _ in range(31)]
        self.assertEqual(codes[:30], [200] * 30)
        self.assertEqual(codes[30], 429)
        # Separate bucket: sign-in still reaches validation instead of 429.
        self.assertEqual(client.post('/api/auth/google/', {}, format='json').status_code, 400)
        cache.clear()

    def test_challenge_is_one_time_and_binds_nonce(self):
        from .authentication import new_login_challenge, exchange_google_identity
        challenge, nonce = new_login_challenge()
        identity = {'email': 'verified@example.test', 'sub': 'verified-subject', 'email_verified': True, 'nonce': nonce}
        token, session = exchange_google_identity(identity, challenge.pk)
        self.assertEqual(session.token_hash, token_hash(token))
        with self.assertRaises(ValueError):
            exchange_google_identity(identity, challenge.pk)
        self.assertEqual(AccessSession.objects.count(), 1)

    def test_unverified_email_wrong_nonce_and_expired_challenge_cannot_issue_sessions(self):
        from .authentication import new_login_challenge, exchange_google_identity
        challenge, nonce = new_login_challenge()
        identity = {'email': 'verified@example.test', 'sub': 'verified-subject', 'email_verified': True, 'nonce': nonce}
        for change in [{'email_verified': False}, {'email_verified': 'true'}, {'nonce': 'wrong'}, {'sub': ''}]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                exchange_google_identity({**identity, **change}, challenge.pk)
        challenge.expires_at = timezone.now() - timedelta(seconds=1)
        challenge.save()
        with self.assertRaises(ValueError):
            exchange_google_identity(identity, challenge.pk)
        self.assertFalse(AccessSession.objects.exists())

    def test_identity_is_bound_to_google_subject(self):
        issue_session('verified@example.test', 'original-subject')
        with self.assertRaises(ValueError):
            issue_session('changed@example.test', 'original-subject')
        from django.db import IntegrityError, transaction
        with self.assertRaises(IntegrityError), transaction.atomic():
            issue_session('verified@example.test', 'different-subject')
        self.assertEqual(AccessSession.objects.count(), 1)


class RequestBoundaryTests(TestCase):
    def test_oversized_json_is_rejected_before_view_parsing(self):
        response = self.client.post('/api/auth/google/', json.dumps({'credential': 'x' * 70000}), content_type='application/json')
        self.assertEqual(response.status_code, 413)

    def test_compressed_charset_is_rejected_by_patched_parser(self):
        import bz2
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        from rest_framework.parsers import JSONParser
        from rest_framework.exceptions import ParseError
        raw = bz2.compress(json.dumps({'probe': 'x' * 1024}).encode())
        request = Request(APIRequestFactory().generic('POST', '/api/', raw,
            content_type='application/json; charset=bz2_codec'), parsers=[JSONParser()])
        with self.assertRaises(ParseError):
            _ = request.data

    def test_large_accept_header_is_rejected_before_negotiation(self):
        self.assertEqual(self.client.get('/api/auth/challenge/', HTTP_ACCEPT='x' * 4097).status_code, 431)

    def test_api_is_json_only_and_custom_session_revocation_still_works(self):
        from django.conf import settings
        self.assertEqual(settings.REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'], ['rest_framework.renderers.JSONRenderer'])
        self.assertNotIn('rest_framework.authtoken', settings.INSTALLED_APPS)
        token, session = issue_session('security@example.test', 'security-subject')
        client = APIClient(); client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(client.post('/api/auth/logout/').status_code, 200)
        self.assertFalse(AccessSession.objects.filter(pk=session.pk).exists())
