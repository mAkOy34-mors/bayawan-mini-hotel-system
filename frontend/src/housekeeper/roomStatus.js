// housekeeper/roomStatus.js
export const ROOM_STATUS = {
  CLEAN: 'CLEAN',
  DIRTY: 'DIRTY',
  OCCUPIED: 'OCCUPIED',
  VACANT: 'VACANT',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTED: 'INSPECTED',
};

export const ROOM_STATUS_CONFIG = {
  [ROOM_STATUS.CLEAN]: {
    label: 'Clean',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '✅',
    nextStatus: [ROOM_STATUS.DIRTY, ROOM_STATUS.OCCUPIED],
  },
  [ROOM_STATUS.DIRTY]: {
    label: 'Dirty',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '🧹',
    nextStatus: [ROOM_STATUS.CLEAN, ROOM_STATUS.MAINTENANCE],
  },
  [ROOM_STATUS.OCCUPIED]: {
    label: 'Occupied',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: '👤',
    nextStatus: [ROOM_STATUS.DIRTY, ROOM_STATUS.VACANT],
  },
  [ROOM_STATUS.VACANT]: {
    label: 'Vacant',
    color: '#8a96a8',
    bgColor: 'rgba(138, 150, 168, 0.1)',
    icon: '🏠',
    nextStatus: [ROOM_STATUS.CLEAN, ROOM_STATUS.DIRTY],
  },
  [ROOM_STATUS.MAINTENANCE]: {
    label: 'Maintenance',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    icon: '🔧',
    nextStatus: [ROOM_STATUS.CLEAN, ROOM_STATUS.DIRTY],
  },
  [ROOM_STATUS.INSPECTED]: {
    label: 'Inspected',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: '✓',
    nextStatus: [ROOM_STATUS.CLEAN, ROOM_STATUS.DIRTY],
  },
};

export const getRoomStatusBadge = (status) => {
  const config = ROOM_STATUS_CONFIG[status] || ROOM_STATUS_CONFIG[ROOM_STATUS.DIRTY];
  return {
    label: config.label,
    color: config.color,
    bgColor: config.bgColor,
    icon: config.icon,
  };
};

export const getStatusOptions = () => {
  return Object.entries(ROOM_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
    icon: config.icon,
    color: config.color,
  }));
};