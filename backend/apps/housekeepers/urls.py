# apps/housekeepers/urls.py
from django.urls import path
from rest_framework.response import Response

from .views import (
    # Housekeeper management
    HousekeeperListView,
    HousekeeperDetailView,
    HousekeeperCreateView,
    HousekeeperUpdateView,
    HousekeeperDeleteView,
    HousekeeperToggleStatusView,

    # Profile
    MyProfileView,

    # Room status
    RoomStatusView,
    UpdateRoomStatusView,
    RoomStatusHistoryView,

    # Tasks
    CleaningTaskListView,
    MyTasksView,
    CreateCleaningTaskView,
    UpdateTaskStatusView,
    TaskChecklistView,
    UpdateChecklistItemView,

    # Reports
    MyReportView,
    TaskHistoryView,

    # Stats
    HousekeeperStatsView,
    MyStatsView,

    # Supply requests
    SupplyRequestListView,
    CreateSupplyRequestView,
    UpdateSupplyRequestStatusView,
    MySupplyRequestsView,

    # Room management for housekeepers
    HousekeeperRoomListView,
    HousekeeperRoomDetailView,
    HousekeeperUpdateRoomStatusView,
    HousekeeperRoomStatusHistoryView,
    HousekeeperRoomStatsView,

    # Room issues
    HousekeeperRoomIssuesView,
    AllRoomIssuesView,
    CreateRoomIssueView,
    RoomIssueDetailView,
    UpdateRoomIssueStatusView,
)

urlpatterns = [
    # ========== STATIC PATHS FIRST (no parameters) ==========

    # Housekeeper
    path('my-profile/', MyProfileView.as_view(), name='my-profile'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('my-stats/', MyStatsView.as_view(), name='my-stats'),
    path('report/', MyReportView.as_view(), name='my-report'),
    path('task-history/', TaskHistoryView.as_view(), name='task-history'),
    path('room-status/', RoomStatusView.as_view(), name='room-status'),
    path('stats/', HousekeeperStatsView.as_view(), name='housekeeper-stats'),

    # Tasks - static
    path('tasks/', CleaningTaskListView.as_view(), name='tasks-list'),
    path('tasks/create/', CreateCleaningTaskView.as_view(), name='task-create'),

    # Supply requests - static
    path('supply-requests/', SupplyRequestListView.as_view(), name='supply-requests-list'),
    path('supply-requests/create/', CreateSupplyRequestView.as_view(), name='supply-request-create'),
    path('supply-requests/my-requests/', MySupplyRequestsView.as_view(), name='my-supply-requests'),

    # Rooms - static
    path('rooms/', HousekeeperRoomListView.as_view(), name='housekeeper-rooms'),
    path('rooms/stats/', HousekeeperRoomStatsView.as_view(), name='housekeeper-room-stats'),

    # Room issues - static
    path('room-issues/', HousekeeperRoomIssuesView.as_view(), name='housekeeper-room-issues'),
    path('room-issues/all/', AllRoomIssuesView.as_view(), name='all-room-issues'),
    path('room-issues/create/', CreateRoomIssueView.as_view(), name='create-room-issue'),

    # ========== DYNAMIC PATHS WITH PARAMETERS ==========

    # Housekeeper management
    path('', HousekeeperListView.as_view(), name='housekeeper-list'),
    path('create/', HousekeeperCreateView.as_view(), name='housekeeper-create'),
    path('<int:housekeeper_id>/', HousekeeperDetailView.as_view(), name='housekeeper-detail'),
    path('<int:housekeeper_id>/update/', HousekeeperUpdateView.as_view(), name='housekeeper-update'),
    path('<int:housekeeper_id>/delete/', HousekeeperDeleteView.as_view(), name='housekeeper-delete'),
    path('<int:housekeeper_id>/toggle-status/', HousekeeperToggleStatusView.as_view(), name='housekeeper-toggle-status'),

    # Rooms - dynamic
    path('rooms/<int:room_id>/', HousekeeperRoomDetailView.as_view(), name='housekeeper-room-detail'),
    path('rooms/<int:room_id>/status/', HousekeeperUpdateRoomStatusView.as_view(), name='housekeeper-room-status'),
    path('rooms/<int:room_id>/history/', HousekeeperRoomStatusHistoryView.as_view(), name='housekeeper-room-history'),

    # Tasks - dynamic
    path('tasks/<int:task_id>/update-status/', UpdateTaskStatusView.as_view(), name='task-update-status'),
    path('tasks/<int:task_id>/checklist/', TaskChecklistView.as_view(), name='task-checklist'),
    path('checklist/<int:item_id>/', UpdateChecklistItemView.as_view(), name='update-checklist'),

    # Supply requests - dynamic
    path('supply-requests/<int:request_id>/update/', UpdateSupplyRequestStatusView.as_view(), name='supply-request-update'),

    # Room issues - dynamic
    path('room-issues/<int:issue_id>/', RoomIssueDetailView.as_view(), name='room-issue-detail'),
    path('room-issues/<int:issue_id>/status/', UpdateRoomIssueStatusView.as_view(), name='update-room-issue-status'),
]