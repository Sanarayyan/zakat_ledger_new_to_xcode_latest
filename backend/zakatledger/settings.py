"""
Django settings for ZakatLedger backend.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-x*f_u*6*bd-v7vb$%dd10a!_=q)(an1-)r#r2dgz9ey#j8jiha'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']


# ── APPS ──────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
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
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'zakatledger.wsgi.application'

# ── DATABASE ───────────────────────────────────────────────────────────────────
# SQLite — perfect for learning, zero setup
# Upgrade to PostgreSQL when deploying to production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ── AUTH ───────────────────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── INTERNATIONALISATION ───────────────────────────────────────────────────────
# ── GOOGLE OAUTH ───────────────────────────────────────────────────────────────
# The same Client ID used in React (VITE_GOOGLE_CLIENT_ID)
# Django uses this to VERIFY the token Google sends — it checks:
#   "Was this token really issued by Google for MY app?"
# If the client ID doesn't match → token is rejected → security!
GOOGLE_CLIENT_ID = '202849810199-h87ncfj5m3lsjun81hn1cil24gtocqb6.apps.googleusercontent.com'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow React Vite dev server to call this API
# In production replace this with your actual frontend domain
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
]
CORS_ALLOW_CREDENTIALS = True

# ── DJANGO REST FRAMEWORK ──────────────────────────────────────────────────────
REST_FRAMEWORK = {
    # Open for now — no login required to test the API
    # Later: switch to 'rest_framework.permissions.IsAuthenticated'
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    # Always return JSON — never HTML error pages
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}
