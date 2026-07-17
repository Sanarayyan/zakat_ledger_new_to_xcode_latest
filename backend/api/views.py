"""
ZakatLedger API — Views (The Brain 🧠)

ENDPOINTS:
  GET    /api/                         → health check
  POST   /api/auth/google/             → verify Google token (Phase 3 security)
  POST   /api/calculate/               → calculate zakat (no save)
  POST   /api/calculations/            → calculate + save to DB
  GET    /api/calculations/?email=X    → user's history
  GET    /api/calculations/<id>/       → one calculation detail
  DELETE /api/calculations/<id>/       → delete one

SECURITY MODEL:
  Before Phase 3: userEmail was sent by React — anyone could fake it
  After Phase 3:  Django calls Google to verify the token is real
                  Google confirms the real email → no faking possible
"""

from decimal import Decimal, ROUND_HALF_UP
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.conf import settings
from django.core import signing

# Google's official library to verify JWT tokens
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import ZakatCalculation
from .serializers import ZakatCalculationSerializer, ZakatCalculationListSerializer


# ── CONSTANTS ──────────────────────────────────────────────────────────────────

CALIBERS = {
    '24K': Decimal('1'),
    '22K': Decimal('0.916'),
    '18K': Decimal('0.75'),
}
GOLD_NISAB_GRAMS = Decimal('87.48')
ZAKAT_RATES = {
    'islamic':  Decimal('0.025'),
    'calendar': Decimal('0.02577'),
}
ACCESS_TOKEN_SALT = 'zakat-ledger-access'
ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 30


def get_authenticated_email(request):
    authorization = request.headers.get('Authorization', '')
    if not authorization.startswith('Bearer '):
        return None

    token = authorization.removeprefix('Bearer ').strip()
    try:
        payload = signing.loads(token, salt=ACCESS_TOKEN_SALT, max_age=ACCESS_TOKEN_MAX_AGE)
        return payload.get('email')
    except (signing.BadSignature, signing.SignatureExpired):
        return None


# ── CORE CALCULATION ENGINE ────────────────────────────────────────────────────

def calculate_cattle_zakat(cattle_type, count):
    """Islamic lookup table for cattle Zakat — returns animal, not money."""
    count = int(count) if count else 0
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


