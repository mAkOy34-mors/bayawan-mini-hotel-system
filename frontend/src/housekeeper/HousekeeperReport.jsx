// housekeeper/HousekeeperReport.jsx
import { useState, useEffect } from 'react';
import { getMyReport, getTaskHistory, getMyTasks, getStaffTasks } from './housekeeperService';
import { 
  Calendar, 
  TrendingUp, 
  Download, 
  BarChart3, 
  PieChart,
  RefreshCw,
  CheckCircle,
  Clock,
  Hotel,
  AlertTriangle,
  FileText,
  Filter
} from 'lucide-react';

export function HousekeeperReport({ token }) {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Loading report data for period:', period);
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch report data and task history
      const [reportData, historyData, housekeeperTasks, staffTasks] = await Promise.all([
        getMyReport(token, period).catch(err => {
          console.warn('Could not fetch report:', err);
          return null;
        }),
        getTaskHistory(token).catch(err => {
          console.warn('Could not fetch task history:', err);
          return [];
        }),
        getMyTasks(token).catch(err => {
          console.warn('Could not fetch housekeeper tasks:', err);
          return [];
        }),
        getStaffTasks(token).catch(err => {
          console.warn('Could not fetch staff tasks:', err);
          return [];
        })
      ]);
      
      console.log('Report data:', reportData);
      console.log('History data:', historyData);
      
      // Process housekeeper tasks
      const housekeeperList = Array.isArray(housekeeperTasks) 
        ? housekeeperTasks 
        : (housekeeperTasks?.tasks || []);
      
      // Process staff tasks
      const staffList = Array.isArray(staffTasks) 
        ? staffTasks 
        : (staffTasks?.tasks || []);
      
      // Combine all tasks for history
      const allTasks = [
        ...housekeeperList.map(task => ({ ...task, source: 'housekeeper' })),
        ...staffList.map(task => ({ ...task, source: 'staff' }))
      ];
      
      // Remove duplicates
      const uniqueMap = new Map();
      allTasks.forEach(item => {
        const compositeKey = `${item.source}-${item.id}`;
        if (!uniqueMap.has(compositeKey)) {
          uniqueMap.set(compositeKey, item);
        }
      });
      const combinedTasks = Array.from(uniqueMap.values());
      
      // Sort by completed date or created date (newest first)
      const sortedHistory = combinedTasks.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.updated_at || a.created_at || 0);
        const dateB = new Date(b.completed_at || b.updated_at || b.created_at || 0);
        return dateB - dateA;
      });
      
      // Process report data from API or calculate from tasks
      let formattedReport = {
        tasks_completed: 0,
        completion_rate: 0,
        rooms_cleaned: 0,
        avg_time_per_task: 0,
        total_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        period: period,
        start_date: null,
        end_date: null
      };
      
      if (reportData) {
        // Use API data if available
        formattedReport = {
          tasks_completed: reportData.tasks_completed || reportData.completed || 0,
          completion_rate: reportData.completion_rate || 0,
          rooms_cleaned: reportData.rooms_cleaned || reportData.rooms_cleaned_count || 0,
          avg_time_per_task: reportData.avg_time_per_task || 0,
          total_tasks: reportData.total_tasks || combinedTasks.length,
          pending_tasks: reportData.pending_tasks || combinedTasks.filter(t => t.status === 'PENDING').length,
          in_progress_tasks: reportData.in_progress_tasks || combinedTasks.filter(t => t.status === 'IN_PROGRESS').length,
          start_date: reportData.start_date,
          end_date: reportData.end_date
        };
      } else {
        // Calculate from tasks if API failed
        const completedTasks = combinedTasks.filter(t => t.status === 'COMPLETED');
        const totalTasks = combinedTasks.length;
        
        formattedReport.tasks_completed = completedTasks.length;
        formattedReport.total_tasks = totalTasks;
        formattedReport.pending_tasks = combinedTasks.filter(t => t.status === 'PENDING').length;
        formattedReport.in_progress_tasks = combinedTasks.filter(t => t.status === 'IN_PROGRESS').length;
        formattedReport.completion_rate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
        formattedReport.rooms_cleaned = completedTasks.filter(t => 
          t.task_type === 'CLEANING' || t.task_type === 'HOUSEKEEPING'
        ).length;
        
        // Calculate average time per task (if time tracking data exists)
        const tasksWithTime = completedTasks.filter(t => t.time_taken);
        if (tasksWithTime.length > 0) {
          const totalTime = tasksWithTime.reduce((sum, t) => sum + (t.time_taken || 0), 0);
          formattedReport.avg_time_per_task = Math.round(totalTime / tasksWithTime.length);
        }
      }
      
      // Use history data if provided, otherwise use combined tasks
      let finalHistory = [];
      if (Array.isArray(historyData) && historyData.length > 0) {
        finalHistory = historyData;
      } else if (historyData?.tasks && Array.isArray(historyData.tasks)) {
        finalHistory = historyData.tasks;
      } else if (historyData?.results && Array.isArray(historyData.results)) {
        finalHistory = historyData.results;
      } else {
        finalHistory = sortedHistory;
      }
      
      setReport(formattedReport);
      setHistory(finalHistory.slice(0, 20)); // Limit to 20 most recent tasks
      
    } catch (err) {
      console.error('Error loading report:', err);
      setError(err.message || 'Failed to load report data');
      
      // Set default values to prevent UI from breaking
      setReport({
        tasks_completed: 0,
        completion_rate: 0,
        rooms_cleaned: 0,
        avg_time_per_task: 0,
        total_tasks: 0,
        pending_tasks: 0,
        in_progress_tasks: 0
      });
      setHistory([]);
      
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    loadReport(true);
  };

  useEffect(() => {
    if (token) {
      loadReport();
    } else {
      console.log('No token provided to HousekeeperReport');
      setLoading(false);
      setError('Authentication required. Please log in again.');
    }
  }, [period, token]);

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'all', label: 'All Time' },
  ];

  const formatDateRange = () => {
    if (!report?.start_date && !report?.end_date) return '';
    if (report?.start_date && report?.end_date) {
      return `${new Date(report.start_date).toLocaleDateString()} - ${new Date(report.end_date).toLocaleDateString()}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        <div style={{ marginTop: '1rem', color: '#8a96a8' }}>Loading report...</div>
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
        <h3 style={{ marginBottom: '0.5rem' }}>Error Loading Report</h3>
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

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
              <FileText size={22} style={{ display: 'inline', marginRight: '0.5rem', color: '#C9A84C' }} />
              My Report
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>
              View your performance metrics and task history
              {formatDateRange() && <span> • {formatDateRange()}</span>}
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
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: '#8a96a8', marginRight: '0.5rem' }} />
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: period === p.value ? 'linear-gradient(135deg, #C9A84C, #9a7a2e)' : '#fff',
              color: period === p.value ? '#fff' : '#4a5568',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tasks Completed', value: report?.tasks_completed || 0, icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Completion Rate', value: `${report?.completion_rate || 0}%`, icon: <TrendingUp size={20} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Rooms Cleaned', value: report?.rooms_cleaned || 0, icon: <Hotel size={20} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
          { label: 'Avg. Time per Task', value: `${report?.avg_time_per_task || 0} min`, icon: <Clock size={20} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>{card.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#8a96a8' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BarChart3 size={18} color="#C9A84C" />
            <span style={{ fontWeight: 600 }}>Task Breakdown</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#8a96a8' }}>Pending</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{report?.pending_tasks || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#8a96a8' }}>In Progress</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{report?.in_progress_tasks || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#8a96a8' }}>Completed</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{report?.tasks_completed || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#8a96a8' }}>Total</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#C9A84C' }}>{report?.total_tasks || 0}</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Calendar size={18} color="#3b82f6" />
            <span style={{ fontWeight: 600 }}>Period Summary</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
            {period === 'daily' && 'Today\'s performance summary'}
            {period === 'weekly' && 'This week\'s performance summary'}
            {period === 'monthly' && 'This month\'s performance summary'}
            {period === 'all' && 'All-time performance summary'}
          </div>
        </div>
      </div>

      {/* Task History Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Task History</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Room</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Task</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Source</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#8a96a8' }}>
                    <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                    <div>No task history found</div>
                    <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Complete tasks to see your history here</div>
                  </td>
                </tr>
              ) : (
                history.map((task, index) => (
                  <tr key={task.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#4a5568' }}>
                      {new Date(task.completed_at || task.updated_at || task.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      Room {task.room_number || task.room?.room_number || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#4a5568' }}>
                      {task.title || task.task_name || 'Task'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: 99,
                        background: task.source === 'staff' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: task.source === 'staff' ? '#3b82f6' : '#10b981'
                      }}>
                        {task.source === 'staff' ? 'Staff' : 'Housekeeping'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: 99, 
                        background: task.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                        color: task.status === 'COMPLETED' ? '#10b981' : task.status === 'IN_PROGRESS' ? '#3b82f6' : '#f59e0b', 
                        fontSize: '0.7rem', 
                        fontWeight: 600 
                      }}>
                        {task.status === 'COMPLETED' ? <CheckCircle size={10} /> : task.status === 'IN_PROGRESS' ? <Clock size={10} /> : <AlertTriangle size={10} />}
                        {task.status?.replace('_', ' ') || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#4a5568' }}>
                      {task.time_taken ? `${task.time_taken} min` : task.completed_at ? 'Completed' : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}