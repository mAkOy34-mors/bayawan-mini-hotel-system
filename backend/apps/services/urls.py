# apps/services/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Guest endpoints
    path('guest/', views.GuestServiceRequestView.as_view(), name='guest-services'),
    path('my-payments/', views.GuestServicePaymentsView.as_view(), name='guest-service-payments'),

    # Reception endpoints
    path('reception/', views.ReceptionServiceListView.as_view(), name='reception-services'),
    path('reception/<int:service_id>/assign/', views.AssignServiceRequestView.as_view(), name='assign-service'),

    # Staff endpoints
    path('tasks/', views.StaffTaskListView.as_view(), name='staff-tasks'),
    path('tasks/<int:service_id>/status/', views.UpdateServiceStatusView.as_view(), name='update-service-status'),

    # Payment
    path('payment/', views.ServicePaymentView.as_view(), name='service-payment'),

    # Admin
    path('admin/dashboard/', views.AdminServiceDashboardView.as_view(), name='admin-service-dashboard'),
]