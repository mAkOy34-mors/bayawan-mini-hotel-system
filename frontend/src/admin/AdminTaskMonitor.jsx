// admin/AdminTaskMonitor.jsx - READ-ONLY version for TASKS only
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import { Modal } from 'react-bootstrap';
import {
  ClipboardList, Wrench, AlertTriangle, CheckCircle, 
  Clock, XCircle, Filter, Search, RefreshCw, 
  User, MapPin, Calendar,
  Loader, Activity, CheckCircle2
} from 'lucide-react';

// ONLY TASK TYPES - removed SUPPLY_REQUEST and MAINTENANCE_REQUEST
const TASK_TYPES = {
  ROOM_ISSUE: { label: 'Room Issues', icon: <AlertTriangle size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  CLEANING_TASK: { label: 'Cleaning Tasks', icon: <ClipboardList size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  STAFF_TASK: { label: 'Staff Tasks', icon: <ClipboardList size={14} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const STATUS_CONFIG = {
  PENDING: { icon: <Clock size={12} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending' },
  IN_PROGRESS: { icon: <Activity size={12} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'In Progress' },
  COMPLETED: { icon: <CheckCircle size={12} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Completed' },
  CANCELLED: { icon: <XCircle size={12} />, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Cancelled' },
};

const styles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .task-row {
    transition: all 0.2s ease;
    animation: fadeIn 0.3s ease both;
  }
  .task-row:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .stat-card {
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

export function AdminTaskMonitor({ token }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    roomIssues: 0,
    cleaningTasks: 0,
    staffTasks: 0,
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  });

  const loadAllTasks = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    const allTasks = [];

    try {
      // 1. Load Room Issues (from housekeepers)
      const roomIssuesRes = await fetch(`${API_BASE}/housekeepers/room-issues/`, {
        headers: getHeaders()
      });
      if (roomIssuesRes.ok) {
        const data = await roomIssuesRes.json();
        allTasks.push(...data.map(t => ({ ...t, taskType: 'ROOM_ISSUE' })));
        console.log(`Loaded ${data.length} room issues`);
      }

      // 2. Load Cleaning Tasks (from housekeepers)
      const cleaningRes = await fetch(`${API_BASE}/housekeepers/tasks/`, {
        headers: getHeaders()
      });
      if (cleaningRes.ok) {
        const data = await cleaningRes.json();
        allTasks.push(...data.map(t => ({ ...t, taskType: 'CLEANING_TASK' })));
        console.log(`Loaded ${data.length} cleaning tasks`);
      }

      // 3. Load Staff Tasks (from staff app)
      const staffTasksRes = await fetch(`${API_BASE}/staff/all-tasks/`, {
        headers: getHeaders()
      });
      if (staffTasksRes.ok) {
        const data = await staffTasksRes.json();
        allTasks.push(...data.map(t => ({ ...t, taskType: 'STAFF_TASK' })));
        console.log(`Loaded ${data.length} staff tasks`);
      }

      // Sort by created_at descending
      allTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTasks(allTasks);

      // Calculate stats
      setStats({
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'PENDING').length,
        inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: allTasks.filter(t => t.status === 'COMPLETED').length,
        roomIssues: allTasks.filter(t => t.taskType === 'ROOM_ISSUE').length,
        cleaningTasks: allTasks.filter(t => t.taskType === 'CLEANING_TASK').length,
        staffTasks: allTasks.filter(t => t.taskType === 'STAFF_TASK').length,
      });

    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllTasks();
    }
  }, [token]);

  useEffect(() => {
    let filtered = tasks;
    
    if (search) {
      filtered = filtered.filter(t => 
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.room_number?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.taskType === typeFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
  }, [search, typeFilter, statusFilter, tasks]);

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const getTaskIcon = (taskType) => {
    return TASK_TYPES[taskType]?.icon || <ClipboardList size={14} />;
  };

  const getTaskTypeLabel = (taskType) => {
    return TASK_TYPES[taskType]?.label || taskType;
  };

  const getTaskTypeColor = (taskType) => {
    return TASK_TYPES[taskType]?.color || '#6b7280';
  };

  const getTaskTypeBg = (taskType) => {
    return TASK_TYPES[taskType]?.bg || 'rgba(107,114,128,0.1)';
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTaskTitle = (task) => {
    if (task.title) return task.title;
    if (task.description) return task.description.substring(0, 50);
    return 'Untitled Task';
  };

  const getTaskDescription = (task) => {
    if (task.description) return task.description;
    return 'No description provided';
  };

  const getRoomNumber = (task) => {
    return task.room_number || task.room?.room_number || 'N/A';
  };

  const getRequestedBy = (task) => {
    if (task.reported_by_name) return task.reported_by_name;
    if (task.assigned_to_name) return task.assigned_to_name;
    if (task.assigned_by_name) return task.assigned_by_name;
    return 'Unknown';
  };

  const LoadingSpinner = ({ size = 20 }) => (
    <div style={{
      width: size,
      height: size,
      border: `2px solid #C9A84C20`,
      borderTopColor: '#C9A84C',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite'
    }} />
  );

  // Priority badge helper
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
      <style>{styles}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={24} style={{ color: '#C9A84C' }} />
            Task Monitor
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>
            Monitor room issues, cleaning tasks, and staff assignments
          </p>
        </div>
        <button 
          onClick={() => loadAllTasks(true)} 
          disabled={refreshing}
          style={{ 
            padding: '0.5rem 1rem', 
            border: '1px solid #e2e8f0', 
            borderRadius: 8, 
            background: '#fff', 
            cursor: refreshing ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.3rem',
            opacity: refreshing ? 0.7 : 1
          }}
        >
          {refreshing ? <LoadingSpinner size={14} /> : <RefreshCw size={14} />}
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards - Only for TASK types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: stats.total, color: '#C9A84C', bg: 'rgba(201,168,76,0.1)', icon: <ClipboardList size={16} /> },
          { label: 'Pending', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={16} /> },
          { label: 'In Progress', value: stats.inProgress, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Activity size={16} /> },
          { label: 'Completed', value: stats.completed, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={16} /> },
          { label: 'Room Issues', value: stats.roomIssues, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle size={16} /> },
          { label: 'Cleaning', value: stats.cleaningTasks, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <ClipboardList size={16} /> },
          { label: 'Staff Tasks', value: stats.staffTasks, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <ClipboardList size={16} /> },
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.6rem', textAlign: 'center' }}
            onClick={() => {
              if (stat.label === 'Room Issues') setTypeFilter('ROOM_ISSUE');
              else if (stat.label === 'Cleaning') setTypeFilter('CLEANING_TASK');
              else if (stat.label === 'Staff Tasks') setTypeFilter('STAFF_TASK');
              else setTypeFilter('all');
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, margin: '0 auto 0.25rem' }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1f2e' }}>{loading ? '—' : stat.value}</div>
            <div style={{ fontSize: '0.55rem', color: '#8a96a8' }}>{stat.label}</div>
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
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}
          >
            <option value="all">All Types</option>
            {Object.entries(TASK_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
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
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSearch('');
            setTypeFilter('all');
            setStatusFilter('all');
          }}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <Filter size={14} /> Clear Filters
        </button>
      </div>

      {/* Tasks List - READ ONLY (No actions) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <LoadingSpinner size={40} />
          <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          <CheckCircle size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No tasks found</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>All tasks are up to date</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((task, idx) => {
            const statusConfig = getStatusConfig(task.status);
            const typeColor = getTaskTypeColor(task.taskType);
            const typeBg = getTaskTypeBg(task.taskType);
            const priorityConfig = task.priority ? getPriorityConfig(task.priority) : null;
            
            return (
              <div key={`${task.taskType}-${task.id}`} className="task-row" style={{ 
                background: '#fff', 
                border: `1px solid ${typeColor}30`, 
                borderRadius: 12, 
                overflow: 'hidden',
                cursor: 'pointer',
                animationDelay: `${idx * 0.03}s`
              }} onClick={() => openTaskDetail(task)}>
                <div style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: typeBg, 
                        color: typeColor, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        {getTaskIcon(task.taskType)} {getTaskTypeLabel(task.taskType)}
                      </span>
                      {priorityConfig && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.3rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: 99, 
                          background: priorityConfig.bg, 
                          color: priorityConfig.color, 
                          fontSize: '0.6rem', 
                          fontWeight: 600 
                        }}>
                          {priorityConfig.label} Priority
                        </span>
                      )}
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: statusConfig.bg, 
                        color: statusConfig.color, 
                        fontSize: '0.65rem', 
                        fontWeight: 600 
                      }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#1a1f2e' }}>
                    {getTaskTitle(task)}
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {getTaskDescription(task).substring(0, 100)}{getTaskDescription(task).length > 100 ? '...' : ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#8a96a8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MapPin size={11} /> Room {getRoomNumber(task)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <User size={11} /> {getRequestedBy(task)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={11} /> {formatDate(task.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal - READ ONLY (No action buttons) */}
      <Modal show={showDetail} onHide={() => { setShowDetail(false); setSelectedTask(null); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedTask && getTaskIcon(selectedTask.taskType)}
            Task Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {selectedTask && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, background: '#f8f9fb', borderRadius: 10, padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {getStatusConfig(selectedTask.status).icon}
                    <span style={{ fontWeight: 600, color: getStatusConfig(selectedTask.status).color }}>
                      {getStatusConfig(selectedTask.status).label}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, background: '#f8f9fb', borderRadius: 10, padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Type</div>
                  <div style={{ fontWeight: 600, color: getTaskTypeColor(selectedTask.taskType) }}>
                    {getTaskTypeLabel(selectedTask.taskType)}
                  </div>
                </div>
                {selectedTask.priority && (
                  <div style={{ flex: 1, background: '#f8f9fb', borderRadius: 10, padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Priority</div>
                    <div style={{ fontWeight: 600, color: getPriorityConfig(selectedTask.priority).color }}>
                      {getPriorityConfig(selectedTask.priority).label}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Title</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1f2e' }}>{getTaskTitle(selectedTask)}</div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Description</div>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.5, background: '#f8f9fb', padding: '0.75rem', borderRadius: 8 }}>
                  {getTaskDescription(selectedTask)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Room Number</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getRoomNumber(selectedTask)}</div>
                </div>
                <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Assigned To</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getRequestedBy(selectedTask)}</div>
                </div>
                <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Created At</div>
                  <div style={{ fontSize: '0.8rem' }}>{formatDate(selectedTask.created_at)}</div>
                </div>
                <div style={{ background: '#f8f9fb', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Last Updated</div>
                  <div style={{ fontSize: '0.8rem' }}>{formatDate(selectedTask.updated_at || selectedTask.created_at)}</div>
                </div>
              </div>

              {selectedTask.completed_at && (
                <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '0.75rem', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#10b981', marginBottom: '0.2rem' }}>Completed At</div>
                  <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>{formatDate(selectedTask.completed_at)}</div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}