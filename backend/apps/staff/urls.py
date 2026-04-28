# apps/staff/urls.py
from django.urls import path
from .views import (
    StaffTaskListView,
    AllTasksView,
    CreateTaskView,
    UpdateTaskStatusView,
    TaskDetailView,
    TaskHistoryView,
    StaffStatsView,
    AvailableStaffView,
    TaskDeleteView, MaintenanceRequestListView, AllMaintenanceRequestsView, CreateMaintenanceRequestView,
    MaintenanceRequestDetailView, UpdateMaintenanceRequestStatusView, AssignMaintenanceRequestView,
)

urlpatterns = [
    path('tasks/', StaffTaskListView.as_view(), name='staff-tasks'),
    path('all-tasks/', AllTasksView.as_view(), name='all-tasks'),
    path('tasks/create/', CreateTaskView.as_view(), name='create-task'),
    path('tasks/<int:task_id>/update/', UpdateTaskStatusView.as_view(), name='update-task-status'),
    path('tasks/<int:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:task_id>/history/', TaskHistoryView.as_view(), name='task-history'),
    path('tasks/<int:task_id>/delete/', TaskDeleteView.as_view(), name='task-delete'),
    path('stats/', StaffStatsView.as_view(), name='staff-stats'),
    path('available/', AvailableStaffView.as_view(), name='available-staff'),
    path('maintenance-requests/', MaintenanceRequestListView.as_view(), name='maintenance-requests'),
    path('maintenance-requests/all/', AllMaintenanceRequestsView.as_view(), name='all-maintenance-requests'),
    path('maintenance-requests/create/', CreateMaintenanceRequestView.as_view(), name='create-maintenance-request'),
    path('maintenance-requests/<int:request_id>/', MaintenanceRequestDetailView.as_view(),
         name='maintenance-request-detail'),
    path('maintenance-requests/<int:request_id>/update/', UpdateMaintenanceRequestStatusView.as_view(),
         name='update-maintenance-request'),
    path('maintenance-requests/<int:request_id>/assign/', AssignMaintenanceRequestView.as_view(),
         name='assign-maintenance-request'),
]