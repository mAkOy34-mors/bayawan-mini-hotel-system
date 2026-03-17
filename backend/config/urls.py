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
    path("api/v1/payments/", include("apps.payments.urls")),# ← fixed
    path("api/v1/receptionist/", include("apps.receptionist.urls")),
    *schema_patterns,
]

urlpatterns = [
    path("api/v1/", include(api_v1_patterns)),
]