def run_zakat_calculation(data):
    """
    Core calculation function — extracted so it can be reused by multiple views.
    Returns (result_dict, error_string_or_None).
    DRY principle: Don't Repeat Yourself.
    """
    category    = data.get('category', '')
    year_type   = data.get('yearType', '')
    gold_rate   = Decimal(str(data.get('goldRate', 0) or 0))
    gold_entries = data.get('goldEntries', [])
    cash        = Decimal(str(data.get('cash', 0) or 0))
    cattle_type = data.get('cattleType', 'cows')
    cattle      = data.get('cattle', 0)
    share_type  = data.get('stocksShareType', '')
    num_shares  = Decimal(str(data.get('stocksNumShares', 0) or 0))
    mkt_price   = Decimal(str(data.get('stocksMarketPrice', 0) or 0))
    dividend    = Decimal(str(data.get('stocksDividend', 0) or 0))
    non_halal   = Decimal(str(data.get('stocksNonHalalPct', 0) or 0))

    if year_type not in ZAKAT_RATES:
        return None, 'yearType must be "islamic" or "calendar"'

    zakat_rate = ZAKAT_RATES[year_type]

    total_gold_value, total_gold_weight = Decimal('0'), Decimal('0')
    for entry in gold_entries:
        weight         = Decimal(str(entry.get('weight', 0) or 0))
        caliber_factor = CALIBERS.get(entry.get('caliber', '24K'), Decimal('1'))
        adjusted_price     = (gold_rate * caliber_factor).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        total_gold_value  += weight * adjusted_price
        total_gold_weight += weight * caliber_factor

    gold_zakat_amount = total_gold_value * zakat_rate
    gold_zakat_weight = total_gold_weight * zakat_rate
    cash_zakat_amount = cash * zakat_rate
    cattle_zakat_due  = calculate_cattle_zakat(cattle_type, cattle)

    stocks_total_value, stocks_zakat_amount = Decimal('0'), Decimal('0')
    stocks_zakatable_base, stocks_purification_amt = Decimal('0'), Decimal('0')

    if share_type == 'trading':
        stocks_total_value    = num_shares * mkt_price
        stocks_zakatable_base = stocks_total_value
        stocks_zakat_amount   = stocks_total_value * Decimal('0.025')
    elif share_type == 'investment':
        stocks_total_value    = num_shares * mkt_price
        stocks_zakatable_base = stocks_total_value * Decimal('0.25')
        stocks_zakat_amount   = stocks_zakatable_base * Decimal('0.025')
    elif share_type == 'purification':
        stocks_purification_amt = dividend * (non_halal / Decimal('100'))

    total_zakat_payable = gold_zakat_amount + cash_zakat_amount
    money_nisab_value   = gold_rate * GOLD_NISAB_GRAMS

    if category == 'gold':
        is_below_nisab = total_gold_weight < GOLD_NISAB_GRAMS
    elif category == 'cattle':
        nisab_map      = {'camels': 5, 'cows': 30, 'sheep': 40, 'goats': 40}
        is_below_nisab = int(cattle or 0) < nisab_map.get(cattle_type, 30)
    elif category == 'money':
        is_below_nisab = cash < money_nisab_value
    elif category == 'stocks':
        is_below_nisab = False if share_type == 'purification' else stocks_total_value < money_nisab_value
    else:
        is_below_nisab = False

    return {
        'goldValue':             float(total_gold_value),
        'goldWeight':            float(total_gold_weight),
        'goldZakatAmount':       float(gold_zakat_amount),
        'goldZakatWeight':       float(gold_zakat_weight),
        'cashValue':             float(cash),
        'cashZakatAmount':       float(cash_zakat_amount),
        'cattleZakatDue':        cattle_zakat_due,
        'stocksTotalValue':      float(stocks_total_value),
        'stocksZakatableBase':   float(stocks_zakatable_base),
        'stocksZakatAmount':     float(stocks_zakat_amount),
        'stocksPurificationAmt': float(stocks_purification_amt),
        'shareType':             share_type,
        'totalZakatPayable':     float(total_zakat_payable),
        'isBelowNisab':          is_below_nisab,
        'moneyNisabValue':       float(money_nisab_value),
        'zakatRateDisplay':      '2.5' if year_type == 'islamic' else '2.577',
        'yearType':              year_type,
        'category':              category,
    }, None


# ── VIEW 1: HEALTH CHECK ────────────────────────────────────────────────────────

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': '🕌 ZakatLedger API is running!',
        'endpoints': {
            'verify_google':    'POST /api/auth/google/',
            'calculate':        'POST /api/calculate/',
            'save_calculation': 'POST /api/calculations/',
            'list_history':     'GET  /api/calculations/?email=X',
            'get_one':          'GET  /api/calculations/<id>/',
            'delete':           'DELETE /api/calculations/<id>/',
        }
    })


# ── VIEW 2: GOOGLE TOKEN VERIFICATION (Phase 3 Security) ───────────────────────

