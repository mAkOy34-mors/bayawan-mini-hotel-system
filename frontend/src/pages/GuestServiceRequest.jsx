// pages/GuestServiceRequest.jsx
import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { API_BASE } from '../constants/config';
import { 
  Wrench, Sparkles, Shirt, Package, 
  Bed, Bath, Coffee, Tv, Send, CheckCircle2, Clock, AlertCircle,
  Hotel, User, Mail
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .sr-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    padding: 2rem 2.25rem;
  }
  @media (max-width: 768px) {
    .sr-root {
      padding: 1.25rem 1rem;
    }
  }

  .sr-header {
    margin-bottom: 1.6rem;
    animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
  }
  .sr-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .18rem;
  }
  .sr-sub {
    font-size: .82rem;
    color: var(--text-muted);
  }

  .sr-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,.05);
    animation: fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    margin-bottom: 1rem;
  }
  .sr-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .95rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }
  .sr-panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: .5rem;
  }
  .sr-panel-body {
    padding: 1.25rem;
  }

  .service-types {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 768px) {
    .service-types {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 540px) {
    .service-types {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .service-type-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .service-type-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    transition: background 0.2s;
  }
  .service-type-card:hover {
    border-color: var(--gold);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .service-type-card:hover::before {
    background: linear-gradient(to right, #9a7a2e, #C9A84C);
  }
  .service-type-card.selected {
    border-color: var(--gold);
    background: var(--gold-bg);
  }
  .service-type-card.selected::before {
    background: linear-gradient(to right, #9a7a2e, #C9A84C);
  }
  .service-type-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
    color: var(--gold-dark);
  }
  .service-type-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.25rem;
  }
  .service-charge {
    font-size: 0.65rem;
    color: var(--gold-dark);
    font-weight: 600;
  }

  .priority-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .priority-btn {
    flex: 1;
    padding: 0.6rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
  }

  /* Field styles matching other pages */
  .ap-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }
  .ap-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 700;
  }
  .ap-textarea {
    background: #fff;
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    font-size: 0.875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
  }
  .ap-textarea:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
  }
  .ap-textarea::placeholder {
    color: var(--text-muted);
  }

  .guest-info-card {
    background: var(--surface2);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
  }
  .guest-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .guest-info-row:last-child {
    border-bottom: none;
  }
  .guest-info-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .guest-info-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
  }

  .submit-btn {
    width: 100%;
    padding: 0.85rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.22s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 2px 8px rgba(201,168,76,0.28);
  }
  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #b09038, #dfc06e);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201,168,76,0.32);
  }
  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-container {
    text-align: center;
    padding: 2.5rem;
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--border);
    animation: fadeUp 0.4s ease both;
  }
  .success-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--green-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }
  .success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }
  .success-sub {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .loading-room {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .room-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .ap-spin-sm {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
`;

const SERVICE_TYPES = [
  { value: 'CLEANING', label: 'Cleaning', icon: <Sparkles size={24} />, charge: 0, color: '#10b981' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench size={24} />, charge: 0, color: '#f59e0b' },
  { value: 'LAUNDRY', label: 'Laundry', icon: <Shirt size={24} />, charge: 150, color: '#3b82f6' },
  { value: 'DELIVERY', label: 'Delivery', icon: <Package size={24} />, charge: 50, color: '#8b5cf6' },
  { value: 'EXTRA_PILLOWS', label: 'Extra Pillows', icon: <Bed size={24} />, charge: 0, color: '#ec4898' },
  { value: 'EXTRA_TOWELS', label: 'Extra Towels', icon: <Bath size={24} />, charge: 0, color: '#06b6d4' },
  { value: 'MINI_BAR', label: 'Mini Bar', icon: <Coffee size={24} />, charge: 100, color: '#78716c' },
  { value: 'TECH_SUPPORT', label: 'Tech Support', icon: <Tv size={24} />, charge: 0, color: '#6366f1' },
  { value: 'OTHER', label: 'Other', icon: <Package size={24} />, charge: 0, color: '#64748b' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={14} /> },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={14} /> },
  { value: 'HIGH', label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertCircle size={14} /> },
  { value: 'URGENT', label: 'Urgent', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: <AlertCircle size={14} /> },
];

export function GuestServiceRequest({ token, user }) {
  const [selectedType, setSelectedType] = useState('CLEANING');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(true);
  const { alert, showAlert } = useAlert();

  const guestName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';
  const guestEmail = user?.email || '';

  // Fetch the actual room number from active booking
  useEffect(() => {
    const fetchActiveRoom = async () => {
      if (!token) return;
      
      setLoadingRoom(true);
      try {
        const response = await fetch(`${API_BASE}/bookings/my-bookings/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const bookings = await response.json();
          const today = new Date().toISOString().split('T')[0];
          
          // Find active booking (CHECKED_IN status)
          const activeBooking = bookings.find(b => 
            b.status === 'CHECKED_IN' &&
            b.checkInDate <= today && 
            b.checkOutDate >= today
          );
          
          if (activeBooking) {
            // Try multiple possible field names for room number
            let roomNum = null;
            if (activeBooking.roomNumber) {
              roomNum = activeBooking.roomNumber;
            } else if (activeBooking.room_number) {
              roomNum = activeBooking.room_number;
            } else if (activeBooking.room?.roomNumber) {
              roomNum = activeBooking.room.roomNumber;
            } else if (activeBooking.room?.room_number) {
              roomNum = activeBooking.room.room_number;
            } else if (activeBooking.room?.number) {
              roomNum = activeBooking.room.number;
            }
            
            if (roomNum) {
              setActiveRoom(String(roomNum));
            } else {
              setActiveRoom('');
            }
          } else {
            setActiveRoom('');
          }
        } else {
          setActiveRoom('');
        }
      } catch (error) {
        console.error('Failed to fetch active room:', error);
        setActiveRoom('');
      } finally {
        setLoadingRoom(false);
      }
    };
    
    fetchActiveRoom();
  }, [token]);

  const roomNumber = activeRoom;

  const handleSubmit = async () => {
    if (!roomNumber || roomNumber === '') {
      showAlert('Room number is required. Please check in first at the front desk.', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/services/guest/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          service_type: selectedType,
          description: description,
          room_number: roomNumber,
          priority: priority
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setDescription('');
        setTimeout(() => setSubmitted(false), 3000);
        showAlert('Service request submitted successfully!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.message || 'Failed to submit request', 'error');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = SERVICE_TYPES.find(s => s.value === selectedType);
  const displayRoom = loadingRoom ? 'Loading...' : (roomNumber || 'Not checked in');

  return (
    <div className="sr-root">
      <style>{css}</style>
      <Alert alert={alert} />

      {/* Header */}
      <div className="sr-header">
        <h1 className="sr-title">Hotel Services</h1>
        <p className="sr-sub">Request anything you need — we'll deliver it to your room</p>
      </div>

      {submitted ? (
        <div className="success-container">
          <div className="success-icon">
            <CheckCircle2 size={48} color="#2d9b6f" />
          </div>
          <div className="success-title">Request Submitted!</div>
          <div className="success-sub">
            Your request has been sent to our team.<br />
            We'll handle it promptly and notify you once completed.
          </div>
          <button 
            className="submit-btn" 
            style={{ maxWidth: 200, margin: '0 auto' }}
            onClick={() => setSubmitted(false)}
          >
            Submit Another Request
          </button>
        </div>
      ) : (
        <div className="sr-panel">
          <div className="sr-panel-header">
            <div className="sr-panel-title">
              <Sparkles size={18} /> Request a Service
            </div>
          </div>
          <div className="sr-panel-body">
            {/* Service Types */}
            <div className="service-types">
              {SERVICE_TYPES.map(type => (
                <div
                  key={type.value}
                  className={`service-type-card ${selectedType === type.value ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.value)}
                >
                  <div className="service-type-icon">{type.icon}</div>
                  <div className="service-type-name">{type.label}</div>
                  {type.charge > 0 && (
                    <div className="service-charge">₱{type.charge}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Charge Notice */}
            {selectedService?.charge > 0 && (
              <div style={{ 
                background: 'rgba(201,168,76,0.08)', 
                padding: '0.75rem 1rem', 
                borderRadius: 10, 
                marginBottom: '1rem',
                borderLeft: `3px solid var(--gold)`,
                fontSize: '0.8rem',
                color: 'var(--gold-dark)',
              }}>
                <strong>💰 Service Charge:</strong> This service has an additional charge of <strong>₱{selectedService.charge}</strong> that will be added to your bill.
              </div>
            )}

            {/* Priority Selection */}
            <div className="ap-field">
              <label className="ap-label">Priority Level</label>
              <div className="priority-buttons">
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className="priority-btn"
                    onClick={() => setPriority(opt.value)}
                    style={{
                      border: `2px solid ${priority === opt.value ? opt.color : 'var(--border)'}`,
                      background: priority === opt.value ? opt.bg : '#fff',
                      color: priority === opt.value ? opt.color : 'var(--text-sub)',
                    }}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description - Fixed alignment */}
            <div className="ap-field">
              <label className="ap-label">Additional Details</label>
              <textarea
                className="ap-textarea"
                rows={3}
                placeholder="Tell us more about your request (e.g., specific items, timing, special instructions)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Guest Information */}
            <div className="guest-info-card">
              <div className="guest-info-row">
                <span className="guest-info-label">
                  <User size={12} /> Guest
                </span>
                <span className="guest-info-value">{guestName}</span>
              </div>
              <div className="guest-info-row">
                <span className="guest-info-label">
                  <Mail size={12} /> Email
                </span>
                <span className="guest-info-value">{guestEmail}</span>
              </div>
              <div className="guest-info-row">
                <span className="guest-info-label">
                  <Hotel size={12} /> Room Number
                </span>
                <span className="guest-info-value" style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>
                  {loadingRoom ? (
                    <span className="loading-room" style={{ padding: 0 }}>
                      <div className="room-spinner" /> Loading...
                    </span>
                  ) : (
                    displayRoom
                  )}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="submit-btn"
              disabled={submitting || loadingRoom || !roomNumber}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><div className="ap-spin-sm" /> Submitting Request...</>
              ) : (
                <><Send size={16} /> Submit Request</>
              )}
            </button>

            {/* Info Note */}
            <div style={{ 
              marginTop: '1rem',
              padding: '0.65rem',
              background: 'rgba(59,130,246,0.05)',
              borderRadius: 8,
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              border: '1px solid rgba(59,130,246,0.1)'
            }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
              Estimated response time: 5-10 minutes for urgent requests, 15-20 minutes for standard requests
            </div>

            {/* Check-in reminder */}
            {!loadingRoom && !roomNumber && (
              <div style={{ 
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: '#ef4444',
                textAlign: 'center',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                Please check in at the front desk first to request services.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}