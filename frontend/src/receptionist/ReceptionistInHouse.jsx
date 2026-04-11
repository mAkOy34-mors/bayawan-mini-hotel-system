// ReceptionistInHouse.jsx — View all currently checked-in guests
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, Pill, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  Users, BedDouble, Calendar, Clock, CreditCard, 
  Search, RefreshCw, User, Phone, Mail, AlertCircle,
  CheckCircle2, XCircle, Eye, ChevronRight, Home, LogOut,
  Hash, Calendar as CalendarIcon, DollarSign, FileText, MapPin, Smartphone, CreditCard as CreditCardIcon
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

const EXTRA_CSS = `
  .inhouse-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 768px) {
    .inhouse-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .inhouse-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
  }
  .inhouse-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: rgba(201,168,76,0.3);
  }
  .inhouse-stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }
  .inhouse-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
  }
  .inhouse-guest-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
    animation: fadeUp 0.3s ease both;
  }
  .inhouse-guest-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: var(--gold);
  }
  .inhouse-status-paid {
    background: var(--green-bg);
    color: var(--green);
    border: 1px solid rgba(45,155,111,0.25);
  }
  .inhouse-status-pending {
    background: rgba(245,158,11,0.1);
    color: #f59e0b;
    border: 1px solid rgba(245,158,11,0.25);
  }
  .inhouse-status-partial {
    background: rgba(201,168,76,0.1);
    color: #9a7a2e;
    border: 1px solid rgba(201,168,76,0.25);
  }
  .inhouse-room-badge {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  /* Improved Modal Styles - Fixed height, no scroll */
  .detail-modal .modal-dialog {
    max-width: 550px;
    margin: 1.75rem auto;
  }
  .detail-modal .modal-content {
    border-radius: 20px;
    overflow: hidden;
    max-height: 90vh;
  }
  .detail-modal .modal-body {
    padding: 0;
    overflow-y: auto;
    max-height: calc(90vh - 140px);
  }
  .detail-modal-header {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: white;
    padding: 1.25rem 1.5rem;
    position: relative;
  }
  .detail-modal-header .close {
    position: absolute;
    right: 1.25rem;
    top: 1.25rem;
    color: white;
    opacity: 0.8;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
  .detail-guest-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
  }
  .detail-section {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 0.875rem 1rem;
    margin-bottom: 0.75rem;
  }
  .detail-section-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #9a7a2e;
    font-weight: 700;
    margin-bottom: 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border-bottom: 1px solid #e9ecef;
  }
  .detail-row:last-child {
    border-bottom: none;
  }
  .detail-label {
    font-size: 0.75rem;
    color: #6c757d;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .detail-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #212529;
  }
  .payment-badge-large {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem;
    border-radius: 30px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .detail-modal-footer {
    border-top: 1px solid #e9ecef;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    background: white;
  }
`;

