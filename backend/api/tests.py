from django.test import TestCase
from django.core import signing
from rest_framework.test import APIClient

from .models import ZakatCalculation
from .views import run_zakat_calculation
from .views import ACCESS_TOKEN_SALT


class ZakatCalculationTests(TestCase):
    def test_gold_below_nisab(self):
        result, error = run_zakat_calculation({
            'category': 'gold',
            'yearType': 'islamic',
            'goldRate': 100,
            'goldEntries': [{'caliber': '24K', 'weight': 50}],
        })

        self.assertIsNone(error)
        self.assertTrue(result['isBelowNisab'])
        self.assertEqual(result['goldZakatAmount'], 125.0)

    def test_invalid_year_type_is_rejected(self):
        result, error = run_zakat_calculation({'category': 'money', 'yearType': 'invalid'})

        self.assertIsNone(result)
        self.assertIn('yearType', error)


class CalculationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        token = signing.dumps({'email': 'user@example.com'}, salt=ACCESS_TOKEN_SALT)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_health_check(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'ok')

    def test_save_and_list_calculation(self):
        payload = {
            'userEmail': 'user@example.com',
            'category': 'money',
            'yearType': 'islamic',
            'goldRate': 100,
            'cash': 10000,
        }
        save_response = self.client.post('/api/calculations/', payload, format='json')
        self.assertEqual(save_response.status_code, 201)
        self.assertEqual(ZakatCalculation.objects.count(), 1)

        list_response = self.client.get('/api/calculations/')
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.json()['count'], 1)

    def test_history_requires_authentication(self):
        self.client.credentials()
        response = self.client.get('/api/calculations/')
        self.assertEqual(response.status_code, 401)
