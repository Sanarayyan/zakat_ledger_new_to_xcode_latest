"""
Main URL configuration for ZakatLedger.

Think of this as the "reception desk" — it directs traffic:
  /admin/   → Django admin panel
  /api/     → Our REST API (all the good stuff)
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # All API routes are defined inside api/urls.py
    # 'include' just means "go look in that file for the rest"
    path('api/', include('api.urls')),
]
