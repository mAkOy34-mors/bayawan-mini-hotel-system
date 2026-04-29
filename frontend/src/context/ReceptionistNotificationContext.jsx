// context/ReceptionistNotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  AlertTriangle, Bell, CalendarCheck, X, ArrowRightLeft, 
  Wrench, Hammer, MessageSquare, BedDouble, ClipboardList,
  Flame, Heart, Shield, Clock, CheckCircle, Loader2
} from 'lucide-react';
import { API_BASE } from '../constants/config';
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'

const ReceptionistNotificationContext = createContext(null);

const POLL_INTERVAL = 30000; // 30 seconds

// Define notification types with Lucide icons
export const NOTIF_TYPES = {
  urgent_emergency: { 
    label: i18next.t('urgentEmergency', 'URGENT EMERGENCY'), 
    colour: '#dc2626', 
    priority: 1, 
    Icon: AlertTriangle,
    bg: 'rgba(220,38,38,0.15)'
  },
  active_emergency: { 
    label: i18next.t('activeEmergency', 'Active Emergency'), 
    colour: '#ef4444', 
    priority: 2, 
    Icon: Bell,
    bg: 'rgba(239,68,68,0.1)'
  },
  cancellation_request: { 
    label: i18next.t('cancellationRequest2', 'Cancellation Request'), 
    colour: '#ef4444', 
    priority: 3, 
    Icon: X,
    bg: 'rgba(239,68,68,0.1)'
  },
  change_request: { 
    label: i18next.t('changeRequest', 'Change Request'), 
    colour: '#8b5cf6', 
    priority: 4, 
    Icon: ArrowRightLeft,
    bg: 'rgba(139,92,246,0.1)'
  },
  pending_arrival: { 
    label: i18next.t('pendingArrival', 'Pending Arrival'), 
    colour: '#3b82f6', 
    priority: 5, 
    Icon: CalendarCheck,
    bg: 'rgba(59,130,246,0.1)'
  },
  service_request: { 
    label: i18next.t('serviceRequest', 'Service Request'), 
    colour: '#f59e0b', 
    priority: 6, 
    Icon: Wrench,
    bg: 'rgba(245,158,11,0.1)'
  },
  room_issue: { 
    label: i18next.t('roomIssue', 'Room Issue'), 
    colour: '#ef4444', 
    priority: 7, 
    Icon: Hammer,
    bg: 'rgba(239,68,68,0.1)'
  },
  guest_complaint: { 
    label: i18next.t('guestComplaint', 'Guest Complaint'), 
    colour: '#f97316', 
    priority: 8, 
    Icon: MessageSquare,
    bg: 'rgba(249,115,22,0.1)'
  },
  dirty_room: { 
    label: i18next.t('roomNeedsCleaning', 'Room Needs Cleaning'), 
    colour: '#f59e0b', 
    priority: 9, 
    Icon: BedDouble,
    bg: 'rgba(245,158,11,0.1)'
  },
  pending_task: { 
    label: i18next.t('pendingStaffTask', 'Pending Staff Task'), 
    colour: '#3b82f6', 
    priority: 10, 
    Icon: ClipboardList,
    bg: 'rgba(59,130,246,0.1)'
  },
};

