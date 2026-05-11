// housekeeper/HousekeeperDashboard.jsx
import { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { getMyStats, getMyTasks, getStaffTasks } from './housekeeperService';
import { Clock, CheckCircle, AlertTriangle, Hotel, TrendingUp, Star, Calendar, RefreshCw } from 'lucide-react';

export function HousekeeperDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { activeEmergencies } = useEmergency();

  const loadData = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch stats and tasks in parallel (same as HousekeeperTasks)
      const [statsData, housekeeperTasksData, staffTasksData] = await Promise.all([
        getMyStats(token),
        getMyTasks(token),
        getStaffTasks(token).catch(err => {
          console.warn('Could not fetch staff tasks:', err);
          return []; // Return empty array if staff tasks fail
        })
      ]);
      
      console.log('Stats data:', statsData);
      console.log('Housekeeper tasks:', housekeeperTasksData);
      console.log('Staff tasks:', staffTasksData);
      
      // Process housekeeper tasks (same as HousekeeperTasks)
      const housekeeperList = Array.isArray(housekeeperTasksData) 
        ? housekeeperTasksData 
        : (housekeeperTasksData.tasks || []);
      
      // Process staff tasks (same as HousekeeperTasks)
      const staffList = Array.isArray(staffTasksData) 
        ? staffTasksData 
        : (staffTasksData.tasks || []);
      
      // Combine all tasks for recent tasks list
      const allTasks = [
        ...housekeeperList.map(task => ({ ...task, source: 'housekeeper' })),
        ...staffList.map(task => ({ ...task, source: 'staff' }))
      ];
      
      // Remove duplicates (same as HousekeeperTasks)
      const uniqueMap = new Map();
      allTasks.forEach(item => {
        const compositeKey = `${item.source}-${item.id}`;
        if (!uniqueMap.has(compositeKey)) {
          uniqueMap.set(compositeKey, item);
        }
      });
      const combinedTasks = Array.from(uniqueMap.values());
      
      // Sort by created date (newest first) and take first 5
      const sortedTasks = combinedTasks.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0);
        const dateB = new Date(b.created_at || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setRecentTasks(sortedTasks.slice(0, 5));
      
      // Calculate stats from tasks if stats API doesn't return complete data
      let formattedStats = {
        completed: statsData?.completed || 0,
        in_progress: statsData?.in_progress || 0,
        pending: statsData?.pending || 0,
        rooms_cleaned: statsData?.rooms_cleaned || 0,
        completion_rate: statsData?.completion_rate || 0,
        rating: statsData?.rating || 5.0,
        shift: statsData?.shift || 'Morning',
        status: statsData?.status || 'On Duty'
      };
      
      // If stats API didn't return proper counts, calculate from tasks
      if (formattedStats.completed === 0 && formattedStats.in_progress === 0 && formattedStats.pending === 0) {
        formattedStats.completed = combinedTasks.filter(t => t.status === 'COMPLETED').length;
        formattedStats.in_progress = combinedTasks.filter(t => t.status === 'IN_PROGRESS').length;
        formattedStats.pending = combinedTasks.filter(t => t.status === 'PENDING').length;
        
        // Calculate completion rate
        const total = formattedStats.completed + formattedStats.in_progress + formattedStats.pending;
        if (total > 0) {
          formattedStats.completion_rate = Math.round((formattedStats.completed / total) * 100);
        }
      }
      
      setStats(formattedStats);
      
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Set default values to prevent UI from breaking
      setStats({
        completed: 0,
        in_progress: 0,
        pending: 0,
        rooms_cleaned: 0,
        completion_rate: 0,
        rating: 5.0,
        shift: 'Morning',
        status: 'On Duty'
      });
      setRecentTasks([]);
      
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      console.log('No token provided to HousekeeperDashboard');
      setLoading(false);
      setError('Authentication required. Please log in again.');
    }
  }, [token]);

  const statCards = [
    { label: 'Tasks Completed', value: stats?.completed || 0, icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'In Progress', value: stats?.in_progress || 0, icon: <Clock size={20} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Pending', value: stats?.pending || 0, icon: <AlertTriangle size={20} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Rooms Cleaned', value: stats?.rooms_cleaned || 0, icon: <Hotel size={20} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <div style={{ marginTop: '1rem', color: '#8a96a8' }}>Loading dashboard...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#dc2626', marginBottom: '1rem' }}>
          <AlertTriangle size={48} />
        </div>
        <h3 style={{ marginBottom: '0.5rem' }}>Error Loading Dashboard</h3>
        <p style={{ color: '#8a96a8', marginBottom: '1rem' }}>{error}</p>
        <button 
          onClick={handleRefresh}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#C9A84C',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      {/* Emergency Alert Banner */}
      {activeEmergencies && activeEmergencies.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          <span><strong>🚨 EMERGENCY!</strong> {activeEmergencies.length} active emergency(s)</span>
        </div>
      )}

      {/* Header with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            Welcome Back! 👋
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>
            Here's your housekeeping summary for today
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.4rem 1rem',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a1f2e' }}>{card.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#8a96a8' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#10b981" />
            <span style={{ fontWeight: 600 }}>Performance</span>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#4a5568' }}>Completion Rate</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{stats?.completion_rate || 0}%</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${stats?.completion_rate || 0}%`, height: '100%', background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontSize: '0.8rem' }}>Rating: {stats?.rating || 5.0}/5.0</span>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={18} color="#3b82f6" />
            <span style={{ fontWeight: 600 }}>Today's Schedule</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: '0.25rem' }}>Shift: {stats?.shift || 'Morning'}</div>
            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>Status: <span style={{ color: '#10b981', fontWeight: 600 }}>{stats?.status || 'On Duty'}</span></div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600, margin: 0 }}>Recent Tasks</h3>
        </div>
        {recentTasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8a96a8' }}>
            <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <div>No tasks assigned yet</div>
            <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Tasks will appear here when assigned</div>
          </div>
        ) : (
          recentTasks.map(task => (
            <div key={`${task.source}-${task.id}`} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Room {task.room_number || task.room?.room_number || 'N/A'}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Source badge */}
                  <span style={{ 
                    fontSize: '0.6rem', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: 99,
                    background: task.source === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: task.source === 'staff' ? '#3b82f6' : '#10b981'
                  }}>
                    {task.source === 'staff' ? 'Staff' : 'Housekeeping'}
                  </span>
                  {/* Status badge */}
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: 99, 
                    background: task.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    color: task.status === 'COMPLETED' ? '#10b981' : task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b' 
                  }}>
                    {task.status?.replace('_', ' ') || 'PENDING'}
                  </span>
                </div>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title || task.task_name || 'Task'}</div>
              <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>{task.description || 'No description provided'}</div>
              {task.created_at && (
                <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginTop: '0.5rem' }}>
                  Assigned: {new Date(task.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}