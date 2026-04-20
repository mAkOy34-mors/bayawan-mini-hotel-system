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

    # Room management for housekeepers
    HousekeeperRoomListView,
    HousekeeperRoomDetailView,
    HousekeeperUpdateRoomStatusView,
    HousekeeperRoomStatusHistoryView,
    HousekeeperRoomStatsView,
)

urlpatterns = [
    # ========== STATIC PATHS FIRST (no parameters) ==========
    path('my-profile/', MyProfileView.as_view(), name='my-profile'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('my-stats/', MyStatsView.as_view(), name='my-stats'),
    path('report/', MyReportView.as_view(), name='my-report'),
    path('task-history/', TaskHistoryView.as_view(), name='task-history'),
    path('room-status/', RoomStatusView.as_view(), name='room-status'),
    path('tasks/', CleaningTaskListView.as_view(), name='tasks-list'),
    path('tasks/create/', CreateCleaningTaskView.as_view(), name='task-create'),
    path('stats/', HousekeeperStatsView.as_view(), name='housekeeper-stats'),
    path('supply-requests/', SupplyRequestListView.as_view(), name='supply-requests-list'),
    path('supply-requests/create/', CreateSupplyRequestView.as_view(), name='supply-request-create'),
    path('rooms/', HousekeeperRoomListView.as_view(), name='housekeeper-rooms'),
    path('rooms/stats/', HousekeeperRoomStatsView.as_view(), name='housekeeper-room-stats'),

    # ========== DYNAMIC PATHS WITH PARAMETERS (place after static) ==========
    path('', HousekeeperListView.as_view(), name='housekeeper-list'),
    path('create/', HousekeeperCreateView.as_view(), name='housekeeper-create'),
    path('<int:housekeeper_id>/', HousekeeperDetailView.as_view(), name='housekeeper-detail'),
    path('<int:housekeeper_id>/update/', HousekeeperUpdateView.as_view(), name='housekeeper-update'),
    path('<int:housekeeper_id>/delete/', HousekeeperDeleteView.as_view(), name='housekeeper-delete'),
    path('<int:housekeeper_id>/toggle-status/', HousekeeperToggleStatusView.as_view(),
         name='housekeeper-toggle-status'),

    # Room status with parameters
    path('rooms/<int:room_id>/status/', UpdateRoomStatusView.as_view(), name='update-room-status'),
    path('rooms/<int:room_id>/history/', RoomStatusHistoryView.as_view(), name='room-status-history'),
    path('rooms/<int:room_id>/', HousekeeperRoomDetailView.as_view(), name='housekeeper-room-detail'),
    path('rooms/<int:room_id>/status/', HousekeeperUpdateRoomStatusView.as_view(), name='housekeeper-room-status'),
    path('rooms/<int:room_id>/history/', HousekeeperRoomStatusHistoryView.as_view(), name='housekeeper-room-history'),

    # Tasks with parameters
    path('tasks/<int:task_id>/update-status/', UpdateTaskStatusView.as_view(), name='task-update-status'),
    path('tasks/<int:task_id>/checklist/', TaskChecklistView.as_view(), name='task-checklist'),
    path('checklist/<int:item_id>/', UpdateChecklistItemView.as_view(), name='update-checklist'),

    # Supply requests with parameters
    path('supply-requests/<int:request_id>/update/', UpdateSupplyRequestStatusView.as_view(),
         name='supply-request-update'),
]
