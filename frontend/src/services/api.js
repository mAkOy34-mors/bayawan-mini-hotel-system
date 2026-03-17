import { API_BASE } from '../constants/config';
import { DEMO_BOOKINGS, DEMO_PAYMENTS, DEMO_ROOMS } from '../constants/data';

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'ngrok-skip-browser-warning': 'true',   // ← bypasses ngrok warning page
});

// ── Auth ────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: headers(null, true),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Invalid email or password.');
  return data;
};

export const registerUser = async (payload) => {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: headers(null, true),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed.');
  return data;
};

export const verifyOtp = async (email, otp) => {
  const res = await fetch(`${API_BASE}/users/verify-otp`, {
    method: 'POST',
    headers: headers(null, true),
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw new Error('Invalid OTP.');
  return res.json();
};

export const resendOtp = async (email) => {
  await fetch(`${API_BASE}/users/resend-otp`, {
    method: 'POST',
    headers: headers(null, true),
    body: JSON.stringify({ email }),
  });
};

// ── Bookings ────────────────────────────────────────────────────
export const fetchRecentBookings = async (token) => {
  const res = await fetch(`${API_BASE}/bookings/my-bookings/`, {  // 👈 fixed URL (removed duplicate /api/v1)
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  // Sort if needed (backend should already return sorted)
  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const fetchAvailableRooms = async (token, checkIn, checkOut) => {
  try {
    const query = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : '';
    const res = await fetch(`${API_BASE}/rooms/available${query}`, { headers: headers(token) });

    if (!res.ok) {
      console.error('Rooms API error:', res.status);
      return DEMO_ROOMS;
    }

    const data = await res.json();
    console.log('✅ Rooms from API:', data);  // check this in F12 console

    if (!data.length) {
      console.warn('API returned empty rooms, using DEMO_ROOMS');
      return DEMO_ROOMS;
    }

    return data;

  } catch (err) {
    console.error('Rooms fetch error:', err);
    return DEMO_ROOMS;
  }
};

export const createBooking = async (token, payload) => {
  const nights = Math.max(1, Math.ceil(
    (new Date(payload.checkOutDate) - new Date(payload.checkInDate)) / 86400000
  ));
  const totalAmount = payload.pricePerNight * nights;

  const res = await fetch(`${API_BASE}/bookings/`, {    // ← was BASE_URL
    method: 'POST',
    headers: headers(token, true),                       // ← use your existing headers() helper
    body: JSON.stringify({
      roomId:          payload.roomId,
      checkInDate:     payload.checkInDate,
      checkOutDate:    payload.checkOutDate,
      numberOfGuests:  payload.numberOfGuests,
      numAdults:       payload.numberOfGuests,
      numChildren:     0,
      totalAmount:     totalAmount,
      specialRequests: payload.specialRequests || '',
      paymentType:     payload.paymentType,
      paymentMethod:   payload.paymentMethod,
    }),
  });

  const data = await res.json();
  console.log('Booking response:', res.status, data); 
  if (!res.ok) throw new Error(
    data.message ||
    data.detail ||
    Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', ') ||
    'Booking failed'
  );
  return data;
};
// ── Payments ────────────────────────────────────────────────────
// ✅ Fixed — throws real errors, no fallback to demo data
export const fetchPayments = async (token) => {
  const res = await fetch(`${API_BASE}/payments/my-payments/`, { headers: headers(token) });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// ── Profile ─────────────────────────────────────────────────────
export const fetchProfile = async (token) => {
  const res = await fetch(`${API_BASE}/guests/my-profile`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load profile.');
  return res.json();
};

export const saveProfile = async (token, profile) => {
  const method = profile.id ? 'PUT' : 'POST';
  const res = await fetch(`${API_BASE}/guests/complete-profile`, {
    method,
    headers: headers(token, true),
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Save failed.');
  return data;
};

export const deleteProfile = async (token) => {
  const res = await fetch(`${API_BASE}/guests/my-profile`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete profile');
  return true;
};