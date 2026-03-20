// AdminDashboard.jsx — Enhanced analytics dashboard with Lucide icons
import { useState, useEffect } from 'react';
import { getDashboard, getRevenue, getCheckins, adminGetBookings } from './adminApi';
import { SHARED_CSS, fmt, fmtDate, Pill, Skel, Spinner, BarChart } from './adminShared';
import { API_BASE as BASE } from '../constants/config';
import {
  Hotel, Users, DollarSign, BedDouble, LogIn, LogOut,
  Clock, TrendingUp, RefreshCw, ChevronRight,
  CalendarCheck, CreditCard, AlertTriangle, CheckCircle2,
  BarChart2, PieChart, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const ANALYTICS_CSS = `
  .ad-section-title{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:600;color:var(--text);margin:0 0 1rem;display:flex;align-items:center;gap:.6rem;}
  .ad-section-title::after{content:'';flex:1;height:1px;background:var(--border);}
  .ad-metric{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.15rem 1.2rem;position:relative;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.05);animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;transition:transform .2s,box-shadow .2s;}
  .ad-metric:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.09);}
  .ad-metric::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
  .ad-metric.gold::before{background:linear-gradient(to right,#9a7a2e,#C9A84C);}
  .ad-metric.green::before{background:linear-gradient(to right,#059669,#34d399);}
  .ad-metric.blue::before{background:linear-gradient(to right,#2563eb,#60a5fa);}
  .ad-metric.orange::before{background:linear-gradient(to right,#d97706,#fbbf24);}
  .ad-metric.red::before{background:linear-gradient(to right,#dc2626,#f87171);}
  .ad-metric.purple::before{background:linear-gradient(to right,#7c3aed,#a78bfa);}
  .ad-metric.teal::before{background:linear-gradient(to right,#0d9488,#5eead4);}
  .ad-metric-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:.55rem;}
  .ad-metric-ico{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .ad-metric.gold   .ad-metric-ico{background:rgba(201,168,76,0.12);color:#9a7a2e;}
  .ad-metric.green  .ad-metric-ico{background:rgba(45,155,111,0.12);color:#2d9b6f;}
  .ad-metric.blue   .ad-metric-ico{background:rgba(59,130,246,0.12);color:#3b82f6;}
  .ad-metric.orange .ad-metric-ico{background:rgba(245,158,11,0.12);color:#f59e0b;}
  .ad-metric.red    .ad-metric-ico{background:rgba(220,53,69,0.1);color:#dc3545;}
  .ad-metric.purple .ad-metric-ico{background:rgba(124,58,237,0.1);color:#7c3aed;}
  .ad-metric.teal   .ad-metric-ico{background:rgba(13,148,136,0.1);color:#0d9488;}
  .ad-metric-trend{display:inline-flex;align-items:center;gap:.2rem;font-size:.7rem;font-weight:700;padding:.15rem .45rem;border-radius:99px;}
  .ad-metric-trend.up{background:rgba(45,155,111,0.1);color:var(--green);}
  .ad-metric-trend.down{background:rgba(220,53,69,0.1);color:var(--red);}
  .ad-metric-label{font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:.28rem;}
  .ad-metric-value{font-family:'Cormorant Garamond',serif;font-size:1.85rem;font-weight:600;color:var(--text);line-height:1;}
  .ad-metric-sub{font-size:.72rem;color:var(--text-muted);margin-top:.25rem;}
  .ad-chart-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.05);animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;margin-bottom:1rem;}
  .ad-chart-hd{display:flex;align-items:center;justify-content:space-between;padding:.95rem 1.25rem;border-bottom:1px solid var(--border);background:var(--surface2);flex-wrap:wrap;gap:.5rem;}
  .ad-chart-title{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;color:var(--text);display:flex;align-items:center;gap:.5rem;}
  .ad-chart-sub{font-size:.72rem;color:var(--text-muted);margin-top:.08rem;}
  .ad-chart-body{padding:1.25rem;}
  .ad-period-tabs{display:flex;gap:.3rem;background:var(--surface2);border-radius:8px;padding:.25rem;}
  .ad-period-tab{padding:.3rem .75rem;border-radius:6px;border:none;font-size:.72rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;background:transparent;color:var(--text-muted);}
  .ad-period-tab.on{background:#fff;color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.08);}
  .ad-status-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;}
  .ad-status-item{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:.75rem .9rem;text-align:center;}
  .ad-status-num{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text);line-height:1;}
  .ad-status-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-top:.2rem;}
  .ad-donut-wrap{position:relative;width:140px;height:140px;flex-shrink:0;}
  .ad-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .ad-donut-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text);line-height:1;}
  .ad-donut-label{font-size:.62rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
  .ad-legend{display:flex;flex-direction:column;gap:.5rem;}
  .ad-legend-item{display:flex;align-items:center;gap:.55rem;font-size:.78rem;}
  .ad-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
  .ad-legend-name{color:var(--text-sub);font-weight:500;flex:1;}
  .ad-legend-val{font-weight:700;color:var(--text);}
  .ad-legend-pct{font-size:.7rem;color:var(--text-muted);}
  .ad-feed-item{display:flex;align-items:center;gap:.75rem;padding:.72rem 0;border-bottom:1px solid #f8f9fb;}
  .ad-feed-item:last-child{border-bottom:none;}
  .ad-feed-ico{width:34px;height:34px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .ad-feed-ico.check-in{background:var(--blue-bg);color:var(--blue);}
  .ad-feed-name{font-size:.83rem;font-weight:600;color:var(--text);}
  .ad-feed-sub{font-size:.72rem;color:var(--text-muted);}
  .ad-occ-bar-wrap{margin-bottom:.75rem;}
  .ad-occ-bar-label{display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.35rem;}
  .ad-occ-track{height:8px;border-radius:99px;background:#f1f5f9;overflow:hidden;}
  .ad-occ-fill{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.22,1,.36,1);}
  .ad-action-card{display:flex;align-items:center;gap:.75rem;padding:.82rem 1rem;border-radius:10px;border:1px solid var(--border);background:#fff;cursor:pointer;transition:all .18s;margin-bottom:.45rem;}
  .ad-action-card:hover{border-color:var(--gold);background:var(--gold-bg);transform:translateX(2px);}
  .ad-action-ico{width:34px;height:34px;border-radius:9px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .18s;}
  .ad-action-card:hover .ad-action-ico{background:rgba(201,168,76,0.15);color:var(--gold-dark);}
  .ad-action-label{font-size:.84rem;font-weight:600;color:var(--text);}
  .ad-action-sub{font-size:.71rem;color:var(--text-muted);}
`;

function TrendBadge({ pct }) {
  if (pct == null || isNaN(pct)) return null;
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) return null;
  if (rounded > 0) return <span className="ad-metric-trend up"><ArrowUpRight size={11}/>+{rounded}%</span>;
  return <span className="ad-metric-trend down"><ArrowDownRight size={11}/>{rounded}%</span>;
}

