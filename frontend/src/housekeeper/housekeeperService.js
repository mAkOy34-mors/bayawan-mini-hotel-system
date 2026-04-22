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
  const response = await fetch(`${API_BASE}/employees/my-profile/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
};

export const updateMyProfile = async (token, data) => {
  const response = await fetch(`${API_BASE}/employees/my-profile/`, {
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

// Add these new functions to your existing housekeeperService.js

// ── Staff Tasks (for housekeeper to fetch assigned tasks) ──
export const getStaffTasks = async (token) => {
  const response = await fetch(`${API_BASE}/staff/tasks/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch staff tasks');
  const data = await response.json();
  
  // Filter for housekeeping/cleaning tasks only
  return data.filter(task => 
    task.task_type === 'HOUSEKEEPING' || 
    task.task_type === 'CLEANING'
  );
};

export const updateStaffTaskStatus = async (token, taskId, status, notes = '') => {
  const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/update/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status, note: notes }),
  });
  if (!response.ok) throw new Error('Failed to update task status');
  return response.json();
};

export const getStaffTaskDetail = async (token, taskId) => {
  const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch task detail');
  return response.json();
};

export const getStaffTaskHistory = async (token, taskId) => {
  const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/history/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch task history');
  return response.json();
};

export const getStaffStats = async (token) => {
  const response = await fetch(`${API_BASE}/staff/stats/`, {
    headers: getHeaders(token),
  });
  if (!response.ok) throw new Error('Failed to fetch staff stats');
  return response.json();
};

// housekeeper/housekeeperService.js - Add these functions

// ── Service Requests (for housekeeper) ──
export const getMyServiceRequests = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/services/tasks/`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch service requests');
    const data = await response.json();
    // Add source identifier
    return data.map(task => ({ ...task, source: 'service' }));
  } catch (err) {
    console.error('Error fetching service requests:', err);
    return [];
  }
};

export const updateServiceRequestStatus = async (token, serviceId, status, notes = '') => {
  const response = await fetch(`${API_BASE}/services/tasks/${serviceId}/status/`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status, notes }),
  });
  if (!response.ok) throw new Error('Failed to update service request');
  return response.json();
};