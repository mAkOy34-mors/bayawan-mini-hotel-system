// context/NotificationContext.jsx
// Polls real guest API endpoints and derives notifications from actual response shapes.
//
// Endpoints used (matching what the app already calls):
//   GET /bookings/my-bookings/           → booking list
//   GET /bookings/{id}/change-requests/  → change requests per booking
//   GET /services/guest/                 → service requests
//   GET /complaints/guest/               → complaints
//
// Field names mirror what MyBookingsPage / GuestComplaintPage / GuestServiceRequest actually use.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../constants/config';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 30_000; // 30 s

// Colour / label per type
export const NOTIF_META = {
  booking_confirmed:            { colour: '#2d9b6f', label: 'Booking Confirmed'         },
  booking_cancelled:            { colour: '#dc3545', label: 'Booking Cancelled'         },
  booking_cancellation_pending: { colour: '#8b5cf6', label: 'Cancellation Requested'   },
  change_request_approved:      { colour: '#2d9b6f', label: 'Change Request Approved'   },
  change_request_rejected:      { colour: '#dc3545', label: 'Change Request Declined'   },
  change_request_pending:       { colour: '#f59e0b', label: 'Change Request Submitted'  },
  change_request_payment:       { colour: '#3b82f6', label: 'Payment Required'          },
  service_completed:            { colour: '#2d9b6f', label: 'Service Completed'         },
  service_in_progress:          { colour: '#3b82f6', label: 'Service In Progress'       },
  complaint_in_progress:        { colour: '#3b82f6', label: 'Complaint In Progress'     },
  complaint_resolved:           { colour: '#2d9b6f', label: 'Complaint Resolved'        },
};

// Room number from a booking object — handles both snake_case and camelCase
function getRoomNo(b) {
  return b?.room?.roomNumber || b?.roomNumber || b?.room?.room_number || b?.room_number || 'your room';
}

// Derive notifications from API data
// changeRequestsMap: { [bookingId]: cr[] }
function deriveNotifs(bookings, changeRequestsMap, services, complaints) {
  const notifs = [];

  bookings.forEach(b => {
    const ref  = b.bookingReference || b.booking_reference || '#' + b.id;
    const room = getRoomNo(b);
    const cin  = b.checkInDate || b.check_in_date || '';
    const time = b.updatedAt || b.updated_at || b.createdAt || b.created_at;

    if (b.status === 'CONFIRMED') {
      notifs.push({
        id:      'booking-confirmed-' + b.id,
        type:    'booking_confirmed',
        title:   'Booking Confirmed',
        message: 'Room ' + room + ' (' + ref + ') confirmed' + (cin ? ' — check-in ' + cin : '') + '.',
        time, read: false, ref: 'mybookings',
      });
    }

    if (b.status === 'CANCELLED') {
      notifs.push({
        id:      'booking-cancelled-' + b.id,
        type:    'booking_cancelled',
        title:   'Booking Cancelled',
        message: 'Your booking ' + ref + ' for Room ' + room + ' has been cancelled.',
        time, read: false, ref: 'mybookings',
      });
    }

    if (b.status === 'CANCELLATION_PENDING') {
      notifs.push({
        id:      'booking-cancel-pending-' + b.id,
        type:    'booking_cancellation_pending',
        title:   'Cancellation Under Review',
        message: 'Your cancellation request for ' + ref + ' is being reviewed by the hotel.',
        time:    b.cancellationRequest?.createdAt || time,
        read: false, ref: 'mybookings',
      });
    }

    // Change requests (fetched separately per booking)
    const crs = changeRequestsMap[b.id] || [];
    crs.forEach(cr => {
      const crTime = cr.updatedAt || cr.updated_at || cr.createdAt || cr.created_at;

      if (cr.status === 'APPROVED') {
        notifs.push({
          id:      'cr-approved-' + cr.id,
          type:    'change_request_approved',
          title:   'Change Request Approved',
          message: 'Your change request for booking ' + ref + ' has been approved.',
          time: crTime, read: false, ref: 'mybookings',
        });
      } else if (cr.status === 'REJECTED') {
        notifs.push({
          id:      'cr-rejected-' + cr.id,
          type:    'change_request_rejected',
          title:   'Change Request Declined',
          message: 'Your change request for booking ' + ref + ' was declined by the hotel.',
          time: crTime, read: false, ref: 'mybookings',
        });
      } else if (cr.status === 'PAYMENT_PENDING') {
        notifs.push({
          id:      'cr-payment-' + cr.id,
          type:    'change_request_payment',
          title:   'Payment Required',
          message: 'Change request for ' + ref + ' approved — additional deposit needed to confirm.',
          time: crTime, read: false, ref: 'mybookings',
        });
      } else if (cr.status === 'PENDING') {
        notifs.push({
          id:      'cr-pending-' + cr.id,
          type:    'change_request_pending',
          title:   'Change Request Submitted',
          message: 'Your change request for booking ' + ref + ' is awaiting hotel approval.',
          time: crTime, read: false, ref: 'mybookings',
        });
      }
    });
  });

  // Services: fields are snake_case (service_type, service_type_label, room_number, status, created_at, updated_at)
  services.forEach(s => {
    const label = s.service_type_label || s.service_type || 'Service request';
    const room  = s.room_number || 'your room';
    const time  = s.updated_at || s.created_at;

    if (s.status === 'COMPLETED') {
      notifs.push({
        id:      'service-completed-' + s.id,
        type:    'service_completed',
        title:   'Service Completed',
        message: label + ' for Room ' + room + ' has been completed.',
        time, read: false, ref: 'services',
      });
    } else if (s.status === 'IN_PROGRESS' || s.status === 'ASSIGNED') {
      notifs.push({
        id:      'service-inprogress-' + s.id,
        type:    'service_in_progress',
        title:   'Service In Progress',
        message: label + ' for Room ' + room + ' is being handled by our staff.',
        time, read: false, ref: 'services',
      });
    }
  });

  // Complaints: fields are created_at/createdAt, updated_at/updatedAt, title, status
  complaints.forEach(c => {
    const time = c.updated_at || c.updatedAt || c.created_at || c.createdAt;
    const titleSnippet = c.title ? ' "' + c.title + '"' : '';

    if (c.status === 'IN_PROGRESS') {
      notifs.push({
        id:      'complaint-inprogress-' + c.id,
        type:    'complaint_in_progress',
        title:   'Complaint In Progress',
        message: 'Our team is looking into your complaint' + titleSnippet + '.',
        time, read: false, ref: 'complaints',
      });
    } else if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
      notifs.push({
        id:      'complaint-resolved-' + c.id,
        type:    'complaint_resolved',
        title:   c.status === 'RESOLVED' ? 'Complaint Resolved' : 'Complaint Closed',
        message: 'Your complaint' + titleSnippet + ' has been ' + c.status.toLowerCase() + '.',
        time, read: false, ref: 'complaints',
      });
    }
  });

  notifs.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  return notifs;
}

