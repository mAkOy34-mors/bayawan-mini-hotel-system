# apps/employees/urls.py
from django.urls import path
from .views import (
    EmployeeListView,
    EmployeeDetailView,
    EmployeeCreateView,
    EmployeeUpdateView,
    EmployeeDeleteView,
    EmployeeToggleStatusView,
    EmployeeByDepartmentView,
    EmployeeByPositionView,
    MyEmployeeProfileView,
)

urlpatterns = [
    # Employee management
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('<int:employee_id>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('<int:employee_id>/update/', EmployeeUpdateView.as_view(), name='employee-update'),
    path('<int:employee_id>/delete/', EmployeeDeleteView.as_view(), name='employee-delete'),
    path('<int:employee_id>/toggle-status/', EmployeeToggleStatusView.as_view(), name='employee-toggle-status'),

    # Filter endpoints
    path('department/<str:department>/', EmployeeByDepartmentView.as_view(), name='employee-by-department'),
    path('position/<str:position>/', EmployeeByPositionView.as_view(), name='employee-by-position'),

    # Employee self-service
    path('my-profile/', MyEmployeeProfileView.as_view(), name='my-employee-profile'),
]