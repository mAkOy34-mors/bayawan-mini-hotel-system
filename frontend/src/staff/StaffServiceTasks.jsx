// staff/StaffServiceTasks.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { 
  Clock, PlayCircle, CheckCircle, Wrench, Sparkles, Shirt, Package, 
  RefreshCw, AlertCircle, User, Hotel, Mail, Bed, Bath, Coffee, Tv
} from 'lucide-react';

const css = `
  .sst-root {
    min-height: 100vh;
    background: #f4f6f8;
    font-family: 'DM Sans', sans-serif;
    color: #1a1f2e;
    padding: 1.5rem;
  }
  .sst-header {
    margin-bottom: 1.5rem;
  }
  .sst-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1f2e;
    margin: 0;
  }
  .sst-sub {
    font-size: 0.8rem;
    color: #8a96a8;
    margin-top: 0.2rem;
  }
  .sst-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .sst-stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
  }
  .sst-stat-value {
    font-size: 1.8rem;
    font-weight: 700;
  }
  .sst-stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: #8a96a8;
    font-weight: 600;
  }
  .sst-task-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1rem;
    padding: 1rem;
    transition: all 0.2s;
  }
  .sst-task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .sst-priority-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
  }
  .priority-urgent { background: rgba(239,68,68,0.1); color: #ef4444; }
  .priority-high { background: rgba(239,68,68,0.1); color: #ef4444; }
  .priority-medium { background: rgba(245,158,11,0.1); color: #f59e0b; }
  .priority-low { background: rgba(16,185,129,0.1); color: #10b981; }
  .status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .status-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
  .status-progress { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .status-completed { background: rgba(16,185,129,0.1); color: #10b981; }
  .filter-btn {
    padding: 0.3rem 0.8rem;
    border-radius: 99px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s;
  }
  .filter-btn.active {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    border-color: #C9A84C;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .sst-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top-color: #C9A84C;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin: 0 auto;
  }
`;

const SERVICE_ICONS = {
  'CLEANING': <Sparkles size={20} />,
  'MAINTENANCE': <Wrench size={20} />,
  'LAUNDRY': <Shirt size={20} />,
  'DELIVERY': <Package size={20} />,
  'EXTRA_PILLOWS': <Bed size={20} />,
  'EXTRA_TOWELS': <Bath size={20} />,
  'MINI_BAR': <Coffee size={20} />,
  'TECH_SUPPORT': <Tv size={20} />,
};

const SERVICE_LABELS = {
  'CLEANING': 'Cleaning',
  'MAINTENANCE': 'Maintenance',
  'LAUNDRY': 'Laundry',
  'DELIVERY': 'Delivery',
  'EXTRA_PILLOWS': 'Extra Pillows',
  'EXTRA_TOWELS': 'Extra Towels',
  'MINI_BAR': 'Mini Bar',
  'TECH_SUPPORT': 'Tech Support',
  'OTHER': 'Other',
};

export function StaffServiceTasks({ token, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/services/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/services/tasks/${taskId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const stats = {
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
  };

  const staffRole = user?.role || 'STAFF';
  const roleDisplay = staffRole === 'HOUSEKEEPER' ? 'Housekeeping' : 
                      staffRole === 'MAINTENANCE' ? 'Maintenance' :
                      staffRole === 'SECURITY' ? 'Security' :
                      staffRole === 'FRONT_DESK' ? 'Front Desk' : 'Staff';

  return (
    <div className="sst-root">
      <style>{css}</style>

      <div className="sst-header">
        <h1 className="sst-title">My Service Tasks</h1>
        <p className="sst-sub">{roleDisplay} tasks assigned by reception</p>
      </div>

      {/* Stats */}
      <div className="sst-stats">
        <div className="sst-stat-card">
          <div className="sst-stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</div>
          <div className="sst-stat-label">Pending</div>
        </div>
        <div className="sst-stat-card">
          <div className="sst-stat-value" style={{ color: '#3b82f6' }}>{stats.inProgress}</div>
          <div className="sst-stat-label">In Progress</div>
        </div>
        <div className="sst-stat-card">
          <div className="sst-stat-value" style={{ color: '#10b981' }}>{stats.completed}</div>
          <div className="sst-stat-label">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'PENDING', 'IN_PROGRESS'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Tasks' : f === 'PENDING' ? 'Pending' : 'In Progress'}
          </button>
        ))}
        <button onClick={loadTasks} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8a96a8' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="sst-spinner" />
          <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <div style={{ fontWeight: 600 }}>No tasks assigned</div>
          <div style={{ fontSize: '0.75rem', color: '#8a96a8', marginTop: '0.25rem' }}>
            You're all caught up!
          </div>
        </div>
      ) : (
        filteredTasks.map(task => (
          <div key={task.id} className="sst-task-card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {SERVICE_ICONS[task.service_type] || <Sparkles size={20} />}
                <span style={{ fontWeight: 700 }}>{SERVICE_LABELS[task.service_type] || task.service_type}</span>
                <span className={`sst-priority-badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                  {task.priority_label || task.priority || 'MEDIUM'}
                </span>
              </div>
              <span className={`status-badge status-${task.status?.toLowerCase() === 'in_progress' ? 'progress' : task.status?.toLowerCase()}`}>
                {task.status === 'PENDING' && <Clock size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />}
                {task.status === 'IN_PROGRESS' && <AlertCircle size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />}
                {task.status === 'COMPLETED' && <CheckCircle size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />}
                {task.status_label || task.status}
              </span>
            </div>

            {/* Guest Info */}
            <div style={{ 
              background: '#f8f9fb', 
              padding: '0.65rem', 
              borderRadius: 8, 
              marginBottom: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span><User size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> {task.guest_name}</span>
                <span><Hotel size={12} style={{ display: 'inline', marginRight: '0.2rem' }} /> Room {task.room_number}</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#4a5568', 
                marginBottom: '0.75rem',
                padding: '0.5rem',
                background: '#fff',
                borderRadius: 6,
                border: '1px solid #e2e8f0'
              }}>
                {task.description}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {task.status === 'PENDING' && (
                <button
                  onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                  disabled={updating}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <PlayCircle size={14} /> Start Task
                </button>
              )}
              {task.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => updateStatus(task.id, 'COMPLETED')}
                  disabled={updating}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <CheckCircle size={14} /> Mark Complete
                </button>
              )}
              {task.status === 'COMPLETED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.75rem' }}>
                  <CheckCircle size={14} /> Completed
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}