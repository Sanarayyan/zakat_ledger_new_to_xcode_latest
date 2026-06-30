"""
ZakatLedger API — URL Router

URL PATTERN                    METHOD   VIEW                      ACTION
──────────────────────────────────────────────────────────────────────────────────
/api/                          GET      health_check              Server alive?
/api/auth/google/              POST     GoogleVerifyView          Verify Google token
/api/calculate/                POST     CalculateZakatView        Calculate (no save)
/api/calculations/             POST     CalculationListCreate     Calculate + save
/api/calculations/             GET      CalculationListCreate     History list
/api/calculations/<id>/        GET      CalculationDetailView     One record detail
/api/calculations/<id>/        DELETE   CalculationDetailView     Delete a record
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.health_check, name='health-check'),

    # 🔐 Phase 3 — Verify Google token on the server (real security)
    path('auth/google/', views.GoogleVerifyView.as_view(), name='google-verify'),

    # Stateless calculation — quick, no DB write
    path('calculate/', views.CalculateZakatView.as_view(), name='calculate-zakat'),

    # Save to DB (POST) and list history (GET) — same URL, different method
    path('calculations/', views.CalculationListCreateView.as_view(), name='calculations'),

    # Get or delete one specific calculation
    path('calculations/<int:pk>/', views.CalculationDetailView.as_view(), name='calculation-detail'),
]
