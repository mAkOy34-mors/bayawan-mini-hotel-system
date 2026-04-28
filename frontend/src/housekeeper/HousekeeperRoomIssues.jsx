// housekeeper/HousekeeperRoomIssues.jsx
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
  RefreshCw,
  Search,
  Lightbulb,
  Droplet,
  Sofa,
  Tv,
  Lock,
  Zap,
  Thermometer,
  Bug,
  AlertTriangle,
  Calendar,
  MapPin,
  MessageCircle,
  Eye,
  ThumbsUp,
  Ban
} from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'LIGHTS', label: 'Broken Lights 💡', icon: <Lightbulb size={16} />, color: '#f59e0b' },
  { value: 'PLUMBING', label: 'Plumbing Problem 🚿', icon: <Droplet size={16} />, color: '#3b82f6' },
  { value: 'FURNITURE', label: 'Damaged Furniture 🪑', icon: <Sofa size={16} />, color: '#8b5cf6' },
  { value: 'ELECTRICAL', label: 'Electrical Issue ⚡', icon: <Zap size={16} />, color: '#ef4444' },
  { value: 'TV_ELECTRONICS', label: 'TV/Electronics 📺', icon: <Tv size={16} />, color: '#10b981' },
  { value: 'DOOR_LOCK', label: 'Door/Lock Issue 🔒', icon: <Lock size={16} />, color: '#f59e0b' },
  { value: 'AC_ISSUE', label: 'AC/Heating Problem ❄️', icon: <Thermometer size={16} />, color: '#06b6d4' },
  { value: 'PEST_CONTROL', label: 'Pest Issue 🐜', icon: <Bug size={16} />, color: '#dc2626' },
  { value: 'OTHER', label: 'Other Issue', icon: <AlertTriangle size={16} />, color: '#6b7280' },
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High - Urgent', color: '#dc2626' },
  { value: 'MEDIUM', label: 'Medium - Normal', color: '#f59e0b' },
  { value: 'LOW', label: 'Low - Can Wait', color: '#10b981' },
];

const STATUS_CONFIG = {
  PENDING: { icon: <Clock size={12} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending' },
  IN_PROGRESS: { icon: <Wrench size={12} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'In Progress' },
  COMPLETED: { icon: <CheckCircle size={12} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Completed' },
  REJECTED: { icon: <X size={12} />, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Rejected' },
};

export function HousekeeperRoomIssues({ token }) {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    issueType: 'LIGHTS',
    title: '',
    description: '',
    roomNumber: '',
    priority: 'MEDIUM',
    notes: '',
  });

  const loadIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/housekeepers/room-issues/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
        setFilteredIssues(data);
      }
    } catch (err) {
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [token]);

  useEffect(() => {
    let filtered = issues;
    
    if (search) {
      filtered = filtered.filter(i => 
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase()) ||
        i.room_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(i => i.issue_type === filter);
    }
    
    setFilteredIssues(filtered);
  }, [search, statusFilter, filter, issues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/housekeepers/room-issues/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowModal(false);
        setFormData({
          issueType: 'LIGHTS',
          title: '',
          description: '',
          roomNumber: '',
          priority: 'MEDIUM',
          notes: '',
        });
        await loadIssues();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create issue report');
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      alert('Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const getIssueIcon = (type) => {
    const found = ISSUE_TYPES.find(t => t.value === type);
    return found?.icon || <Wrench size={16} />;
  };

  const getIssueLabel = (type) => {
    const found = ISSUE_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getIssueColor = (type) => {
    const found = ISSUE_TYPES.find(t => t.value === type);
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
    total: issues.length,
    pending: issues.filter(i => i.status === 'PENDING').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    completed: issues.filter(i => i.status === 'COMPLETED').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={24} style={{ color: '#C9A84C' }} />
            Room Issues & Maintenance
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Report room problems, broken items, or maintenance needs</p>
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
          <Plus size={16} /> Report Issue
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Reports', value: stats.total, color: '#C9A84C', icon: <AlertTriangle size={18} /> },
          { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: <Clock size={18} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#3b82f6', icon: <Wrench size={18} /> },
          { label: 'Completed', value: stats.completed, color: '#10b981', icon: <CheckCircle size={18} /> },
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
            {ISSUE_TYPES.map(type => (
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
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <button
          onClick={loadIssues}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Issues List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading issues...</div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          <CheckCircle size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No issues reported</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Click "Report Issue" to report a room problem</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredIssues.map(issue => {
            const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.PENDING;
            const priorityBadge = getPriorityBadge(issue.priority);
            const issueColor = getIssueColor(issue.issue_type);
            
            return (
              <div key={issue.id} style={{ background: '#fff', border: `1px solid ${issueColor}30`, borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div style={{ padding: '1rem 1.25rem' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 10, 
                        background: `${issueColor}15`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: issueColor
                      }}>
                        {getIssueIcon(issue.issue_type)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{issue.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>
                          {getIssueLabel(issue.issue_type)}
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
                    <span><strong>Room:</strong> {issue.room_number || 'Not specified'}</span>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Description</div>
                    <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.5 }}>{issue.description}</div>
                  </div>

                  {/* Notes */}
                  {issue.notes && (
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
                      <span style={{ color: '#4a5568' }}>{issue.notes}</span>
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
                      Reported on {formatDate(issue.created_at)}
                    </div>
                    {issue.status === 'REJECTED' && issue.rejection_reason && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Ban size={12} />
                        Rejected: {issue.rejection_reason}
                      </div>
                    )}
                    {issue.status === 'COMPLETED' && issue.completed_at && (
                      <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ThumbsUp size={12} />
                        Fixed on {formatDate(issue.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Issue Modal */}
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
                <AlertTriangle size={20} color="#C9A84C" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Report Room Issue</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
              {/* Issue Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Issue Type *
                </label>
                <select
                  value={formData.issueType}
                  onChange={e => setFormData({ ...formData, issueType: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}
                  required
                >
                  {ISSUE_TYPES.map(type => (
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
                  placeholder="e.g., Light not working, Broken chair, Leaking faucet..."
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
                  placeholder="Provide detailed information about the issue..."
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Room Number */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem' }}>
                  Room Number *
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g., 101, 202, 305"
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                  required
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
                  {submitting ? 'Submitting...' : <><Send size={14} /> Report Issue</>}
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