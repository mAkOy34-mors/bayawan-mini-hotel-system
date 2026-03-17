"""apps/support/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    # Guest
    path("",               views.CreateTicketView.as_view()),
    path("my-tickets/",    views.MyTicketsView.as_view()),
    path("<int:pk>/",      views.TicketDetailView.as_view()),
    # Admin
    path("all/",           views.AllTicketsView.as_view()),
    path("<int:pk>/reply/", views.ReplyTicketView.as_view()),
    path("<int:pk>/status/", views.UpdateTicketStatusView.as_view()),
]
