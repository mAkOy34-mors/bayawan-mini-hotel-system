// admin/AdminEmergencyLog.jsx
import { useState, useEffect } from 'react';
import { ReceptionistEmergencyLog } from '../receptionist/ReceptionistEmergencyLog';
import { API_BASE } from '../constants/config';
import { TrendingUp, Download, Calendar, Clock, Users, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = {
  medical: '#dc2626',
  fire: '#f97316',
  security: '#3b82f6',
  other: '#f59e0b',
  resolved: '#10b981',
  active: '#ef4444'
};

export function AdminEmergencyLog({ token }) {
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // all, week, month

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/emergency/all/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const emergencies = data.emergencies || [];
        
        // Filter by time range
        let filtered = [...emergencies];
        const now = new Date();
        if (timeRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          filtered = emergencies.filter(e => new Date(e.createdAt) >= weekAgo);
        } else if (timeRange === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          filtered = emergencies.filter(e => new Date(e.createdAt) >= monthAgo);
        }
        
        // Basic stats
        const total = filtered.length;
        const resolved = filtered.filter(e => e.status === 'RESOLVED').length;
        const active = total - resolved;
        
        // Response time calculation
        const responseTimes = filtered
          .filter(e => e.resolvedAt && e.createdAt)
          .map(e => {
            const created = new Date(e.createdAt);
            const resolved = new Date(e.resolvedAt);
            return (resolved - created) / 60000;
          });
        const avgResponseTime = responseTimes.length > 0 
          ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
          : 0;
        
        // Data for Donut Chart - Emergency Types
        const typeData = [
          { name: 'Medical', value: filtered.filter(e => e.emergencyType === 'medical').length, color: COLORS.medical },
          { name: 'Fire', value: filtered.filter(e => e.emergencyType === 'fire').length, color: COLORS.fire },
          { name: 'Security', value: filtered.filter(e => e.emergencyType === 'security').length, color: COLORS.security },
          { name: 'Other', value: filtered.filter(e => e.emergencyType === 'other').length, color: COLORS.other },
        ].filter(d => d.value > 0);
        
        // Data for Status Pie Chart
        const statusData = [
          { name: 'Resolved', value: resolved, color: COLORS.resolved },
          { name: 'Active', value: active, color: COLORS.active },
        ].filter(d => d.value > 0);
        
        // Data for Timeline (emergencies over time)
        const timelineMap = new Map();
        filtered.forEach(e => {
          const date = new Date(e.createdAt).toLocaleDateString();
          timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
        });
        const timelineData = Array.from(timelineMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-14); // Last 14 days
        
        // Data for Response Time by Type
        const responseByType = {
          medical: { total: 0, count: 0 },
          fire: { total: 0, count: 0 },
          security: { total: 0, count: 0 },
          other: { total: 0, count: 0 }
        };
        filtered.forEach(e => {
          if (e.resolvedAt && e.createdAt) {
            const type = e.emergencyType || 'other';
            const time = (new Date(e.resolvedAt) - new Date(e.createdAt)) / 60000;
            responseByType[type].total += time;
            responseByType[type].count += 1;
          }
        });
        const responseTimeData = Object.entries(responseByType)
          .filter(([_, data]) => data.count > 0)
          .map(([type, data]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            minutes: Math.round(data.total / data.count),
            color: COLORS[type]
          }));
        
        // Data for Staff Performance (Top 5)
        const staffMap = new Map();
        filtered
          .filter(e => e.resolvedBy)
          .forEach(e => {
            staffMap.set(e.resolvedBy, (staffMap.get(e.resolvedBy) || 0) + 1);
          });
        const staffData = Array.from(staffMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Data for Hourly Distribution
        const hourlyMap = new Array(24).fill(0);
        filtered.forEach(e => {
          const hour = new Date(e.createdAt).getHours();
          hourlyMap[hour]++;
        });
        const hourlyData = hourlyMap.map((count, hour) => ({ hour: `${hour}:00`, count }));
        
        // Top responder
        const topResponder = staffData[0]?.name || '—';
        
        setAnalytics({
          total, resolved, active, avgResponseTime, topResponder,
          typeData, statusData, timelineData, responseTimeData, staffData, hourlyData
        });
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAnalytics) {
      loadAnalytics();
    }
  }, [showAnalytics, timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>{label}</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#C9A84C' }}>
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Admin Analytics Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f2e, #2d3748)',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} />
          <span><strong>Emergency Analytics Dashboard</strong></span>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>| Real-time insights</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 8, padding: '0.3rem 0.8rem', fontSize: '0.7rem', cursor: 'pointer' }}
          >
            <option value="all" style={{ color: '#000' }}>All Time</option>
            <option value="week" style={{ color: '#000' }}>Last 7 Days</option>
            <option value="month" style={{ color: '#000' }}>Last 30 Days</option>
          </select>
          <button 
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 8, padding: '0.3rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
          >
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              <div style={{ marginTop: '0.5rem', color: '#8a96a8' }}>Loading analytics...</div>
            </div>
          ) : analytics ? (
            <div style={{ marginBottom: '1.5rem' }}>
              
              {/* KPI Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '1rem', 
                marginBottom: '1.5rem'
              }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <Activity size={20} style={{ color: '#3b82f6', marginBottom: '0.25rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{analytics.total}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Total Emergencies</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <CheckCircle2 size={20} style={{ color: '#10b981', marginBottom: '0.25rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{analytics.resolved}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Resolved</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <AlertTriangle size={20} style={{ color: '#ef4444', marginBottom: '0.25rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{analytics.active}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Active</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <Clock size={20} style={{ color: '#f59e0b', marginBottom: '0.25rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{analytics.avgResponseTime}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Avg Response (min)</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <Users size={20} style={{ color: '#C9A84C', marginBottom: '0.25rem' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C' }}>{analytics.topResponder}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Top Responder</div>
                </div>
              </div>

              {/* Row 1: Timeline + Donut Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                
                {/* Timeline Chart - Emergencies over time */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} /> Emergency Timeline (Last 14 days)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analytics.timelineData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#C9A84C" fill="url(#colorCount)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Donut Chart - Emergency Types */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem' }}>Emergency by Type</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics.typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {analytics.typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Pie Chart */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem' }}>Status Distribution</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {analytics.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Row 2: Response Time + Staff Performance + Hourly Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                
                {/* Bar Chart - Response Time by Type */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Response Time (minutes)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.responseTimeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={60} />
                      <Tooltip />
                      <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart - Staff Performance */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} /> Top Performers
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.staffData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart - Hourly Distribution */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#8a96a8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Activity size={14} /> Emergencies by Hour
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analytics.hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={3} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Section */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(59,130,246,0.04))',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 12, 
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                  <strong>📊 Insights:</strong> 
                  {analytics.avgResponseTime < 5 ? ' ✓ Excellent response time' : 
                   analytics.avgResponseTime < 10 ? ' ⚡ Good response time' : ' ⚠️ Response time needs improvement'}
                  {analytics.typeData.find(t => t.name === 'Medical')?.value > analytics.typeData.length && ' | Medical emergencies are most common'}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#8a96a8' }}>
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Emergency Log Component */}
      <ReceptionistEmergencyLog token={token} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}