class GoogleVerifyView(APIView):
    """
    POST /api/auth/google/

    WHY THIS EXISTS:
      Before: React decoded the Google JWT token itself (in the browser).
              Anyone could open DevTools and fake a user identity.

      After:  React sends the raw token to Django.
              Django calls Google's servers to verify it.
              Google confirms: "Yes, this token is real, here's the real email."
              Django returns the verified user info.
              Now userEmail cannot be faked.

    HOW GOOGLE TOKEN VERIFICATION WORKS:
      1. User clicks "Sign in with Google" in React
      2. Google returns a credential (JWT token string)
      3. React sends that token to POST /api/auth/google/
      4. Django calls: id_token.verify_oauth2_token(token, request, CLIENT_ID)
      5. Google's servers check: is this token valid? Was it for MY app?
      6. If yes → Google returns the verified payload with real email/name
      7. If no  → ValueError raised → we return 401 Unauthorized

    REQUEST:  { "credential": "eyJhbGciOiJSUzI1NiIs..." }
    RESPONSE: { "verified": true, "email": "real@gmail.com", "name": "Ahmad", "picture": "..." }
    """

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response(
                {'error': 'credential is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # This is the KEY security step:
            # verify_oauth2_token contacts Google's public key servers
            # and checks the token signature + expiry + audience (client_id)
            google_info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            # If we reach here, the token is 100% legitimate
            verified_email   = google_info['email']
            verified_name    = google_info.get('name', '')
            verified_picture = google_info.get('picture', '')
            access_token = signing.dumps({'email': verified_email}, salt=ACCESS_TOKEN_SALT)

            return Response({
                'verified': True,
                'email':    verified_email,
                'name':     verified_name,
                'picture':  verified_picture,
                'accessToken': access_token,
                # The email is now server-verified — safe to use in /api/calculations/
            })

        except ValueError as e:
            # Token is invalid, expired, or for a different app
            # This is exactly what we want to catch — fake tokens
            return Response(
                {'error': f'Invalid Google token: {str(e)}', 'verified': False},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ── VIEW 3: CALCULATE ONLY (stateless, no DB) ──────────────────────────────────

class CalculateZakatView(APIView):
    """POST /api/calculate/ — runs math, returns result, does NOT save."""
    def post(self, request):
        result, error = run_zakat_calculation(request.data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


# ── VIEW 4: SAVE + LIST HISTORY ───────────────────────────────────────────────

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
        total_saved  = sum(float(c.total_zakat) for c in calculations if not c.is_below_nisab)
        below_nisab  = calculations.filter(is_below_nisab=True).count()

        return Response({
            'count':              calculations.count(),
            'email':              email,
            'total_zakat_saved':  round(total_saved, 2),
            'below_nisab_count':  below_nisab,
            'results':            serializer.data,
        })

    def post(self, request):
        data       = request.data
        user_email = get_authenticated_email(request)
        if not user_email:
            return Response({'error': 'Valid bearer token required'}, status=status.HTTP_401_UNAUTHORIZED)

        result, error = run_zakat_calculation(data)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        calculation = ZakatCalculation.objects.create(
            user_email         = user_email,
            category           = result['category'],
            year_type          = result['yearType'],
            gold_rate          = data.get('goldRate', 0) or 0,
            total_zakat        = result['totalZakatPayable'],
            is_below_nisab     = result['isBelowNisab'],
            zakat_rate_display = result['zakatRateDisplay'],
            input_snapshot     = json.dumps(data),
            result_snapshot    = json.dumps(result),
        )

        # After saving, return the updated count so React can update badge
        total_records = ZakatCalculation.objects.filter(user_email=user_email).count()

        return Response({
            'saved':         True,
            'id':            calculation.id,
            'calculation':   result,
            'total_records': total_records,
            'message':       f'Saved! ID #{calculation.id} — {total_records} total in history',
        }, status=status.HTTP_201_CREATED)


# ── VIEW 5: SINGLE CALCULATION DETAIL OR DELETE ───────────────────────────────

class CalculationDetailView(APIView):
    """
    GET    /api/calculations/<id>/  → full detail
    DELETE /api/calculations/<id>/  → delete it
    """

    def _get_object(self, pk, email):
        try:
            return ZakatCalculation.objects.get(pk=pk, user_email=email)
        except ZakatCalculation.DoesNotExist:
            return None

    def get(self, request, pk):
        email = get_authenticated_email(request)
        if not email:
            return Response({'error': 'Valid bearer token required'}, status=status.HTTP_401_UNAUTHORIZED)
        calc = self._get_object(pk, email)
        if not calc:
            return Response({'error': f'#{pk} not found'}, status=404)
        return Response(ZakatCalculationSerializer(calc).data)

    def delete(self, request, pk):
        email = get_authenticated_email(request)
        if not email:
            return Response({'error': 'Valid bearer token required'}, status=status.HTTP_401_UNAUTHORIZED)
        calc = self._get_object(pk, email)
        if not calc:
            return Response({'error': f'#{pk} not found'}, status=404)

        calc.delete()
        return Response({'deleted': True, 'id': pk})