// Helper to format relative time
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return i18next.t('secondsSecAgo', '{{seconds}} sec ago', { seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return i18next.t('minutesMinAgo', '{{minutes}} min ago', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18next.t('hoursHourvalAgo', '{{hours}} hour{{val}} ago', { hours, val: hours !== 1 ? 's' : '' });
  const days = Math.floor(hours / 24);
  return i18next.t('daysDayvalAgo', '{{days}} day{{val}} ago', { days, val: days !== 1 ? 's' : '' });
}

// Derive notifications from API data
function deriveReceptionistNotifs(data) {
  const notifs = [];
  const now = new Date().toISOString();

  // 1. Emergency Alerts
  const emergencies = data.emergencies || [];
  emergencies.forEach(emergency => {
    if (emergency.status === 'ACTIVE') {
      const isUrgent = emergency.priority === 'HIGH' || 
                       emergency.emergencyType === 'medical' || 
                       emergency.emergencyType === 'fire';
      
      notifs.push({
        id: `emergency-${emergency.id}`,
        type: isUrgent ? 'urgent_emergency' : 'active_emergency',
        title: isUrgent ? 'URGENT EMERGENCY' : i18next.t('activeEmergency', 'Active Emergency'),
        message: i18next.t('valInRoomVal2', '{{val}} in Room {{val2}}', { val: emergency.emergencyTypeName || emergency.emergencyType?.toUpperCase() || 'Emergency', val2: emergency.roomNumber || 'Unknown' }),
        guestName: emergency.guestName || 'Guest',
        roomNumber: emergency.roomNumber,
        time: emergency.createdAt || now,
        read: false,
        link: 'emergency',
        priority: 1,
      });
    }
  });

  // 2. Cancellation Requests
  const cancelRequests = data.cancellationRequests || [];
  cancelRequests.forEach(req => {
    notifs.push({
      id: i18next.t('cancelid', 'cancel-{{id}}', { id: req.id }),
      type: 'cancellation_request',
      title: i18next.t('cancellationRequest2', 'Cancellation Request'),
      message: i18next.t('bookingBooking_reference', 'Booking {{booking_reference}}', { booking_reference: req.booking_reference }),
      guestName: req.guest_name,
      roomNumber: req.room_number,
      time: req.created_at || now,
      read: false,
      link: 'bookings',
      priority: NOTIF_TYPES.cancellation_request.priority,
    });
  });

  // 3. Change Requests
  const changeRequests = data.changeRequests || [];
  changeRequests.forEach(req => {
    notifs.push({
      id: `change-${req.id}`,
      type: 'change_request',
      title: i18next.t('changeRequest', 'Change Request'),
      message: i18next.t('bookingBookingreference', 'Booking {{bookingReference}}', { bookingReference: req.bookingReference }),
      guestName: req.guestName,
      roomNumber: req.roomNumber,
      time: req.createdAt || req.created_at || now,
      read: false,
      link: 'change-requests',
      priority: NOTIF_TYPES.change_request.priority,
    });
  });

  // 4. Today's Arrivals
  const arrivals = data.arrivals || [];
  arrivals.forEach(arrival => {
    notifs.push({
      id: i18next.t('arrivalid', 'arrival-{{id}}', { id: arrival.id }),
      type: 'pending_arrival',
      title: i18next.t('arrivalToday', 'Arrival Today'),
      message: i18next.t('roomtypeRoomnumber', '{{roomType}} #{{roomNumber}}', { roomType: arrival.roomType, roomNumber: arrival.roomNumber }),
      guestName: arrival.guestUsername || arrival.guestEmail,
      roomNumber: arrival.roomNumber,
      time: arrival.checkInDate || now,
      read: false,
      link: 'arrivals',
      priority: NOTIF_TYPES.pending_arrival.priority,
    });
  });

  // 5. Service Requests
  const services = data.serviceRequests || [];
  services.forEach(service => {
    const serviceType = service.service_type_label || service.service_type || 'Service';
    notifs.push({
      id: `service-${service.id}`,
      type: 'service_request',
      title: i18next.t('servicetypeRequest', '{{serviceType}} Request', { serviceType }),
      message: i18next.t('roomRoom_number', 'Room {{room_number}}', { room_number: service.room_number }),
      guestName: service.guest_name,
      roomNumber: service.room_number,
      time: service.created_at || now,
      read: false,
      link: 'services',
      priority: NOTIF_TYPES.service_request.priority,
    });
  });

  // 6. Room Issues
  const roomIssues = data.roomIssues || [];
  roomIssues.forEach(issue => {
    notifs.push({
      id: `issue-${issue.id}`,
      type: 'room_issue',
      title: i18next.t('roomIssueVal', 'Room Issue: {{val}}', { val: issue.title?.substring(0, 40) }),
      message: issue.description?.substring(0, 80) || 'Reported issue',
      guestName: issue.reported_by_name,
      roomNumber: issue.room_number,
      time: issue.created_at || now,
      read: false,
      link: 'room-issues',
      priority: issue.priority === 'HIGH' ? 5 : NOTIF_TYPES.room_issue.priority,
    });
  });

  // 7. Guest Complaints
  const complaints = data.complaints || [];
  complaints.forEach(complaint => {
    notifs.push({
      id: `complaint-${complaint.id}`,
      type: 'guest_complaint',
      title: complaint.title?.substring(0, 50),
      message: complaint.description?.substring(0, 80),
      guestName: complaint.guest_name,
      roomNumber: complaint.room_number,
      time: complaint.created_at || now,
      read: false,
      link: 'tasks',
      priority: complaint.priority === 'HIGH' ? 6 : NOTIF_TYPES.guest_complaint.priority,
    });
  });

  // 8. Dirty Rooms
  const dirtyRooms = data.dirtyRooms || [];
  dirtyRooms.forEach(room => {
    notifs.push({
      id: `dirty-${room.id}`,
      type: 'dirty_room',
      title: i18next.t('roomNeedsCleaning', 'Room Needs Cleaning'),
      message: i18next.t('roomtypeRoomnumber', '{{roomType}} #{{roomNumber}}', { roomType: room.roomType, roomNumber: room.roomNumber }),
      roomNumber: room.roomNumber,
      time: room.updated_at || room.updatedAt || now,
      read: false,
      link: 'roomboard',
      priority: NOTIF_TYPES.dirty_room.priority,
    });
  });

  // 9. Pending Staff Tasks
  const tasks = data.pendingTasks || [];
  tasks.forEach(task => {
    notifs.push({
      id: `task-${task.id}`,
      type: 'pending_task',
      title: task.title,
      message: task.description?.substring(0, 80) || 'Task assigned',
      roomNumber: task.room_number,
      time: task.created_at || task.createdAt || now,
      read: false,
      link: 'tasks',
      priority: task.priority === 'HIGH' ? 7 : NOTIF_TYPES.pending_task.priority,
    });
  });

  // Sort by priority and time
  notifs.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.time) - new Date(a.time);
  });

  return notifs;
}