// Provider
export function NotificationProvider({ children, token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [readIds, setReadIds]             = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('notif_read') || '[]')); }
    catch { return new Set(); }
  });
  const timerRef   = useRef(null);
  const readIdsRef = useRef(readIds);
  useEffect(() => { readIdsRef.current = readIds; }, [readIds]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: 'Bearer ' + token };

      // 1. Bookings
      const bRes     = await fetch(API_BASE + '/bookings/my-bookings/', { headers });
      const bookings = bRes.ok ? await bRes.json() : [];
      const bArray   = Array.isArray(bookings) ? bookings : [];

      // 2. Change requests per booking (concurrent)
      const changeRequestsMap = {};
      await Promise.all(
        bArray.map(async (b) => {
          try {
            const res = await fetch(API_BASE + '/bookings/' + b.id + '/change-requests/', { headers });
            changeRequestsMap[b.id] = res.ok ? (await res.json()) : [];
          } catch {
            changeRequestsMap[b.id] = [];
          }
        })
      );

      // 3. Services
      const sRes     = await fetch(API_BASE + '/services/guest/', { headers });
      const services = sRes.ok ? await sRes.json() : [];

      // 4. Complaints
      const cRes        = await fetch(API_BASE + '/complaints/guest/', { headers });
      const complaints  = cRes.ok ? await cRes.json() : [];

      const derived = deriveNotifs(
        bArray,
        changeRequestsMap,
        Array.isArray(services)   ? services   : [],
        Array.isArray(complaints) ? complaints : [],
      );

      const curRead = readIdsRef.current;
      setNotifications(derived.map(n => ({ ...n, read: curRead.has(n.id) })));
    } catch (err) {
      console.error('[NotificationContext]', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [token, fetchAll]);

  const markRead = useCallback((id) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { sessionStorage.setItem('notif_read', JSON.stringify([...next])); } catch {}
      return next;
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const ids  = prev.map(n => n.id);
      const next = new Set([...readIdsRef.current, ...ids]);
      try { sessionStorage.setItem('notif_read', JSON.stringify([...next])); } catch {}
      setReadIds(next);
      return prev.map(n => ({ ...n, read: true }));
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh: fetchAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

const NOTIF_FALLBACK = {
  notifications: [], unreadCount: 0, loading: false,
  markRead: () => {}, markAllRead: () => {}, refresh: () => {},
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  return ctx ?? NOTIF_FALLBACK;
}