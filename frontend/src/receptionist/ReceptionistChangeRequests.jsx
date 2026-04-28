// receptionist/ReceptionistChangeRequests.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { API_BASE } from '../constants/config';
import { SHARED_CSS, fmt, fmtDate, Pill, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  ArrowRightLeft, Calendar, BedDouble, User, CheckCircle2,
  XCircle, Clock, RefreshCw, Search, Filter, AlertTriangle,
  MessageSquare, Info, Mail, Phone, MapPin
} from 'lucide-react';

const css = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .rcr-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 768px) {
    .rcr-stats { grid-template-columns: repeat(2, 1fr); }
  }
  
  .rcr-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
    animation: fadeUp 0.4s ease both;
  }
  .rcr-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .rcr-stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.2;
  }
  .rcr-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
    margin-top: 0.25rem;
  }
  
  .rcr-request-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-bottom: 1rem;
    overflow: hidden;
    transition: all 0.2s;
    animation: fadeUp 0.4s ease both;
  }
  .rcr-request-card:hover {
    border-color: rgba(201,168,76,0.3);
  }
  .rcr-request-card.pending {
    border-left: 3px solid #f59e0b;
  }
  .rcr-request-card.approved {
    border-left: 3px solid #10b981;
  }
  .rcr-request-card.rejected {
    border-left: 3px solid #dc2626;
  }
  
  .rcr-change-detail {
    background: var(--surface2);
    border-radius: 8px;
    padding: 0.75rem;
    margin: 0.5rem 0;
  }
  .rcr-change-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.3rem 0;
  }
  .rcr-change-from {
    color: var(--text-muted);
    text-decoration: line-through;
    font-size: 0.85rem;
  }
  .rcr-change-to {
    font-weight: 700;
    color: var(--text);
  }
  .rcr-arrow {
    color: var(--blue);
    font-size: 0.8rem;
  }
