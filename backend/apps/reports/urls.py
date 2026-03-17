"""apps/reports/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/",  views.DashboardView.as_view()),
    path("revenue/",    views.RevenueReportView.as_view()),
    path("bookings/",   views.BookingReportView.as_view()),
    path("occupancy/",  views.OccupancyReportView.as_view()),
    path("checkins/",   views.TodayCheckinsView.as_view()),
    path("settings/",   views.HotelSettingsView.as_view()),
]
