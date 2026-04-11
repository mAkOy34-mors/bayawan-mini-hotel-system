# apps/staff/urls.py
from django.urls import path
from .views import (
    StaffTaskListView,
    AllTasksView,
    CreateTaskView,
    UpdateTaskStatusView,
    TaskDetailView,
    TaskHistoryView,
    StaffProfileView,
    StaffStatsView,
    AvailableStaffView,
)

urlpatterns = [
    # Staff endpoints
    path('tasks/', StaffTaskListView.as_view(), name='staff-tasks'),
    path('all-tasks/', AllTasksView.as_view(), name='all-tasks'),
    path('tasks/create/', CreateTaskView.as_view(), name='create-task'),
    path('tasks/<int:task_id>/update/', UpdateTaskStatusView.as_view(), name='update-task-status'),
    path('tasks/<int:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:task_id>/history/', TaskHistoryView.as_view(), name='task-history'),
    path('profile/', StaffProfileView.as_view(), name='staff-profile'),
    path('stats/', StaffStatsView.as_view(), name='staff-stats'),
    path('available/', AvailableStaffView.as_view(), name='available-staff'),
]