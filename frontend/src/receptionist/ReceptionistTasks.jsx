// ReceptionistTasks.jsx — Manage staff tasks for guest complaints and requests
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { SHARED_CSS, fmt, fmtDate, Pill, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  ClipboardList, AlertTriangle, Plus, CheckCircle2, Clock,
  XCircle, Filter, Search, RefreshCw, User, Bell,
  MessageSquare, Wrench, Coffee, Tv, Thermometer, Lock,
  Trash2, Edit2, Send, Phone, Mail, Flag, AlertCircle,
  Calendar, Building, Star, Users, Eye,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

const EXTRA_CSS = `
  .tasks-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 768px) {
    .tasks-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .tasks-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
  }
  .tasks-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .tasks-stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }
  .tasks-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    font-weight: 600;
  }
  .tasks-filter-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
    align-items: center;
  }
  .tasks-priority-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
  }
  .priority-high { background: rgba(220,53,69,0.12); color: #dc3545; border: 1px solid rgba(220,53,69,0.25); }
  .priority-medium { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
  .priority-low { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
  .task-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s;
    animation: fadeUp 0.3s ease both;
    cursor: pointer;
  }
  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .task-card.resolved {
    opacity: 0.7;
    background: var(--surface2);
  }
  .complaint-type-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    background: rgba(201,168,76,0.12);
    color: #9a7a2e;
  }
  .tasks-timeline {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border);
    font-size: 0.7rem;
    color: var(--text-muted);
  }
`;

const COMPLAINT_TYPES = [
  { value: 'NOISE', label: 'Noise Complaint', Icon: Bell },
  { value: 'CLEANING', label: 'Cleaning Issue', Icon: Wrench },
  { value: 'AC', label: 'Air Conditioning', Icon: Thermometer },
  { value: 'TV', label: 'TV/Entertainment', Icon: Tv },
  { value: 'PLUMBING', label: 'Plumbing Issue', Icon: Wrench },
  { value: 'STAFF', label: 'Staff Behavior', Icon: Users },
  { value: 'AMENITIES', label: 'Amenities Missing', Icon: Coffee },
  { value: 'SECURITY', label: 'Security Concern', Icon: Lock },
  { value: 'OTHER', label: 'Other', Icon: AlertCircle },
];

const PRIORITIES = [
  { value: 'HIGH', label: 'High', color: '#dc3545', icon: AlertTriangle },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b', icon: AlertCircle },
  { value: 'LOW', label: 'Low', color: '#10b981', icon: CheckCircle2 },
];

const STATUSES = [
  { value: 'PENDING', label: 'Pending', color: '#f59e0b', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', icon: Wrench },
  { value: 'RESOLVED', label: 'Resolved', color: '#10b981', icon: CheckCircle2 },
];

export function ReceptionistTasks({ token, setPage }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  // Create task modal
  const [showCreate, setShowCreate] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [submitting, setSubmitting] = useState(false); // ← ADD THIS STATE
  
  // Task form
  const [taskForm, setTaskForm] = useState({
    complaintId: null,
    guestId: null,
    guestName: '',
    guestEmail: '',
    roomNumber: '',
    complaintType: 'OTHER',
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedTo: 'HOUSEKEEPING',
  });
  
  // View complaint modal
  const [viewComplaint, setViewComplaint] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  
  const { toast, show } = useToast();

  // Helper function to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to map complaint type to task type
  const mapComplaintTypeToTaskType = (complaintType) => {
    const mapping = {
    'CLEANING': 'CLEANING',
    'AC': 'MAINTENANCE',
    'TV': 'MAINTENANCE',
    'PLUMBING': 'MAINTENANCE',
    'NOISE': 'ASSISTANCE',
    'SECURITY': 'ASSISTANCE',  // Use ASSISTANCE instead
    'STAFF': 'ASSISTANCE',
    'AMENITIES': 'CLEANING',
    'OTHER': 'ASSISTANCE'
  };
    return mapping[complaintType] || 'ASSISTANCE';
  };

  // Load complaints from API
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE}/complaints/staff/`, {
        headers: h(token)
      });
      
      if (response.ok) {
        const data = await response.json();
        const complaintsList = Array.isArray(data) ? data : (data.complaints || []);
        setComplaints(complaintsList);
      } else {
        console.error('Failed to load complaints:', response.status);
        setComplaints([]);
      }
    } catch (error) {
      console.error('Failed to load complaints:', error);
      show('Failed to load complaints', 'error');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadComplaints();
    }
  }, [token]);

  // Update complaint status
  const updateComplaintStatus = async (complaintId, status, responseText) => {
    try {
      const res = await fetch(`${BASE}/complaints/staff/${complaintId}/`, {
        method: 'PUT',
        headers: hj(token),
        body: JSON.stringify({
          status: status,
          response: responseText
        })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => 
          c.id === complaintId ? updated : c
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update complaint:', error);
      return false;
    }
  };

  // Create task from complaint
  const openCreateFromComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setTaskForm({
      complaintId: complaint.id,
      guestId: complaint.user_id,
      guestName: complaint.guest_name,
      guestEmail: complaint.guest_email,
      roomNumber: complaint.room_number || '',
      complaintType: complaint.complaint_type,
      title: complaint.title,
      description: complaint.description,
      priority: 'MEDIUM',
      assignedTo: 'HOUSEKEEPING',
    });
    setShowCreate(true);
  };

  // Create task function
 // Create task function
const createTask = async () => {
  if (!taskForm.title || !taskForm.description) {
    show('Please fill in all required fields', 'error');
    return;
  }

  setSubmitting(true);
  try {
    // First, find the staff user ID based on the assigned department
    const staffResponse = await fetch(`${BASE}/staff/available/?department=${taskForm.assignedTo}`, {
      headers: h(token)
    });
    
    let assignedToId = null;
    if (staffResponse.ok) {
      const staffList = await staffResponse.json();
      console.log('Available staff:', staffList);
      if (staffList && staffList.length > 0) {
        assignedToId = staffList[0].id;
      }
    }

    const payload = {
      title: taskForm.title,
      description: taskForm.description,
      task_type: mapComplaintTypeToTaskType(taskForm.complaintType),
      priority: taskForm.priority,
      room_number: taskForm.roomNumber,
      assigned_to: assignedToId,
      note: `Complaint #${taskForm.complaintId}: ${taskForm.description.substring(0, 100)}`,
      complaint_id: taskForm.complaintId  // ✅ ADD THIS LINE
    };
    
    console.log('Sending payload:', payload);

    const response = await fetch(`${BASE}/staff/tasks/create/`, {
      method: 'POST',
      headers: hj(token),
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', responseData);

    if (response.ok) {
      await updateComplaintStatus(
        taskForm.complaintId,
        'IN_PROGRESS',
        `Task created and assigned to ${taskForm.assignedTo}`
      );
      
      show('Task created and assigned successfully!', 'success');
      setShowCreate(false);
      loadComplaints();
      resetForm();
    } else {
      const errorMessage = responseData.error || responseData.errors || responseData.message || 'Failed to create task';
      show(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage, 'error');
    }
  } catch (error) {
    console.error('Failed to create task:', error);
    show('Network error. Please try again.', 'error');
  } finally {
    setSubmitting(false);
  }
};

  const resetForm = () => {
    setTaskForm({
      complaintId: null,
      guestId: null,
      guestName: '',
      guestEmail: '',
      roomNumber: '',
      complaintType: 'OTHER',
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedTo: 'HOUSEKEEPING',
    });
    setSelectedComplaint(null);
  };

  const handleResolveComplaint = async (complaint) => {
    if (!window.confirm(`Mark complaint "${complaint.title}" as resolved?`)) return;
    
    const response = prompt('Enter resolution notes (optional):', complaint.response || '');
    
    const success = await updateComplaintStatus(
      complaint.id,
      'RESOLVED',
      response || 'Complaint resolved by staff'
    );
    
    if (success) {
      show('Complaint marked as resolved!', 'success');
      loadComplaints();
    } else {
      show('Failed to update complaint', 'error');
    }
  };

  const getPriorityInfo = (complaintType) => {
    const priorityMap = {
      'NOISE': 'HIGH',
      'SECURITY': 'HIGH',
      'STAFF': 'HIGH',
      'PLUMBING': 'HIGH',
      'AC': 'MEDIUM',
      'CLEANING': 'MEDIUM',
      'TV': 'LOW',
      'AMENITIES': 'LOW',
      'OTHER': 'MEDIUM'
    };
    const mappedPriority = priorityMap[complaintType] || 'MEDIUM';
    return PRIORITIES.find(p => p.value === mappedPriority) || PRIORITIES[1];
  };

  const getStatusInfo = (status) => {
    return STATUSES.find(s => s.value === status) || STATUSES[0];
  };

  const getComplaintTypeInfo = (type) => {
    return COMPLAINT_TYPES.find(t => t.value === type) || COMPLAINT_TYPES[8];
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchSearch = !search ||
      complaint.title?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      complaint.room_number?.includes(search);
    const matchStatus = statusFilter === 'ALL' || complaint.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'PENDING').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
    highPriority: complaints.filter(c => {
      const priority = getPriorityInfo(c.complaint_type);
      return priority.value === 'HIGH' && c.status !== 'RESOLVED' && c.status !== 'CLOSED';
    }).length,
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <ClipboardList size={22} color="var(--gold-dark)"/>
            Guest Complaints Management
          </h1>
          <p className="ap-sub">View and manage guest complaints, create staff tasks</p>
        </div>
        <button className="ap-btn-ghost" onClick={loadComplaints}>
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="tasks-stats">
        <div className="tasks-stat-card">
          <div className="tasks-stat-value">{stats.total}</div>
          <div className="tasks-stat-label">Total Complaints</div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</div>
          <div className="tasks-stat-label">Pending</div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-value" style={{ color: '#3b82f6' }}>{stats.inProgress}</div>
          <div className="tasks-stat-label">In Progress</div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
          <div className="tasks-stat-label">Resolved</div>
        </div>
      </div>

      {/* High Priority Alert */}
      {stats.highPriority > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.75rem',
          background: 'rgba(220,53,69,0.08)',
          border: '1px solid rgba(220,53,69,0.25)',
          borderRadius: '10px',
          padding: '.65rem 1rem',
          marginBottom: '1rem',
        }}>
          <AlertTriangle size={18} color="#dc3545" />
          <span style={{ fontSize: '.82rem', color: '#dc3545', fontWeight: 600 }}>
            {stats.highPriority} high priority complaint{stats.highPriority !== 1 ? 's' : ''} need{stats.highPriority === 1 ? 's' : ''} attention!
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="ap-panel" style={{ marginBottom: '1rem' }}>
        <div className="ap-panel-body">
          <div className="tasks-filter-bar">
            <div className="ap-search-wrap" style={{ flex: 1 }}>
              <span className="ap-search-ico"><Search size={13}/></span>
              <input
                className="ap-search"
                placeholder="Search by title, guest, room..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="ap-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="ap-btn-ghost" onClick={loadComplaints}>
              <RefreshCw size={14}/> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner/>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="ap-empty">
          <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.25, marginBottom: '1rem' }}>
            <ClipboardList size={48} strokeWidth={1}/>
          </div>
          <div className="ap-empty-title">No complaints found</div>
          <div className="ap-empty-sub">Guest complaints will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filteredComplaints.map((complaint, idx) => {
            const priorityInfo = getPriorityInfo(complaint.complaint_type);
            const statusInfo = getStatusInfo(complaint.status);
            const complaintInfo = getComplaintTypeInfo(complaint.complaint_type);
            const PriorityIcon = priorityInfo.icon;
            const StatusIcon = statusInfo.icon;
            const ComplaintIcon = complaintInfo.Icon;
            const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
            
            return (
              <div
                key={complaint.id}
                className={`task-card ${isResolved ? 'resolved' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`tasks-priority-badge priority-${priorityInfo.value.toLowerCase()}`}>
                      <PriorityIcon size={10}/> {priorityInfo.label}
                    </span>
                    <span className="complaint-type-tag">
                      <ComplaintIcon size={10}/> {complaintInfo.label}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      #{complaint.id}
                    </span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: statusInfo.color }}>
                    <StatusIcon size={10}/> {statusInfo.label}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem', color: 'var(--text)' }}>
                  {complaint.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {complaint.description.length > 120 ? complaint.description.substring(0, 120) + '...' : complaint.description}
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span><User size={11}/> {complaint.guest_name}</span>
                  <span><Building size={11}/> Room {complaint.room_number || 'N/A'}</span>
                  <span><Mail size={11}/> {complaint.guest_email}</span>
                  <span><Clock size={11}/> {formatDateTime(complaint.created_at)}</span>
                </div>

                {complaint.response && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem', 
                    background: 'var(--surface2)', 
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    borderLeft: '3px solid var(--gold)'
                  }}>
                    <strong>📝 Staff Response:</strong> {complaint.response}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  {!isResolved && (
                    <>
                      <button 
                        className="ap-btn-primary" 
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
                        onClick={() => openCreateFromComplaint(complaint)}
                      >
                        <Plus size={12}/> Create Task
                      </button>
                      <button 
                        className="ap-btn-green" 
                        style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
                        onClick={() => handleResolveComplaint(complaint)}
                      >
                        <CheckCircle2 size={12}/> Resolve
                      </button>
                    </>
                  )}
                  <button 
                    className="ap-btn-ghost" 
                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
                    onClick={() => setViewComplaint(complaint)}
                  >
                    <Eye size={12}/> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal show={showCreate} onHide={() => { setShowCreate(false); resetForm(); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Plus size={18}/> Create Staff Task from Complaint
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedComplaint && (
            <>
              {/* Original Complaint Info */}
              <div style={{ 
                background: 'var(--surface2)', 
                borderRadius: 8, 
                padding: '0.75rem', 
                marginBottom: '1rem',
                borderLeft: '3px solid var(--gold)'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.3rem' }}>Original Complaint #{selectedComplaint.id}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  From: {selectedComplaint.guest_name} • Room: {selectedComplaint.room_number || 'N/A'}
                </div>
              </div>

              {/* Guest Info (read-only) */}
              <div className="ap-field" style={{ marginBottom: '1rem' }}>
                <label className="ap-label">Guest</label>
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.65rem' }}>
                  <div><strong>{taskForm.guestName}</strong> ({taskForm.guestEmail})</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room: {taskForm.roomNumber || 'Not assigned'}</div>
                </div>
              </div>

              {/* Complaint Type (read-only) */}
              <div className="ap-field" style={{ marginBottom: '1rem' }}>
                <label className="ap-label">Complaint Type</label>
                <div className="ap-input" style={{ background: 'var(--surface2)' }}>
                  {COMPLAINT_TYPES.find(t => t.value === taskForm.complaintType)?.label || taskForm.complaintType}
                </div>
              </div>

              {/* Title */}
              <div className="ap-field" style={{ marginBottom: '1rem' }}>
                <label className="ap-label">Task Title <span className="req">*</span></label>
                <input
                  className="ap-input"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="ap-field" style={{ marginBottom: '1rem' }}>
                <label className="ap-label">Description <span className="req">*</span></label>
                <textarea
                  className="ap-textarea"
                  rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>

              {/* Priority & Assignment */}
              <div className="ap-form-grid" style={{ marginBottom: '1rem' }}>
                <div className="ap-field">
                  <label className="ap-label">Priority</label>
                  <select
                    className="ap-select"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Assign To</label>
                  <select
                    className="ap-select"
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SECURITY">Security</option>
                    <option value="FRONT_DESK">Front Desk</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</button>
          <button
            className="ap-btn-primary"
            disabled={submitting || !taskForm.title || !taskForm.description}
            onClick={createTask}
          >
            {submitting ? <><div className="ap-spin-sm" /> Creating...</> : <><CheckCircle2 size={14}/> Create Task</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* View Complaint Modal */}
      <Modal show={!!viewComplaint} onHide={() => { setViewComplaint(null); }} size="lg" centered className="ap-modal">
        {viewComplaint && (
          <>
            <Modal.Header closeButton>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <Flag size={18}/> Complaint #{viewComplaint.id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  <span className={`tasks-priority-badge priority-${getPriorityInfo(viewComplaint.complaint_type).value.toLowerCase()}`}>
                    {(() => {
                      const Icon = getPriorityInfo(viewComplaint.complaint_type).icon;
                      return <Icon size={10} />;
                    })()}
                    {' '}{getPriorityInfo(viewComplaint.complaint_type).label}
                  </span>
                  <span className="complaint-type-tag">
                    {(() => {
                      const Icon = getComplaintTypeInfo(viewComplaint.complaint_type).Icon;
                      return <Icon size={10} />;
                    })()}
                    {' '}{getComplaintTypeInfo(viewComplaint.complaint_type).label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Created: {formatDateTime(viewComplaint.created_at)}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{viewComplaint.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1rem', lineHeight: 1.5 }}>{viewComplaint.description}</div>

                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Guest:</span> <strong>{viewComplaint.guest_name}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Room:</span> <strong>{viewComplaint.room_number || 'N/A'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> {viewComplaint.guest_email}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ color: getStatusInfo(viewComplaint.status).color }}>{viewComplaint.status}</span></div>
                  </div>
                </div>

                {viewComplaint.response && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: 'var(--green-bg)', 
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--green)'
                  }}>
                    <strong>📝 Staff Response:</strong><br/>
                    {viewComplaint.response}
                  </div>
                )}

                {viewComplaint.timeline && viewComplaint.timeline.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={14}/> Timeline
                    </div>
                    {viewComplaint.timeline.map((item, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.75rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>{formatDateTime(item.created_at)}</div>
                        <div><strong>{item.status}:</strong> {item.note}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button className="ap-btn-ghost" onClick={() => { setViewComplaint(null); }}>Close</button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}