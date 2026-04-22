// receptionist/ReceptionistPartnerPayments.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { API_BASE } from '../constants/config';
import { SHARED_CSS, fmt, fmtDate, Spinner, Toast, useToast, Pill } from '../admin/adminShared';
import {
  DollarSign, CreditCard, Banknote, Smartphone, Building2,
  CheckCircle2, XCircle, Clock, Send, RefreshCw,
  Eye, Phone, Mail, Calendar, User, Receipt,
  Printer, Search, Filter, Download, Settings,
  Check, AlertCircle
} from 'lucide-react';

const css = `
  .rpp-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    padding: 2rem 2.25rem;
  }
  @media (max-width: 768px) { .rpp-root { padding: 1.25rem 1rem; } }

  .rpp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .rpp-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .18rem;
  }
  .rpp-sub { font-size: .82rem; color: var(--text-muted); }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 1000px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1rem 1.2rem;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  .stat-card.blue::before { background: linear-gradient(90deg, #2563eb, #60a5fa); }
  .stat-card.green::before { background: linear-gradient(90deg, #059669, #34d399); }
  .stat-card.orange::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .stat-card.purple::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text);
  }
  .stat-label { font-size: .72rem; color: var(--text-muted); margin-top: .2rem; }

  .requests-table {
    width: 100%;
    border-collapse: collapse;
  }
  .requests-table th {
    text-align: left;
    padding: .75rem 1rem;
    font-size: .7rem;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: var(--text-muted);
    font-weight: 700;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }
  .requests-table td {
    padding: .85rem 1rem;
    border-bottom: 1px solid rgba(0,0,0,.04);
    vertical-align: middle;
  }
  .requests-table tr:hover td { background: var(--surface2); }

  .payment-badge {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    padding: .2rem .6rem;
    border-radius: 99px;
    font-size: .7rem;
    font-weight: 600;
  }
  .payment-badge.PAID { background: rgba(5,150,105,.1); color: #059669; }
  .payment-badge.UNPAID { background: rgba(245,158,11,.1); color: #d97706; }
  .payment-badge.REFUNDED { background: rgba(220,38,38,.1); color: #dc2626; }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    padding: .2rem .55rem;
    border-radius: 99px;
    font-size: .65rem;
    font-weight: 700;
  }
  .status-badge.PENDING { background: rgba(245,158,11,.1); color: #d97706; }
  .status-badge.CONFIRMED { background: rgba(37,99,235,.1); color: #2563eb; }
  .status-badge.IN_PROGRESS { background: rgba(124,58,237,.1); color: #7c3aed; }
  .status-badge.COMPLETED { background: rgba(5,150,105,.1); color: #059669; }

  .action-btn {
    padding: .35rem .7rem;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: #fff;
    font-size: .72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all .18s;
    display: inline-flex;
    align-items: center;
    gap: .3rem;
  }
  .action-btn:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-bg); }
  .action-btn.primary { background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: #fff; border: none; }
  .action-btn.primary:hover { transform: translateY(-1px); }
  .action-btn.success { background: #10b981; color: #fff; border: none; }
  .action-btn.success:hover { background: #059669; }

  .status-select {
    padding: .25rem .5rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    font-size: .7rem;
    background: #fff;
    cursor: pointer;
  }

  .receipt-modal .modal-content { border-radius: 16px; }
  .receipt-body {
    padding: 2rem;
    text-align: center;
  }
  .receipt-header {
    border-bottom: 2px dashed var(--border);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }
  .receipt-row {
    display: flex;
    justify-content: space-between;
    padding: .5rem 0;
    border-bottom: 1px solid var(--border);
  }
  .receipt-total {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--gold-dark);
    margin-top: .5rem;
    padding-top: .5rem;
    border-top: 2px solid var(--border);
  }
`;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: '#d97706', next: 'CONFIRMED' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#2563eb', next: 'IN_PROGRESS' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#7c3aed', next: 'COMPLETED' },
  { value: 'COMPLETED', label: 'Completed', color: '#059669', next: null },
  { value: 'CANCELLED', label: 'Cancelled', color: '#dc2626', next: null },
];

