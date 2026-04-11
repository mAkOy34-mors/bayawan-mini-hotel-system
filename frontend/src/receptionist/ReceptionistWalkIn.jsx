// ReceptionistWalkIn.jsx — Create walk-in bookings for guests without reservation
import { useState, useEffect } from 'react';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  PlusCircle, BedDouble, User, Calendar, Users, CreditCard,
  CheckCircle2, AlertTriangle, Search, RefreshCw, Phone, Mail,
  MapPin, Globe, Calendar as CalendarIcon, IdCard,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

const EXTRA_CSS = `
  .wi-steps { display: flex; gap: 0; margin-bottom: 1.5rem; }
  .wi-step {
    flex: 1; display: flex; flex-direction: column; align-items: center; position: relative;
  }
  .wi-step::after {
    content: ''; position: absolute; top: 16px; left: calc(50% + 16px);
    right: calc(-50% + 16px); height: 2px; background: var(--border); z-index: 0;
  }
  .wi-step:last-child::after { display: none; }
  .wi-step-dot {
    width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: .78rem; font-weight: 700; z-index: 1;
    transition: all .3s; border: 2px solid;
  }
  .wi-step-dot.done { background: var(--green); border-color: var(--green); color: #fff; }
  .wi-step-dot.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
  .wi-step-dot.idle { background: #fff; border-color: var(--border); color: var(--text-muted); }
  .wi-step-label { font-size: .68rem; font-weight: 600; margin-top: .4rem; color: var(--text-muted); text-align: center; }
  .wi-step-label.active { color: #2563eb; }
  .wi-step-label.done { color: var(--green); }

  .wi-room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .65rem; }
  .wi-room-card {
    border: 2px solid var(--border); border-radius: 10px; padding: .8rem .9rem; cursor: pointer;
    transition: all .18s; background: #fff;
  }
  .wi-room-card:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.04); }
  .wi-room-card.sel { border-color: #3b82f6; background: rgba(59, 130, 246, 0.06); }
  .wi-room-card.unavail { opacity: .4; cursor: not-allowed; }
  .wi-room-num { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: var(--text); }
  .wi-room-type { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); margin-bottom: .3rem; }
  .wi-room-price { font-size: .76rem; color: var(--text-sub); font-weight: 600; }

  .wi-summary-box {
    background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px; padding: 1rem 1.1rem;
  }
  .wi-summary-row { display: flex; justify-content: space-between; font-size: .82rem; margin-bottom: .35rem; color: var(--text-sub); }
  .wi-summary-row.total { font-weight: 700; color: var(--text); font-size: .9rem; border-top: 1px solid rgba(59, 130, 246, 0.15); padding-top: .45rem; margin-top: .45rem; }
  
  .wi-temp-password {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: rgba(201, 168, 76, 0.15);
    border: 1px solid var(--gold);
    border-radius: 8px;
    font-size: 0.8rem;
  }
  .wi-temp-password strong {
    color: var(--gold-dark);
  }
  
  .wi-guest-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  @media (max-width: 640px) {
    .wi-guest-form-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export function ReceptionistWalkIn({ token, setPage }) {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [rLoad, setRLoad] = useState(true);
  const [selRoom, setSelRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(tomorrow());
  const [guests, setGuests] = useState(1);

  // Guest information
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'Not Specified',
    address: '',
    nationality: 'Filipino',
    dateOfBirth: '',
    idType: 'OTHER',
    idNumber: '',
  });

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const { toast, show } = useToast();

  useEffect(() => {
    fetch(`${BASE}/receptionist/rooms/`, { headers: h(token) })
      .then(r => r.json())
      .then(d => setRooms(Array.isArray(d) ? d : []))
      .catch(() => show('Failed to load rooms', 'error'))
      .finally(() => setRLoad(false));
  }, [token]);

  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const total = selRoom ? parseFloat(selRoom.pricePerNight || 0) * nights : 0;

  const handleSubmit = async () => {
    setSaving(true);
    setTempPassword(null);

    try {
      // Validation
      if (!guestInfo.email) throw new Error('Guest email is required.');
      if (!guestInfo.firstName && !guestInfo.lastName) throw new Error('Guest name is required.');

      const res = await fetch(`${BASE}/receptionist/bookings/walkin/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({
          roomId: selRoom.id,
          guestEmail: guestInfo.email,
          firstName: guestInfo.firstName || 'Walk-in',
          lastName: guestInfo.lastName || 'Guest',
          guestPhone: guestInfo.phone,
          gender: guestInfo.gender,
          address: guestInfo.address || 'Not provided',
          nationality: guestInfo.nationality,
          dateOfBirth: guestInfo.dateOfBirth || '2000-01-01',
          idType: guestInfo.idType,
          idNumber: guestInfo.idNumber || '',
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: guests,
          amountPaid: total,
          paymentMethod: 'CASH',
          specialRequests: 'Walk-in booking',
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create booking');

      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
      }

      setDone(data);
      show(data.message || 'Walk-in booking created successfully!', 'success');
    } catch (e) {
      show(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGuestChange = (field, value) => {
    setGuestInfo(prev => ({ ...prev, [field]: value }));
  };

  const STEPS = ['Select Room', 'Guest Info', 'Confirm'];

  if (done) {
    return (
      <div className="ap-root">
        <style>{SHARED_CSS}{EXTRA_CSS}</style>
        <div style={{ maxWidth: 500, margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 size={64} strokeWidth={1.5} color="var(--green)" />
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.7rem', fontWeight: 600, marginBottom: '.5rem' }}>
            Walk-in Created!
          </div>
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Guest has been checked in successfully.
          </div>

          {tempPassword && (
            <div className="wi-temp-password">
              <strong>🔐 Temporary Password:</strong> {tempPassword}
              <br />
              <small>✓ Sent to {done.guestEmail}</small>
            </div>
          )}

          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', margin: '1rem 0', textAlign: 'left' }}>
            {[
              ['Reference', done.bookingReference],
              ['Room', `${selRoom?.roomType} #${done.roomNumber || selRoom?.roomNumber}`],
              ['Guest', done.guestName || done.guestEmail],
              ['Check-In', fmtDate(checkIn)],
              ['Check-Out', fmtDate(checkOut)],
              ['Total', fmt(total)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', marginBottom: '.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v || '—'}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
            <button
              className="ap-btn-ghost"
              onClick={() => {
                setDone(null);
                setStep(1);
                setSelRoom(null);
                setGuestInfo({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  gender: 'Not Specified',
                  address: '',
                  nationality: 'Filipino',
                  dateOfBirth: '',
                  idType: 'OTHER',
                  idNumber: '',
                });
                setTempPassword(null);
              }}
            >
              New Walk-in
            </button>
            <button className="ap-btn-primary" onClick={() => setPage('arrivals')}>
              View Arrivals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <PlusCircle size={22} color="#2563eb" />
            Walk-in Booking
          </h1>
          <p className="ap-sub">Create a booking for a guest who arrives without a reservation</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="wi-steps" style={{ maxWidth: 480, marginBottom: '1.5rem' }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? 'done' : n === step ? 'active' : 'idle';
          return (
            <div key={i} className="wi-step">
              <div className={`wi-step-dot ${state}`}>
                {state === 'done' ? <CheckCircle2 size={16} /> : n}
              </div>
              <div className={`wi-step-label ${state}`}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Room Selection */}
      {step === 1 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <BedDouble size={16} /> Select Room & Dates
            </div>
          </div>
          <div className="ap-panel-body">
            <div className="ap-form-grid" style={{ marginBottom: '1.1rem' }}>
              <div className="ap-field">
                <label className="ap-label">Check-In Date</label>
                <input
                  type="date"
                  className="ap-input"
                  value={checkIn}
                  min={today()}
                  onChange={e => {
                    setCheckIn(e.target.value);
                    if (checkOut <= e.target.value) setCheckOut(tomorrow());
                  }}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Check-Out Date</label>
                <input
                  type="date"
                  className="ap-input"
                  value={checkOut}
                  min={checkIn || today()}
                  onChange={e => setCheckOut(e.target.value)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Number of Guests</label>
                <input
                  type="number"
                  className="ap-input"
                  value={guests}
                  min={1}
                  max={10}
                  onChange={e => setGuests(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Duration</label>
                <div className="ap-input" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                  {nights} night{nights !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.65rem' }}>
              Available Rooms ({rooms.filter(r => r.available).length})
            </div>

            {rLoad ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Spinner />
              </div>
            ) : (
              <div className="wi-room-grid">
                {rooms.map(r => (
                  <div
                    key={r.id}
                    className={`wi-room-card${selRoom?.id === r.id ? ' sel' : ''}${!r.available ? ' unavail' : ''}`}
                    onClick={() => r.available && setSelRoom(r)}
                  >
                    <div className="wi-room-type">{r.roomType}</div>
                    <div className="wi-room-num">#{r.roomNumber}</div>
                    <div className="wi-room-price">₱{Number(r.pricePerNight || 0).toLocaleString()}/night</div>
                    {!r.available && <div style={{ fontSize: '.65rem', color: 'var(--red)', fontWeight: 700, marginTop: '.25rem' }}>Unavailable</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="ap-btn-primary" disabled={!selRoom || !checkIn || !checkOut} onClick={() => setStep(2)}>
                Next: Guest Info →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Guest Information */}
      {step === 2 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <User size={16} /> Guest Information
            </div>
          </div>
          <div className="ap-panel-body">
            <div className="wi-guest-form-grid">
              <div className="ap-field">
                <label className="ap-label">First Name <span className="req">*</span></label>
                <input
                  className="ap-input"
                  placeholder="First name"
                  value={guestInfo.firstName}
                  onChange={e => handleGuestChange('firstName', e.target.value)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Last Name <span className="req">*</span></label>
                <input
                  className="ap-input"
                  placeholder="Last name"
                  value={guestInfo.lastName}
                  onChange={e => handleGuestChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="wi-guest-form-grid">
              <div className="ap-field">
                <label className="ap-label">Email <span className="req">*</span></label>
                <input
                  type="email"
                  className="ap-input"
                  placeholder="guest@example.com"
                  value={guestInfo.email}
                  onChange={e => handleGuestChange('email', e.target.value)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Phone Number</label>
                <input
                  className="ap-input"
                  placeholder="+63 912 345 6789"
                  value={guestInfo.phone}
                  onChange={e => handleGuestChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="wi-guest-form-grid">
              <div className="ap-field">
                <label className="ap-label">Gender</label>
                <select
                  className="ap-select"
                  value={guestInfo.gender}
                  onChange={e => handleGuestChange('gender', e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>
              <div className="ap-field">
                <label className="ap-label">Nationality</label>
                <input
                  className="ap-input"
                  placeholder="Nationality"
                  value={guestInfo.nationality}
                  onChange={e => handleGuestChange('nationality', e.target.value)}
                />
              </div>
            </div>

            <div className="wi-guest-form-grid">
              <div className="ap-field">
                <label className="ap-label">Date of Birth</label>
                <input
                  type="date"
                  className="ap-input"
                  value={guestInfo.dateOfBirth}
                  onChange={e => handleGuestChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="ap-field">
                <label className="ap-label">Home Address</label>
                <input
                  className="ap-input"
                  placeholder="Home address"
                  value={guestInfo.address}
                  onChange={e => handleGuestChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="wi-guest-form-grid">
              <div className="ap-field">
                <label className="ap-label">ID Type</label>
                <select
                  className="ap-select"
                  value={guestInfo.idType}
                  onChange={e => handleGuestChange('idType', e.target.value)}
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="ap-field">
                <label className="ap-label">ID Number</label>
                <input
                  className="ap-input"
                  placeholder="ID number"
                  value={guestInfo.idNumber}
                  onChange={e => handleGuestChange('idNumber', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '.75rem', background: 'rgba(59, 130, 246, 0.04)', borderRadius: 8, fontSize: '.72rem', color: 'var(--text-muted)' }}>
              <strong>📌 Note:</strong> An account will be automatically created for this guest.
              A temporary password will be sent to their email.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
              <button className="ap-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="ap-btn-primary"
                disabled={!guestInfo.email || (!guestInfo.firstName && !guestInfo.lastName)}
                onClick={() => setStep(3)}
              >
                Next: Confirm →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Booking */}
      {step === 3 && (
        <div className="ap-panel">
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <CreditCard size={16} /> Confirm Booking
            </div>
          </div>
          <div className="ap-panel-body">
            <div className="ap-form-grid">
              <div>
                <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.5rem' }}>
                  Booking Summary
                </div>
                <div className="wi-summary-box">
                  {[
                    ['Room', `${selRoom?.roomType} #${selRoom?.roomNumber}`],
                    ['Guest', `${guestInfo.firstName} ${guestInfo.lastName}`.trim() || guestInfo.email],
                    ['Email', guestInfo.email],
                    ['Phone', guestInfo.phone || '—'],
                    ['Check-In', fmtDate(checkIn)],
                    ['Check-Out', fmtDate(checkOut)],
                    ['Nights', `${nights} night${nights !== 1 ? 's' : ''}`],
                    ['Rate/Night', fmt(selRoom?.pricePerNight || 0)],
                  ].map(([k, v]) => (
                    <div key={k} className="wi-summary-row">
                      <span>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div className="wi-summary-row total">
                    <span>Total Amount</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.5rem' }}>
                  Payment
                </div>
                <div className="wi-summary-box">
                  <div className="wi-summary-row">
                    <span>Payment Method</span>
                    <span><strong>Cash</strong></span>
                  </div>
                  <div className="wi-summary-row total">
                    <span>Amount to Collect</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 9, padding: '.65rem .85rem', marginTop: '.65rem', fontSize: '.79rem', color: 'var(--orange)', display: 'flex', gap: '.5rem' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  Walk-in guests are immediately checked in upon booking creation.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
              <button className="ap-btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button
                className="ap-btn-primary"
                disabled={saving}
                onClick={handleSubmit}
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)' }}
              >
                {saving ? <><div className="ap-spin-sm" /> Creating…</> : <><CheckCircle2 size={14} /> Create Walk-in & Check In</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}