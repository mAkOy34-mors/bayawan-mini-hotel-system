// housekeeper/HousekeeperReport.jsx
import { useState, useEffect } from 'react';
import { getMyReport, getTaskHistory } from './housekeeperService';
import { Calendar, TrendingUp, Download, BarChart3, PieChart } from 'lucide-react';

export function HousekeeperReport({ token }) {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [reportData, historyData] = await Promise.all([
        getMyReport(token, period),
        getTaskHistory(token),
      ]);
      setReport(reportData);
      setHistory(historyData);
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, token]);

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Report</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>View your performance metrics and task history</p>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: period === p.value ? 'linear-gradient(135deg, #10b981, #34d399)' : '#fff',
                color: period === p.value ? '#fff' : '#4a5568',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={loadReport}
          style={{ padding: '0.4rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading report...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Tasks Completed', value: report?.tasks_completed || 0, icon: <CheckCircle size={20} />, color: '#10b981' },
              { label: 'Completion Rate', value: `${report?.completion_rate || 0}%`, icon: <TrendingUp size={20} />, color: '#3b82f6' },
              { label: 'Rooms Cleaned', value: report?.rooms_cleaned || 0, icon: <Hotel size={20} />, color: '#8b5cf6' },
              { label: 'Avg. Time per Task', value: `${report?.avg_time_per_task || 0} min`, icon: <Clock size={20} />, color: '#f59e0b' },
            ].map((card, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                    {card.icon}
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1f2e' }}>{card.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#8a96a8' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Task History Table */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Task History</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Room</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Task</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8' }}>Time Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#8a96a8' }}>No task history found</td>
                    </tr>
                  ) : (
                    history.map(task => (
                      <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{new Date(task.completed_at || task.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>Room {task.room_number}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>{task.title}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: task.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: task.status === 'COMPLETED' ? '#10b981' : '#3b82f6', fontSize: '0.7rem', fontWeight: 600 }}>
                            {task.status === 'COMPLETED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {task.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                          {task.time_taken ? `${task.time_taken} min` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}