// staff/StaffMaintenanceRequests.jsx - Updated with new status values
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { 
  Wrench, 
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
  Eye,
  Zap,
  Droplet,
  Thermometer,
  Lock,
  Tv,
  Hammer,
  Package,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  MessageCircle,
  PlayCircle,
  Ban,
  CheckCircle2
} from 'lucide-react';
import { useToast, Toast } from '../admin/adminShared';

const MAINTENANCE_TYPES = [
  { value: 'ELECTRICAL', label: 'Electrical Problem', icon: <Zap size={16} />, color: '#f59e0b' },
  { value: 'PLUMBING', label: 'Plumbing Issue', icon: <Droplet size={16} />, color: '#3b82f6' },
  { value: 'HVAC', label: 'AC/Heating Problem', icon: <Thermometer size={16} />, color: '#10b981' },
  { value: 'DOOR_LOCK', label: 'Door/Lock Issue', icon: <Lock size={16} />, color: '#8b5cf6' },
  { value: 'TV_ELECTRONICS', label: 'TV/Electronics', icon: <Tv size={16} />, color: '#ef4444' },
  { value: 'FURNITURE', label: 'Furniture Repair', icon: <Hammer size={16} />, color: '#f59e0b' },
  { value: 'TOOLS_REQUEST', label: 'Request Tools/Materials', icon: <Package size={16} />, color: '#06b6d4' },
  { value: 'OTHER', label: 'Other Issue', icon: <Wrench size={16} />, color: '#6b7280' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High - Urgent', color: '#dc2626' },
  { value: 'MEDIUM', label: 'Medium - Normal', color: '#f59e0b' },
  { value: 'LOW', label: 'Low - Can Wait', color: '#10b981' },
];

// IMPORTANT: Updated STATUS_CONFIG with new status values
const STATUS_CONFIG = {
  PENDING: { icon: <Clock size={12} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending' },
  APPROVED: { icon: <CheckCircle2 size={12} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Approved' },
  FULFILLED: { icon: <CheckCircle size={12} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Fulfilled' },
  REJECTED: { icon: <X size={12} />, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Rejected' },
};

export function StaffMaintenanceRequests({ token, user }) {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { toast, show } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    maintenanceType: 'ELECTRICAL',
    title: '',
    description: '',
    roomNumber: '',
    priority: 'MEDIUM',
    notes: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staff/maintenance-requests/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Loaded requests:", data); // Debug log
        setRequests(data);
        setFilteredRequests(data);
      }
    } catch (err) {
      console.error('Error loading maintenance requests:', err);
      show('Failed to load maintenance requests', 'error');
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
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.room_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.maintenance_type === filter);
    }
    
    setFilteredRequests(filtered);
  }, [search, statusFilter, filter, requests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      show('Please fill in title and description', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        maintenance_type: formData.maintenanceType,
        title: formData.title,
        description: formData.description,
        room_number: formData.roomNumber,
        priority: formData.priority,
        notes: formData.notes,
      };
      
      const response = await fetch(`${API_BASE}/staff/maintenance-requests/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowModal(false);
        setFormData({
          maintenanceType: 'ELECTRICAL',
          title: '',
          description: '',
          roomNumber: '',
          priority: 'MEDIUM',
          notes: '',
        });
        await loadRequests();
        show('Maintenance request submitted successfully!', 'success');
      } else {
        show(data.errors || data.error || 'Failed to create request', 'error');
      }
    } catch (err) {
      console.error('Error creating request:', err);
      show('Failed to create maintenance request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getMaintenanceIcon = (type) => {
    const found = MAINTENANCE_TYPES.find(t => t.value === type);
    return found?.icon || <Wrench size={16} />;
  };

  const getMaintenanceLabel = (type) => {
    const found = MAINTENANCE_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getMaintenanceColor = (type) => {
    const found = MAINTENANCE_TYPES.find(t => t.value === type);
    return found?.color || '#6b7280';
  };

  const getPriorityBadge = (priority) => {
    const config = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
    return { color: config.color, label: config.label };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    fulfilled: requests.filter(r => r.status === 'FULFILLED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div>
      <Toast toast={toast} />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={24} style={{ color: '#C9A84C' }} />
            Maintenance Requests
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Report issues, request tools, or track maintenance work</p>
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

      {/* Stats Summary - Updated with new statuses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Requests', value: stats.total, color: '#C9A84C', icon: <Wrench size={18} /> },
          { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: <Clock size={18} /> },
          { label: 'Approved', value: stats.approved, color: '#8b5cf6', icon: <CheckCircle2 size={18} /> },
          { label: 'Fulfilled', value: stats.fulfilled, color: '#10b981', icon: <CheckCircle size={18} /> },
          { label: 'Rejected', value: stats.rejected, color: '#dc2626', icon: <Ban size={18} /> },
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

      {/* Filters - Updated status filter options */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a96a8' }} />
            <input
              type="text"
              placeholder="Search by title, room, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem' }}
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}
          >
            <option value="all">All Types</option>
            {MAINTENANCE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
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
          <Wrench size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No maintenance requests found</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Click "New Request" to report an issue</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRequests.map(request => {
            // Use the updated STATUS_CONFIG
            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
            const priorityBadge = getPriorityBadge(request.priority);
            const maintenanceColor = getMaintenanceColor(request.maintenance_type);
            
            return (
              <div key={request.id} style={{ background: '#fff', border: `1px solid ${maintenanceColor}30`, borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div style={{ padding: '1rem 1.25rem' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 10, 
                        background: `${maintenanceColor}15`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: maintenanceColor
                      }}>
                        {getMaintenanceIcon(request.maintenance_type)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{request.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>
                          {getMaintenanceLabel(request.maintenance_type)}
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
                        background: `${priorityBadge.color}20`, 
                        color: priorityBadge.color, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        <AlertTriangle size={10} />
                        {priorityBadge.label}
                      </span>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: status.bg, 
                        color: status.color, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Room Info */}
                  {request.room_number && (
                    <div style={{ 
                      background: '#f8f9fb', 
                      borderRadius: 8, 
                      padding: '0.5rem 0.75rem', 
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem'
                    }}>
                      <MapPin size={14} color="#C9A84C" />
                      <span><strong>Location:</strong> Room {request.room_number}</span>
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Description</div>
                    <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.5 }}>{request.description}</div>
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div style={{ 
                      background: '#f1f5f9', 
                      borderRadius: 8, 
                      padding: '0.5rem 0.75rem', 
                      marginBottom: '0.75rem', 
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <MessageCircle size={12} />
                      <span style={{ color: '#4a5568' }}>{request.notes}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} />
                      Reported on {formatDate(request.created_at)}
                    </div>
                    {request.status === 'REJECTED' && request.rejection_reason && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                        Rejected: {request.rejection_reason}
                      </div>
                    )}
                    {request.status === 'FULFILLED' && request.completed_at && (
                      <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                        Completed: {formatDate(request.completed_at)}
                      </div>
                    )}
                  </div>
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
            maxWidth: 550,
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
                <Wrench size={20} color="#C9A84C" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>New Maintenance Request</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
              {/* Maintenance Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Issue Type *
                </label>
                <select
                  value={formData.maintenanceType}
                  onChange={e => setFormData({ ...formData, maintenanceType: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
                  required
                >
                  {MAINTENANCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Title / Subject *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Aircon not cooling, Broken door lock, Need tools..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Provide detailed information about the issue or request..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Room Number */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Room Number
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g., 101, 202, Common Area"
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              </div>

              {/* Priority */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
                >
                  {PRIORITY_OPTIONS.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any additional information..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              {/* Submit Buttons */}
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
    </div>
  );
}