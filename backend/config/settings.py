"""
Django Settings — Cebu Grand Hotel API
Stack: Django 5 · DRF · Supabase (PostgreSQL) · Supabase Auth (JWT)
"""

import os
from datetime import timedelta
from pathlib import Path

import environ
import os

# ─────────────────────────────────────────────────────────────────────────────
# Base
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DEBUG")
APPEND_SLASH = False
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"]) + ["*"]
FRONTEND_URL = "http://localhost:5173"
# ─────────────────────────────────────────────────────────────────────────────
# Installed Apps
# ─────────────────────────────────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "rest_framework_simplejwt",
    "channels",
    "apps.admin_panel",
    "apps.rewards",
    "apps.support",
    "apps.reports",
]

LOCAL_APPS = [
    "apps.users",
    "apps.guests",
    "apps.rooms",
    "apps.bookings",
    "apps.payments",
    "apps.receptionist",
    "apps.emergency",
    "apps.staff",
    "apps.employees",
    "apps.housekeepers",
    "apps.complaints",
    "apps.services",
    "apps.feedback",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

ASGI_APPLICATION = "config.asgi.application"

# Channel Layers - Use InMemory for development
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}
# ─────────────────────────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.request_logger.RequestLoggerMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

# ─────────────────────────────────────────────────────────────────────────────
# Templates (minimal – API only, no HTML rendering needed)
# ─────────────────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# Database — Supabase PostgreSQL (Transaction Pooler recommended for prod)
# ─────────────────────────────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     env("SUPABASE_DB_NAME", default="postgres"),
        "USER":     env("SUPABASE_DB_USER", default="postgres"),
        "PASSWORD": env("SUPABASE_DB_PASSWORD"),
        "HOST":     env("SUPABASE_DB_HOST"),
        "PORT":     env("SUPABASE_DB_PORT", default="5432"),
        "OPTIONS": {
            "sslmode":              "require",
            "connect_timeout":      10,
            "keepalives":           1,
            "keepalives_idle":      10,
            "keepalives_interval":  5,
            "keepalives_count":     3,
        },
        "CONN_MAX_AGE":      600,
        "CONN_HEALTH_CHECKS": True,
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "users.User"

# ─────────────────────────────────────────────────────────────────────────────
# Supabase Auth — config (used by core/utils/supabase_client.py)
# ─────────────────────────────────────────────────────────────────────────────
SUPABASE_URL = env("SUPABASE_URL")                        # https://<project>.supabase.co
SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = env("SUPABASE_JWT_SECRET")          # from Supabase dashboard → API → JWT secret

# ─────────────────────────────────────────────────────────────────────────────
# Django REST Framework
# ─────────────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}

# ─────────────────────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://treasure-beneath-address-delicious.trycloudflare.com ",
]

CORS_ALLOW_ALL_ORIGINS = True   # ← allows all origins including ngrok

# ─────────────────────────────────────────────────────────────────────────────
# drf-spectacular (OpenAPI / Swagger)
# ─────────────────────────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "Cebu Grand Hotel API",
    "DESCRIPTION": "REST API backing the CGH guest portal.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

CACHES = {
    "default": {
        "BACKEND":  "django.core.cache.backends.locmem.LocMemCache",
        "TIMEOUT":  30,
    }
}
# ─────────────────────────────────────────────────────────────────────────────
# Internationalisation
# ─────────────────────────────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Manila"
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────────────────────────────────────
# Static files
# ─────────────────────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "apps": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "core": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
# ─── Simple JWT ──────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":  timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES":      ("Bearer",),
    "USER_ID_FIELD":          "id",
    "USER_ID_CLAIM":          "user_id",
}
# ─── PayMongo ────────────────────────────────────────────────────────────────
PAYMONGO_SECRET_KEY = env("PAYMONGO_SECRET_KEY")
PAYMONGO_PUBLIC_KEY = env("PAYMONGO_PUBLIC_KEY")
PAYMONGO_WEBHOOK_SECRET= env("PAYMONGO_WEBHOOK_SECRET")

#GMAIL Otp
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = env('EMAIL_HOST_USER', default='michomoreno34@gmail.com')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='ewha ngym merc fsef')
DEFAULT_FROM_EMAIL  = f'Bayawan Mini Hotel <{EMAIL_HOST_USER}>'

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'ngrok-skip-browser-warning',
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')