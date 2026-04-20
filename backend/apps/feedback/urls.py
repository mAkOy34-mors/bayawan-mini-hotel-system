# apps/feedback/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Guest endpoints
    path('submit/', views.SubmitFeedbackView.as_view(), name='submit-feedback'),
    path('my-feedback/', views.GetFeedbackView.as_view(), name='my-feedback'),
    path('booking/<int:booking_id>/', views.GetBookingFeedbackView.as_view(), name='booking-feedback'),

    # Admin/Staff endpoints
    path('all/', views.GetAllFeedbackView.as_view(), name='all-feedback'),
    path('unresponded/', views.GetUnrespondedFeedbackView.as_view(), name='unresponded-feedback'),
    path('<int:feedback_id>/respond/', views.RespondToFeedbackView.as_view(), name='respond-feedback'),
    path('<int:feedback_id>/delete/', views.DeleteFeedbackView.as_view(), name='delete-feedback'),
    path('<int:feedback_id>/escalate/', views.EscalateFeedbackView.as_view(), name='escalate-feedback'),
]