`;

export function ReceptionistChangeRequests({ token, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const { toast, show } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bookings/change-requests/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to load change requests:', err);
      show('Failed to load change requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token]);

  const filteredRequests = requests.filter(req => {
    const matchSearch = !search ||
      req.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      req.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      req.guestEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
    total: requests.length,
  };

  const openRequestDetail = (req) => {
    setSelectedRequest(req);
    setAdminNote(req.adminNote || '');
    setError('');
    setActionSuccess('');
    setShowDetail(true);
  };

  const handleAction = async (action) => {
    setActioning(true);
    setError('');
    try {
      const url = action === 'approve'
        ? `${API_BASE}/bookings/change-requests/${selectedRequest.id}/approve/`
        : `${API_BASE}/bookings/change-requests/${selectedRequest.id}/reject/`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ admin_note: adminNote })
      });

      const data = await response.json();
      
      if (response.ok) {
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        setActionSuccess(newStatus);
        show(data.message || `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
        // Update local state
        setRequests(prev => prev.map(r =>
          r.id === selectedRequest.id ? { ...r, status: newStatus, adminNote } : r
        ));
        setSelectedRequest(prev => ({ ...prev, status: newStatus, adminNote }));
      } else {
        setError(data.error || data.message || `Failed to ${action} request`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setActioning(false);
    }
  };

  const fmtDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getChangeDescription = (req) => {
    const changes = [];
    if (req.requestedCheckin && req.requestedCheckout) {
      changes.push(`Dates: ${fmtDate(req.requestedCheckin)} → ${fmtDate(req.requestedCheckout)}`);
    }
    if (req.requestedRoomType) {
      changes.push(`Room: ${req.roomType} → ${req.requestedRoomType}`);
    }
    return changes.join(' · ');
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <style>{css}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <ArrowRightLeft size={22} color="var(--gold-dark)" />
            Booking Change Requests
          </h1>
          <p className="ap-sub">Review and manage guest booking modification requests</p>
        </div>
        <button className="ap-btn-ghost" onClick={loadRequests}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="rcr-stats">
        <div className="rcr-stat-card">
          <div className="rcr-stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</div>
          <div className="rcr-stat-label">Pending</div>
        </div>
        <div className="rcr-stat-card">
          <div className="rcr-stat-value" style={{ color: '#10b981' }}>{stats.approved}</div>
          <div className="rcr-stat-label">Approved</div>
        </div>
        <div className="rcr-stat-card">
          <div className="rcr-stat-value" style={{ color: '#dc2626' }}>{stats.rejected}</div>
          <div className="rcr-stat-label">Rejected</div>
        </div>
        <div className="rcr-stat-card">
          <div className="rcr-stat-value" style={{ color: '#C9A84C' }}>{stats.total}</div>
          <div className="rcr-stat-label">Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="ap-toolbar">
        <div className="ap-search-wrap" style={{ flex: 2 }}>
          <Search size={14} className="ap-search-ico" />
          <input
            className="ap-search"
            placeholder="Search by guest name, email, or booking reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty-ico"><ArrowRightLeft size={48} strokeWidth={1} /></div>
          <div className="ap-empty-title">No change requests found</div>
          <div className="ap-empty-sub">
            {statusFilter === 'pending' ? 'No pending requests at this time' : 'Guest change requests will appear here'}
          </div>
        </div>
      ) : (
        filteredRequests.map((req, idx) => (
          <div key={req.id} className={`rcr-request-card ${req.status?.toLowerCase()}`} style={{ animationDelay: `${idx * 0.05}s` }}>
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                    {req.bookingReference}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    {req.guestName || req.guestEmail?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <Mail size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                    {req.guestEmail}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`ap-pill ${req.status}`}>
                    <span className="ap-pill-dot" />
                    {req.status}
                  </span>
                  <button
                    className="ap-btn-ghost"
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.72rem' }}
                    onClick={() => openRequestDetail(req)}
                  >
                    Review
                  </button>
                </div>
              </div>

              <div className="rcr-change-detail">
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Requested Changes
                </div>
                <div className="rcr-change-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} /> Current Dates
                  </span>
                  <span>{fmtDate(req.currentCheckin)} → {fmtDate(req.currentCheckout)}</span>
                </div>
                {(req.requestedCheckin || req.requestedCheckout) && (
                  <div className="rcr-change-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> Requested Dates
                    </span>
                    <div>
                      <span className="rcr-change-from">
                        {fmtDate(req.currentCheckin)} → {fmtDate(req.currentCheckout)}
                      </span>
                      <span className="rcr-arrow"> → </span>
                      <span className="rcr-change-to">
                        {fmtDate(req.requestedCheckin)} → {fmtDate(req.requestedCheckout)}
                      </span>
                    </div>
                  </div>
                )}
                {req.requestedRoomType && (
                  <div className="rcr-change-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <BedDouble size={14} /> Room Type
                    </span>
                    <div>
                      <span className="rcr-change-from">{req.roomType}</span>
                      <span className="rcr-arrow"> → </span>
                      <span className="rcr-change-to">{req.requestedRoomType}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />
                Submitted: {fmtDate(req.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setSelectedRequest(null); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <ArrowRightLeft size={18} />
            Change Request Review
            {selectedRequest && (
              <span className={`ap-pill ${selectedRequest.status}`} style={{ marginLeft: '0.5rem' }}>
                {selectedRequest.status}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedRequest && (
            <>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: 'var(--red-bg)', border: '1px solid rgba(220,53,69,0.25)', borderRadius: 9, padding: '.65rem .9rem', marginBottom: '1rem', fontSize: '.8rem', color: 'var(--red)' }}>
                  <AlertTriangle size={15} /> {error}
                </div>
              )}

              {actionSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: actionSuccess === 'APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${actionSuccess === 'APPROVED' ? 'rgba(45,155,111,0.25)' : 'rgba(220,53,69,0.25)'}`, borderRadius: 9, padding: '.65rem .9rem', marginBottom: '1rem', fontSize: '.8rem', fontWeight: 600, color: actionSuccess === 'APPROVED' ? 'var(--green)' : 'var(--red)' }}>
                  {actionSuccess === 'APPROVED' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  Request {actionSuccess === 'APPROVED' ? 'approved' : 'rejected'} successfully.
                </div>
              )}

              {/* Guest Info */}
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Guest Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>Name:</strong> {selectedRequest.guestName || '—'}</div>
                  <div><strong>Email:</strong> {selectedRequest.guestEmail || '—'}</div>
                  <div><strong>Phone:</strong> {selectedRequest.guestPhone || '—'}</div>
                  <div><strong>Current Room:</strong> {selectedRequest.roomType} Room</div>
                </div>
              </div>

              {/* Current Booking */}
              <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Current Booking
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><strong>Reference:</strong> {selectedRequest.bookingReference}</div>
                  <div><strong>Check-in:</strong> {fmtDate(selectedRequest.currentCheckin)}</div>
                  <div><strong>Check-out:</strong> {fmtDate(selectedRequest.currentCheckout)}</div>
                  <div><strong>Room Type:</strong> {selectedRequest.roomType}</div>
                </div>
              </div>

              {/* Requested Changes */}
              <div style={{ background: 'var(--blue-bg)', borderRadius: 10, padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ArrowRightLeft size={14} /> Requested Changes
                </div>
                {(selectedRequest.requestedCheckin || selectedRequest.requestedCheckout) && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.2rem' }}>Dates</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ textDecoration: 'line-through', color: '#8a96a8' }}>
                        {fmtDate(selectedRequest.currentCheckin)} → {fmtDate(selectedRequest.currentCheckout)}
                      </span>
                      <span>→</span>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {fmtDate(selectedRequest.requestedCheckin)} → {fmtDate(selectedRequest.requestedCheckout)}
                      </span>
                    </div>
                  </div>
                )}
                {selectedRequest.requestedRoomType && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.2rem' }}>Room Type</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ textDecoration: 'line-through', color: '#8a96a8' }}>{selectedRequest.roomType}</span>
                      <span>→</span>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedRequest.requestedRoomType}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Reason */}
              {selectedRequest.reason && (
                <div style={{ background: '#fffbf0', borderRadius: 10, padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9a7a2e', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageSquare size={14} /> Guest Reason
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                    {selectedRequest.reason}
                  </div>
                </div>
              )}

              {/* Admin Note */}
              <div className="ap-field">
                <label className="ap-label">
                  Admin Note <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional — shown to guest)</span>
                </label>
                <textarea
                  className="ap-textarea"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. Approved — dates confirmed available. / Rejected — requested room type is fully booked."
                  disabled={selectedRequest.status !== 'PENDING'}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowDetail(false); setSelectedRequest(null); }}>
            Close
          </button>
          {selectedRequest?.status === 'PENDING' && !actionSuccess && (
            <>
              <button
                className="ap-btn-red"
                disabled={actioning}
                onClick={() => handleAction('reject')}
              >
                {actioning ? <><div className="ap-spin-sm" /> Processing…</> : <><XCircle size={14} /> Reject Request</>}
              </button>
              <button
                className="ap-btn-primary"
                disabled={actioning}
                onClick={() => handleAction('approve')}
                style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}
              >
                {actioning ? <><div className="ap-spin-sm" /> Processing…</> : <><CheckCircle2 size={14} /> Approve Request</>}
              </button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}