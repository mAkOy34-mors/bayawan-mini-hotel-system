// housekeeper/HousekeeperTasks.jsx
import { useState, useEffect } from 'react';
import { 
  getMyTasks,           // Housekeeper cleaning tasks
  updateTaskStatus, 
  getTaskChecklist, 
  updateChecklistItem,
  getMyStats,
  getStaffTasks,        // Staff tasks
  updateStaffTaskStatus,
  getStaffStats,
  getMyServiceRequests, // ← NEW: Service requests
  updateServiceRequestStatus // ← NEW: Update service request status
} from './housekeeperService';
import { 
  Clock, PlayCircle, CheckCircle, AlertTriangle, RefreshCw, 
  ChevronDown, ChevronUp, MessageCircle, Sparkles, Wrench, 
  Package, Users, Heart, BedDouble, Calendar, TrendingUp,
  Briefcase, Hotel, Coffee, Tv, Shirt, Bath, ClipboardList,XCircle
} from 'lucide-react';

export function HousekeeperTasks({ token }) {
  const [housekeeperTasks, setHousekeeperTasks] = useState([]);
  const [staffTasks, setStaffTasks] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [updating, setUpdating] = useState(false);
  const [taskSource, setTaskSource] = useState('all'); // 'all', 'housekeeper', 'staff', 'service'
  const [stats, setStats] = useState({ 
    pending: 0, 
    in_progress: 0, 
    completed: 0,
    total: 0,
    housekeeperCount: 0,
    staffCount: 0,
    serviceCount: 0
  });

  // Fetch from all endpoints
  const loadTasks = async () => {
    setLoading(true);
    try {
      // Fetch from Housekeeper endpoint (cleaning tasks)
      const housekeeperData = await getMyTasks(token);
      const housekeeperList = Array.isArray(housekeeperData) ? housekeeperData : (housekeeperData.tasks || []);
      setHousekeeperTasks(housekeeperList.map(task => ({ ...task, source: 'housekeeper' })));
      
      // Fetch from Staff endpoint (tasks assigned to this housekeeper)
      const staffData = await getStaffTasks(token);
      const staffList = Array.isArray(staffData) ? staffData : (staffData.tasks || []);
      setStaffTasks(staffList.map(task => ({ ...task, source: 'staff' })));
      
      // ← NEW: Fetch service requests assigned to this housekeeper
      const serviceData = await getMyServiceRequests(token);
      setServiceRequests(serviceData.map(req => ({ ...req, source: 'service' })));
      
      // Combine all lists
      const allItems = [
        ...housekeeperList.map(task => ({ ...task, source: 'housekeeper' })),
        ...staffList.map(task => ({ ...task, source: 'staff' })),
        ...serviceData.map(req => ({ ...req, source: 'service' }))
      ];
      
      // Remove duplicates by ID (if any)
      const uniqueMap = new Map();
      allItems.forEach(item => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });
      const combined = Array.from(uniqueMap.values());
      setAllTasks(combined);
      
      console.log('Housekeeper tasks:', housekeeperList.length);
      console.log('Staff tasks:', staffList.length);
      console.log('Service requests:', serviceData.length);
      console.log('Combined tasks:', combined.length);
      
      // Calculate stats
      setStats({
        pending: combined.filter(t => t.status === 'PENDING').length,
        in_progress: combined.filter(t => t.status === 'IN_PROGRESS').length,
        completed: combined.filter(t => t.status === 'COMPLETED').length,
        total: combined.length,
        housekeeperCount: housekeeperList.length,
        staffCount: staffList.length,
        serviceCount: serviceData.length
      });
      
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
      setChecklist(prev => ({ ...prev, [taskId]: [] }));
    }
  };

  const handleUpdateStatus = async (task, newStatus) => {
    setUpdating(true);
    try {
      // Use the appropriate update function based on task source
      if (task.source === 'staff') {
        await updateStaffTaskStatus(token, task.id, newStatus);
      } else if (task.source === 'service') {
        await updateServiceRequestStatus(token, task.id, newStatus);
      } else {
        await updateTaskStatus(token, task.id, newStatus);
      }
      await loadTasks(); // Reload all tasks
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChecklistUpdate = async (itemId, isCompleted) => {
    try {
      await updateChecklistItem(token, itemId, !isCompleted);
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
    if (token) {
      loadTasks();
    }
  }, [token]);

  // Filter tasks based on selected source and status
  let displayedTasks = [];
  if (taskSource === 'housekeeper') {
    displayedTasks = housekeeperTasks;
  } else if (taskSource === 'staff') {
    displayedTasks = staffTasks;
  } else if (taskSource === 'service') {
    displayedTasks = serviceRequests;
  } else {
    displayedTasks = allTasks;
  }
  
  const filteredTasks = filter === 'all' 
    ? displayedTasks 
    : displayedTasks.filter(t => t.status === filter);

  const getTaskIcon = (taskType, source) => {
    // For service requests, show appropriate icon based on service type
    if (source === 'service') {
      switch (taskType?.toUpperCase()) {
        case 'CLEANING': return <Sparkles size={14} />;
        case 'MAINTENANCE': return <Wrench size={14} />;
        case 'LAUNDRY': return <Shirt size={14} />;
        case 'DELIVERY': return <Package size={14} />;
        case 'EXTRA_PILLOWS': return <BedDouble size={14} />;
        case 'EXTRA_TOWELS': return <Bath size={14} />;
        case 'MINI_BAR': return <Coffee size={14} />;
        case 'TECH_SUPPORT': return <Tv size={14} />;
        default: return <ClipboardList size={14} />;
      }
    }
    
    switch (taskType?.toUpperCase()) {
      case 'CLEANING':
      case 'HOUSEKEEPING':
        return <Sparkles size={14} />;
      case 'MAINTENANCE':
        return <Wrench size={14} />;
      case 'DELIVERY':
        return <Package size={14} />;
      case 'ASSISTANCE':
        return <Users size={14} />;
      case 'EMERGENCY':
        return <Heart size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return '#dc2626';
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
      CANCELLED: { icon: <XCircle size={12} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Cancelled' },
    };
    return config[status] || config.PENDING;
  };

  const getSourceBadge = (source) => {
    if (source === 'staff') {
      return { 
        icon: <Briefcase size={10} />, 
        label: 'Staff Task', 
        color: '#3b82f6', 
        bg: 'rgba(59, 130, 246, 0.1)' 
      };
    }
    if (source === 'service') {
      return { 
        icon: <ClipboardList size={10} />, 
        label: 'Service Request', 
        color: '#8b5cf6', 
        bg: 'rgba(139, 92, 246, 0.1)' 
      };
    }
    return { 
      icon: <Hotel size={10} />, 
      label: 'Housekeeping', 
      color: '#10b981', 
      bg: 'rgba(16, 185, 129, 0.1)' 
    };
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
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
    return labels[serviceType] || serviceType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          <Sparkles size={22} style={{ display: 'inline', marginRight: '0.5rem', color: '#10b981' }} />
          My Tasks
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>
          Tasks from Housekeeping, Staff, and Service Requests
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '1rem', 
        marginBottom: '1.5rem'
      }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>TOTAL TASKS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#C9A84C' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>PENDING</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#3b82f6' }}>{stats.in_progress}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>COMPLETED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>{stats.completed}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>HOUSEKEEPING</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{stats.housekeeperCount}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#8a96a8', marginBottom: '0.2rem' }}>SERVICES</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b5cf6' }}>{stats.serviceCount}</div>
        </div>
      </div>

      {/* Source Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#8a96a8', fontWeight: 600 }}>Source:</span>
        {[
          { key: 'all', label: 'All Tasks', icon: null },
          { key: 'housekeeper', label: 'Housekeeping', icon: <Hotel size={12} /> },
          { key: 'staff', label: 'Staff Tasks', icon: <Briefcase size={12} /> },
          { key: 'service', label: 'Service Requests', icon: <ClipboardList size={12} /> }
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setTaskSource(s.key)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: 99,
              border: '1px solid #e2e8f0',
              background: taskSource === s.key ? 'linear-gradient(135deg, #C9A84C, #9a7a2e)' : '#fff',
              color: taskSource === s.key ? '#fff' : '#4a5568',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Status Filters */}
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
              {f === 'all' ? 'All Status' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button onClick={loadTasks} style={{ padding: '0.3rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading tasks...</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#8a96a8' }}>
          <Sparkles size={48} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No tasks assigned</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tasks will appear here when assigned</div>
        </div>
      ) : (
        filteredTasks.map(task => {
          const statusBadge = getStatusBadge(task.status);
          const sourceBadge = getSourceBadge(task.source);
          const isCompleted = task.status === 'COMPLETED';
          const isService = task.source === 'service';
          
          return (
            <div key={`${task.source}-${task.id}`} style={{ 
              background: '#fff', 
              border: `1px solid ${isCompleted ? '#10b981' : '#e2e8f0'}`, 
              borderRadius: 14, 
              marginBottom: '1rem', 
              overflow: 'hidden',
              opacity: isCompleted ? 0.85 : 1
            }}>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isService ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isService ? '#8b5cf6' : '#10b981'
                    }}>
                      {getTaskIcon(task.task_type || task.service_type, task.source)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          Room {task.room_number || task.room?.room_number || 'N/A'}
                        </span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.3rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: 99, 
                          background: sourceBadge.bg, 
                          color: sourceBadge.color, 
                          fontSize: '0.6rem', 
                          fontWeight: 600 
                        }}>
                          {sourceBadge.icon} {sourceBadge.label}
                        </span>
                      </div>
                      {task.priority && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: 99, 
                          background: `${getPriorityColor(task.priority)}20`, 
                          color: getPriorityColor(task.priority), 
                          fontWeight: 600, 
                          display: 'inline-block',
                          marginTop: '0.25rem'
                        }}>
                          {task.priority} PRIORITY
                        </span>
                      )}
                      {isService && task.service_type && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: 99, 
                          background: 'rgba(139,92,246,0.1)', 
                          color: '#8b5cf6', 
                          fontWeight: 600, 
                          display: 'inline-block',
                          marginLeft: '0.5rem'
                        }}>
                          {getServiceTypeLabel(task.service_type)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.3rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 99, 
                      background: statusBadge.bg, 
                      color: statusBadge.color, 
                      fontSize: '0.7rem', 
                      fontWeight: 600 
                    }}>
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                    {!isCompleted && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#8a96a8' }}
                      >
                        {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: '#1a1f2e' }}>{task.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {task.description}
                  {isService && task.service_charge > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#f59e0b' }}>
                      💰 Service Charge: ₱{task.service_charge.toLocaleString()}
                    </div>
                  )}
                </div>

                {task.guest_name && (
                  <div style={{ 
                    background: 'rgba(201,168,76,0.08)', 
                    borderRadius: 8, 
                    padding: '0.5rem 0.75rem', 
                    marginBottom: '0.75rem', 
                    fontSize: '0.75rem',
                    borderLeft: '3px solid #C9A84C'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Guest Request</div>
                    <div style={{ color: '#4a5568' }}>{task.guest_name} (Room {task.room_number})</div>
                  </div>
                )}

                {task.created_at && (
                  <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={12} />
                    Assigned on: {formatDate(task.created_at)}
                  </div>
                )}

                {task.note && !isCompleted && (
                  <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MessageCircle size={12} /> {task.note}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(task, 'IN_PROGRESS')}
                      disabled={updating}
                      style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <PlayCircle size={14} /> Start Task
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(task, 'COMPLETED')}
                      disabled={updating}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <CheckCircle size={14} /> Mark Complete
                    </button>
                  )}
                  {task.status === 'COMPLETED' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle size={14} /> Task Completed
                    </div>
                  )}
                </div>

                {/* Expanded Section - Checklist (only for cleaning tasks) */}
                {expandedTask === task.id && !isCompleted && !isService && checklist[task.id] && checklist[task.id].length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={12} /> Task Checklist
                    </div>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}