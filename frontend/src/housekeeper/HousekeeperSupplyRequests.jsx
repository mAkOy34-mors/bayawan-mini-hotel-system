// housekeeper/HousekeeperSupplyRequests.jsx
import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Send,
  List,
  Filter,
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';
import { createSupplyRequest, getMySupplyRequests } from './housekeeperService';

export function HousekeeperSupplyRequests({ token }) {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 1,
    reason: '',
    priority: 'MEDIUM'
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getMySupplyRequests(token);
      setRequests(data);
      setFilteredRequests(data);
    } catch (err) {
      console.error('Error loading supply requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [token]);

  useEffect(() => {
    let filtered = requests;
    
    if (search) {
      filtered = filtered.filter(r => 
        r.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.reason?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }
    
    setFilteredRequests(filtered);
  }, [search, filter, requests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await createSupplyRequest(token, formData);
      setShowModal(false);
      setFormData({ itemName: '', quantity: 1, reason: '', priority: 'MEDIUM' });
      await loadRequests();
    } catch (err) {
      console.error('Error creating request:', err);
      alert('Failed to create supply request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { icon: <Clock size={12} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending' },
      APPROVED: { icon: <CheckCircle size={12} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Approved' },
      FULFILLED: { icon: <Package size={12} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Fulfilled' },
      REJECTED: { icon: <AlertCircle size={12} />, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Rejected' },
    };
    return config[status] || config.PENDING;
  };

  const getPriorityBadge = (priority) => {
    const config = {
      HIGH: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'High' },
      MEDIUM: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Medium' },
      LOW: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low' },
    };
    return config[priority] || config.MEDIUM;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={24} style={{ color: '#C9A84C' }} />
            Supply Requests
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Request cleaning supplies and equipment</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'linear-gradient(135deg, #C9A84C, #9a7a2e)',
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Requests', value: requests.length, color: '#C9A84C', icon: <Package size={18} /> },
          { label: 'Pending', value: requests.filter(r => r.status === 'PENDING').length, color: '#f59e0b', icon: <Clock size={18} /> },
          { label: 'Approved', value: requests.filter(r => r.status === 'APPROVED').length, color: '#3b82f6', icon: <CheckCircle size={18} /> },
          { label: 'Fulfilled', value: requests.filter(r => r.status === 'FULFILLED').length, color: '#10b981', icon: <CheckCircle size={18} /> },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>{stat.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a96a8' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', width: 200 }}
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          onClick={loadRequests}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          <Package size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No supply requests found</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Click "New Request" to request supplies</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRequests.map(request => {
            const statusBadge = getStatusBadge(request.status);
            const priorityBadge = getPriorityBadge(request.priority);
            
            return (
              <div key={request.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 10, 
                        background: 'rgba(201,168,76,0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#C9A84C'
                      }}>
                        <Package size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{request.item_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>
                          Requested on {formatDate(request.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: priorityBadge.bg, 
                        color: priorityBadge.color, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        {priorityBadge.label} Priority
                      </span>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: statusBadge.bg, 
                        color: statusBadge.color, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Quantity</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{request.quantity} {request.unit || 'piece(s)'}</div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Reason</div>
                    <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{request.reason}</div>
                  </div>

                  {request.status === 'REJECTED' && request.rejection_reason && (
                    <div style={{ 
                      background: 'rgba(220, 38, 38, 0.08)', 
                      borderRadius: 8, 
                      padding: '0.5rem 0.75rem', 
                      marginTop: '0.5rem',
                      borderLeft: '3px solid #dc2626'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginBottom: '0.2rem' }}>Rejection Reason</div>
                      <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>{request.rejection_reason}</div>
                    </div>
                  )}

                  {request.status === 'FULFILLED' && request.fulfilled_at && (
                    <div style={{ 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      borderRadius: 8, 
                      padding: '0.5rem 0.75rem', 
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#10b981'
                    }}>
                      <CheckCircle size={14} />
                      Fulfilled on {formatDate(request.fulfilled_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} color="#C9A84C" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>New Supply Request</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g., Bathroom Cleaner, Trash Bags, Gloves"
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Unit
                </label>
                <select
                  value={formData.unit || 'piece(s)'}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="piece(s)">Piece(s)</option>
                  <option value="bottle(s)">Bottle(s)</option>
                  <option value="box(es)">Box(es)</option>
                  <option value="roll(s)">Roll(s)</option>
                  <option value="set(s)">Set(s)</option>
                  <option value="gallon(s)">Gallon(s)</option>
                  <option value="liter(s)">Liter(s)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="LOW">Low - Can wait</option>
                  <option value="MEDIUM">Medium - Needed soon</option>
                  <option value="HIGH">High - Urgently needed</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Reason for Request *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                  placeholder="Explain why you need these supplies..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #C9A84C, #9a7a2e)', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {submitting ? 'Submitting...' : <><Send size={14} /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}