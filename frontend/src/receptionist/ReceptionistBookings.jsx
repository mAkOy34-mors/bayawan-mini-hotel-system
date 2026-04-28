// receptionist/ReceptionistBookings.jsx — Full booking management with cancellation request approval
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, useToast, Toast } from '../admin/adminShared';
import {
  CalendarCheck, Search, RefreshCw, Eye, CheckCircle2, XCircle, 
  Clock, AlertTriangle, CreditCard, LogIn, LogOut, Edit2,
  ChevronRight, Filter, X, Save, Ban, CheckCircle, Bell
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED', 'CANCELLATION_PENDING'];
const PAYMENT_STATUS_OPTIONS = ['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID', 'REFUNDED'];

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

export function ReceptionistBookings({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNote, setPaymentNote] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Cancellation Request states
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [showCancelRequests, setShowCancelRequests] = useState(false);
  const [pendingCancellations, setPendingCancellations] = useState(0);
  const [selectedCancelRequest, setSelectedCancelRequest] = useState(null);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelRequestNote, setCancelRequestNote] = useState('');
  const [processingCancelRequest, setProcessingCancelRequest] = useState(false);
  
  const { toast, show } = useToast();

  // Load bookings
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (search) params.set('search', search);
      
      const res = await fetch(`${BASE}/receptionist/bookings/?${params}`, { headers: h(token) });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      show('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, filter, search]);

  // Load pending cancellation requests
  const loadPendingCancellations = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/bookings/cancel-requests/?status=PENDING`, {
        headers: h(token)
      });
      if (res.ok) {
        const data = await res.json();
        setCancellationRequests(Array.isArray(data) ? data : []);
        setPendingCancellations(Array.isArray(data) ? data.filter(r => r.status === 'PENDING').length : 0);
      }
    } catch (err) {
      console.error('Failed to load cancellation requests:', err);
    }
  }, [token]);

  useEffect(() => { 
    load(); 
    loadPendingCancellations();
  }, [load, loadPendingCancellations]);

  const openDetail = async (booking) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${booking.id}/`, { headers: h(token) });
      if (res.ok) {
        const data = await res.json();
        setSelectedBooking(data);
        setNewStatus(data.status);
        setNewPaymentStatus(data.paymentStatus);
        setSpecialRequests(data.specialRequests || '');
      } else {
        setSelectedBooking(booking);
        setNewStatus(booking.status);
        setNewPaymentStatus(booking.paymentStatus);
        setSpecialRequests(booking.specialRequests || '');
      }
    } catch (err) {
      setSelectedBooking(booking);
      setNewStatus(booking.status);
      setNewPaymentStatus(booking.paymentStatus);
      setSpecialRequests(booking.specialRequests || '');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateBookingStatus = async () => {
    if (!selectedBooking || newStatus === selectedBooking.status) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/status/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        show(`Booking status updated to ${newStatus}`, 'success');
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        setItems(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: newStatus } : b));
        if (newStatus === 'CHECKED_IN') {
          load();
        }
      } else {
        const error = await res.json();
        show(error.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentStatus = async () => {
    if (!selectedBooking || newPaymentStatus === selectedBooking.paymentStatus) return;
    
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/payment/`, {
        method: 'PATCH',
        headers: hj(token),
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });
      
      if (res.ok) {
        show(`Payment status updated to ${newPaymentStatus}`, 'success');
        setSelectedBooking(prev => ({ ...prev, paymentStatus: newPaymentStatus }));
        setItems(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, paymentStatus: newPaymentStatus } : b));
      } else {
        const error = await res.json();
        show(error.error || 'Failed to update payment status', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateSpecialRequests = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/`, {
        method: 'PATCH',
        headers: hj(token),
        body: JSON.stringify({ specialRequests: specialRequests })
      });
      
      if (res.ok) {
        show('Special requests updated', 'success');
        setSelectedBooking(prev => ({ ...prev, specialRequests }));
        setItems(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, specialRequests } : b));
        setEditingNotes(false);
      } else {
        const error = await res.json();
        show(error.error || 'Failed to update notes', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const recordPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      show('Please enter a valid amount', 'error');
      return;
    }
    
    setProcessingPayment(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/record-payment/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          note: paymentNote
        })
      });
      
      if (res.ok) {
        show(`Payment of ${fmt(paymentAmount)} recorded successfully!`, 'success');
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setPaymentMethod('CASH');
        setPaymentNote('');
        
        const refreshRes = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/`, { headers: h(token) });
        if (refreshRes.ok) {
          const updated = await refreshRes.json();
          setSelectedBooking(updated);
          setNewPaymentStatus(updated.paymentStatus);
          setItems(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
        }
      } else {
        const error = await res.json();
        show(error.error || 'Failed to record payment', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const cancelBooking = async () => {
    if (!cancelReason) {
      show('Please provide a cancellation reason', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/cancel/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ reason: cancelReason })
      });
      
      if (res.ok) {
        show('Booking cancelled successfully', 'success');
        setShowCancelModal(false);
        setCancelReason('');
        setShowDetail(false);
        load();
        loadPendingCancellations();
      } else {
        const error = await res.json();
        show(error.error || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkInBooking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/checkin/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({})
      });
      
      if (res.ok) {
        show(`Guest checked in successfully`, 'success');
        setSelectedBooking(prev => ({ ...prev, status: 'CHECKED_IN' }));
        setItems(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'CHECKED_IN' } : b));
        setNewStatus('CHECKED_IN');
        load();
      } else {
        const error = await res.json();
        if (error.payment_required) {
          show('Payment required before check-in', 'warning');
          setShowPaymentModal(true);
        } else {
          show(error.error || 'Failed to check in', 'error');
        }
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkOutBooking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/receptionist/bookings/${selectedBooking.id}/checkout/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({})
      });
      
      if (res.ok) {
        show(`Guest checked out successfully`, 'success');
        setSelectedBooking(prev => ({ ...prev, status: 'CHECKED_OUT' }));
        setItems(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'CHECKED_OUT' } : b));
        setNewStatus('CHECKED_OUT');
        load();
      } else {
        const error = await res.json();
        show(error.error || 'Failed to check out', 'error');
      }
    } catch (err) {
      show('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve cancellation request
  const approveCancelRequest = async () => {
    if (!selectedCancelRequest) return;
    
    setProcessingCancelRequest(true);
    try {
      const res = await fetch(`${BASE}/bookings/cancel-requests/${selectedCancelRequest.id}/approve/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ admin_note: cancelRequestNote })
      });
      
      if (res.ok) {
        show('Cancellation request approved! Booking has been cancelled.', 'success');
        setShowCancelRequestModal(false);
        setSelectedCancelRequest(null);
        setCancelRequestNote('');
        loadPendingCancellations();
        load();
      } else {
        const error = await res.json();
        show(error.error || 'Failed to approve', 'error');
      }
    } catch (err) {
      show('Network error', 'error');
    } finally {
      setProcessingCancelRequest(false);
    }
  };

  // Reject cancellation request
  const rejectCancelRequest = async () => {
    if (!selectedCancelRequest) return;
    
    if (!cancelRequestNote) {
      show('Please provide a reason for rejection', 'error');
      return;
    }
    
    setProcessingCancelRequest(true);
    try {
      const res = await fetch(`${BASE}/bookings/cancel-requests/${selectedCancelRequest.id}/reject/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ admin_note: cancelRequestNote })
      });
      
      if (res.ok) {
        show('Cancellation request rejected.', 'success');
        setShowCancelRequestModal(false);
        setSelectedCancelRequest(null);
        setCancelRequestNote('');
        loadPendingCancellations();
        load();
      } else {
        const error = await res.json();
        show(error.error || 'Failed to reject', 'error');
      }
    } catch (err) {
      show('Network error', 'error');
    } finally {
      setProcessingCancelRequest(false);
    }
  };

  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <CalendarCheck size={22} color="var(--gold-dark)"/>
            Booking Management
          </h1>
          <p className="ap-sub">View, manage, and update booking statuses</p>
        </div>
        <button className="ap-btn-ghost" onClick={() => { load(); loadPendingCancellations(); }}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
  {[
    { label: 'Total', value: items.length, color: 'gold' },
    { label: 'Pending', value: items.filter(b => b.status === 'PENDING_DEPOSIT').length, color: 'orange' },
    { label: 'Confirmed', value: items.filter(b => b.status === 'CONFIRMED').length, color: 'blue' },
    { label: 'Checked In', value: items.filter(b => b.status === 'CHECKED_IN').length, color: 'green' },
    { label: 'Completed', value: items.filter(b => b.status === 'COMPLETED').length, color: 'teal' },
    { label: 'Cancelled', value: items.filter(b => b.status === 'CANCELLED').length, color: 'red' },
    { label: 'Cancel Pending', value: items.filter(b => b.status === 'CANCELLATION_PENDING').length, color: 'purple' },
  ].map((s, i) => (
    <div
      key={i}
      className={`ap-stat ${s.color}`}
      style={{
        animationDelay: `${i * 0.05}s`,
        padding: '.9rem 1rem',
        cursor: s.label !== 'Total' ? 'pointer' : 'default'
      }}
      onClick={() => {
        if (s.label !== 'Total') {
          if (s.label === 'Cancel Pending') {
            setFilter('CANCELLATION_PENDING');
          } else if (s.label === 'Pending') {
            setFilter('PENDING_DEPOSIT');
          } else if (s.label === 'Checked In') {
            setFilter('CHECKED_IN');
          } else if (s.label === 'Completed') {
            setFilter('COMPLETED');
          } else if (s.label === 'Cancelled') {
            setFilter('CANCELLED');
          } else {
            setFilter(f => f === s.label.toUpperCase().replace(' ', '_') ? '' : s.label.toUpperCase().replace(' ', '_'));
          }
          setPage(1);
        }
      }}
    >
      <div className="ap-stat-lbl">{s.label}</div>
      <div className="ap-stat-val" style={{ fontSize: '1.6rem' }}>
        {loading ? <Skel h={24} w={30} /> : s.value}
      </div>
    </div>
  ))}
</div>

      {/* Pending Cancellation Requests Banner */}
      {pendingCancellations > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 12, 
          padding: '0.75rem 1rem', 
          marginBottom: '1rem',
          cursor: 'pointer'
        }} onClick={() => setShowCancelRequests(!showCancelRequests)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={18} color="#8b5cf6" />
            <span style={{ fontWeight: 600 }}>
              {pendingCancellations} pending cancellation request{pendingCancellations !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
              Click to review
            </span>
          </div>
          <ChevronRight size={16} style={{ color: '#8b5cf6' }} />
        </div>
      )}

      {/* Pending Cancellation Requests List */}
      {showCancelRequests && cancellationRequests.length > 0 && (
        <div className="ap-panel" style={{ marginBottom: '1rem', background: 'rgba(139,92,246,0.03)' }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title" style={{ color: '#8b5cf6' }}>
              <Bell size={16} /> Pending Cancellation Requests
            </div>
            <button className="ap-btn-ghost" onClick={() => setShowCancelRequests(false)}>
              <X size={14} /> Close
            </button>
          </div>
          <div style={{ padding: '0.5rem' }}>
            {cancellationRequests.map(req => (
              <div key={req.id} style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }} onClick={() => {
                setSelectedCancelRequest(req);
                setCancelRequestNote('');
                setShowCancelRequestModal(true);
                setShowCancelRequests(false);
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{req.guest_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Booking: {req.booking_reference}</div>
                  </div>
                  <div>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 99, 
                      background: 'rgba(139,92,246,0.1)', 
                      color: '#8b5cf6', 
                      fontSize: '0.65rem', 
                      fontWeight: 600 
                    }}>
                      <Bell size={10} /> Pending
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Reason: {req.reason?.substring(0, 80)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Bookings</div>
            <div className="ap-panel-sub">{!loading && `${items.length} records`}</div>
          </div>
          <div className="ap-toolbar" style={{ margin: 0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico"><Search size={13}/></span>
              <input className="ap-search" placeholder="Reference or email…" value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}/>
            </div>
            <select className="ap-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button className="ap-btn-primary" onClick={load} style={{ padding: '.58rem .9rem' }}>🔍</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
            <Spinner/><span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Loading bookings…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico">🛏️</div>
            <div className="ap-empty-title">No bookings found</div>
            <div className="ap-empty-sub">Try adjusting your filters</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr>
                    <th>Reference</th><th>Guest</th><th>Room</th>
                    <th>Check-in</th><th>Check-out</th><th>Nights</th>
                    <th>Total</th><th>Deposit</th><th>Remaining</th>
                    <th>Payment</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(b => (
                    <tr key={b.id} style={{ opacity: b.status === 'CANCELLED' ? 0.55 : 1 }}>
                      <td style={{ fontFamily: 'monospace', fontSize: '.74rem', color: b.status === 'CANCELLED' ? '#dc3545' : 'var(--gold-dark)', fontWeight: 700 }}>
                        {b.bookingReference}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{b.guestUsername}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{b.guestEmail}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.roomType} #{b.roomNumber}</td>
                      <td style={{ fontSize: '.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                      <td style={{ fontSize: '.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(b.checkOutDate)}</td>
                      <td style={{ textAlign: 'center' }}>{b.numberOfNights}</td>
                      <td><span style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(b.totalAmount)}</span></td>
                      <td style={{ fontSize: '.78rem', color: 'var(--orange)', whiteSpace: 'nowrap' }}>{fmt(b.depositAmount)}</td>
                      <td style={{ fontSize: '.78rem', color: 'var(--red)', whiteSpace: 'nowrap' }}>{fmt(b.remainingAmount)}</td>
                      <td><Pill status={b.paymentStatus} label={b.paymentStatus || 'UNPAID'}/></td>
                      <td><Pill status={b.status}/></td>
                      <td>
                        <button className="ap-btn-ghost" style={{ padding: '.28rem .65rem', fontSize: '.72rem' }}
                          onClick={() => openDetail(b)}>
                          <Eye size={12}/> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={items.length} size={PAGE_SIZE} setPage={setPage}/>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setSelectedBooking(null); setEditingNotes(false); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton style={{ padding: '.9rem 1.35rem', borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            Booking Management
            {selectedBooking && (
              <span style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                #{selectedBooking.bookingReference}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: '1.1rem 1.35rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
              <Spinner/><span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>Loading…</span>
            </div>
          ) : selectedBooking && (
            <>
              {/* Cancelled Banner */}
              {selectedBooking.status === 'CANCELLED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', background: 'rgba(220,53,69,0.07)', border: '1px solid rgba(220,53,69,0.22)', borderRadius: 10, padding: '.85rem 1.1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(220,53,69,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🚫</div>
                  <div>
                    <div style={{ fontSize: '.83rem', fontWeight: 700, color: '#dc3545', marginBottom: '.12rem' }}>Booking Cancelled</div>
                    <div style={{ fontSize: '.74rem', color: '#e05a5a', lineHeight: 1.4 }}>This booking has been cancelled and cannot be modified.</div>
                  </div>
                </div>
              )}

              {/* Booking Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.6rem', marginBottom: '.85rem' }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Guest</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{selectedBooking.guestUsername || '—'}</div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Email</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{selectedBooking.guestEmail || '—'}</div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Room</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{selectedBooking.roomType} #{selectedBooking.roomNumber}</div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Check-In</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{fmtDate(selectedBooking.checkInDate)}</div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Check-Out</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{fmtDate(selectedBooking.checkOutDate)}</div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.55rem .75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.61rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.15rem' }}>Nights / Guests</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text)', fontWeight: 600 }}>{selectedBooking.numberOfNights} nights / {selectedBooking.numberOfGuests} guests</div>
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(59,130,246,0.03))', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '.85rem 1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gold-dark)', fontWeight: 700, marginBottom: '.5rem' }}>Financial Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> <strong>{fmt(selectedBooking.totalAmount)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Deposit:</span> <strong style={{ color: '#f59e0b' }}>{fmt(selectedBooking.depositAmount)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Remaining:</span> <strong style={{ color: parseFloat(selectedBooking.remainingAmount) > 0 ? '#dc2626' : '#10b981' }}>{fmt(selectedBooking.remainingAmount)}</strong></div>
                </div>
              </div>

              {/* Special Requests - Editable */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700 }}>Special Requests</div>
                  {selectedBooking.status !== 'CANCELLED' && (
                    <button className="ap-btn-ghost" style={{ padding: '.2rem .6rem', fontSize: '.65rem' }} onClick={() => editingNotes ? updateSpecialRequests() : setEditingNotes(true)}>
                      {editingNotes ? (saving ? <div className="ap-spin-sm"/> : <Save size={12}/>) : <Edit2 size={12}/>}
                      {editingNotes ? ' Save' : ' Edit'}
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    className="ap-textarea"
                    rows={3}
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="No special requests"
                    disabled={saving}
                  />
                ) : (
                  <div style={{ background: '#fffbf0', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, padding: '.65rem .9rem', fontSize: '.82rem', color: 'var(--text-sub)', lineHeight: 1.55 }}>
                    {selectedBooking.specialRequests || 'No special requests'}
                  </div>
                )}
              </div>

              {/* Status Update Section */}
              {selectedBooking.status !== 'CANCELLED' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.5rem' }}>Booking Status</div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="ap-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1 }}>
                      {STATUS_OPTIONS.filter(s => s !== 'CANCELLED').map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button className="ap-btn-primary" disabled={saving || newStatus === selectedBooking.status} onClick={updateBookingStatus}>
                      {saving ? <div className="ap-spin-sm"/> : 'Update Status'}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Status Update */}
              {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.5rem' }}>Payment Status</div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="ap-select" value={newPaymentStatus} onChange={e => setNewPaymentStatus(e.target.value)} style={{ flex: 1 }}>
                      {PAYMENT_STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button className="ap-btn-primary" disabled={saving || newPaymentStatus === selectedBooking.paymentStatus} onClick={updatePaymentStatus}>
                      {saving ? <div className="ap-spin-sm"/> : 'Update Payment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.5rem' }}>Quick Actions</div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {selectedBooking.status === 'CONFIRMED' && (
                    <button className="ap-btn-primary" style={{ background: '#3b82f6' }} onClick={checkInBooking} disabled={saving}>
                      <LogIn size={14}/> Check In
                    </button>
                  )}
                  {selectedBooking.status === 'CHECKED_IN' && (
                    <>
                      <button className="ap-btn-primary" style={{ background: '#f59e0b' }} onClick={checkOutBooking} disabled={saving}>
                        <LogOut size={14}/> Check Out
                      </button>
                      <button className="ap-btn-primary" style={{ background: '#8b5cf6' }} onClick={() => setShowPaymentModal(true)}>
                        <CreditCard size={14}/> Record Payment
                      </button>
                    </>
                  )}
                  {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'COMPLETED' && (
                    <button className="ap-btn-red" onClick={() => setShowCancelModal(true)}>
                      <Ban size={14}/> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => { setShowPaymentModal(false); setPaymentAmount(0); setPaymentMethod('CASH'); setPaymentNote(''); }} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <CreditCard size={18}/> Record Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <div style={{ background: 'var(--surface2)', padding: '.75rem', borderRadius: 8, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                  <span>Remaining Balance:</span>
                  <strong style={{ color: '#dc2626' }}>{fmt(selectedBooking.remainingAmount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Booking:</span>
                  <strong>{selectedBooking.bookingReference}</strong>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Amount</label>
                <input type="number" className="ap-input" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} step="0.01" min="0" max={selectedBooking.remainingAmount} />
              </div>
              <div className="ap-field">
                <label className="ap-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
                  {[
                    { value: 'CASH', label: 'Cash', icon: '💰' },
                    { value: 'CARD', label: 'Card', icon: '💳' },
                    { value: 'GCASH', label: 'GCash', icon: '📱' },
                  ].map(method => (
                    <button key={method.value} onClick={() => setPaymentMethod(method.value)}
                      style={{ padding: '.5rem', border: `2px solid ${paymentMethod === method.value ? '#C9A84C' : 'var(--border)'}`, borderRadius: 8, background: paymentMethod === method.value ? 'rgba(201,168,76,0.1)' : '#fff', cursor: 'pointer' }}>
                      {method.icon} {method.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Note (Optional)</label>
                <input className="ap-input" placeholder="Payment note..." value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={processingPayment || !paymentAmount} onClick={recordPayment}>
            {processingPayment ? <div className="ap-spin-sm"/> : 'Record Payment'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => { setShowCancelModal(false); setCancelReason(''); }} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Ban size={18} color="#dc2626"/> Cancel Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <>
              <div style={{ background: 'rgba(220,53,69,0.08)', padding: '.75rem', borderRadius: 8, marginBottom: '1rem' }}>
                <div><strong>Booking:</strong> {selectedBooking.bookingReference}</div>
                <div><strong>Guest:</strong> {selectedBooking.guestUsername}</div>
                <div><strong>Room:</strong> {selectedBooking.roomType} #{selectedBooking.roomNumber}</div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Cancellation Reason <span className="req">*</span></label>
                <textarea className="ap-textarea" rows={3} placeholder="Please provide a reason for cancellation..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
              </div>
              <div style={{ background: 'rgba(220,53,69,0.08)', borderRadius: 8, padding: '.65rem', fontSize: '.75rem', color: '#dc2626', marginTop: '.5rem' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '.3rem' }}/>
                This action cannot be undone. The booking will be marked as CANCELLED.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowCancelModal(false); setCancelReason(''); }}>Go Back</button>
          <button className="ap-btn-red" disabled={saving || !cancelReason} onClick={cancelBooking}>
            {saving ? <div className="ap-spin-sm"/> : 'Confirm Cancellation'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Cancellation Request Review Modal */}
      <Modal show={showCancelRequestModal} onHide={() => { setShowCancelRequestModal(false); setSelectedCancelRequest(null); setCancelRequestNote(''); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Bell size={18} color="#8b5cf6" />
            Review Cancellation Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCancelRequest && (
            <>
              {/* Booking Details */}
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Booking Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><strong>Booking Ref:</strong> {selectedCancelRequest.booking_reference}</div>
                  <div><strong>Room:</strong> Room {selectedCancelRequest.room_number}</div>
                  <div><strong>Guest:</strong> {selectedCancelRequest.guest_name}</div>
                  <div><strong>Email:</strong> {selectedCancelRequest.guest_email}</div>
                  <div><strong>Deposit Paid:</strong> <strong style={{ color: '#f59e0b' }}>{fmt(selectedCancelRequest.deposit_amount)}</strong></div>
                  <div><strong>Refund (50%):</strong> <strong style={{ color: '#10b981' }}>{fmt(parseFloat(selectedCancelRequest.deposit_amount) * 0.5)}</strong></div>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div style={{ background: 'rgba(220,53,69,0.08)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertTriangle size={14} color="#dc2626" /> Cancellation Reason
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                  {selectedCancelRequest.reason}
                </div>
              </div>

              {/* Admin Note */}
              <div className="ap-field">
                <label className="ap-label">Admin Note</label>
                <textarea
                  className="ap-textarea"
                  rows={3}
                  value={cancelRequestNote}
                  onChange={e => setCancelRequestNote(e.target.value)}
                  placeholder="Add a note for the guest (required for rejection)"
                />
              </div>

              {/* Warning */}
              <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                Upon approval, the booking will be cancelled and a 50% refund will be processed.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowCancelRequestModal(false); setSelectedCancelRequest(null); setCancelRequestNote(''); }}>
            Close
          </button>
          <button
            className="ap-btn-red"
            disabled={processingCancelRequest}
            onClick={rejectCancelRequest}
          >
            {processingCancelRequest ? <div className="ap-spin-sm" /> : <><XCircle size={14} /> Reject</>}
          </button>
          <button
            className="ap-btn-primary"
            disabled={processingCancelRequest}
            onClick={approveCancelRequest}
            style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
          >
            {processingCancelRequest ? <div className="ap-spin-sm" /> : <><CheckCircle size={14} /> Approve & Refund</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}