// staff/StaffDashboard.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { useEmergency } from '../context/EmergencyContext';
import { Clock, PlayCircle, CheckCircle, AlertTriangle, Wrench, Package, Users, Heart } from 'lucide-react';

export function StaffDashboard({ user, token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeEmergencies } = useEmergency();

  const loadTasks = async () => {
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

  useEffect(() => {
    loadTasks();
  }, [token]);

  const stats = {
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'MAINTENANCE': return <Wrench size={14} />;
      case 'DELIVERY': return <Package size={14} />;
      case 'ASSISTANCE': return <Users size={14} />;
      case 'EMERGENCY': return <Heart size={14} />;
      default: return <Wrench size={14} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      default: return '#2d9b6f';
    }
  };

  return (
    <div>
      {/* Emergency Alert Banner */}
      {activeEmergencies.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          <span><strong>🚨 EMERGENCY!</strong> {activeEmergencies.length} active emergency(s)</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>PENDING</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.pending}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <PlayCircle size={18} color="#3b82f6" />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>IN PROGRESS</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.inProgress}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={18} color="#2d9b6f" />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>COMPLETED</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.completed}</div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, margin: 0 }}>Recent Tasks</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8a96a8' }}>No tasks assigned</div>
        ) : (
          tasks.slice(0, 5).map(task => (
            <div key={task.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getTypeIcon(task.type)}
                  <span style={{ fontWeight: 600 }}>{task.type}</span>
                  <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 99, background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}>
                    {task.priority || 'MEDIUM'}
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 99, background: task.status === 'COMPLETED' ? 'rgba(45,155,111,0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: task.status === 'COMPLETED' ? '#2d9b6f' : task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b' }}>
                  {task.status?.replace('_', ' ') || 'PENDING'}
                </span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Room {task.roomNumber} - {task.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>{task.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}