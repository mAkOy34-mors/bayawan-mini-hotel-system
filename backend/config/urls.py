"""
Root URL configuration — Cebu Grand Hotel API
All routes are versioned under /api/v1/
"""

from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.conf import settings
from django.conf.urls.static import static

# ── OpenAPI schema endpoints ──────────────────────────────────────────────────
schema_patterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("schema/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

# ── API v1 ────────────────────────────────────────────────────────────────────
api_v1_patterns = [
    path("users/",    include("apps.users.urls")),
    path("guests/",   include("apps.guests.urls")),
    path("rooms/",    include("apps.rooms.urls")),
    path("bookings/", include("apps.bookings.urls")),
    path("payments/", include("apps.payments.urls")),
    path("admin/",    include("apps.admin_panel.urls")),  # ← fixed
    path("rewards/",  include("apps.rewards.urls")),      # ← fixed
    path("support/",  include("apps.support.urls")),      # ← fixed
    path("reports/",  include("apps.reports.urls")),
    path("payments/", include("apps.payments.urls")),# ← fixed
    path("receptionist/", include("apps.receptionist.urls")),
    path("emergency/", include("apps.emergency.urls")),
    path("staff/", include("apps.staff.urls")),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('housekeepers/', include('apps.housekeepers.urls')),

    *schema_patterns,
]

urlpatterns = [
    path("api/v1/", include(api_v1_patterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)