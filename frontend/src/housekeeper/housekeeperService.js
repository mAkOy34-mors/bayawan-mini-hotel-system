// housekeeper/housekeeperService.js
import { API_BASE } from '../constants/config';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'ngrok-skip-browser-warning': 'true',
});

// ── Room Status ──────────────────────────────────────────────────────────
export const getRooms = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/rooms/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch rooms');
  return response.json();
};
export const getRoomDetail = async (token, roomId) => {
  const response = await fetch(`${API_BASE}/housekeepers/rooms/${roomId}/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch room details');
  return response.json();
};
export const getRoomHistory = async (token, roomId) => {
  const response = await fetch(`${API_BASE}/housekeepers/rooms/${roomId}/history/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch room history');
  return response.json();
};
export const getRoomStats = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/rooms/stats/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch room stats');
  return response.json();
};
export const getRoomStatus = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/room-status/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch room status');
  return response.json();
};

export const updateRoomStatus = async (token, roomId, status) => {
  const response = await fetch(`${API_BASE}/housekeepers/rooms/${roomId}/status/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update room status');
  return response.json();
};

// ── Tasks ────────────────────────────────────────────────────────────────
export const getMyTasks = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/my-tasks/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
};

export const updateTaskStatus = async (token, taskId, status, notes = '') => {
  const response = await fetch(`${API_BASE}/housekeepers/tasks/${taskId}/update-status/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status, notes }),
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
};

export const getTaskChecklist = async (token, taskId) => {
  const response = await fetch(`${API_BASE}/housekeepers/tasks/${taskId}/checklist/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch checklist');
  return response.json();
};

export const updateChecklistItem = async (token, itemId, isCompleted) => {
  const response = await fetch(`${API_BASE}/housekeepers/checklist/${itemId}/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) throw new Error('Failed to update checklist');
  return response.json();
};

// ── Reports ──────────────────────────────────────────────────────────────
export const getMyReport = async (token, period = 'daily') => {
  const response = await fetch(`${API_BASE}/housekeepers/report/?period=${period}`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch report');
  return response.json();
};

export const getTaskHistory = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/task-history/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch task history');
  return response.json();
};

// ── Profile ──────────────────────────────────────────────────────────────
export const getMyProfile = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/my-profile/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const updateMyProfile = async (token, data) => {
  const response = await fetch(`${API_BASE}/housekeepers/my-profile/`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

// ── Stats ────────────────────────────────────────────────────────────────
export const getMyStats = async (token) => {
  const response = await fetch(`${API_BASE}/housekeepers/my-stats/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};