function DonutChart({ segments, total }) {
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16"/>
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export function AdminDashboard({ token, setPage }) {
  const [kpi,      setKpi]      = useState(null);
  const [revenue,  setRevenue]  = useState([]);
  const [checkins, setCheckins] = useState({ checkins:[], checkouts:[] });
  const [bookings, setBookings] = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [period,   setPeriod]   = useState('monthly');
  const [loading,  setLoading]  = useState(true);

  const today = new Date().toLocaleDateString('en-PH', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  const loadRevenue = async (per) => {
    const r = await getRevenue(token, per).catch(() => null);
    if (!r?.data) return;
    setRevenue(r.data.slice(-12).map(d => ({
      label: d.period?.slice(5,10) || d.period?.slice(0,7) || d.period,
      total: d.total,
    })));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard(token).catch(() => null),
      getCheckins(token).catch(() => ({ checkins:[], checkouts:[] })),
      adminGetBookings(token,'').catch(() => []),
      fetch(`${BASE}/admin/rooms/`, {
        headers: { Authorization:`Bearer ${token}`, 'ngrok-skip-browser-warning':'true' }
      }).then(r => r.json()).catch(() => []),
    ]).then(([k, c, b, r]) => {
      if (k) setKpi(k);
      setCheckins(c || { checkins:[], checkouts:[] });
      setBookings(Array.isArray(b) ? b : []);
      setRooms(Array.isArray(r) ? r : []);
    }).finally(() => setLoading(false));
    loadRevenue(period);
  }, [token]);

  useEffect(() => { loadRevenue(period); }, [period]);

  // ── Booking status counts (from ALL bookings) ──
  const statusCounts = {
    CONFIRMED:       bookings.filter(b => b.status === 'CONFIRMED').length,
    CHECKED_IN:      bookings.filter(b => b.status === 'CHECKED_IN').length,
    PENDING_DEPOSIT: bookings.filter(b => b.status === 'PENDING_DEPOSIT').length,
    COMPLETED:       bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED:       bookings.filter(b => b.status === 'CANCELLED').length,
  };
  const totalBookingsCount = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  // ── Room calculations ──
  const totalRooms     = rooms.length > 0 ? rooms.length : (kpi?.totalRooms || 0);
  const availableRooms = rooms.length > 0 ? rooms.filter(r => r.available).length : (kpi?.availableRooms || 0);

  // In-house = CHECKED_IN bookings (must be before occupiedRooms)
  const inHouseCount = statusCounts.CHECKED_IN;
  // Total booked = all active bookings (confirmed + checked-in + pending)
  const totalBooked  = statusCounts.CONFIRMED + statusCounts.CHECKED_IN + statusCounts.PENDING_DEPOSIT;
  // Occupied = checked-in count (most accurate)
  const occupiedRooms = inHouseCount;
  const occupancyPct  = totalRooms > 0 ? Math.min(100, Math.round((occupiedRooms / totalRooms) * 100)) : 0;

  const revenueTotal   = revenue.reduce((s, r) => s + r.total, 0);
  const recentBookings = bookings.slice(0, 8);

  const donutSegments = [
    { label:'Confirmed',  value:statusCounts.CONFIRMED,       color:'#3b82f6' },
    { label:'Checked In', value:statusCounts.CHECKED_IN,      color:'#2d9b6f' },
    { label:'Pending',    value:statusCounts.PENDING_DEPOSIT, color:'#f59e0b' },
    { label:'Completed',  value:statusCounts.COMPLETED,       color:'#94a3b8' },
    { label:'Cancelled',  value:statusCounts.CANCELLED,       color:'#dc3545' },
  ].filter(s => s.value > 0);

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{ANALYTICS_CSS}</style>

      {/* ── Header ── */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Admin Dashboard</h1>
          <p className="ap-sub">{today}</p>
        </div>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.42rem .9rem', borderRadius:99, background:'#fff', border:'1px solid var(--border)', fontSize:'.75rem', color:'var(--text-sub)', fontWeight:600 }}>
            <Activity size={13} color="var(--green)"/><span style={{ color:'var(--green)', fontWeight:700 }}>Live</span>
          </div>
          <button className="ap-btn-ghost" onClick={() => window.location.reload()} style={{ padding:'.42rem .85rem' }}>
            <RefreshCw size={13}/>Refresh
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="ad-section-title"><BarChart2 size={18}/>Key Metrics</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="ad-metric gold" style={{ animationDelay:`${i*0.06}s` }}>
            <Skel h={14} w={80} mb={10}/><Skel h={10} w="60%" mb={8}/><Skel h={26} w="45%"/>
          </div>
        )) : [
          { Icon:Hotel,      label:'Total Bookings', value:kpi?.totalBookings ?? '—',          color:'gold',   sub:`${statusCounts.CONFIRMED} confirmed`,        pct:kpi?.bookingChangePct },
          { Icon:Users,      label:'Total Guests',   value:kpi?.totalGuests ?? '—',            color:'blue',   sub:'Registered accounts' },
          { Icon:DollarSign, label:'Total Revenue',  value:kpi ? fmt(kpi.totalRevenue) : '—',  color:'green',  sub:'All time collected' },
          { Icon:BedDouble,  label:'Available Rooms',value:availableRooms,                     color:'teal',   sub:`${totalBooked} booked · ${totalRooms} total` },
        ].map((m, i) => (
          <div key={i} className={`ad-metric ${m.color}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="ad-metric-top">
              <div className="ad-metric-ico"><m.Icon size={18}/></div>
              <TrendBadge pct={m.pct}/>
            </div>
            <div className="ad-metric-label">{m.label}</div>
            <div className="ad-metric-value">{m.value}</div>
            <div className="ad-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Today's Operations ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="ad-metric orange" style={{ animationDelay:`${i*0.06}s` }}>
            <Skel h={14} w={80} mb={10}/><Skel h={10} w="60%" mb={8}/><Skel h={26} w="45%"/>
          </div>
        )) : [
          { Icon:LogIn,     label:"Today's Check-ins",  value:kpi?.todaysCheckins  ?? '—', color:'blue',   sub:'Expected arrivals' },
          { Icon:LogOut,    label:"Today's Check-outs", value:kpi?.todaysCheckouts ?? '—', color:'orange', sub:'Expected departures' },
          { Icon:Clock,     label:'Pending Deposits',   value:kpi?.pendingBookings ?? '—', color:'red',    sub:'Awaiting payment' },
          { Icon:CreditCard,label:'In-House Guests',    value:inHouseCount,                color:'purple', sub:'Currently checked in' },
        ].map((m, i) => (
          <div key={i} className={`ad-metric ${m.color}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="ad-metric-top">
              <div className="ad-metric-ico"><m.Icon size={18}/></div>
            </div>
            <div className="ad-metric-label">{m.label}</div>
            <div className="ad-metric-value">{m.value}</div>
            <div className="ad-metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue & Trends ── */}
      <div className="ad-section-title"><TrendingUp size={18}/>Revenue & Trends</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1rem', marginBottom:'1rem' }}>

        {/* Revenue Chart */}
        <div className="ad-chart-panel">
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><BarChart2 size={15}/>Revenue Overview</div>
              <div className="ad-chart-sub">{revenue.length > 0 ? `Total: ${fmt(revenueTotal)} · ${revenue.length} periods` : 'No data yet'}</div>
            </div>
            <div className="ad-period-tabs">
              {['daily','weekly','monthly'].map(p => (
                <button key={p} className={`ad-period-tab${period===p?' on':''}`} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="ad-chart-body">
            {revenue.length > 0
              ? <BarChart data={revenue} height={130}/>
              : <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)', fontSize:'.82rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'.5rem' }}>
                  <BarChart2 size={36} strokeWidth={1} style={{ opacity:.3 }}/>No revenue data for this period
                </div>
            }
          </div>
        </div>

        {/* Room Occupancy */}
        <div className="ad-chart-panel" style={{ marginBottom:0 }}>
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><BedDouble size={15}/>Room Occupancy</div>
              <div className="ad-chart-sub">{loading ? 'Loading…' : `${occupancyPct}% occupied`}</div>
            </div>
          </div>
          <div className="ad-chart-body">
            {loading ? <Spinner/> : (
              <>
                {/* Main occupancy bar */}
                <div style={{ marginBottom:'1.25rem' }}>
                  <div className="ad-occ-bar-label">
                    <span style={{ fontWeight:600, color:'var(--text)', fontSize:'.82rem' }}>Current Occupancy</span>
                    <span style={{ fontWeight:700, fontSize:'.85rem', color: occupancyPct > 80 ? 'var(--green)' : occupancyPct > 50 ? 'var(--orange)' : 'var(--red)' }}>{occupancyPct}%</span>
                  </div>
                  <div className="ad-occ-track">
                    <div className="ad-occ-fill" style={{
                      width:`${Math.max(0, Math.min(100, occupancyPct))}%`,
                      background: occupancyPct > 80 ? 'linear-gradient(to right,#059669,#34d399)' : occupancyPct > 50 ? 'linear-gradient(to right,#d97706,#fbbf24)' : 'linear-gradient(to right,#dc2626,#f87171)',
                    }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.3rem' }}>
                    <span>{occupiedRooms} checked in</span>
                    <span>{availableRooms} available</span>
                  </div>
                </div>

                {/* Room breakdown bars — now includes Total Booked */}
                {[
                  { label:'Total Rooms',   value:totalRooms,    max:Math.max(totalRooms,1), color:'#C9A84C' },
                  { label:'Total Booked',  value:totalBooked,   max:Math.max(totalRooms,1), color:'#7c3aed' },
                  { label:'Checked In',    value:occupiedRooms, max:Math.max(totalRooms,1), color:'#3b82f6' },
                  { label:'Available',     value:availableRooms,max:Math.max(totalRooms,1), color:'#2d9b6f' },
                ].map((row, i) => (
                  <div key={i} className="ad-occ-bar-wrap">
                    <div className="ad-occ-bar-label">
                      <span style={{ fontSize:'.75rem', color:'var(--text-sub)', fontWeight:500 }}>{row.label}</span>
                      <span style={{ fontSize:'.75rem', fontWeight:700, color:'var(--text)' }}>{row.value}</span>
                    </div>
                    <div className="ad-occ-track" style={{ height:6 }}>
                      <div className="ad-occ-fill" style={{ width:`${Math.min(100,(row.value/row.max)*100)}%`, background:row.color }}/>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Booking Breakdown ── */}
      <div className="ad-section-title"><PieChart size={18}/>Booking Breakdown</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>

        {/* Donut chart */}
        <div className="ad-chart-panel" style={{ marginBottom:0 }}>
          <div className="ad-chart-hd">
            <div className="ad-chart-title"><PieChart size={15}/>Status Distribution</div>
          </div>
          <div className="ad-chart-body">
            {loading ? <Spinner/> : (
              <div style={{ display:'flex', alignItems:'center', gap:'2rem' }}>
                <div className="ad-donut-wrap">
                  <DonutChart segments={donutSegments} total={totalBookingsCount}/>
                  <div className="ad-donut-center">
                    <div className="ad-donut-val">{totalBookingsCount}</div>
                    <div className="ad-donut-label">Total</div>
                  </div>
                </div>
                <div className="ad-legend" style={{ flex:1 }}>
                  {donutSegments.map((s, i) => (
                    <div key={i} className="ad-legend-item">
                      <div className="ad-legend-dot" style={{ background:s.color }}/>
                      <span className="ad-legend-name">{s.label}</span>
                      <span className="ad-legend-val">{s.value}</span>
                      <span className="ad-legend-pct">{Math.round((s.value/totalBookingsCount)*100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status summary grid */}
        <div className="ad-chart-panel" style={{ marginBottom:0 }}>
          <div className="ad-chart-hd">
            <div className="ad-chart-title"><Activity size={15}/>Status Summary</div>
            <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.3rem .65rem' }} onClick={() => setPage('bookings')}>
              View All <ChevronRight size={12}/>
            </button>
          </div>
          <div className="ad-chart-body">
            {loading ? <Spinner/> : (
              <>
                <div className="ad-status-grid" style={{ marginBottom:'.85rem' }}>
                  {[
                    { label:'Confirmed',   value:statusCounts.CONFIRMED,       color:'var(--blue)'      },
                    { label:'Checked In',  value:statusCounts.CHECKED_IN,      color:'var(--green)'     },
                    { label:'Pending',     value:statusCounts.PENDING_DEPOSIT, color:'var(--orange)'    },
                    { label:'Completed',   value:statusCounts.COMPLETED,       color:'var(--text-muted)'},
                    { label:'Cancelled',   value:statusCounts.CANCELLED,       color:'var(--red)'       },
                    { label:'Total Booked',value:totalBooked,                  color:'var(--purple)'    },
                  ].map((s, i) => (
                    <div key={i} className="ad-status-item">
                      <div className="ad-status-num" style={{ color:s.color }}>{s.value}</div>
                      <div className="ad-status-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                {statusCounts.PENDING_DEPOSIT > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'.6rem', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:9, padding:'.6rem .85rem', fontSize:'.78rem', color:'var(--orange)', fontWeight:600 }}>
                    <AlertTriangle size={14}/>
                    {statusCounts.PENDING_DEPOSIT} booking{statusCounts.PENDING_DEPOSIT>1?'s':''} awaiting deposit payment
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="ad-section-title"><Activity size={18}/>Recent Activity</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1rem' }}>

        {/* Recent Bookings table */}
        <div className="ad-chart-panel" style={{ marginBottom:0 }}>
          <div className="ad-chart-hd">
            <div>
              <div className="ad-chart-title"><CalendarCheck size={15}/>Recent Bookings</div>
              <div className="ad-chart-sub">{loading ? 'Loading…' : `${bookings.length} total records`}</div>
            </div>
            <button className="ap-btn-ghost" style={{ fontSize:'.72rem', padding:'.3rem .65rem' }} onClick={() => setPage('bookings')}>
              All Bookings <ChevronRight size={12}/>
            </button>
          </div>
          {loading ? (
            <div style={{ padding:'2rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'.65rem' }}><Spinner/></div>
          ) : recentBookings.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty-ico"><CalendarCheck size={40} strokeWidth={1}/></div>
              <div className="ap-empty-title">No bookings yet</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentBookings.map(b => (
                    <tr key={b.id}>
                      <td><span style={{ fontFamily:'monospace', fontSize:'.74rem', color:'var(--gold-dark)', fontWeight:700 }}>{b.bookingReference}</span></td>
                      <td>
                        <div style={{ fontWeight:600, color:'var(--text)', fontSize:'.82rem' }}>{b.guestUsername}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{b.guestEmail}</div>
                      </td>
                      <td style={{ fontSize:'.8rem' }}>{b.roomType} #{b.roomNumber}</td>
                      <td style={{ fontSize:'.76rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtDate(b.checkInDate)}</td>
                      <td><span style={{ fontWeight:700, color:'var(--text)', fontSize:'.82rem' }}>{fmt(b.totalAmount)}</span></td>
                      <td><Pill status={b.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Today's arrivals */}
          <div className="ad-chart-panel" style={{ marginBottom:0 }}>
            <div className="ad-chart-hd">
              <div>
                <div className="ad-chart-title"><LogIn size={15} color="var(--blue)"/>Today's Arrivals</div>
                <div className="ad-chart-sub">{checkins.checkins?.length||0} expected</div>
              </div>
            </div>
            <div style={{ padding:'0 1.25rem' }}>
              {(checkins.checkins||[]).length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'.78rem', padding:'1.25rem 0' }}>No arrivals today</div>
              ) : (checkins.checkins||[]).slice(0,4).map((ci, i) => (
                <div key={i} className="ad-feed-item">
                  <div className="ad-feed-ico check-in"><LogIn size={14}/></div>
                  <div>
                    <div className="ad-feed-name">{ci.user__username||ci.user__email}</div>
                    <div className="ad-feed-sub">Room {ci.room__room_number}</div>
                  </div>
                  <div style={{ marginLeft:'auto' }}><Pill status={ci.status}/></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ad-chart-panel" style={{ marginBottom:0 }}>
            <div className="ad-chart-hd">
              <div className="ad-chart-title"><CheckCircle2 size={15}/>Quick Actions</div>
            </div>
            <div style={{ padding:'.75rem 1rem' }}>
              {[
                { Icon:BedDouble,  label:'Add Room',        sub:'Create listing',       page:'rooms',    color:'rgba(201,168,76,0.12)', iconColor:'#9a7a2e' },
                { Icon:Users,      label:'Manage Guests',   sub:'View accounts',        page:'guests',   color:'rgba(59,130,246,0.1)',  iconColor:'#3b82f6' },
                { Icon:CreditCard, label:'Verify Payments', sub:'Approve transactions', page:'payments', color:'rgba(45,155,111,0.1)',  iconColor:'#2d9b6f' },
                { Icon:Clock,      label:'Support Tickets', sub:'Reply to guests',      page:'support',  color:'rgba(245,158,11,0.1)',  iconColor:'#f59e0b' },
              ].map((a, i) => (
                <div key={i} className="ad-action-card" onClick={() => setPage(a.page)}>
                  <div className="ad-action-ico" style={{ background:a.color, color:a.iconColor }}>
                    <a.Icon size={15}/>
                  </div>
                  <div>
                    <div className="ad-action-label">{a.label}</div>
                    <div className="ad-action-sub">{a.sub}</div>
                  </div>
                  <ChevronRight size={14} style={{ marginLeft:'auto', color:'var(--text-muted)' }}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}