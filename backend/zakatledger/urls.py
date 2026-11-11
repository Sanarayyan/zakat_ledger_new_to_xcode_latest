"""Root URLs: every route lives under /api/ (see api/urls.py)."""
from django.urls import path, include

urlpatterns = [
    path('api/', include('api.urls')),
]
