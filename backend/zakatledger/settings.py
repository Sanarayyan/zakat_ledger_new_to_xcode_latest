"""
Django settings for ZakatLedger backend.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get('DJANGO_DEBUG', 'false').lower() == 'true'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if DEBUG and not SECRET_KEY:
    from django.core.management.utils import get_random_secret_key
    SECRET_KEY = get_random_secret_key()

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]

if not DEBUG and (len(SECRET_KEY) < 50 or SECRET_KEY == 'unsafe-development-only-key'):
    raise RuntimeError('DJANGO_SECRET_KEY must be set when DJANGO_DEBUG=false')


# ── APPS ──────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',   # Gives us APIView, Response, etc.
    'corsheaders',      # Lets React (port 5173) talk to Django (port 8000)
    # Our app
    'api',
]

# ── MIDDLEWARE ─────────────────────────────────────────────────────────────────
# CorsMiddleware MUST come first — it needs to process the request before anything else
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # ← FIRST
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.PrivateApiResponses',
]

ROOT_URLCONF = 'zakatledger.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'zakatledger.wsgi.application'

# ── DATABASE ───────────────────────────────────────────────────────────────────
# Local SQLite remains the default; production may select PostgreSQL explicitly.
DB_ENGINE = os.environ.get('DJANGO_DB_ENGINE', 'sqlite')
if DB_ENGINE == 'postgresql':
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['POSTGRES_DB'], 'USER': os.environ['POSTGRES_USER'],
        'PASSWORD': os.environ['POSTGRES_PASSWORD'], 'HOST': os.environ['POSTGRES_HOST'],
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {'sslmode': os.environ.get('POSTGRES_SSLMODE', 'verify-full')},
        'CONN_MAX_AGE': 60,
    }}
elif DB_ENGINE == 'sqlite':
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DJANGO_SQLITE_PATH', BASE_DIR / 'db.sqlite3')}}
else:
    raise RuntimeError('DJANGO_DB_ENGINE must be sqlite or postgresql')

if os.environ.get('DJANGO_CACHE_LOCATION'):
    CACHES = {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ['DJANGO_CACHE_LOCATION'], 'KEY_PREFIX': 'muslimplus'}}

# ── INTERNATIONALISATION ───────────────────────────────────────────────────────
# ── GOOGLE OAUTH ───────────────────────────────────────────────────────────────
# The same Client ID used in React (VITE_GOOGLE_CLIENT_ID)
# Django uses this to VERIFY the token Google sends — it checks:
#   "Was this token really issued by Google for MY app?"
# If the client ID doesn't match → token is rejected → security!
GOOGLE_CLIENT_IDS = [value.strip() for value in os.environ.get('GOOGLE_CLIENT_IDS', os.environ.get('GOOGLE_CLIENT_ID', '')).split(',') if value.strip()]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DATA_UPLOAD_MAX_MEMORY_SIZE = 65536
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow React Vite dev server to call this API
# In production replace this with your actual frontend domain
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'DJANGO_CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174',
    ).split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('DJANGO_CSRF_TRUSTED_ORIGINS', '').split(',')
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'false' if DEBUG else 'true').lower() == 'true'
SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0

# ── DJANGO REST FRAMEWORK ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    # Open for now — no login required to test the API
    # Later: switch to 'rest_framework.permissions.IsAuthenticated'
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    # Always return JSON — never HTML error pages
    'DEFAULT_THROTTLE_RATES': {'anon': '30/min'},
    # Trust forwarding headers only when a deployment names its trusted proxy count.
    'NUM_PROXIES': int(os.environ.get('DJANGO_NUM_PROXIES', '0')),
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}
