"""
ZakatLedger API views.

  GET    /api/                     health check
  POST   /api/auth/challenge/      one-time login nonce
  POST   /api/auth/google/         verify Google token, issue session
  POST   /api/auth/logout/         revoke session
  DELETE /api/account/data/        delete all of the user's cloud data
  GET    /api/calculations/        user's history
  POST   /api/calculations/        calculate + save
  DELETE /api/calculations/<id>/   delete one record
"""

from decimal import Decimal
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.conf import settings
from django.db import transaction, IntegrityError
from uuid import UUID
from google.auth.exceptions import GoogleAuthError
from google.auth.exceptions import TransportError
from functools import partial
from requests.exceptions import RequestException
from .authentication import authenticated_session, new_login_challenge, exchange_google_identity, lock_account_for_write
from .calculations import calculate
from rest_framework.throttling import AnonRateThrottle

# Google's official library to verify JWT tokens
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import AccessSession, AccountDeletionReceipt, GoogleIdentity, ZakatCalculation
from .serializers import ZakatCalculationListSerializer


def get_authenticated_email(request):
    session = authenticated_session(request)
    return session.user_email if session else None


# ── CORE CALCULATION ENGINE ────────────────────────────────────────────────────

def calculate_cattle_zakat(cattle_type, count):
    """Islamic lookup table for cattle Zakat — returns animal, not money."""
    count = int(Decimal(str(count))) if count else 0
    if cattle_type == 'camels':
        if count < 5:    return '0'
        if count <= 9:   return '1 Sheep'
        if count <= 14:  return '2 Sheep'
        if count <= 19:  return '3 Sheep'
        if count <= 24:  return '4 Sheep'
        if count <= 35:  return '1 Female Camel (1 year old)'
        if count <= 45:  return '1 Female Camel (2 years old)'
        if count <= 60:  return '1 Female Camel (3 years old)'
        if count <= 75:  return '1 Female Camel (4 years old)'
        if count <= 120: return '2 Female Camels'
        return 'Increase according to Islamic rules'
    elif cattle_type == 'cows':
        if count < 30:   return '0'
        if count <= 39:  return '1 One-Year-Old Calf'
        if count <= 59:  return '1 Two-Year-Old Cow'
        if count <= 69:  return '2 One-Year Calves'
        if count <= 79:  return '1 One-Year Calf + 1 Two-Year Cow'
        if count <= 89:  return '2 Two-Year Cows'
        if count <= 99:  return '3 One-Year Calves'
        return 'Increase according to Islamic rules'
    elif cattle_type == 'sheep':
        if count < 40:   return '0'
        if count <= 120: return '1 Sheep'
        if count <= 200: return '2 Sheep'
        if count <= 300: return '3 Sheep'
        return f'{count // 100} Sheep'
    elif cattle_type == 'goats':
        if count < 40:   return '0'
        if count <= 120: return '1 Goat'
        if count <= 200: return '2 Goats'
        if count <= 300: return '3 Goats'
        return f'{count // 100} Goats'
    return '0'


# ── VIEW 1: HEALTH CHECK ────────────────────────────────────────────────────────

def health_check(request):
    return JsonResponse({'status': 'ok'})


# ── VIEW 2: GOOGLE TOKEN VERIFICATION (Phase 3 Security) ───────────────────────

class GoogleVerifyView(APIView):
    """Verify Google's signature/audience, bind a one-time nonce, and issue an opaque session."""
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_IDS:
            return Response({'error': 'Google login is not configured.'}, status=503)
        credential = request.data.get('credential') if isinstance(request.data, dict) else None
        if not isinstance(credential, str) or not 1 <= len(credential) <= 16384:
            return Response({'error': 'A Google credential is required.'}, status=400)
        try:
            # Pass an explicit audience allowlist. Never accept client-supplied profile claims.
            info = id_token.verify_oauth2_token(credential, partial(google_requests.Request(), timeout=10), settings.GOOGLE_CLIENT_IDS)
            try:
                challenge_id = UUID(str(request.data.get('challengeId', '')))
            except (ValueError, TypeError):
                return Response({'error': 'A valid login challenge is required.'}, status=400)
            token, session = exchange_google_identity(info, challenge_id)
            response = Response({'verified': True, 'email': session.user_email,
                'name': info.get('name', ''), 'picture': info.get('picture', ''),
                'accessToken': token, 'expiresAt': session.expires_at.isoformat()})
            response['Cache-Control'] = 'no-store'
            return response
        except TransportError:
            return Response({'error': 'Google verification is temporarily unavailable.'}, status=503)
        except (ValueError, GoogleAuthError, IntegrityError):
            return Response({'error': 'Google credential is invalid or expired.'}, status=401)
        except RequestException:
            return Response({'error': 'Google verification is temporarily unavailable.'}, status=503)


