"""ZakatLedger API routes. See views.py for what each endpoint does."""
from django.urls import path
from . import views

urlpatterns = [
    path('auth/challenge/', views.LoginChallengeView.as_view(), name='login-challenge'),
    path('', views.health_check, name='health-check'),

    # 🔐 Phase 3 — Verify Google token on the server (real security)
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('account/data/', views.AccountDataView.as_view(), name='account-data'),
    path('auth/google/', views.GoogleVerifyView.as_view(), name='google-verify'),

    # Save to DB (POST) and list history (GET) — same URL, different method
    path('calculations/', views.CalculationListCreateView.as_view(), name='calculations'),

    # Delete one specific calculation
    path('calculations/<int:pk>/', views.CalculationDetailView.as_view(), name='calculation-detail'),
]
