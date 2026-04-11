# apps/emergency/urls.py
from django.urls import path
from .views import (
    SendEmergencyAlertView,
    MyEmergencyAlertsView,
    AllEmergencyAlertsView,
    ResolveEmergencyView,
)

urlpatterns = [
    path('alert/', SendEmergencyAlertView.as_view(), name='emergency-alert'),
    path('my-alerts/', MyEmergencyAlertsView.as_view(), name='my-emergency-alerts'),
    path('all/', AllEmergencyAlertsView.as_view(), name='all-emergency-alerts'),
    path('<int:emergency_id>/resolve/', ResolveEmergencyView.as_view(), name='resolve-emergency'),
]