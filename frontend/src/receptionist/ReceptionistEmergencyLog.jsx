// receptionist/ReceptionistEmergencyLog.jsx
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  AlertTriangle, Bell, CheckCircle2, XCircle, Clock,
  User, Hotel, Phone, Calendar, Search, RefreshCw,
  Filter, Eye, Download, Printer, FileText,
  TrendingUp, Users, Activity, Shield, Flame, Heart,
  ChevronRight, ChevronDown, ExternalLink
} from 'lucide-react';

import { API_BASE } from '../constants/config';

const EXTRA_CSS = `
  .emergency-stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 768px) {
    .emergency-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .emergency-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
    cursor: pointer;
  }
  .emergency-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .emergency-stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1.2;
  }
  .emergency-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
    margin-top: 0.25rem;
  }
  .emergency-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
  }
  .emergency-type-medical { background: rgba(220,38,38,0.12); color: #dc2626; }
  .emergency-type-fire { background: rgba(249,115,22,0.12); color: #f97316; }
  .emergency-type-security { background: rgba(59,130,246,0.12); color: #3b82f6; }
  .emergency-type-other { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .emergency-status-active { background: rgba(220,38,38,0.12); color: #dc2626; }
  .emergency-status-resolved { background: rgba(16,185,129,0.12); color: #10b981; }
  .emergency-table {
    width: 100%;
    border-collapse: collapse;
  }
  .emergency-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    background: var(--surface2);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }
  .emergency-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.8rem;
    vertical-align: middle;
  }
  .emergency-table tr:hover {
    background: rgba(201,168,76,0.04);
  }
  .detail-modal .modal-dialog {
    max-width: 600px;
  }
  .detail-section {
    background: var(--surface2);
    border-radius: 10px;
    padding: 0.85rem;
    margin-bottom: 0.75rem;
  }
  .detail-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 700;
    margin-bottom: 0.3rem;
  }
  .timeline-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--border);
  }
  .timeline-item:last-child {
    border-bottom: none;
  }
  .timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 0.5rem;
    flex-shrink: 0;
  }
  .timeline-dot.created { background: #3b82f6; }
  .timeline-dot.resolved { background: #10b981; }
  .filter-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    align-items: center;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .export-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export function ReceptionistEmergencyLog({ token }) {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    byType: { medical: 0, fire: 0, security: 0, other: 0 },
    resolvedBy: {}
  });
  
  const { toast, show } = useToast();

  const loadEmergencies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/emergency/all/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const emergenciesList = data.emergencies || [];
        setEmergencies(emergenciesList);
        // 🔍 ADD THIS DEBUG
      console.log('=== API Response ===');
      console.log('Full response:', data);
      console.log('Emergencies list:', emergenciesList);
      
      // Check each resolved emergency
      emergenciesList.forEach(emergency => {
        if (emergency.status === 'RESOLVED') {
          console.log(`Resolved Emergency #${emergency.id}:`, {
            status: emergency.status,
            resolvedBy: emergency.resolvedBy,
            resolvedAt: emergency.resolvedAt,
            hasResolvedBy: !!emergency.resolvedBy
          });
        }
      });
      
      setEmergencies(emergenciesList);
        // Calculate stats
        const active = emergenciesList.filter(e => e.status === 'ACTIVE').length;
        const resolved = emergenciesList.filter(e => e.status === 'RESOLVED').length;
        
        const byType = {
          medical: emergenciesList.filter(e => e.emergencyType === 'medical').length,
          fire: emergenciesList.filter(e => e.emergencyType === 'fire').length,
          security: emergenciesList.filter(e => e.emergencyType === 'security').length,
          other: emergenciesList.filter(e => e.emergencyType === 'other').length,
        };
        
        // Count resolved by each staff member
        const resolvedBy = {};
        emergenciesList
          .filter(e => e.status === 'RESOLVED' && e.resolvedBy)
          .forEach(e => {
            resolvedBy[e.resolvedBy] = (resolvedBy[e.resolvedBy] || 0) + 1;
          });
        
        setStats({
          total: emergenciesList.length,
          active,
          resolved,
          byType,
          resolvedBy
        });
      } else {
        show('Failed to load emergencies', 'error');
      }
    } catch (err) {
      console.error('Failed to load emergencies:', err);
      show('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencies();
  }, [token]);

  const getDateRangeFilter = (dateRange) => {
    const now = new Date();
    switch (dateRange) {
      case 'TODAY':
        const today = new Date().toISOString().slice(0, 10);
        return e => e.createdAt?.slice(0, 10) === today;
      case 'WEEK':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return e => new Date(e.createdAt) >= weekAgo;
      case 'MONTH':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return e => new Date(e.createdAt) >= monthAgo;
      default:
        return () => true;
    }
  };

  const filteredEmergencies = emergencies.filter(e => {
    // Search filter
    if (search && !e.guestName?.toLowerCase().includes(search.toLowerCase()) &&
        !e.roomNumber?.includes(search) &&
        !e.emergencyTypeName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    // Type filter
    if (typeFilter !== 'ALL' && e.emergencyType !== typeFilter) return false;
    // Date range filter
    const dateFilter = getDateRangeFilter(dateRange);
    if (!dateFilter(e)) return false;
    
    return true;
  });

  const getTypeStyle = (type) => {
    switch (type) {
      case 'medical': return 'emergency-type-medical';
      case 'fire': return 'emergency-type-fire';
      case 'security': return 'emergency-type-security';
      default: return 'emergency-type-other';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medical': return <Heart size={14} />;
      case 'fire': return <Flame size={14} />;
      case 'security': return <Shield size={14} />;
      default: return <AlertTriangle size={14} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'medical': return 'Medical';
      case 'fire': return 'Fire';
      case 'security': return 'Security';
      default: return 'Other';
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Guest Name', 'Room', 'Emergency Type', 'Status', 'Resolved By', 'Resolved At'];
    const rows = filteredEmergencies.map(e => [
      e.id,
      new Date(e.createdAt).toLocaleDateString(),
      new Date(e.createdAt).toLocaleTimeString(),
      e.guestName || 'Unknown',
      e.roomNumber || 'Unknown',
      e.emergencyTypeName || e.emergencyType,
      e.status,
      e.resolvedBy || '—',
      e.resolvedAt ? new Date(e.resolvedAt).toLocaleString() : '—'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const getResponseTime = (emergency) => {
    if (!emergency.resolvedAt) return null;
    const created = new Date(emergency.createdAt);
    const resolved = new Date(emergency.resolvedAt);
    const minutes = Math.round((resolved - created) / 60000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <style>{EXTRA_CSS}</style>
      <Toast toast={toast} />

      {showExportToast && (
        <div className="export-toast">
          <Download size={16} />
          Emergency log exported successfully!
        </div>
      )}

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <AlertTriangle size={22} color="var(--gold-dark)" />
            Emergency Management Log
          </h1>
          <p className="ap-sub">Complete history of all emergency alerts and responses</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="ap-btn-ghost" onClick={loadEmergencies}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="ap-btn-primary" onClick={exportToCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="emergency-stats-grid">
        <div className="emergency-stat-card" onClick={() => setStatusFilter('ALL')}>
          <div className="emergency-stat-value" style={{ color: '#3b82f6' }}>{stats.total}</div>
          <div className="emergency-stat-label">Total Emergencies</div>
        </div>
        <div className="emergency-stat-card" onClick={() => setStatusFilter('ACTIVE')}>
          <div className="emergency-stat-value" style={{ color: '#dc2626' }}>{stats.active}</div>
          <div className="emergency-stat-label">Active</div>
        </div>
        <div className="emergency-stat-card" onClick={() => setStatusFilter('RESOLVED')}>
          <div className="emergency-stat-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
          <div className="emergency-stat-label">Resolved</div>
        </div>
        <div className="emergency-stat-card">
          <div className="emergency-stat-value" style={{ color: '#f59e0b' }}>
            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
          </div>
          <div className="emergency-stat-label">Resolution Rate</div>
        </div>
        <div className="emergency-stat-card">
          <div className="emergency-stat-value" style={{ color: '#C9A84C' }}>
            {Object.keys(stats.resolvedBy).length}
          </div>
          <div className="emergency-stat-label">Staff Responders</div>
        </div>
      </div>

      {/* Emergency Type Breakdown */}
      <div className="ap-panel" style={{ marginBottom: '1rem' }}>
        <div className="ap-panel-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div><span style={{ fontWeight: 700 }}>🏥 Medical:</span> {stats.byType.medical}</div>
              <div><span style={{ fontWeight: 700 }}>🔥 Fire:</span> {stats.byType.fire}</div>
              <div><span style={{ fontWeight: 700 }}>🛡️ Security:</span> {stats.byType.security}</div>
              <div><span style={{ fontWeight: 700 }}>⚠️ Other:</span> {stats.byType.other}</div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Users size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />
              Top Responder: {Object.entries(stats.resolvedBy).sort((a,b) => b[1] - a[1])[0]?.[0] || '—'} 
              ({Object.entries(stats.resolvedBy).sort((a,b) => b[1] - a[1])[0]?.[1] || 0} resolved)
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ap-panel" style={{ marginBottom: '1rem' }}>
        <div className="ap-panel-body">
          <div className="filter-bar">
            <div className="ap-search-wrap" style={{ flex: 2 }}>
              <Search size={14} className="ap-search-ico" />
              <input
                className="ap-search"
                placeholder="Search by guest name, room number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select className="ap-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="medical">Medical</option>
              <option value="fire">Fire</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
            <select className="ap-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emergencies Table */}
      <div className="ap-panel">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        ) : filteredEmergencies.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico"><Bell size={48} strokeWidth={1} /></div>
            <div className="ap-empty-title">No emergencies found</div>
            <div className="ap-empty-sub">No emergency records match your filters</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="emergency-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Resolved By</th>
                  <th>Response Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmergencies.map(emergency => (
                  <tr key={emergency.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{formatDate(emergency.createdAt)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatTime(emergency.createdAt)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emergency.guestName || 'Unknown'}</div>
                      {emergency.guestPhone && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emergency.guestPhone}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>#{emergency.roomNumber || 'Unknown'}</td>
                    <td>
                      <span className={`emergency-type-badge ${getTypeStyle(emergency.emergencyType)}`}>
                        {getTypeIcon(emergency.emergencyType)} {getTypeLabel(emergency.emergencyType)}
                      </span>
                    </td>
                    <td>
                      <span className={`emergency-type-badge ${emergency.status === 'ACTIVE' ? 'emergency-status-active' : 'emergency-status-resolved'}`}>
                        {emergency.status === 'ACTIVE' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {emergency.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      {emergency.resolvedBy ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{emergency.resolvedBy}</div>
                          {emergency.resolvedAt && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {formatDate(emergency.resolvedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {getResponseTime(emergency) ? (
                        <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{getResponseTime(emergency)}</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="ap-btn-ghost"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                        onClick={() => { setSelectedEmergency(emergency); setShowDetail(true); }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Emergency Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setSelectedEmergency(null); }} centered className="detail-modal ap-modal">
        {selectedEmergency && (
          <>
            <Modal.Header closeButton>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <AlertTriangle size={18} color="var(--gold-dark)" />
                Emergency Details #{selectedEmergency.id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Type and Status */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className={`emergency-type-badge ${getTypeStyle(selectedEmergency.emergencyType)}`} style={{ padding: '0.3rem 0.8rem' }}>
                  {getTypeIcon(selectedEmergency.emergencyType)} {selectedEmergency.emergencyTypeName}
                </span>
                <span className={`emergency-type-badge ${selectedEmergency.status === 'ACTIVE' ? 'emergency-status-active' : 'emergency-status-resolved'}`} style={{ padding: '0.3rem 0.8rem' }}>
                  {selectedEmergency.status === 'ACTIVE' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                  {selectedEmergency.status || 'ACTIVE'}
                </span>
              </div>

              {/* Guest Information */}
              <div className="detail-section">
                <div className="detail-label"><User size={12} /> Guest Information</div>
                <div><strong>Name:</strong> {selectedEmergency.guestName || 'Unknown'}</div>
                {selectedEmergency.guestPhone && <div><strong>Phone:</strong> {selectedEmergency.guestPhone}</div>}
                <div><strong>Room:</strong> <span style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>#{selectedEmergency.roomNumber || 'Unknown'}</span></div>
              </div>

              {/* Emergency Timeline */}
              <div className="detail-section">
                <div className="detail-label"><Clock size={12} /> Timeline</div>
                <div className="timeline-item">
                  <div className="timeline-dot created" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Emergency Created</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(selectedEmergency.createdAt)}
                    </div>
                  </div>
                </div>
                {selectedEmergency.resolvedAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot resolved" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>Emergency Resolved</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(selectedEmergency.resolvedAt)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.2rem' }}>
                        Response time: {getResponseTime(selectedEmergency)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Information */}
              {selectedEmergency.resolvedBy && (
                <div className="detail-section">
                  <div className="detail-label"><CheckCircle2 size={12} /> Resolution Details</div>
                  <div><strong>Resolved By:</strong> {selectedEmergency.resolvedBy}</div>
                  <div><strong>Resolved At:</strong> {formatDateTime(selectedEmergency.resolvedAt)}</div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className="ap-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => window.location.href = `tel:${selectedEmergency.guestPhone || '+63328888888'}`}
                >
                  <Phone size={14} /> Call Guest
                </button>
                <button
                  className="ap-btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const text = `Emergency Alert #${selectedEmergency.id}\nGuest: ${selectedEmergency.guestName}\nRoom: ${selectedEmergency.roomNumber}\nType: ${selectedEmergency.emergencyTypeName}\nStatus: ${selectedEmergency.status}`;
                    navigator.clipboard.writeText(text);
                    show('Copied to clipboard!', 'success');
                  }}
                >
                  <FileText size={14} /> Copy Details
                </button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}