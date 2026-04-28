// admin/AdminMaintenanceRequests.jsx - Updated with APPROVED/FULFILLED workflow (No alerts/confirmations)
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { Modal } from 'react-bootstrap';
import {
  Wrench, CheckCircle2, Ban, RefreshCw, Search, Filter,
  User, Calendar, Eye, CheckCircle, XCircle, 
  Loader, Clock, AlertTriangle, Package
} from 'lucide-react';
import { useToast, Toast } from '../admin/adminShared';

export function AdminMaintenanceRequests({ token }) {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  
  const { toast, show } = useToast();

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staff/maintenance-requests/`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error loading maintenance requests:', err);
      show('Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadRequests();
  }, [token]);

  useEffect(() => {
    let filtered = requests;
    if (search) {
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.requested_by_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.room_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    setFilteredRequests(filtered);
  }, [search, statusFilter, requests]);

  const updateStatus = async (id, newStatus, additionalData = {}) => {
    setUpdating(true);
    setUpdatingId(id);
    
    try {
      const response = await fetch(`${API_BASE}/staff/maintenance-requests/${id}/update/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus, ...additionalData })
      });
      
      if (response.ok) {
        await loadRequests();
        show(`Request ${newStatus.toLowerCase()} successfully!`, 'success');
      } else {
        const error = await response.json();
        show(`Failed to update: ${error.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error updating:', err);
      show('Network error. Please try again.', 'error');
    } finally {
      setUpdating(false);
      setUpdatingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      show('Rejection reason is required', 'error');
      return;
    }
    await updateStatus(id, 'REJECTED', { rejection_reason: reason });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
      APPROVED: { label: 'Approved', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <CheckCircle2 size={12} /> },
      FULFILLED: { label: 'Fulfilled', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} /> },
      REJECTED: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', icon: <XCircle size={12} /> },
    };
    return configs[status] || configs.PENDING;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      HIGH: { label: 'High', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
      MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      LOW: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    };
    return configs[priority] || configs.MEDIUM;
  };

  return (
    <div>
      <Toast toast={toast} />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={24} style={{ color: '#3b82f6' }} />
          Maintenance Requests Management
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8' }}>Approve, fulfill, or reject maintenance requests from staff</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8a96a8' }} />
            <input
              type="text"
              placeholder="Search by title, staff, or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem' }}
            />
          </div>
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
        <button onClick={loadRequests} style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8a96a8' }}>No maintenance requests found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredRequests.map((req) => {
            const statusConfig = getStatusConfig(req.status);
            const priorityConfig = getPriorityConfig(req.priority);
            const isUpdating = updating && updatingId === req.id;
            
            return (
              <div key={req.id} style={{ background: '#fff', border: `1px solid ${statusConfig.color}30`, borderRadius: 12, padding: '1rem', position: 'relative' }}>
                {isUpdating && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <Loader size={24} style={{ animation: 'spin 0.6s linear infinite' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 99, 
                      background: priorityConfig.bg, 
                      color: priorityConfig.color, 
                      fontSize: '0.7rem', 
                      fontWeight: 600 
                    }}>
                      <AlertTriangle size={10} /> {priorityConfig.label}
                    </span>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 99, 
                      background: statusConfig.bg, 
                      color: statusConfig.color, 
                      fontSize: '0.7rem', 
                      fontWeight: 600 
                    }}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {req.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(req.id, 'APPROVED')} disabled={isUpdating} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button onClick={() => handleReject(req.id)} disabled={isUpdating} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                          <Ban size={12} /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'APPROVED' && (
                      <button onClick={() => {
                        const notes = prompt('Enter fulfillment notes:', 'Maintenance work completed');
                        updateStatus(req.id, 'FULFILLED', { resolution_notes: notes });
                      }} disabled={isUpdating} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <Package size={12} /> Mark Fulfilled
                      </button>
                    )}
                    <button onClick={() => { setSelectedRequest(req); setShowDetail(true); }} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>
                
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{req.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: '0.5rem' }}>{req.description}</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#8a96a8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><User size={11} /> {req.requested_by_name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Room {req.room_number || 'N/A'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Calendar size={11} /> {formatDate(req.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setSelectedRequest(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Maintenance Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <div><strong>Title:</strong> {selectedRequest.title}</div>
              <div><strong>Description:</strong> {selectedRequest.description}</div>
              <div><strong>Maintenance Type:</strong> {selectedRequest.maintenance_type}</div>
              <div><strong>Priority:</strong> {selectedRequest.priority}</div>
              <div><strong>Requested By:</strong> {selectedRequest.requested_by_name}</div>
              <div><strong>Room:</strong> {selectedRequest.room_number || 'N/A'}</div>
              <div><strong>Status:</strong> {selectedRequest.status}</div>
              <div><strong>Created:</strong> {formatDate(selectedRequest.created_at)}</div>
              {selectedRequest.started_at && <div><strong>Started:</strong> {formatDate(selectedRequest.started_at)}</div>}
              {selectedRequest.completed_at && <div><strong>Completed:</strong> {formatDate(selectedRequest.completed_at)}</div>}
              {selectedRequest.rejection_reason && <div><strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}</div>}
              {selectedRequest.resolution_notes && <div><strong>Resolution Notes:</strong> {selectedRequest.resolution_notes}</div>}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}