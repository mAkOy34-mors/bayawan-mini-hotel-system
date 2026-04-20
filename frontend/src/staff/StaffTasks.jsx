// staff/StaffTasks.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { Clock, PlayCircle, CheckCircle, Wrench, Package, Users, Heart, MessageCircle, RefreshCw, AlertTriangle, Sparkles, Lock } from 'lucide-react';

export function StaffTasks({ token, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks from API:', data); // Debug log
        setTasks(data);
      } else {
        console.error('Failed to load tasks:', response.status);
        setTasks([]);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status, note = '') => {
    try {
      const response = await fetch(`${API_BASE}/staff/tasks/${taskId}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });
      
      if (response.ok) {
        loadTasks();
      } else {
        const error = await response.json();
        console.error('Failed to update task:', error);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return <Wrench size={16} />;
      case 'CLEANING': return <Sparkles size={16} />;
      case 'HOUSEKEEPING': return <Sparkles size={16} />;
      case 'SECURITY': return <Lock size={16} />;
      case 'ASSISTANCE': return <Users size={16} />;
      case 'EMERGENCY': return <Heart size={16} />;
      default: return <Wrench size={16} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return '#f59e0b';
      case 'CLEANING': return '#10b981';
      case 'HOUSEKEEPING': return '#10b981';
      case 'SECURITY': return '#3b82f6';
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'IN_PROGRESS': return <PlayCircle size={14} />;
      case 'COMPLETED': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#2d9b6f';
      default: return '#8a96a8';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Tasks</h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>
            Tasks assigned to you
          </p>
        </div>
        <button onClick={loadTasks} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>PENDING</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{tasks.filter(t => t.status === 'PENDING').length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>COMPLETED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2d9b6f' }}>{tasks.filter(t => t.status === 'COMPLETED').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: 99,
              border: '1px solid #e2e8f0',
              background: filter === f ? 'linear-gradient(135deg, #9a7a2e, #C9A84C)' : '#fff',
              color: filter === f ? '#fff' : '#4a5568',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {f === 'all' ? 'All Tasks' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
          Loading tasks...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No tasks assigned</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tasks will appear here when assigned</div>
        </div>
      ) : (
        filteredTasks.map(task => (
          <div key={task.id} style={{ background: '#fff', border: `1px solid ${getTypeColor(task.task_type)}20`, borderRadius: 14, marginBottom: '1rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ padding: '0.25rem 0.6rem', borderRadius: 99, background: `${getTypeColor(task.task_type)}15`, color: getTypeColor(task.task_type) }}>
                    {getTypeIcon(task.task_type)}
                    <span style={{ marginLeft: '0.3rem', fontSize: '0.7rem', fontWeight: 600 }}>{task.task_type}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), fontWeight: 600 }}>
                    {task.priority || 'MEDIUM'} PRIORITY
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: `${getStatusColor(task.status)}15`, color: getStatusColor(task.status) }}>
                  {getStatusIcon(task.status)}
                  {getStatusLabel(task.status)}
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                {task.room_number && <span style={{ color: '#C9A84C' }}>Room {task.room_number}</span>}
                {task.room_number && ' - '}
                {task.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.75rem' }}>{task.description}</div>

              {task.note && (
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MessageCircle size={12} /> {task.note}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {task.status === 'PENDING' && (
                  <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS', 'Task started by staff')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlayCircle size={14} /> Start Task
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => {
                    const note = prompt('Add completion notes (optional):');
                    updateTaskStatus(task.id, 'COMPLETED', note || 'Task completed');
                  }} style={{ background: '#2d9b6f', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={14} /> Mark Complete
                  </button>
                )}
                {task.status === 'COMPLETED' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2d9b6f', fontSize: '0.75rem' }}>
                    <CheckCircle size={14} /> Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}