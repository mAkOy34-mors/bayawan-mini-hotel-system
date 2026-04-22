"""apps/guests/urls.py"""

from django.urls import path
from .views import CompleteProfileView, MyProfileView, ProfilePictureView

urlpatterns = [
    path("my-profile",       MyProfileView.as_view(),      name="guest-my-profile"),
    path("complete-profile", CompleteProfileView.as_view(), name="guest-complete-profile"),
    path("profile-picture",  ProfilePictureView.as_view(),  name="guest-profile-picture"),
]
