// housekeeper/HousekeeperDashboard.jsx
import { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { getMyStats, getMyTasks } from './housekeeperService';
import { Clock, CheckCircle, AlertTriangle, Hotel, TrendingUp, Star, Calendar } from 'lucide-react';

export function HousekeeperDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeEmergencies } = useEmergency();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, tasksData] = await Promise.all([
        getMyStats(token),
        getMyTasks(token),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const statCards = [
    { label: 'Tasks Completed', value: stats?.completed || 0, icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'In Progress', value: stats?.in_progress || 0, icon: <Clock size={20} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Pending', value: stats?.pending || 0, icon: <AlertTriangle size={20} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Rooms Cleaned', value: stats?.rooms_cleaned || 0, icon: <Hotel size={20} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ];

  return (
    <div>
      {/* Emergency Alert Banner */}
      {activeEmergencies.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={20} />
          <span><strong>🚨 EMERGENCY!</strong> {activeEmergencies.length} active emergency(s)</span>
        </div>
      )}

      {/* Welcome Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Welcome Back! 👋</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Here's your housekeeping summary for today</p>
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
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a1f2e' }}>{loading ? '—' : card.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#8a96a8' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tasks...</div>
        ) : recentTasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8a96a8' }}>No tasks assigned</div>
        ) : (
          recentTasks.map(task => (
            <div key={task.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>Room {task.room_number}</span>
                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 99, background: task.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: task.status === 'COMPLETED' ? '#10b981' : task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b' }}>
                  {task.status?.replace('_', ' ') || 'PENDING'}
                </span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>{task.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}