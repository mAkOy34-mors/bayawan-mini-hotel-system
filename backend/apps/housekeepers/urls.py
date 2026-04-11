# apps/housekeepers/urls.py
from django.urls import path
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
    UpdateSupplyRequestStatusView, HousekeeperRoomListView, HousekeeperRoomDetailView, HousekeeperUpdateRoomStatusView,
    HousekeeperRoomStatusHistoryView, HousekeeperRoomStatsView,
)

urlpatterns = [
    # Housekeeper management
    path('', HousekeeperListView.as_view(), name='housekeeper-list'),
    path('<int:housekeeper_id>/', HousekeeperDetailView.as_view(), name='housekeeper-detail'),
    path('create/', HousekeeperCreateView.as_view(), name='housekeeper-create'),
    path('<int:housekeeper_id>/update/', HousekeeperUpdateView.as_view(), name='housekeeper-update'),
    path('<int:housekeeper_id>/delete/', HousekeeperDeleteView.as_view(), name='housekeeper-delete'),
    path('<int:housekeeper_id>/toggle-status/', HousekeeperToggleStatusView.as_view(),
         name='housekeeper-toggle-status'),

    # Profile
    path('my-profile/', MyProfileView.as_view(), name='my-profile'),

    # Room status
    path('room-status/', RoomStatusView.as_view(), name='room-status'),
    path('rooms/<int:room_id>/status/', UpdateRoomStatusView.as_view(), name='update-room-status'),
    path('rooms/<int:room_id>/history/', RoomStatusHistoryView.as_view(), name='room-status-history'),

    # Tasks
    path('tasks/', CleaningTaskListView.as_view(), name='tasks-list'),
    path('my-tasks/', MyTasksView.as_view(), name='my-tasks'),
    path('tasks/create/', CreateCleaningTaskView.as_view(), name='task-create'),
    path('tasks/<int:task_id>/update-status/', UpdateTaskStatusView.as_view(), name='task-update-status'),
    path('tasks/<int:task_id>/checklist/', TaskChecklistView.as_view(), name='task-checklist'),
    path('checklist/<int:item_id>/', UpdateChecklistItemView.as_view(), name='update-checklist'),

    # Reports
    path('report/', MyReportView.as_view(), name='my-report'),
    path('task-history/', TaskHistoryView.as_view(), name='task-history'),

    # Stats
    path('stats/', HousekeeperStatsView.as_view(), name='housekeeper-stats'),
    path('my-stats/', MyStatsView.as_view(), name='my-stats'),

    # Supply requests
    path('supply-requests/', SupplyRequestListView.as_view(), name='supply-requests-list'),
    path('supply-requests/create/', CreateSupplyRequestView.as_view(), name='supply-request-create'),
    path('supply-requests/<int:request_id>/update/', UpdateSupplyRequestStatusView.as_view(),
         name='supply-request-update'),
    path('rooms/', HousekeeperRoomListView.as_view(), name='housekeeper-rooms'),
    path('rooms/<int:room_id>/', HousekeeperRoomDetailView.as_view(), name='housekeeper-room-detail'),
    path('rooms/<int:room_id>/status/', HousekeeperUpdateRoomStatusView.as_view(), name='housekeeper-room-status'),
    path('rooms/<int:room_id>/history/', HousekeeperRoomStatusHistoryView.as_view(), name='housekeeper-room-history'),
    path('rooms/stats/', HousekeeperRoomStatsView.as_view(), name='housekeeper-room-stats'),
]