export function ReceptionistInHouse({ token, setPage }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalRooms: 0,
    departingToday: 0,
    pendingPayment: 0,
  });

  const { toast, show } = useToast();

  const loadCheckedInGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/?status=CHECKED_IN`, { 
        headers: h(token) 
      });
      const data = await res.json();
      
      const checkedInGuests = Array.isArray(data) ? data : [];
      
      const today = new Date().toISOString().slice(0, 10);
      const departingToday = checkedInGuests.filter(g => 
        g.checkOutDate?.slice(0, 10) === today
      ).length;
      
      const pendingPayment = checkedInGuests.filter(g => 
        g.paymentStatus !== 'FULLY_PAID' && parseFloat(g.remainingAmount || 0) > 0
      ).length;
      
      setStats({
        total: checkedInGuests.length,
        totalRooms: checkedInGuests.length,
        departingToday,
        pendingPayment,
      });
      
      setGuests(checkedInGuests);
    } catch (error) {
      console.error('Failed to load checked-in guests:', error);
      show('Failed to load checked-in guests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckedInGuests();
  }, [token]);

  const filteredGuests = guests.filter(guest =>
    !search ||
    guest.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
    guest.guestUsername?.toLowerCase().includes(search.toLowerCase()) ||
    guest.guestEmail?.toLowerCase().includes(search.toLowerCase()) ||
    guest.roomNumber?.toString().includes(search)
  );

  const getPaymentStatusBadge = (guest) => {
    const remaining = parseFloat(guest.remainingAmount || 0);
    const total = parseFloat(guest.totalAmount || 0);
    
    if (remaining === 0) {
      return { 
        text: 'Fully Paid', 
        className: 'inhouse-status-paid',
        icon: <CheckCircle2 size={12} />
      };
    } else if (remaining < total) {
      return { 
        text: 'Partial Payment', 
        className: 'inhouse-status-partial',
        icon: <AlertCircle size={12} />
      };
    } else {
      return { 
        text: 'Pending Payment', 
        className: 'inhouse-status-pending',
        icon: <XCircle size={12} />
      };
    }
  };

  const handleViewDetails = (guest) => {
    setSelectedGuest(guest);
  };

  const handleCheckOut = async (guest) => {
    if (!window.confirm(`Check out ${guest.guestUsername || guest.guestEmail} from Room ${guest.roomNumber}?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${guest.id}/checkout/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Check-out failed');
      }
      
      show(`${guest.guestUsername || guest.guestEmail} checked out successfully!`, 'success');
      setSelectedGuest(null);
      loadCheckedInGuests();
    } catch (error) {
      show(error.message, 'error');
    }
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast}/>

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <Users size={22} color="var(--gold-dark)"/>
            Currently In-House
          </h1>
          <p className="ap-sub">
            {new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · 
            {stats.total} guest(s) currently checked in
          </p>
        </div>
        <button className="ap-btn-ghost" onClick={loadCheckedInGuests}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="inhouse-stats">
        <div className="inhouse-stat-card">
          <div className="inhouse-stat-value">{stats.total}</div>
          <div className="inhouse-stat-label">Total In-House</div>
        </div>
        <div className="inhouse-stat-card">
          <div className="inhouse-stat-value">{stats.totalRooms}</div>
          <div className="inhouse-stat-label">Occupied Rooms</div>
        </div>
        <div className="inhouse-stat-card">
          <div className="inhouse-stat-value">{stats.departingToday}</div>
          <div className="inhouse-stat-label">Departing Today</div>
        </div>
        <div className="inhouse-stat-card">
          <div className="inhouse-stat-value">{stats.pendingPayment}</div>
          <div className="inhouse-stat-label">Pending Payment</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ap-panel" style={{ marginBottom: '1rem' }}>
        <div className="ap-panel-body">
          <div className="ap-search-wrap" style={{ width: '100%' }}>
            <span className="ap-search-ico"><Search size={13}/></span>
            <input 
              className="ap-search" 
              style={{ width: '100%' }}
              placeholder="Search by name, email, booking reference, or room number..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Guest List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner/>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="ap-empty">
          <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.25, marginBottom: '1rem' }}>
            <Home size={48} strokeWidth={1}/>
          </div>
          <div className="ap-empty-title">No guests currently checked in</div>
          <div className="ap-empty-sub">All rooms are vacant or guests haven't checked in yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
          {filteredGuests.map((guest, idx) => {
            const paymentStatus = getPaymentStatusBadge(guest);
            const remaining = parseFloat(guest.remainingAmount || 0);
            const isDepartingToday = guest.checkOutDate?.slice(0, 10) === new Date().toISOString().slice(0, 10);
            
            return (
              <div key={guest.id} className="inhouse-guest-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="inhouse-room-badge">
                    <BedDouble size={12} style={{ display: 'inline', marginRight: '0.3rem' }}/>
                    Room {guest.roomNumber}
                  </div>
                  <span className={`${paymentStatus.className}`} style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {paymentStatus.icon} {paymentStatus.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, 
                    background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 600, fontSize: '1rem'
                  }}>
                    {(guest.guestUsername || guest.guestEmail || 'G').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                      {guest.guestUsername || guest.guestEmail?.split('@')[0] || 'Guest'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={11}/> {guest.guestEmail}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '0.5rem',
                  background: 'var(--surface2)',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Booking Ref</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-dark)' }}>
                      {guest.bookingReference}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room Type</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{guest.roomType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Check-in</div>
                    <div style={{ fontSize: '0.7rem' }}>{fmtDate(guest.checkInDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Check-out</div>
                    <div style={{ fontSize: '0.7rem', color: isDepartingToday ? 'var(--orange)' : 'inherit', fontWeight: isDepartingToday ? 600 : 'normal' }}>
                      {fmtDate(guest.checkOutDate)}
                      {isDepartingToday && <span style={{ marginLeft: '0.3rem', fontSize: '0.6rem' }}>Today</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total / Remaining</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      ₱{parseFloat(guest.totalAmount || 0).toLocaleString()} / 
                      <span style={{ color: remaining > 0 ? 'var(--red)' : 'var(--green)' }}>
                        ₱{parseFloat(guest.remainingAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="ap-btn-ghost" 
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}
                      onClick={() => handleViewDetails(guest)}
                    >
                      <Eye size={12}/> View
                    </button>
                    <button 
                      className="ap-btn-primary" 
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}
                      onClick={() => handleCheckOut(guest)}
                    >
                      <LogOut size={12}/> Check Out
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact View Modal - All details visible without scroll */}
      <Modal show={!!selectedGuest} onHide={() => setSelectedGuest(null)} size="sm" centered className="detail-modal">
        {selectedGuest && (
          <>
            <div className="detail-modal-header">
              <button type="button" className="close" onClick={() => setSelectedGuest(null)}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="detail-guest-avatar">
                  {(selectedGuest.guestUsername || selectedGuest.guestEmail || 'G').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    {selectedGuest.guestUsername || selectedGuest.guestEmail?.split('@')[0] || 'Guest'}
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', opacity: 0.8, fontSize: '0.7rem' }}>
                    <Mail size={10} style={{ display: 'inline', marginRight: '0.2rem' }}/>
                    {selectedGuest.guestEmail}
                  </p>
                </div>
              </div>
            </div>

            <Modal.Body style={{ padding: '1rem' }}>
              {/* Room Info */}
              <div className="detail-section">
                <div className="detail-section-title"><BedDouble size={12}/> Room</div>
                <div className="detail-row">
                  <span className="detail-label"><Hash size={11}/> Number</span>
                  <span className="detail-value">Room {selectedGuest.roomNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label"><BedDouble size={11}/> Type</span>
                  <span className="detail-value">{selectedGuest.roomType}</span>
                </div>
              </div>

              {/* Stay Info */}
              <div className="detail-section">
                <div className="detail-section-title"><Calendar size={12}/> Stay</div>
                <div className="detail-row">
                  <span className="detail-label">Check-in</span>
                  <span className="detail-value">{fmtDate(selectedGuest.checkInDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Check-out</span>
                  <span className="detail-value">
                    {fmtDate(selectedGuest.checkOutDate)}
                    {selectedGuest.checkOutDate?.slice(0, 10) === new Date().toISOString().slice(0, 10) && 
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', background: 'rgba(245,158,11,0.15)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>Today</span>
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{selectedGuest.numberOfNights} night(s)</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Guests</span>
                  <span className="detail-value">{selectedGuest.numberOfGuests} person(s)</span>
                </div>
              </div>

              {/* Booking Info */}
              <div className="detail-section">
                <div className="detail-section-title"><FileText size={12}/> Booking</div>
                <div className="detail-row">
                  <span className="detail-label">Reference</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{selectedGuest.bookingReference}</span>
                </div>
                {selectedGuest.specialRequests && (
                  <div className="detail-row">
                    <span className="detail-label">Requests</span>
                    <span className="detail-value" style={{ fontSize: '0.7rem' }}>{selectedGuest.specialRequests}</span>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="detail-section">
                <div className="detail-section-title"><DollarSign size={12}/> Payment</div>
                <div className="detail-row">
                  <span className="detail-label">Total</span>
                  <span className="detail-value">₱{parseFloat(selectedGuest.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Deposit</span>
                  <span className="detail-value">₱{parseFloat(selectedGuest.depositAmount || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Remaining</span>
                  <span className="detail-value" style={{ color: parseFloat(selectedGuest.remainingAmount || 0) > 0 ? '#dc3545' : '#28a745', fontWeight: 700 }}>
                    ₱{parseFloat(selectedGuest.remainingAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row" style={{ paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    {(() => {
                      const remaining = parseFloat(selectedGuest.remainingAmount || 0);
                      const total = parseFloat(selectedGuest.totalAmount || 0);
                      if (remaining === 0) return <span style={{ background: 'rgba(40,167,69,0.1)', color: '#28a745', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>✓ Fully Paid</span>;
                      if (remaining < total) return <span style={{ background: 'rgba(201,168,76,0.1)', color: '#9a7a2e', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>💰 Partial</span>;
                      return <span style={{ background: 'rgba(220,53,69,0.1)', color: '#dc3545', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>⚠️ Pending</span>;
                    })()}
                  </span>
                </div>
              </div>
            </Modal.Body>

            <div className="detail-modal-footer">
              <button className="ap-btn-ghost" onClick={() => setSelectedGuest(null)} style={{ fontSize: '0.8rem' }}>
                Close
              </button>
              <button 
                className="ap-btn-primary" 
                onClick={() => handleCheckOut(selectedGuest)}
                style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)', fontSize: '0.8rem' }}
              >
                <LogOut size={14}/> Check Out
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}