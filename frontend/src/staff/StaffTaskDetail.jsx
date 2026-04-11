// frontend/src/staff/StaffTaskDetail.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import {
  ArrowLeft, Clock, PlayCircle, CheckCircle, 
  Wrench, Package, Users, Heart, MessageCircle,
  Calendar, User, MapPin, AlertTriangle,
  Edit2, Check, X, RefreshCw
} from 'lucide-react';

export function StaffTaskDetail({ token, taskId, onBack }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadTask = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        setNote(data.note || '');
      }
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const updateTaskStatus = async (status, additionalNote = '') => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status, 
          note: additionalNote || note 
        })
      });
      if (response.ok) {
        loadTask();
        loadHistory();
        setShowNoteInput(false);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdating(false);
    }
  };

  const updateNote = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: task.status,
          note: note 
        })
      });
      if (response.ok) {
        loadTask();
        setShowNoteInput(false);
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadTask();
      loadHistory();
    }
  }, [taskId]);

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return <Wrench size={20} />;
      case 'DELIVERY': return <Package size={20} />;
      case 'ASSISTANCE': return <Users size={20} />;
      case 'EMERGENCY': return <Heart size={20} />;
      default: return <Wrench size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return '#f59e0b';
      case 'DELIVERY': return '#3b82f6';
      case 'ASSISTANCE': return '#8b5cf6';
      case 'EMERGENCY': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      default: return '#2d9b6f';
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'PENDING': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={14} />, label: 'Pending' },
      'IN_PROGRESS': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <PlayCircle size={14} />, label: 'In Progress' },
      'COMPLETED': { color: '#2d9b6f', bg: 'rgba(45,155,111,0.1)', icon: <CheckCircle size={14} />, label: 'Completed' },
      'CANCELLED': { color: '#dc2626', bg: 'rgba(220,53,69,0.1)', icon: <X size={14} />, label: 'Cancelled' }
    };
    return config[status] || config['PENDING'];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'IN_PROGRESS': return <PlayCircle size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
          <div style={{ color: '#8a96a8' }}>Loading task details...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertTriangle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <h2>Task Not Found</h2>
        <p>The task you're looking for doesn't exist or has been removed.</p>
        <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Back to Tasks
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(task.status);

  return (
    <div>
      {/* Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Task Details</h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>View and update task information</p>
        </div>
        <button onClick={loadTask} style={{ marginLeft: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Main Task Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: '1rem' }}>
        {/* Task Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 99, background: `${getTypeColor(task.task_type)}15`, color: getTypeColor(task.task_type) }}>
              {getTypeIcon(task.task_type)}
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{task.task_type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 99, background: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.icon}
              <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{statusBadge.label}</span>
            </div>
            <div style={{ padding: '0.25rem 0.75rem', borderRadius: 99, background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), fontWeight: 600, fontSize: '0.7rem' }}>
              {task.priority || 'MEDIUM'} PRIORITY
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1a1f2e' }}>{task.title}</h2>
          <p style={{ fontSize: '0.9rem', color: '#4a5568', marginTop: '0.5rem' }}>{task.description}</p>
        </div>

        {/* Task Details */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} /> Location
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Room {task.room_number || 'Not specified'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> Created
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{new Date(task.created_at).toLocaleString()}</div>
            </div>
            {task.started_at && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <PlayCircle size={12} /> Started
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{new Date(task.started_at).toLocaleString()}</div>
              </div>
            )}
            {task.completed_at && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={12} /> Completed
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{new Date(task.completed_at).toLocaleString()}</div>
              </div>
            )}
            {task.assigned_to_name && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={12} /> Assigned To
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.assigned_to_name}</div>
              </div>
            )}
            {task.assigned_by_name && (
              <div>
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={12} /> Created By
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.assigned_by_name}</div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4a5568', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageCircle size={14} /> Notes
              </div>
              {!showNoteInput && (
                <button onClick={() => setShowNoteInput(true)} style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
            
            {showNoteInput ? (
              <div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add notes about this task..."
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={updateNote} disabled={updating} style={{ background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Check size={12} /> Save
                  </button>
                  <button onClick={() => { setShowNoteInput(false); setNote(task.note || ''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '0.75rem', fontSize: '0.85rem', color: task.note ? '#4a5568' : '#8a96a8', fontStyle: task.note ? 'normal' : 'italic' }}>
                {task.note || 'No notes added yet'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {task.status === 'PENDING' && (
              <button
                onClick={() => updateTaskStatus('IN_PROGRESS')}
                disabled={updating}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlayCircle size={16} /> Start Task
              </button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <button
                onClick={() => {
                  const completionNote = prompt('Add completion notes (optional):');
                  updateTaskStatus('COMPLETED', completionNote || '');
                }}
                disabled={updating}
                style={{ background: '#2d9b6f', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CheckCircle size={16} /> Mark Complete
              </button>
            )}
            {task.status === 'COMPLETED' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d9b6f' }}>
                <CheckCircle size={20} />
                <span style={{ fontWeight: 600 }}>Task Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div 
          onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} />
            <span style={{ fontWeight: 600 }}>Task History</span>
            <span style={{ fontSize: '0.7rem', color: '#8a96a8' }}>({history.length} records)</span>
          </div>
          <span>{showHistory ? '▲' : '▼'}</span>
        </div>
        
        {showHistory && (
          <div style={{ padding: '1rem' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#8a96a8' }}>No history records found</div>
            ) : (
              history.map((record, index) => (
                <div key={index} style={{ padding: '0.75rem', borderBottom: index < history.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: record.previous_status !== record.new_status ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getStatusIcon(record.new_status)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Status changed</span>
                      <span style={{ margin: '0 0.25rem' }}>from</span>
                      <span style={{ padding: '0.1rem 0.4rem', borderRadius: 4, background: '#f1f5f9', fontSize: '0.7rem' }}>{record.previous_status || 'Created'}</span>
                      <span style={{ margin: '0 0.25rem' }}>to</span>
                      <span style={{ padding: '0.1rem 0.4rem', borderRadius: 4, background: '#f1f5f9', fontSize: '0.7rem' }}>{record.new_status}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginTop: '0.2rem' }}>
                      By {record.changed_by_name || 'System'} • {new Date(record.changed_at).toLocaleString()}
                    </div>
                    {record.note && (
                      <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.3rem', padding: '0.3rem 0.5rem', background: '#f8f9fb', borderRadius: 6 }}>
                        <MessageCircle size={10} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        {record.note}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}