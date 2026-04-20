// AdminDashboard.jsx — Professional Analytics Dashboard with Real Data
import { useState, useEffect } from 'react';
import { getDashboard, getRevenue, getCheckins, adminGetBookings } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner } from './adminShared';
import { API_BASE as BASE } from '../constants/config';
import {
  Hotel, Users, DollarSign, BedDouble, LogIn, LogOut,
  Clock, TrendingUp, RefreshCw, ChevronRight,
  CalendarCheck, CreditCard, AlertTriangle, CheckCircle2,
  BarChart2, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Calendar, Home, Wifi, Coffee, Tv, Wind, Sparkles
} from 'lucide-react';

// Import Recharts for professional charts
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const ANALYTICS_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ad-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .ad-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }
  .ad-metric {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.15rem 1.2rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.5s ease both;
  }
  .ad-metric:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -12px rgba(0,0,0,0.15);
  }
  .ad-metric::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }
  .ad-metric.gold::before { background: linear-gradient(90deg, #9a7a2e, #C9A84C); }
  .ad-metric.green::before { background: linear-gradient(90deg, #059669, #34d399); }
  .ad-metric.blue::before { background: linear-gradient(90deg, #2563eb, #60a5fa); }
  .ad-metric.orange::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .ad-metric.red::before { background: linear-gradient(90deg, #dc2626, #f87171); }
  .ad-metric.purple::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  .ad-metric.teal::before { background: linear-gradient(90deg, #0d9488, #5eead4); }
  .ad-metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.55rem; }
  .ad-metric-ico {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s;
  }
  .ad-metric:hover .ad-metric-ico { transform: scale(1.05); }
  .ad-metric.gold .ad-metric-ico { background: rgba(201,168,76,0.12); color: #9a7a2e; }
  .ad-metric.green .ad-metric-ico { background: rgba(45,155,111,0.12); color: #2d9b6f; }
  .ad-metric.blue .ad-metric-ico { background: rgba(59,130,246,0.12); color: #3b82f6; }
  .ad-metric.orange .ad-metric-ico { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .ad-metric.red .ad-metric-ico { background: rgba(220,53,69,0.1); color: #dc3545; }
  .ad-metric.purple .ad-metric-ico { background: rgba(124,58,237,0.1); color: #7c3aed; }
  .ad-metric.teal .ad-metric-ico { background: rgba(13,148,136,0.1); color: #0d9488; }
  .ad-metric-trend {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 99px;
  }
  .ad-metric-trend.up { background: rgba(45,155,111,0.1); color: var(--green); }
  .ad-metric-trend.down { background: rgba(220,53,69,0.1); color: var(--red); }
  .ad-metric-label { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.28rem; }
  .ad-metric-value { font-family: 'Cormorant Garamond', serif; font-size: 1.85rem; font-weight: 600; color: var(--text); line-height: 1; }
  .ad-metric-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; }
  .ad-chart-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
    animation: fadeInUp 0.5s ease both;
  }
  .ad-chart-panel:hover { box-shadow: 0 8px 20px -8px rgba(0,0,0,0.1); }
  .ad-chart-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.95rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ad-chart-title { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
  .ad-chart-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.08rem; }
  .ad-chart-body { padding: 1.25rem; }
  .ad-period-tabs {
    display: flex;
    gap: 0.3rem;
    background: var(--surface2);
    border-radius: 10px;
    padding: 0.25rem;
  }
  .ad-period-tab {
    padding: 0.3rem 0.85rem;
    border-radius: 7px;
    border: none;
    font-size: 0.72rem;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-muted);
  }
  .ad-period-tab.on {
    background: #fff;
    color: var(--text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .ad-status-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .ad-status-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.85rem 0.9rem;
    text-align: center;
    transition: all 0.2s;
  }
  .ad-status-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .ad-status-num { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: var(--text); line-height: 1; }
  .ad-status-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-top: 0.2rem; }
  .ad-donut-wrap { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
  .ad-donut-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .ad-donut-val { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: var(--text); line-height: 1; }
  .ad-donut-label { font-size: 0.62rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .ad-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .ad-legend-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.78rem;
  }
  .ad-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .ad-legend-name { color: var(--text-sub); font-weight: 500; flex: 1; }
  .ad-legend-val { font-weight: 700; color: var(--text); }
  .ad-legend-pct { font-size: 0.7rem; color: var(--text-muted); }
  .ad-feed-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.72rem 0;
    border-bottom: 1px solid #f8f9fb;
    transition: all 0.2s;
  }
  .ad-feed-item:hover { background: rgba(201,168,76,0.04); padding-left: 0.5rem; }
  .ad-feed-ico {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ad-feed-ico.check-in { background: var(--blue-bg); color: var(--blue); }
  .ad-feed-name { font-size: 0.83rem; font-weight: 600; color: var(--text); }
  .ad-feed-sub { font-size: 0.72rem; color: var(--text-muted); }
  .ad-occ-bar-wrap { margin-bottom: 0.75rem; }
  .ad-occ-bar-label { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.35rem; }
  .ad-occ-track { height: 8px; border-radius: 99px; background: #f1f5f9; overflow: hidden; }
  .ad-occ-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
  .ad-action-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.82rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.45rem;
  }
  .ad-action-card:hover {
    border-color: var(--gold);
    background: var(--gold-bg);
    transform: translateX(4px);
  }
  .ad-action-ico {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .ad-action-card:hover .ad-action-ico { background: rgba(201,168,76,0.15); color: var(--gold-dark); }
  .ad-action-label { font-size: 0.84rem; font-weight: 600; color: var(--text); }
  .ad-action-sub { font-size: 0.71rem; color: var(--text-muted); }
`;

function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return null;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) return null;
  if (rounded > 0) return <span className="ad-metric-trend up"><ArrowUpRight size={11}/>+{rounded}%</span>;
  return <span className="ad-metric-trend down"><ArrowDownRight size={11}/>{rounded}%</span>;
}

function CustomTooltip({ active, payload, label, unit = '' }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#1a1f2e' }}>{label}</p>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#C9A84C' }}>
          {payload[0].value.toLocaleString()} {unit}
        </p>
      </div>
    );
  }
  return null;
}

export function AdminDashboard({ token, setPage }) {
  const [kpi, setKpi] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [checkins, setCheckins] = useState({ checkins: [], checkouts: [] });
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [roomTypeData, setRoomTypeData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const loadRevenue = async (per) => {
    const r = await getRevenue(token, per).catch(() => null);
    if (!r?.data) return;
    setRevenue(r.data.slice(-12).map(d => ({
      label: d.period?.slice(5, 10) || d.period?.slice(0, 7) || d.period,
      total: d.total,
    })));
  };

  // Calculate room type popularity from actual bookings
  const calculateRoomTypeData = (bookingsData) => {
    const typeMap = new Map();
    bookingsData.forEach(booking => {
      const type = booking.roomType || 'Standard';
      if (!typeMap.has(type)) {
        typeMap.set(type, { bookings: 0, revenue: 0 });
      }
      typeMap.set(type, {
        bookings: typeMap.get(type).bookings + 1,
        revenue: typeMap.get(type).revenue + (parseFloat(booking.totalAmount) || 0)
      });
    });
    
    return Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        bookings: data.bookings,
        revenue: data.revenue
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  };

  // Calculate monthly trend from actual bookings
  const calculateMonthlyTrend = (bookingsData) => {
    const monthMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    bookingsData.forEach(booking => {
      if (booking.createdAt) {
        const date = new Date(booking.createdAt);
        const month = months[date.getMonth()];
        if (!monthMap.has(month)) {
          monthMap.set(month, { bookings: 0, revenue: 0 });
        }
        monthMap.set(month, {
          bookings: monthMap.get(month).bookings + 1,
          revenue: monthMap.get(month).revenue + (parseFloat(booking.totalAmount) || 0)
        });
      }
    });
    
    return months
      .filter(month => monthMap.has(month))
      .map(month => ({
        month: month,
        bookings: monthMap.get(month).bookings,
        revenue: monthMap.get(month).revenue
      }));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard(token).catch(() => null),
      getCheckins(token).catch(() => ({ checkins: [], checkouts: [] })),
      adminGetBookings(token, '').catch(() => []),
      fetch(`${BASE}/admin/rooms/`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
      }).then(r => r.json()).catch(() => []),
    ]).then(([k, c, b, r]) => {
      if (k) setKpi(k);
      setCheckins(c || { checkins: [], checkouts: [] });
      setBookings(Array.isArray(b) ? b : []);
      setRooms(Array.isArray(r) ? r : []);
      
      // Calculate real data for charts
      if (Array.isArray(b) && b.length > 0) {
        setRoomTypeData(calculateRoomTypeData(b));
        setMonthlyTrendData(calculateMonthlyTrend(b));
      }
    }).finally(() => setLoading(false));
    loadRevenue(period);
  }, [token]);

  useEffect(() => { loadRevenue(period); }, [period]);

  // Booking status counts
  const statusCounts = {
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    CHECKED_IN: bookings.filter(b => b.status === 'CHECKED_IN').length,
    PENDING_DEPOSIT: bookings.filter(b => b.status === 'PENDING_DEPOSIT').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
  };
  const totalBookingsCount = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  // Room calculations
  const totalRooms = rooms.length > 0 ? rooms.length : (kpi?.totalRooms || 0);
  const availableRooms = rooms.length > 0 ? rooms.filter(r => r.available).length : (kpi?.availableRooms || 0);
  const inHouseCount = statusCounts.CHECKED_IN;
  const totalBooked = statusCounts.CONFIRMED + statusCounts.CHECKED_IN + statusCounts.PENDING_DEPOSIT;
  const occupiedRooms = inHouseCount;
  const occupancyPct = totalRooms > 0 ? Math.min(100, Math.round((occupiedRooms / totalRooms) * 100)) : 0;

  const revenueTotal = revenue.reduce((s, r) => s + r.total, 0);
  const recentBookings = bookings.slice(0, 8);

  // Occupancy rate data for Pie Chart
  const occupancyData = [
    { name: 'Occupied', value: occupiedRooms, color: '#2d9b6f' },
    { name: 'Available', value: availableRooms, color: '#C9A84C' },
    { name: 'Maintenance', value: Math.max(0, totalRooms - occupiedRooms - availableRooms), color: '#dc3545' },
  ].filter(d => d.value > 0);

  const donutSegments = [
    { label: 'Confirmed', value: statusCounts.CONFIRMED, color: '#3b82f6' },
    { label: 'Checked In', value: statusCounts.CHECKED_IN, color: '#2d9b6f' },
    { label: 'Pending', value: statusCounts.PENDING_DEPOSIT, color: '#f59e0b' },
    { label: 'Completed', value: statusCounts.COMPLETED, color: '#94a3b8' },
    { label: 'Cancelled', value: statusCounts.CANCELLED, color: '#dc3545' },
  ].filter(s => s.value > 0);

  // Use real revenue data for area chart
  const revenueTrendData = revenue.length > 0 ? revenue : [];

  // Use real monthly trend data
  const hasMonthlyData = monthlyTrendData.length > 0;

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{ANALYTICS_CSS}</style>

      {/* Header */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Analytics Dashboard</h1>
          <p className="ap-sub">{today}</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.42rem .9rem', borderRadius: 99, background: '#fff', border: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text-sub)', fontWeight: 600 }}>
            <Activity size={13} color="var(--green)" /><span style={{ color: 'var(--green)', fontWeight: 700 }}>Live</span>
          </div>
          <button className="ap-btn-ghost" onClick={() => window.location.reload()} style={{ padding: '.42rem .85rem' }}>
            <RefreshCw size={13} />Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="ad-section-title"><Sparkles size={18} />Performance Overview</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading ? [1, 2, 3, 4].map(i => (
          <div key={i} className="ad-metric gold" style={{ animationDelay: `${i * 0.06}s` }}>
            <Skel h={14} w={80} mb={10} /><Skel h={10} w="60%" mb={8} /><Skel h={26} w="45%" />
          </div>
        )) : [
          { Icon: Hotel, label: 'Total Bookings', value: kpi?.totalBookings ?? bookings.length, color: 'gold', sub: `${statusCounts.CONFIRMED} confirmed`, pct: kpi?.bookingChangePct },
          { Icon: Users, label: 'Total Guests', value: kpi?.totalGuests ?? '—', color: 'blue', sub: 'Registered accounts' },
          { Icon: DollarSign, label: 'Total Revenue', value: kpi ? fmt(kpi.totalRevenue) : fmt(revenueTotal), color: 'green', sub: 'All time collected' },
          { Icon: BedDouble, label: 'Available Rooms', value: availableRooms, color: 'teal', sub: `${totalBooked} booked · ${totalRooms} total` },
        ].map((m, i) => (
          <div key={i} className={`ad-metric ${m.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="ad-metric-top">
              <div className="ad-metric-ico"><m.Icon size={20} /></div>
              <TrendBadge pct={m.pct} />
            </div>
            <div className="ad-metric-label">{m.label}</div>
            <div className="ad-metric-value">{m.value}</div>
            <div className="ad-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Today's Operations */}
      <div className="ad-section-title"><Calendar size={18} />Today's Operations</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading ? [1, 2, 3, 4].map(i => (
          <div key={i} className="ad-metric orange" style={{ animationDelay: `${i * 0.06}s` }}>
            <Skel h={14} w={80} mb={10} /><Skel h={10} w="60%" mb={8} /><Skel h={26} w="45%" />
          </div>
        )) : [
          { Icon: LogIn, label: "Today's Check-ins", value: kpi?.todaysCheckins ?? checkins.checkins?.length ?? 0, color: 'blue', sub: 'Expected arrivals' },
          { Icon: LogOut, label: "Today's Check-outs", value: kpi?.todaysCheckouts ?? checkins.checkouts?.length ?? 0, color: 'orange', sub: 'Expected departures' },
          { Icon: Clock, label: 'Pending Deposits', value: kpi?.pendingBookings ?? statusCounts.PENDING_DEPOSIT, color: 'red', sub: 'Awaiting payment' },
          { Icon: CreditCard, label: 'In-House Guests', value: inHouseCount, color: 'purple', sub: 'Currently checked in' },
        ].map((m, i) => (
          <div key={i} className={`ad-metric ${m.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="ad-metric-top">
              <div className="ad-metric-ico"><m.Icon size={20} /></div>
            </div>
            <div className="ad-metric-label">{m.label}</div>
            <div className="ad-metric-value">{m.value}</div>
            <div className="ad-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Professional Charts Section */}
      <div className="ad-section-title"><BarChart2 size={18} />Analytics & Insights</div>

      {/* Row 1: Monthly Bookings Line Chart + Revenue Area Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        
        {/* Monthly Bookings Trend - Line Chart (Real Data) */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><TrendingUp size={15} />Monthly Bookings Trend</div>
              <div className="ad-chart-sub">
                {hasMonthlyData ? `${monthlyTrendData.length} months of data` : 'No booking data available'}
              </div>
            </div>
            <div className="ad-period-tabs">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button key={p} className={`ad-period-tab${period === p ? ' on' : ''}`} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="ad-chart-body">
            {loading ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
            ) : hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendData}>
                  <defs>
                    <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip unit="bookings" />} />
                  <Legend />
                  <Line type="monotone" dataKey="bookings" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: '#C9A84C' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a96a8' }}>
                No booking data available
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend - Area Chart (Real Data) */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><DollarSign size={15} />Revenue Trend</div>
              <div className="ad-chart-sub">Total revenue {fmt(revenueTotal)} · {revenue.length} periods</div>
            </div>
          </div>
          <div className="ad-chart-body">
            {loading ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
            ) : revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d9b6f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2d9b6f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip unit="₱" />} />
                  <Area type="monotone" dataKey="total" stroke="#2d9b6f" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a96a8' }}>
                No revenue data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Room Type Popularity Bar Chart (Real Data) + Occupancy Pie Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        
        {/* Room Type Popularity - Bar Chart (Real Data) */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><BedDouble size={15} />Room Type Popularity</div>
              <div className="ad-chart-sub">Most booked room categories</div>
            </div>
          </div>
          <div className="ad-chart-body">
            {loading ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
            ) : roomTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roomTypeData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip unit="bookings" />} />
                  <Bar dataKey="bookings" fill="#C9A84C" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a96a8' }}>
                No room type data available
              </div>
            )}
          </div>
        </div>

        {/* Occupancy Rate - Pie Chart (Real Data) */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><PieChart size={15} />Occupancy Distribution</div>
              <div className="ad-chart-sub">{occupancyPct}% occupancy rate</div>
            </div>
          </div>
          <div className="ad-chart-body">
            {loading ? (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <ResponsiveContainer width={200} height={200}>
                  <RePieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="ad-legend">
                  {occupancyData.map((item, i) => (
                    <div key={i} className="ad-legend-item">
                      <div className="ad-legend-dot" style={{ background: item.color }} />
                      <span className="ad-legend-name">{item.name}</span>
                      <span className="ad-legend-val">{item.value}</span>
                      <span className="ad-legend-pct">{totalRooms > 0 ? Math.round((item.value / totalRooms) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Booking Status Donut + Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        
        {/* Donut Chart */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div className="ad-chart-title"><PieChart size={15} />Booking Status Distribution</div>
          </div>
          <div className="ad-chart-body">
            {loading ? <Spinner /> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="ad-donut-wrap">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="68" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                    {(() => {
                      let offset = 0;
                      const circ = 2 * Math.PI * 68;
                      return donutSegments.map((s, i) => {
                        const dash = (s.value / totalBookingsCount) * circ;
                        const el = (
                          <circle
                            key={i}
                            cx="80"
                            cy="80"
                            r="68"
                            fill="none"
                            stroke={s.color}
                            strokeWidth="20"
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 80 80)"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="ad-donut-center">
                    <div className="ad-donut-val">{totalBookingsCount}</div>
                    <div className="ad-donut-label">Total</div>
                  </div>
                </div>
                <div className="ad-legend">
                  {donutSegments.map((s, i) => (
                    <div key={i} className="ad-legend-item">
                      <div className="ad-legend-dot" style={{ background: s.color }} />
                      <span className="ad-legend-name">{s.label}</span>
                      <span className="ad-legend-val">{s.value}</span>
                      <span className="ad-legend-pct">{Math.round((s.value / totalBookingsCount) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Summary Grid */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div className="ad-chart-title"><Activity size={15} />Status Summary</div>
            <button className="ap-btn-ghost" style={{ fontSize: '.72rem', padding: '.3rem .65rem' }} onClick={() => setPage('bookings')}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="ad-chart-body">
            {loading ? <Spinner /> : (
              <>
                <div className="ad-status-grid" style={{ marginBottom: '.85rem' }}>
                  {[
                    { label: 'Confirmed', value: statusCounts.CONFIRMED, color: '#3b82f6' },
                    { label: 'Checked In', value: statusCounts.CHECKED_IN, color: '#2d9b6f' },
                    { label: 'Pending', value: statusCounts.PENDING_DEPOSIT, color: '#f59e0b' },
                    { label: 'Completed', value: statusCounts.COMPLETED, color: '#94a3b8' },
                    { label: 'Cancelled', value: statusCounts.CANCELLED, color: '#dc3545' },
                    { label: 'Total Booked', value: totalBooked, color: '#7c3aed' },
                  ].map((s, i) => (
                    <div key={i} className="ad-status-item">
                      <div className="ad-status-num" style={{ color: s.color }}>{s.value}</div>
                      <div className="ad-status-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                {statusCounts.PENDING_DEPOSIT > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 9, padding: '.6rem .85rem', fontSize: '.78rem', color: '#f59e0b', fontWeight: 600 }}>
                    <AlertTriangle size={14} />
                    {statusCounts.PENDING_DEPOSIT} booking{statusCounts.PENDING_DEPOSIT > 1 ? 's' : ''} awaiting deposit payment
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="ad-section-title"><Activity size={18} />Recent Activity</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>

        {/* Recent Bookings Table */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><CalendarCheck size={15} />Recent Bookings</div>
              <div className="ad-chart-sub">{loading ? 'Loading…' : `${bookings.length} total records`}</div>
            </div>
            <button className="ap-btn-ghost" style={{ fontSize: '.72rem', padding: '.3rem .65rem' }} onClick={() => setPage('bookings')}>
              All Bookings <ChevronRight size={12} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner /></div>
          ) : recentBookings.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-ico"><CalendarCheck size={40} strokeWidth={1} /></div>
              <div className="ap-empty-title">No bookings yet</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '.74rem', color: '#9a7a2e', fontWeight: 700 }}>{b.bookingReference}</span></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{b.guestUsername}</div>
                        <div style={{ fontSize: '.7rem', color: '#8a96a8' }}>{b.guestEmail}</div>
                      </td>
                      <td style={{ fontSize: '.8rem' }}>{b.roomType} #{b.roomNumber}</td>
                      <td style={{ fontSize: '.76rem', color: '#8a96a8', whiteSpace: 'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                      <td><span style={{ fontWeight: 700, fontSize: '.82rem' }}>{fmt(b.totalAmount)}</span></td>
                      <td><Pill status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
             </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Today's Arrivals */}
          <div className="ad-chart-panel">
            <div className="ad-chart-hd">
              <div>
                <div className="ad-chart-title"><LogIn size={15} color="#3b82f6" />Today's Arrivals</div>
                <div className="ad-chart-sub">{checkins.checkins?.length || 0} expected</div>
              </div>
            </div>
            <div style={{ padding: '0 1.25rem' }}>
              {(checkins.checkins || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8a96a8', fontSize: '.78rem', padding: '1.25rem 0' }}>No arrivals today</div>
              ) : (checkins.checkins || []).slice(0, 4).map((ci, i) => (
                <div key={i} className="ad-feed-item">
                  <div className="ad-feed-ico check-in"><LogIn size={14} /></div>
                  <div>
                    <div className="ad-feed-name">{ci.user__username || ci.user__email}</div>
                    <div className="ad-feed-sub">Room {ci.room__room_number}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}><Pill status={ci.status} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ad-chart-panel">
            <div className="ad-chart-hd">
              <div className="ad-chart-title"><CheckCircle2 size={15} />Quick Actions</div>
            </div>
            <div style={{ padding: '.75rem 1rem' }}>
              {[
                { Icon: BedDouble, label: 'Add Room', sub: 'Create listing', page: 'rooms', color: 'rgba(201,168,76,0.12)', iconColor: '#9a7a2e' },
                { Icon: Users, label: 'Manage Guests', sub: 'View accounts', page: 'guests', color: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6' },
                { Icon: CreditCard, label: 'Verify Payments', sub: 'Approve transactions', page: 'payments', color: 'rgba(45,155,111,0.1)', iconColor: '#2d9b6f' },
                { Icon: Clock, label: 'Support Tickets', sub: 'Reply to guests', page: 'support', color: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b' },
              ].map((a, i) => (
                <div key={i} className="ad-action-card" onClick={() => setPage(a.page)}>
                  <div className="ad-action-ico" style={{ background: a.color, color: a.iconColor }}>
                    <a.Icon size={15} />
                  </div>
                  <div>
                    <div className="ad-action-label">{a.label}</div>
                    <div className="ad-action-sub">{a.sub}</div>
                  </div>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#8a96a8' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}