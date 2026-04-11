// staff/StaffTasks.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { Clock, PlayCircle, CheckCircle, Wrench, Package, Users, Heart, MessageCircle, RefreshCw } from 'lucide-react';

export function StaffTasks({ token }) {
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
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
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
      case 'DELIVERY': return <Package size={16} />;
      case 'ASSISTANCE': return <Users size={16} />;
      case 'EMERGENCY': return <Heart size={16} />;
      default: return <Wrench size={16} />;
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Tasks</h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Manage and update your assigned tasks</p>
        </div>
        <button onClick={loadTasks} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
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
            {f === 'all' ? 'All Tasks' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          No tasks found
        </div>
      ) : (
        filteredTasks.map(task => (
          <div key={task.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: '1rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getTypeIcon(task.type)}
                  <span style={{ fontWeight: 700 }}>{task.type}</span>
                  <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), fontWeight: 600 }}>
                    {task.priority || 'MEDIUM'} PRIORITY
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: task.status === 'COMPLETED' ? 'rgba(45,155,111,0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: task.status === 'COMPLETED' ? '#2d9b6f' : task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b' }}>
                  {getStatusIcon(task.status)}
                  {task.status?.replace('_', ' ') || 'PENDING'}
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Room {task.roomNumber} - {task.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.75rem' }}>{task.description}</div>

              {task.note && (
                <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MessageCircle size={12} /> {task.note}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {task.status === 'PENDING' && (
                  <button onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlayCircle size={14} /> Start Task
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => {
                    const note = prompt('Add completion notes (optional):');
                    updateTaskStatus(task.id, 'COMPLETED', note || '');
                  }} style={{ background: '#2d9b6f', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={14} /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // In StaffTasks.jsx, add state for selected task
const [selectedTaskId, setSelectedTaskId] = useState(null);

// When a task is clicked, show the detail view
const handleTaskClick = (taskId) => {
  setSelectedTaskId(taskId);
};

// If a task is selected, show the detail view instead of the list
if (selectedTaskId) {
  return (
    <StaffTaskDetail 
      token={token} 
      taskId={selectedTaskId} 
      onBack={() => setSelectedTaskId(null)} 
    />
  );
}
}