export function ReceptionistPartnerPayments({ token }) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast, show } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (paymentFilter) params.append('payment_status', paymentFilter);
      
      const res = await fetch(`${API_BASE}/services/partners/reception/requests/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, paymentFilter]);

  const filteredRequests = requests.filter(r => {
    const matchSearch = !search || 
      r.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number?.includes(search) ||
      r.partner_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const openPaymentModal = (request) => {
    setSelectedRequest(request);
    setPaymentAmount(request.total_amount);
    setPaymentMethod('CASH');
    setReferenceNumber('');
    setNotes('');
    setShowPaymentModal(true);
  };

  const openReceiptModal = (request) => {
    setSelectedRequest(request);
    setShowReceiptModal(true);
  };

  const openStatusModal = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setShowStatusModal(true);
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest || newStatus === selectedRequest.status) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/services/partners/requests/${selectedRequest.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        show(`Status updated to ${newStatus}`, 'success');
        setShowStatusModal(false);
        fetchRequests();
      } else {
        const error = await res.json();
        show(error.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Status update error:', error);
      show('Network error. Please try again.', 'error');
    }
    setUpdatingStatus(false);
  };

  const processPayment = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/services/partners/requests/${selectedRequest.id}/collect-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: paymentAmount,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes: notes
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        show('Payment collected successfully!', 'success');
        setShowPaymentModal(false);
        fetchRequests();
        
        setSelectedRequest({ ...selectedRequest, receipt: data.receipt });
        setShowReceiptModal(true);
      } else {
        const error = await res.json();
        show(error.error || 'Failed to process payment', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      show('Network error. Please try again.', 'error');
    }
    setProcessing(false);
  };

  const printReceipt = () => {
    window.print();
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getNextActions = (currentStatus) => {
    const statusInfo = getStatusInfo(currentStatus);
    if (statusInfo.next) {
      return [{ value: statusInfo.next, label: `Mark as ${statusInfo.next.replace('_', ' ')}` }];
    }
    return [];
  };

  return (
    <div className="rpp-root">
      <style>{SHARED_CSS}</style>
      <style>{css}</style>
      <Toast toast={toast} />

      <div className="rpp-header">
        <div>
          <h1 className="rpp-title">Partner Service Payments</h1>
          <p className="rpp-sub">Collect payments and manage service requests</p>
        </div>
        <button className="action-btn" onClick={fetchRequests}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Pending Payment', value: stats.pending_payments || 0, color: 'orange', icon: <Clock size={18} /> },
          { label: 'Total Collected', value: `₱${(stats.total_collected || 0).toLocaleString()}`, color: 'green', icon: <DollarSign size={18} /> },
          { label: 'Total Commission', value: `₱${(stats.total_commission || 0).toLocaleString()}`, color: 'purple', icon: <Building2 size={18} /> },
          { label: 'Completed Services', value: stats.completed || 0, color: 'blue', icon: <CheckCircle2 size={18} /> },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="stat-value">{s.value}</div>
              <div style={{ opacity: 0.6 }}>{s.icon}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ap-toolbar">
        <div className="ap-search-wrap">
          <Search size={14} className="ap-search-ico" />
          <input
            className="ap-search"
            placeholder="Search by guest name, room, or partner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select className="ap-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
          <option value="">All Payment Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div className="ap-panel-title">Service Requests</div>
          <div className="ap-panel-sub">{filteredRequests.length} requests found</div>
        </div>

        {loading ? (
          <div className="ap-empty"><Spinner /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico"><Receipt size={48} /></div>
            <div className="ap-empty-title">No requests found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Partner / Service</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Request Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const statusInfo = getStatusInfo(req.status);
                  const nextActions = getNextActions(req.status);
                  
                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{req.guest_name}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{req.guest_email}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--gold-dark)' }}>#{req.room_number}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{req.partner_name}</div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{req.service_name || 'General inquiry'}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>₱{req.total_amount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`payment-badge ${req.payment_status}`}>
                          {req.payment_status === 'PAID' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {req.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${req.status}`} style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                          {req.status === 'PENDING' && '⏳ Pending'}
                          {req.status === 'CONFIRMED' && '✓ Confirmed'}
                          {req.status === 'IN_PROGRESS' && '🔄 In Progress'}
                          {req.status === 'COMPLETED' && '✅ Completed'}
                          {req.status === 'CANCELLED' && '❌ Cancelled'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                       </td>
                       <td>
                        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                          {/* Status Update Button - Show for non-completed requests */}
                          {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                            <button 
                              className="action-btn" 
                              onClick={() => openStatusModal(req)}
                              title="Update Status"
                            >
                              <Settings size={12} /> Update Status
                            </button>
                          )}
                          
                          {/* Collect Payment Button - Show for unpaid requests not completed */}
                          {req.payment_status === 'UNPAID' && req.status !== 'COMPLETED' && (
                            <button className="action-btn primary" onClick={() => openPaymentModal(req)}>
                              <CreditCard size={12} /> Collect Payment
                            </button>
                          )}
                          
                          {/* Receipt Button - Show for paid requests */}
                          {req.payment_status === 'PAID' && (
                            <button className="action-btn" onClick={() => openReceiptModal(req)}>
                              <Printer size={12} /> Receipt
                            </button>
                          )}
                        </div>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <Settings size={16} /> Update Request Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <div style={{ background: 'var(--surface2)', padding: '1rem', borderRadius: 10, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <span><strong>Guest:</strong> {selectedRequest.guest_name}</span>
                  <span><strong>Room:</strong> #{selectedRequest.room_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Service:</strong> {selectedRequest.service_name || selectedRequest.partner_name}</span>
                  <span><strong>Current Status:</strong> 
                    <span className={`status-badge ${selectedRequest.status}`} style={{ marginLeft: '.5rem' }}>
                      {selectedRequest.status}
                    </span>
                  </span>
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">New Status</label>
                <select 
                  className="ap-select" 
                  value={newStatus} 
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {newStatus === 'COMPLETED' && selectedRequest.payment_status !== 'PAID' && (
                <div className="warning-box" style={{ 
                  background: '#fef3c7', 
                  padding: '.75rem', 
                  borderRadius: 8, 
                  marginTop: '.5rem',
                  fontSize: '.75rem',
                  color: '#d97706'
                }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '.3rem' }} />
                  Warning: This request is not yet paid. Commission will be calculated when marked as completed.
                </div>
              )}

              {newStatus === 'COMPLETED' && (
                <div style={{ 
                  background: '#e8f5e9', 
                  padding: '.75rem', 
                  borderRadius: 8, 
                  marginTop: '.5rem',
                  fontSize: '.75rem',
                  color: '#059669'
                }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '.3rem' }} />
                  Commission will be calculated: ₱{((selectedRequest.total_amount || 0) * (selectedRequest.commission_rate || 20) / 100).toLocaleString()}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowStatusModal(false)}>Cancel</button>
          <button 
            className="ap-btn-primary" 
            disabled={updatingStatus || newStatus === selectedRequest?.status} 
            onClick={updateRequestStatus}
          >
            {updatingStatus ? <><div className="ap-spin-sm" /> Updating...</> : <>Update Status</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <CreditCard size={16} /> Collect Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <div style={{ background: 'var(--surface2)', padding: '1rem', borderRadius: 10, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <span><strong>Guest:</strong> {selectedRequest.guest_name}</span>
                  <span><strong>Room:</strong> #{selectedRequest.room_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Service:</strong> {selectedRequest.service_name || selectedRequest.partner_name}</span>
                  <span><strong>Amount:</strong> ₱{selectedRequest.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">Payment Amount</label>
                <input
                  type="number"
                  className="ap-input"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="ap-field">
                <label className="ap-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
                  {[
                    { value: 'CASH', label: 'Cash', icon: <Banknote size={16} /> },
                    { value: 'CARD', label: 'Credit Card', icon: <CreditCard size={16} /> },
                    { value: 'GCASH', label: 'GCash', icon: <Smartphone size={16} /> },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      style={{
                        padding: '.6rem',
                        border: `2px solid ${paymentMethod === method.value ? '#C9A84C' : 'var(--border)'}`,
                        borderRadius: 8,
                        background: paymentMethod === method.value ? 'rgba(201,168,76,0.1)' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '.3rem'
                      }}
                    >
                      {method.icon} {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">Reference Number (Optional)</label>
                <input
                  className="ap-input"
                  placeholder="e.g., Transaction ID, Check #"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="ap-field">
                <label className="ap-label">Notes (Optional)</label>
                <textarea
                  className="ap-textarea"
                  rows={2}
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
          <button className="ap-btn-primary" disabled={processing} onClick={processPayment}>
            {processing ? <><div className="ap-spin-sm" /> Processing...</> : <>Confirm Payment</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered className="receipt-modal" size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            <Receipt size={16} /> Payment Receipt
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="receipt-body">
          {selectedRequest && (
            <>
              <div className="receipt-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-dark)' }}>Bayawan Mini Hotel</div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Partner Service Payment Receipt</div>
              </div>
              
              <div className="receipt-row">
                <span>Receipt #:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.receipt_number || `RCP-${selectedRequest.id}`}</span>
              </div>
              <div className="receipt-row">
                <span>Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="receipt-row">
                <span>Guest Name:</span>
                <span style={{ fontWeight: 600 }}>{selectedRequest.guest_name}</span>
              </div>
              <div className="receipt-row">
                <span>Room Number:</span>
                <span>#{selectedRequest.room_number}</span>
              </div>
              <div className="receipt-row">
                <span>Service:</span>
                <span>{selectedRequest.service_name || selectedRequest.partner_name}</span>
              </div>
              <div className="receipt-row">
                <span>Payment Method:</span>
                <span>{selectedRequest.payment_method_detail || 'Cash'}</span>
              </div>
              <div className="receipt-row">
                <span>Reference:</span>
                <span>{selectedRequest.reference_number || '—'}</span>
              </div>
              
              <div className="receipt-total">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Paid:</span>
                  <span>₱{selectedRequest.total_amount?.toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem', fontSize: '.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Thank you for choosing Bayawan Mini Hotel!
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => setShowReceiptModal(false)}>Close</button>
          <button className="ap-btn-primary" onClick={printReceipt}>
            <Printer size={14} /> Print Receipt
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}