class LogoutView(APIView):
    def post(self, request):
        session = authenticated_session(request)
        if session:
            session.delete()
        return Response({'loggedOut': True})


class LoginChallengeView(APIView):
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_IDS:
            return Response({'error': 'Google login is not configured.'}, status=503)
        challenge, nonce = new_login_challenge()
        return Response({'challengeId': str(challenge.pk), 'nonce': nonce})


class AccountDataView(APIView):
    def delete(self, request):
        deletion_id = request.data.get('deletionId') if isinstance(request.data, dict) else None
        if deletion_id is not None:
            try:
                deletion_id = UUID(str(deletion_id))
            except (ValueError, TypeError):
                return Response({'error': 'A valid deletionId UUID is required.'}, status=400)
        session = authenticated_session(request)
        # A receipt confirms only a previous deletion, even after its session was revoked.
        if deletion_id and AccountDeletionReceipt.objects.filter(pk=deletion_id).exists():
            return Response({'deleted': True})
        if not session:
            return Response({'error': 'Valid bearer token required'}, status=401)
        with transaction.atomic():
            if not lock_account_for_write(session):
                if deletion_id and AccountDeletionReceipt.objects.filter(pk=deletion_id).exists():
                    return Response({'deleted': True})
                return Response({'error': 'Valid bearer token required'}, status=401)
            if deletion_id:
                _, created = AccountDeletionReceipt.objects.get_or_create(id=deletion_id)
                if not created:
                    return Response({'deleted': True})
            ZakatCalculation.objects.filter(user_email=session.user_email).delete()
            AccessSession.objects.filter(user_email=session.user_email).delete()
            GoogleIdentity.objects.filter(user_email=session.user_email).delete()
        return Response({'deleted': True})


# ── SAVE + LIST HISTORY ───────────────────────────────────────────────

class CalculationListCreateView(APIView):
    """
    GET  /api/calculations/?email=X  → return history (newest first)
    POST /api/calculations/          → calculate + save + return history count
    """

    def get(self, request):
        email = get_authenticated_email(request)
        if not email:
            return Response(
                {'error': 'Valid bearer token required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        calculations = ZakatCalculation.objects.filter(user_email=email)
        serializer   = ZakatCalculationListSerializer(calculations, many=True)

        # Summary stats — useful for the history dashboard
        total_saved = sum((Decimal(str(row['total_zakat'])) for row in serializer.data), Decimal('0'))
        below_nisab = sum(row['is_below_nisab'] for row in serializer.data)

        return Response({
            'count':              len(serializer.data),
            'email':              email,
            'total_zakat_saved': str(total_saved.quantize(Decimal('0.01'))),
            'below_nisab_count':  below_nisab,
            'results':            serializer.data,
        })

    def post(self, request):
        data       = request.data
        session = authenticated_session(request)
        if not session:
            return Response({'error': 'Valid bearer token required'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            result, clean = calculate(data, calculate_cattle_zakat)
            request_id = UUID(str(data.get('requestId', '')))
        except (ValueError, TypeError) as error:
            return Response({'error': str(error) or 'A requestId UUID is required.'}, status=400)
        snapshot = json.dumps(clean, sort_keys=True)
        with transaction.atomic():
            if not lock_account_for_write(session):
                return Response({'error': 'Valid bearer token required'}, status=401)
            user_email = session.user_email
            calculation, created = ZakatCalculation.objects.get_or_create(
                user_email=user_email, request_id=request_id, defaults={
                    'category': result['category'], 'year_type': result['yearType'],
                    'gold_rate': clean['goldRate'], 'total_zakat': Decimal(str(result['totalZakatPayable'])),
                    'is_below_nisab': result['isBelowNisab'], 'zakat_rate_display': result['zakatRateDisplay'],
                    'input_snapshot': snapshot, 'result_snapshot': json.dumps(result),
                })
            if not created and calculation.input_snapshot != snapshot:
                return Response({'error': 'This requestId belongs to a different calculation.'}, status=409)
            return Response({'saved': True, 'id': calculation.id, 'calculation': calculation.get_result(),
                'total_records': ZakatCalculation.objects.filter(user_email=user_email).count()}, status=201 if created else 200)


# ── DELETE ONE CALCULATION ───────────────────────────────

class CalculationDetailView(APIView):
    """DELETE /api/calculations/<id>/ — delete one of the caller's records."""

    def delete(self, request, pk):
        email = get_authenticated_email(request)
        if not email:
            return Response({'error': 'Valid bearer token required'}, status=status.HTTP_401_UNAUTHORIZED)
        deleted, _ = ZakatCalculation.objects.filter(pk=pk, user_email=email).delete()
        if not deleted:
            return Response({'error': f'#{pk} not found'}, status=404)
        return Response({'deleted': True, 'id': pk})
