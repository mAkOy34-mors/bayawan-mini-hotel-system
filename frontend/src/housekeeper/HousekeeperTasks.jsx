// housekeeper/HousekeeperTasks.jsx
import { useState, useEffect } from 'react';
import { getMyTasks, updateTaskStatus, getTaskChecklist, updateChecklistItem } from './housekeeperService';
import { Clock, PlayCircle, CheckCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

export function HousekeeperTasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [updating, setUpdating] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getMyTasks(token);
      setTasks(data);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklist = async (taskId) => {
    if (checklist[taskId]) return;
    try {
      const data = await getTaskChecklist(token, taskId);
      setChecklist(prev => ({ ...prev, [taskId]: data }));
    } catch (err) {
      console.error('Error loading checklist:', err);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdating(true);
    try {
      await updateTaskStatus(token, taskId, newStatus);
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleChecklistUpdate = async (itemId, isCompleted) => {
    try {
      await updateChecklistItem(token, itemId, !isCompleted);
      // Update local state
      setChecklist(prev => ({
        ...prev,
        [expandedTask]: prev[expandedTask].map(item =>
          item.id === itemId ? { ...item, isCompleted: !isCompleted } : item
        )
      }));
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const toggleExpand = async (taskId) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      await loadChecklist(taskId);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [token]);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return '#dc2626';
      case 'MEDIUM': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { icon: <Clock size={12} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending' },
      IN_PROGRESS: { icon: <PlayCircle size={12} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'In Progress' },
      COMPLETED: { icon: <CheckCircle size={12} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Completed' },
    };
    return config[status] || config.PENDING;
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Tasks</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Manage your cleaning assignments</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: 99,
                border: '1px solid #e2e8f0',
                background: filter === f ? 'linear-gradient(135deg, #10b981, #34d399)' : '#fff',
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
        <button onClick={loadTasks} style={{ padding: '0.3rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          No tasks found
        </div>
      ) : (
        filteredTasks.map(task => {
          const statusBadge = getStatusBadge(task.status);
          return (
            <div key={task.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: '1rem', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Room {task.room_number}</span>
                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 99, background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), fontWeight: 600 }}>
                      {task.priority || 'MEDIUM'} PRIORITY
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: statusBadge.bg, color: statusBadge.color, fontSize: '0.7rem', fontWeight: 600 }}>
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                    <button
                      onClick={() => toggleExpand(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{task.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.75rem' }}>{task.description}</div>

                {task.notes && (
                  <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageCircle size={12} /> {task.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                      disabled={updating}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <PlayCircle size={14} /> Start Task
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                      disabled={updating}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <CheckCircle size={14} /> Mark Complete
                    </button>
                  )}
                </div>

                {/* Expanded Section - Checklist */}
                {expandedTask === task.id && checklist[task.id] && checklist[task.id].length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#4a5568' }}>Cleaning Checklist</div>
                    {checklist[task.id].map(item => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleChecklistUpdate(item.id, item.isCompleted)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.8rem', textDecoration: item.isCompleted ? 'line-through' : 'none', color: item.isCompleted ? '#8a96a8' : '#1a1f2e' }}>
                          {item.item_name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}