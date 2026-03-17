// adminApi.js – maps every backend endpoint to a JS function
import { API_BASE } from '../constants/config';
const BASE = API_BASE;
const h = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'ngrok-skip-browser-warning': 'true',   // ← add this
});
async function req(url, opts = {}) {
  const res = await fetch(url, opts);

  // Guard against HTML error pages (404, 500 pages return HTML not JSON)
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error ${res.status} at ${url} — expected JSON but got HTML. Check the URL is correct.`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Reports / Dashboard ──────────────────────────────────────
export const getDashboard   = (t)        => req(`${BASE}/reports/dashboard/`,        { headers: h(t) });
export const getRevenue     = (t, period)=> req(`${BASE}/reports/revenue/?period=${period}`, { headers: h(t) });
export const getCheckins    = (t)        => req(`${BASE}/reports/checkins/`,          { headers: h(t) });
export const getOccupancy   = (t)        => req(`${BASE}/reports/occupancy/`,         { headers: h(t) });
export const getBookingReport=(t,period) => req(`${BASE}/reports/bookings/?period=${period}`, { headers: h(t) });

// ── Hotel Settings ───────────────────────────────────────────
export const getHotelSettings   = (t)    => req(`${BASE}/reports/settings/`,         { headers: h(t) });
export const saveHotelSettings  = (t, d) => req(`${BASE}/reports/settings/`,         { method: 'PUT',  headers: h(t), body: JSON.stringify(d) });

// ── Rooms ────────────────────────────────────────────────────
export const adminGetRooms   = (t)       => req(`${BASE}/admin/rooms/`,               { headers: h(t) });
export const adminCreateRoom = (t, d)    => req(`${BASE}/admin/rooms/`,               { method: 'POST', headers: h(t), body: JSON.stringify(d) });
export const adminGetRoom    = (t, id)   => req(`${BASE}/admin/rooms/${id}/`,         { headers: h(t) });
export const adminUpdateRoom = (t, id, d)=> req(`${BASE}/admin/rooms/${id}/`,         { method: 'PUT',  headers: h(t), body: JSON.stringify(d) });
export const adminDeleteRoom = (t, id)   => req(`${BASE}/admin/rooms/${id}/`,         { method: 'DELETE', headers: h(t) });

// ── Bookings ─────────────────────────────────────────────────
export const adminGetBookings    = (t, p = '') => req(`${BASE}/admin/bookings/?${p}`, { headers: h(t) });
export const adminGetBooking     = (t, id)     => req(`${BASE}/admin/bookings/${id}/`,{ headers: h(t) });
export const adminSetBookingStatus=(t,id,status)=> req(`${BASE}/admin/bookings/${id}/status/`, { method:'POST', headers:h(t), body:JSON.stringify({status}) });

// ── Guests ───────────────────────────────────────────────────
export const adminGetGuests       = (t, s = '') => req(`${BASE}/admin/guests/?search=${encodeURIComponent(s)}`, { headers: h(t) });
export const adminGetGuest        = (t, id)     => req(`${BASE}/admin/guests/${id}/`, { headers: h(t) });
export const adminToggleGuest     = (t, id)     => req(`${BASE}/admin/guests/${id}/toggle-active/`, { method: 'POST', headers: h(t) });

// ── Payments ─────────────────────────────────────────────────
export const adminGetPayments   = (t, s = '') => req(`${BASE}/admin/payments/?${s}`,  { headers: h(t) });
export const adminGetPayment    = (t, id)     => req(`${BASE}/admin/payments/${id}/`, { headers: h(t) });
export const adminVerifyPayment = (t, id)     => req(`${BASE}/admin/payments/${id}/verify/`, { method: 'POST', headers: h(t) });

// ── Rewards ──────────────────────────────────────────────────
export const adminGetAllRewards  = (t)        => req(`${BASE}/rewards/`,              { headers: h(t) });
export const adminAdjustPoints   = (t, uid, d)=> req(`${BASE}/rewards/${uid}/adjust/`,{ method:'POST', headers:h(t), body:JSON.stringify(d) });
export const adminGetRules       = (t)        => req(`${BASE}/rewards/rules/`,        { headers: h(t) });
export const adminCreateRule     = (t, d)     => req(`${BASE}/rewards/rules/`,        { method:'POST', headers:h(t), body:JSON.stringify(d) });
export const adminCreatePromo    = (t, d)     => req(`${BASE}/rewards/promotions/create/`, { method:'POST', headers:h(t), body:JSON.stringify(d) });
export const getActivePromos     = (t)        => req(`${BASE}/rewards/promotions/`,   { headers: h(t) });

// ── Support ──────────────────────────────────────────────────
export const adminGetAllTickets  = (t, s='') => req(`${BASE}/support/all/?status=${s}`, { headers: h(t) });
export const adminReplyTicket    = (t,id,msg)=> req(`${BASE}/support/${id}/reply/`,   { method:'POST', headers:h(t), body:JSON.stringify({message:msg}) });
export const adminSetTicketStatus= (t,id,st) => req(`${BASE}/support/${id}/status/`,  { method:'POST', headers:h(t), body:JSON.stringify({status:st}) });

// ── Change Requests ──────────────────────────────────────────
export const adminGetChangeRequests  = (t, s = '') => req(`${BASE}/bookings/change-requests/?status=${s}`, { headers: h(t) });
export const adminApproveChangeReq   = (t, id, note = '') => req(`${BASE}/bookings/change-requests/${id}/approve/`, { method: 'POST', headers: h(t), body: JSON.stringify({ adminNote: note }) });
export const adminRejectChangeReq    = (t, id, note = '') => req(`${BASE}/bookings/change-requests/${id}/reject/`,  { method: 'POST', headers: h(t), body: JSON.stringify({ adminNote: note }) });