export function ReceptionistNotificationProvider({ children, token }) {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    emergencies: 0,
    cancellations: 0,
    arrivals: 0,
    services: 0,
    complaints: 0,
  });
  
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('receptionist_notif_read') || '[]'));
    } catch {
      return new Set();
    }
  });
  
  const timerRef = useRef(null);
  const readIdsRef = useRef(readIds);
  
  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);

  const fetchAll = useCallback(async () => {
    if (!token || !isPolling) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const headers = { 
        Authorization: t('bearerToken', 'Bearer {{token}}', { token }),
        'ngrok-skip-browser-warning': 'true'
      };
      const today = new Date().toISOString().slice(0, 10);
      
      // Fetch all endpoints in parallel
      const [
        emergenciesRes,
        cancellationsRes,
        changeRequestsRes,
        arrivalsRes,
        servicesRes,
        roomIssuesRes,
        complaintsRes,
        dirtyRoomsRes,
        tasksRes,
      ] = await Promise.allSettled([
        fetch(`${API_BASE}/emergency/active/`, { headers }),
        fetch(t('api_basebookingscancelrequestsstatuspending', '{{API_BASE}}/bookings/cancel-requests/?status=PENDING', { API_BASE }), { headers }),
        fetch(t('api_basebookingschangerequestsstatuspending', '{{API_BASE}}/bookings/change-requests/?status=PENDING', { API_BASE }), { headers }),
        fetch(`${API_BASE}/receptionist/arrivals/?date=${today}`, { headers }),
        fetch(t('api_baseservicesreceptionstatuspending', '{{API_BASE}}/services/reception/?status=PENDING', { API_BASE }), { headers }),
        fetch(t('api_basehousekeepersroomissuesstatuspending', '{{API_BASE}}/housekeepers/room-issues/?status=PENDING', { API_BASE }), { headers }),
        fetch(t('api_basecomplaintsstaffstatuspending', '{{API_BASE}}/complaints/staff/?status=PENDING', { API_BASE }), { headers }),
        fetch(t('api_basereceptionistroomsstatusdirty', '{{API_BASE}}/receptionist/rooms/?status=DIRTY', { API_BASE }), { headers }),
        fetch(t('api_basestafftaskspendinglimit50', '{{API_BASE}}/staff/tasks/pending/?limit=50', { API_BASE }), { headers }),
      ]);

      // Parse responses
      const emergencies = emergenciesRes.status === 'fulfilled' && emergenciesRes.value.ok
        ? await emergenciesRes.value.json().then(d => d.emergencies || d || [])
        : [];
      
      const cancellations = cancellationsRes.status === 'fulfilled' && cancellationsRes.value.ok
        ? await cancellationsRes.value.json()
        : [];
      
      const changeRequests = changeRequestsRes.status === 'fulfilled' && changeRequestsRes.value.ok
        ? await changeRequestsRes.value.json()
        : [];
      
      const arrivalsData = arrivalsRes.status === 'fulfilled' && arrivalsRes.value.ok
        ? await arrivalsRes.value.json()
        : { arrivals: [] };
      const arrivals = (arrivalsData.arrivals || []).filter(
        b => b.status === 'CONFIRMED' || b.status === 'PENDING_DEPOSIT'
      );
      
      const servicesData = servicesRes.status === 'fulfilled' && servicesRes.value.ok
        ? await servicesRes.value.json()
        : { services: [] };
      const services = servicesData.services || [];
      
      const roomIssues = roomIssuesRes.status === 'fulfilled' && roomIssuesRes.value.ok
        ? await roomIssuesRes.value.json()
        : [];
      
      const complaints = complaintsRes.status === 'fulfilled' && complaintsRes.value.ok
        ? await complaintsRes.value.json()
        : [];
      
      const dirtyRooms = dirtyRoomsRes.status === 'fulfilled' && dirtyRoomsRes.value.ok
        ? await dirtyRoomsRes.value.json()
        : [];
      
      const pendingTasks = tasksRes.status === 'fulfilled' && tasksRes.value.ok
        ? await tasksRes.value.json()
        : [];

      // Update counts
      setCounts({
        total: emergencies.length + cancellations.length + changeRequests.length + 
               arrivals.length + services.length + roomIssues.length + 
               complaints.length + dirtyRooms.length + pendingTasks.length,
        emergencies: emergencies.filter(e => e.status === 'ACTIVE').length,
        cancellations: cancellations.length,
        arrivals: arrivals.length,
        services: services.filter(s => s.status === 'PENDING').length,
        complaints: complaints.filter(c => c.status === 'PENDING').length,
      });

      // Derive notifications
      const derived = deriveReceptionistNotifs({
        emergencies,
        cancellationRequests: cancellations,
        changeRequests,
        arrivals,
        serviceRequests: services,
        roomIssues,
        complaints,
        dirtyRooms,
        pendingTasks,
      });

      // Mark read status
      const currentReadIds = readIdsRef.current;
      setNotifications(derived.map(n => ({ 
        ...n, 
        read: currentReadIds.has(n.id),
        timeAgo: formatTimeAgo(n.time)
      })));
      
      setLastChecked(new Date());
      
    } catch (err) {
      console.error('[ReceptionistNotificationContext]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isPolling]);

  // Start polling
  useEffect(() => {
    if (!token) return;
    
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token, fetchAll]);

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('receptionist_notif_read', JSON.stringify([...next]));
      } catch {}
      return next;
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const ids = prev.map(n => n.id);
      const next = new Set([...readIdsRef.current, ...ids]);
      try {
        sessionStorage.setItem('receptionist_notif_read', JSON.stringify([...next]));
      } catch {}
      setReadIds(next);
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasCritical = notifications.some(n => 
    !n.read && (n.type === 'urgent_emergency' || n.type === 'active_emergency')
  );

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <ReceptionistNotificationContext.Provider value={{
      notifications,
      unreadCount,
      hasCritical,
      counts,
      loading,
      lastChecked,
      error,
      isPolling,
      markRead,
      markAllRead,
      refresh,
      stopPolling: () => setIsPolling(false),
      startPolling: () => setIsPolling(true),
    }}>
      {children}
    </ReceptionistNotificationContext.Provider>
  );
}

const NOTIF_FALLBACK = {
  notifications: [],
  unreadCount: 0,
  hasCritical: false,
  counts: { total: 0, emergencies: 0, cancellations: 0, arrivals: 0, services: 0, complaints: 0 },
  loading: false,
  lastChecked: null,
  error: null,
  isPolling: true,
  markRead: () => {},
  markAllRead: () => {},
  refresh: () => {},
  stopPolling: () => {},
  startPolling: () => {},
};

export function useReceptionistNotifications() {
  const ctx = useContext(ReceptionistNotificationContext);
  return ctx ?? NOTIF_FALLBACK;
}