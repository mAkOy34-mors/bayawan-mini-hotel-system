import { API_BASE } from '../constants/config';

const headers = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'ngrok-skip-browser-warning': 'true',
});

const formatDateForAPI = (dateString) => {
  if (!dateString) return null;
  
  // If already in YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Try to parse as Date object
  const date = new Date(dateString);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', dateString);
    return null;
  }
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Format dates from API for display
const formatDateFromAPI = (dateString) => {
  if (!dateString) return '';
  
  // If already in YYYY-MM-DD format, return as is (for input[type="date"])
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Map frontend field names to backend field names
// Map frontend field names to backend field names
const mapProfileToBackend = (profile) => {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: profile.gender,
    homeAddress: profile.homeAddress,
    nationality: profile.nationality,
    dateOfBirth: formatDateForAPI(profile.dateOfBirth),
    contactNumber: profile.contactNumber,
    idType: profile.idType,
    idNumber: profile.idNumber,
    passportNumber: profile.passportNumber,
    visaType: profile.visaType,
    visaExpiryDate: formatDateForAPI(profile.visaExpiryDate),
    profilePicture: profile.profilePicture || null,
  };
};

// Map backend field names to frontend field names
const mapProfileToFrontend = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    firstName: data.firstName,        // was: data.first_name
    lastName: data.lastName,           // was: data.last_name
    gender: data.gender,
    homeAddress: data.homeAddress,     // was: data.home_address
    nationality: data.nationality,
    dateOfBirth: formatDateFromAPI(data.dateOfBirth),    // was: data.date_of_birth
    contactNumber: data.contactNumber, // was: data.contact_number
    idType: data.idType,               // was: data.id_type
    idNumber: data.idNumber,           // was: data.id_number
    passportNumber: data.passportNumber, // was: data.passport_number
    visaType: data.visaType,           // was: data.visa_type
    visaExpiryDate: formatDateFromAPI(data.visaExpiryDate), // was: data.visa_expiry_date
    profilePicture: data.profilePicture || null,
  };
};

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
  const res = await fetch(`${API_BASE}/bookings/my-bookings/`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const fetchAvailableRooms = async (token, checkIn, checkOut) => {
  try {
    const query = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : '';
    const res = await fetch(`${API_BASE}/rooms/available${query}`, { 
      headers: headers(token) 
    });

    if (!res.ok) {
      console.error('Rooms API error:', res.status);
      return [];
    }

    const data = await res.json();
    console.log('✅ Rooms from API:', data);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Rooms fetch error:', err);
    return [];
  }
};

export const createBooking = async (token, payload) => {
  const nights = Math.max(1, Math.ceil(
    (new Date(payload.checkOutDate) - new Date(payload.checkInDate)) / 86400000
  ));
  const totalAmount = payload.pricePerNight * nights;

  const res = await fetch(`${API_BASE}/bookings/`, {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({
      roomId: payload.roomId,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      numberOfGuests: payload.numberOfGuests,
      numAdults: payload.numberOfGuests,
      numChildren: 0,
      totalAmount: totalAmount,
      specialRequests: payload.specialRequests || '',
      paymentType: payload.paymentType,
      paymentMethod: payload.paymentMethod,
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
export const fetchPayments = async (token) => {
  const res = await fetch(`${API_BASE}/payments/my-payments/`, { headers: headers(token) });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// ── Profile ─────────────────────────────────────────────────────
// ── Profile ─────────────────────────────────────────────────────
export const fetchProfile = async (token) => {
  const res = await fetch(`${API_BASE}/guests/my-profile`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load profile.');
  
  const data = await res.json();
  // ✅ Map backend snake_case to frontend camelCase
  return mapProfileToFrontend(data);
};

export const saveProfile = async (token, profile) => {
  // Convert frontend camelCase to backend snake_case
  const backendData = mapProfileToBackend(profile);
  
  console.log('=== DEBUG: Saving Profile ===');
  console.log('Original profile:', profile);
  console.log('Mapped backend data:', backendData);
  console.log('Fields check:');
  console.log('  first_name:', backendData.first_name, '| empty?', !backendData.first_name);
  console.log('  last_name:', backendData.last_name, '| empty?', !backendData.last_name);
  console.log('  home_address:', backendData.home_address, '| empty?', !backendData.home_address);
  console.log('  nationality:', backendData.nationality, '| empty?', !backendData.nationality);
  console.log('  date_of_birth:', backendData.date_of_birth, '| empty?', !backendData.date_of_birth);
  console.log('  contact_number:', backendData.contact_number, '| empty?', !backendData.contact_number);
  console.log('  id_type:', backendData.id_type, '| empty?', !backendData.id_type);
  console.log('  gender:', backendData.gender);
  console.log('  id_number:', backendData.id_number);
  console.log('  passport_number:', backendData.passport_number);
  
  const method = profile.id ? 'PUT' : 'POST';
  const res = await fetch(`${API_BASE}/guests/complete-profile`, {
    method,
    headers: headers(token, true),
    body: JSON.stringify(backendData),
  });
  
  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response data:', data);
  
  if (!res.ok) {
    throw new Error(data.message || data.error || Object.values(data).flat().join(', ') || 'Save failed.');
  }
  
  return mapProfileToFrontend(data);
};

export const deleteProfile = async (token) => {
  const res = await fetch(`${API_BASE}/guests/my-profile`, {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete profile');
  return true;
};

// ===== FEEDBACK API FUNCTIONS =====
export const fetchFeedback = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/feedback/my-feedback/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch feedback');
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Fetch feedback error:', error);
    return [];
  }
};

export const submitFeedback = async (token, feedbackData) => {
  try {
    const payload = {
      booking: feedbackData.bookingId,
      overall_rating: feedbackData.rating,
      comment: feedbackData.comment || '',
    };
    
    const response = await fetch(`${API_BASE}/feedback/submit/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to submit feedback');
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      bookingId: data.booking,
      roomType: feedbackData.roomType,
      rating: data.overall_rating,
      comment: data.comment,
      date: data.created_at,
      response: data.response,
    };
  } catch (error) {
    console.error('Submit feedback error:', error);
    throw error;
  }
};

export const fetchProfilePicture = async (token) => {
  const res = await fetch(`${API_BASE}/guests/profile-picture`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load profile picture.');
  const data = await res.json();
  return data.imageBase64 || null;
};

export const saveProfilePicture = async (token, imageBase64) => {
  const res = await fetch(`${API_BASE}/guests/profile-picture`, {
    method: 'POST',
    headers: headers(token, true),
    body: JSON.stringify({ imageBase64 }),
  });
  if (!res.ok) throw new Error('Failed to save profile picture.');
  const data = await res.json();
  return data.imageBase64 || null;
};