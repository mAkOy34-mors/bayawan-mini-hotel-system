from django.urls import path
from . import views

urlpatterns = [
    # Guest endpoints
    path('guest/', views.GuestComplaintListView.as_view(), name='guest-complaints'),
    path('guest/<int:complaint_id>/', views.GuestComplaintDetailView.as_view(), name='guest-complaint-detail'),

    # Staff endpoints
    path('staff/', views.StaffComplaintListView.as_view(), name='staff-complaints'),
    path('staff/<int:complaint_id>/', views.StaffComplaintUpdateView.as_view(), name='staff-complaint-update'),
]