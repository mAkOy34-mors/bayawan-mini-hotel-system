// DashboardPage.jsx – Light card UI with Lucide icons
import { useState, useEffect } from 'react';
import { fetchRecentBookings, fetchPayments } from '../services/api';
import { fmt, fmtDate } from '../utils/format';
import {
  Hotel, BedDouble, CheckCircle2, DollarSign, Star,
  CreditCard, User, ChevronRight, Calendar,
  AlertTriangle, RefreshCw, BedSingle, Building2,
  Home, Sparkles, Crown, Gem, TrendingUp,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:       #C9A84C;
    --gold-dark:  #9a7a2e;
    --gold-bg:    rgba(201,168,76,0.1);
    --bg:         #f4f6f8;
    --surface:    #ffffff;
    --surface2:   #f8f9fb;
    --text:       #1a1f2e;
    --text-sub:   #4a5568;
    --text-muted: #8a96a8;
    --border:     #e2e8f0;
    --green:      #2d9b6f;
    --green-bg:   rgba(45,155,111,0.1);
    --red:        #dc3545;
    --red-bg:     rgba(220,53,69,0.1);
    --blue:       #3b82f6;
    --blue-bg:    rgba(59,130,246,0.1);
    --orange:     #f59e0b;
    --orange-bg:  rgba(245,158,11,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:linear-gradient(to bottom,rgba(201,168,76,.5),rgba(201,168,76,.2)); border-radius:99px; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes barUp   { from{transform:scaleY(0)} to{transform:scaleY(1)} }

  .db-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .db-root { padding:1.25rem 1rem; } }

  /* ── Header ── */
  .db-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.6rem; flex-wrap:wrap; gap:.75rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .db-greeting { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .db-greeting em { font-style:normal; color:var(--gold-dark); }
  .db-header-sub { font-size:.82rem; color:var(--text-muted); }
  .db-date-pill {
    display:flex; align-items:center; gap:.45rem; padding:.4rem .9rem;
    border-radius:99px; background:var(--surface); border:1px solid var(--border);
    font-size:.75rem; color:var(--text-sub); white-space:nowrap;
    box-shadow:0 1px 3px rgba(0,0,0,.05);
  }

  /* ── Stat Cards ── */
  .db-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
  @media(max-width:1024px){ .db-stats { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:540px)  { .db-stats { grid-template-columns:1fr 1fr; } }

  .db-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1.15rem 1.2rem; position:relative; overflow:hidden;
    box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s, box-shadow .2s;
  }
  .db-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
  .db-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .db-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .db-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .db-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .db-stat.orange::before { background:linear-gradient(to right,#d97706,#fbbf24); }

  .db-stat-icon {
    width:34px; height:34px; border-radius:9px; margin-bottom:.65rem;
    display:flex; align-items:center; justify-content:center;
    background:#f1f5f9; border:1px solid var(--border);
  }
  .db-stat.gold   .db-stat-icon { background:rgba(201,168,76,0.12);  border-color:rgba(201,168,76,0.2);  color:#9a7a2e; }
  .db-stat.green  .db-stat-icon { background:rgba(45,155,111,0.12);  border-color:rgba(45,155,111,0.2);  color:#2d9b6f; }
  .db-stat.blue   .db-stat-icon { background:rgba(59,130,246,0.12);  border-color:rgba(59,130,246,0.2);  color:#3b82f6; }
  .db-stat.orange .db-stat-icon { background:rgba(245,158,11,0.12);  border-color:rgba(245,158,11,0.2);  color:#f59e0b; }

  .db-stat-label { font-size:.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:.3rem; }
  .db-stat-val { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); line-height:1; }

  /* ── Main layout ── */
  .db-main { display:grid; grid-template-columns:1fr 300px; gap:1rem; }
  @media(max-width:1050px){ .db-main { grid-template-columns:1fr; } }

  /* ── Panel ── */
  .db-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
  }
  .db-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .db-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); }
  .db-panel-sub   { font-size:.72rem; color:var(--text-muted); margin-top:.08rem; }
  .db-panel-body  { padding:1.15rem 1.25rem; }

  .db-view-all {
    padding:.35rem .85rem; border-radius:8px; border:1px solid var(--border);
    background:#fff; color:var(--text-sub); font-size:.75rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .18s;
    display:inline-flex; align-items:center; gap:.3rem;
  }
  .db-view-all:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }

  /* ── Table ── */
  .db-table { width:100%; border-collapse:collapse; }
  .db-table th {
    font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
    color:var(--text-muted); padding:.6rem .8rem; text-align:left;
    border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .db-table td { padding:.78rem .8rem; border-bottom:1px solid #f8f9fb; font-size:.83rem; color:var(--text-sub); vertical-align:middle; }
  .db-table tr:last-child td { border-bottom:none; }
  .db-table tr:hover td { background:#fafbfc; }

  .db-room-cell { display:flex; align-items:center; gap:.5rem; }
  .db-room-ico {
    width:32px; height:32px; border-radius:8px;
    background:var(--gold-bg); border:1px solid rgba(201,168,76,0.18);
    display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#9a7a2e;
  }
  .db-room-name { font-weight:600; color:var(--text); font-size:.84rem; }
  .db-date-sm   { font-size:.72rem; color:var(--text-muted); }

  /* Status pill */
  .db-pill {
    display:inline-flex; align-items:center; gap:.28rem;
    padding:.2rem .65rem; border-radius:99px;
    font-size:.67rem; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; border:1px solid transparent;
  }
  .db-pill-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
  .db-pill.COMPLETED { background:var(--green-bg); color:var(--green); border-color:rgba(45,155,111,0.25); }
  .db-pill.CONFIRMED { background:var(--blue-bg);  color:var(--blue);  border-color:rgba(59,130,246,0.25); }
  .db-pill.PENDING   { background:var(--orange-bg);color:var(--orange);border-color:rgba(245,158,11,0.25); }
  .db-pill.CANCELLED { background:var(--red-bg);   color:var(--red);   border-color:rgba(220,53,69,0.25); }
  .db-pill.PENDING_DEPOSIT { background:var(--orange-bg);color:var(--orange);border-color:rgba(245,158,11,0.25); }

  /* ── Pagination ── */
  .db-pager {
    display:flex; align-items:center; justify-content:space-between;
    padding:.85rem 1.25rem; border-top:1px solid var(--border); background:var(--surface2);
    flex-wrap:wrap; gap:.5rem;
  }
  .db-pager-info { font-size:.75rem; color:var(--text-muted); }
  .db-pager-info strong { color:var(--text-sub); }
  .db-pager-btns { display:flex; align-items:center; gap:.3rem; }
  .db-pg {
    width:30px; height:30px; border-radius:7px; border:1px solid var(--border);
    background:#fff; color:var(--text-muted); font-size:.78rem;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s;
  }
  .db-pg.wide { width:auto; padding:0 .65rem; font-size:.73rem; }
  .db-pg:hover:not(:disabled) { border-color:var(--gold); color:var(--gold-dark); }
  .db-pg.on { background:linear-gradient(135deg,#9a7a2e,#C9A84C); border-color:var(--gold); color:#fff; font-weight:700; }
  .db-pg:disabled { opacity:.35; cursor:not-allowed; }

  /* ── Quick Actions ── */
  .db-qa { display:flex; flex-direction:column; gap:.35rem; }
  .db-qa-item {
    display:flex; align-items:center; gap:.75rem;
    padding:.72rem .85rem; border-radius:10px;
    border:1px solid transparent; cursor:pointer; transition:all .18s;
  }
  .db-qa-item:hover { background:var(--surface2); border-color:var(--border); }
  .db-qa-ico {
    width:36px; height:36px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    background:#f1f5f9; border:1px solid var(--border); flex-shrink:0; color:#64748b;
    transition:all .18s;
  }
  .db-qa-item:hover .db-qa-ico { background:var(--gold-bg); border-color:rgba(201,168,76,0.25); color:var(--gold-dark); }
  .db-qa-label { font-size:.83rem; font-weight:600; color:var(--text); }
  .db-qa-sub   { font-size:.7rem; color:var(--text-muted); margin-top:.05rem; }
  .db-qa-arr   { margin-left:auto; color:var(--text-muted); transition:transform .18s; display:flex; }
  .db-qa-item:hover .db-qa-arr { transform:translateX(3px); color:var(--gold-dark); }

  /* ── Status breakdown ── */
  .db-sbar-item { margin-bottom:.8rem; }
  .db-sbar-row { display:flex; justify-content:space-between; margin-bottom:.3rem; }
  .db-sbar-lbl { font-size:.76rem; color:var(--text-sub); }
  .db-sbar-cnt { font-size:.76rem; font-weight:700; color:var(--text); }
  .db-sbar-track { height:5px; border-radius:99px; background:#f1f5f9; }
  .db-sbar-fill  { height:100%; border-radius:99px; transition:width .6s ease; }

  /* ── Activity feed ── */
  .db-act-item { display:flex; gap:.65rem; padding:.68rem 0; border-bottom:1px solid #f8f9fb; }
  .db-act-item:last-child { border-bottom:none; }
  .db-act-dot-col { display:flex; flex-direction:column; align-items:center; gap:.12rem; padding-top:3px; }
  .db-act-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .db-act-line { flex:1; width:1px; background:var(--border); min-height:14px; }
  .db-act-text { font-size:.79rem; color:var(--text-sub); line-height:1.5; }
  .db-act-text strong { color:var(--text); }
  .db-act-time { font-size:.68rem; color:var(--text-muted); margin-top:.12rem; }

  /* ── Bar chart ── */
  .db-chart { display:flex; align-items:flex-end; gap:.45rem; position:relative; padding-bottom:1.4rem; }
  .db-chart-grid {
    position:absolute; inset:0 0 1.4rem 0; pointer-events:none;
    background-image:repeating-linear-gradient(to top,transparent 0%,transparent calc(25% - 1px),#f1f5f9 calc(25% - 1px),#f1f5f9 25%);
  }
  .db-bar-wrap { flex:1; display:flex; flex-direction:column; align-items:center; gap:.38rem; }
  .db-bar-outer { width:100%; display:flex; align-items:flex-end; }
  .db-bar-inner {
    width:100%; border-radius:5px 5px 0 0; cursor:pointer; position:relative;
    background:linear-gradient(to top,rgba(201,168,76,.7),rgba(201,168,76,.3));
    transform-origin:bottom; animation:barUp .5s cubic-bezier(.22,1,.36,1) both;
    transition:background .18s;
  }
  .db-bar-inner:hover { background:linear-gradient(to top,#C9A84C,rgba(201,168,76,.55)); }
  .db-bar-inner::after { content:attr(data-v); position:absolute; bottom:calc(100% + 3px); left:50%; transform:translateX(-50%); font-size:.59rem; color:var(--gold-dark); white-space:nowrap; opacity:0; transition:opacity .15s; }
  .db-bar-inner:hover::after { opacity:1; }
  .db-bar-lbl { font-size:.6rem; color:var(--text-muted); letter-spacing:.02em; }

  /* ── Skeleton ── */
  .db-skel {
    display:block; border-radius:6px;
    background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%);
    background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite;
  }

  /* ── Empty ── */
  .db-empty { text-align:center; padding:3rem 2rem; }
  .db-empty-ico { display:flex; justify-content:center; margin-bottom:.65rem; opacity:.35; }
  .db-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--text-sub); margin-bottom:.3rem; }
  .db-empty-sub   { font-size:.78rem; color:var(--text-muted); margin-bottom:1rem; }
  .db-book-btn {
    display:inline-flex; align-items:center; gap:.4rem; padding:.5rem 1.1rem;
    border-radius:8px; border:1.5px solid var(--border); background:#fff;
    color:var(--text); font-size:.82rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; transition:all .18s;
  }
  .db-book-btn:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }

  .db-spin { width:22px; height:22px; border:2.5px solid #e2e8f0; border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; margin:0 auto .75rem; }
`;

const STATUS_COLORS = { COMPLETED:'#2d9b6f', CONFIRMED:'#3b82f6', PENDING:'#f59e0b', CANCELLED:'#dc3545', PENDING_DEPOSIT:'#f59e0b' };
const PAGE_SIZE = 5;

const getRoomIcon = (roomType) => {
  const t = roomType?.toUpperCase();
  if (t === 'STANDARD')     return <BedSingle  size={16}/>;
  if (t === 'DELUXE')       return <Sparkles   size={16}/>;
  if (t === 'SUITE')        return <Crown      size={16}/>;
  if (t === 'PRESIDENTIAL') return <Gem        size={16}/>;
  if (t === 'VILLA')        return <Home       size={16}/>;
  return <Hotel size={16}/>;
};

function StatusPill({ status }) {
  const labels = { COMPLETED:'Completed', CONFIRMED:'Confirmed', PENDING:'Pending', CANCELLED:'Cancelled', PENDING_DEPOSIT:'Pending Deposit' };
  return (
    <span className={`db-pill ${status}`}>
      <span className="db-pill-dot"/>
      {labels[status] || status}
    </span>
  );
}

function BarChart({ data, height = 110 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="db-chart" style={{ height: height + 22 }}>
      <div className="db-chart-grid"/>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * height);
        return (
          <div key={i} className="db-bar-wrap">
            <div className="db-bar-outer" style={{ height }}>
              <div className="db-bar-inner" style={{ height: h, animationDelay: `${i * 0.05}s` }} data-v={fmt(d.value)}/>
            </div>
            <span className="db-bar-lbl">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function getUsername(user) {
  return user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';
}

export function DashboardPage({ user, token, t, setPage }) {
  const [bookings,    setBookings]    = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [today]                       = useState(() => new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }));

  const load = () => {
    setLoading(true); setError(null);
    Promise.all([
      fetchRecentBookings(token),
      fetchPayments(token).catch(() => []),
    ])
      .then(([bData, pData]) => {
        setBookings(Array.isArray(bData) ? bData : []);
        setPayments(Array.isArray(pData) ? pData : []);
        setLoading(false);
      })
      .catch(err => { setError(err?.message || 'Failed to load.'); setLoading(false); });
  };

  useEffect(() => { load(); }, [token]);

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const pageStart  = (currentPage - 1) * PAGE_SIZE;
  const visible    = bookings.slice(pageStart, pageStart + PAGE_SIZE);

  // Calculate totals — deduct refunds from total spent
  const isRefund   = (p) => p.description?.toLowerCase().startsWith('refund') || p.type === 'REFUND';
  const paidPayments   = payments.filter(p => p.status === 'PAID' && !isRefund(p));
  const refundPayments = payments.filter(p => p.status === 'PAID' && isRefund(p));
  const totalPaid      = paidPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalRefunds   = refundPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const netSpent       = Math.max(0, totalPaid - totalRefunds);

  // Fallback: if no payment records yet, use depositAmount (what was actually paid)
  const netSpentFinal  = netSpent > 0
    ? netSpent
    : bookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((s, b) => s + parseFloat(b.depositAmount || 0), 0);

  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const rewards   = bookings
    .filter(b => b.status !== 'CANCELLED')
    .reduce((s, b) => s + Math.floor((b.totalAmount || 0) / 100) * 10, 0);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
    const val = bookings.filter(b => {
      const bd = new Date(b.checkInDate);
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
        && b.status !== 'CANCELLED';
    }).reduce((s, b) => s + parseFloat(b.depositAmount || 0), 0);
    return { label: months[d.getMonth()].slice(0, 3), value: val };
  });

  const statusCounts = { COMPLETED:0, CONFIRMED:0, PENDING:0, CANCELLED:0 };
  bookings.forEach(b => { if (statusCounts[b.status] !== undefined) statusCounts[b.status]++; });

  const statCards = [
    { Icon: Hotel,        label:'Total Bookings',  value: bookings.length,               color:'gold'   },
    { Icon: CheckCircle2, label:'Completed Stays', value: completed,                     color:'green'  },
    { Icon: DollarSign,   label:'Net Spent',       value: fmt(netSpentFinal),            color:'blue'   },
    { Icon: Star,         label:'Reward Points',   value: rewards.toLocaleString(),      color:'orange' },
  ];

  const quickActions = [
    { Icon: BedDouble,  label:'Book a Room',    sub:'Check availability',     act: () => setPage('bookings') },
    { Icon: CreditCard, label:'Make Payment',   sub:'Settle outstanding dues', act: () => setPage('payments') },
    { Icon: User,       label:'Update Profile', sub:'Manage your information', act: () => setPage('profile') },
    { Icon: Star,       label:'View Rewards',   sub:'Redeem your points',      act: () => setPage('rewards') },
  ];

  const pageBtns = () => {
    const btns = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) btns.push(i); }
    else {
      btns.push(1);
      if (currentPage > 3) btns.push('…');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) btns.push(i);
      if (currentPage < totalPages - 2) btns.push('…');
      btns.push(totalPages);
    }
    return btns;
  };

  return (
    <div className="db-root">
      <style>{css}</style>

      {/* Header */}
      <div className="db-header">
        <div>
          <h1 className="db-greeting">Welcome back, <em>{getUsername(user)}</em></h1>
          <p className="db-header-sub">Here's your stay overview at Cebu Grand Hotel</p>
        </div>
        <div className="db-date-pill">
          <Calendar size={13}/> {today}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.9rem 1.15rem', borderRadius:12, marginBottom:'1.25rem', background:'rgba(220,53,69,0.06)', border:'1px solid rgba(220,53,69,0.2)', animation:'fadeUp .4s both' }}>
          <AlertTriangle size={18} color="#dc3545"/>
          <div style={{ flex:1, fontSize:'.82rem', color:'#dc3545', fontWeight:600 }}>Failed to load — {error}</div>
          <button className="db-view-all" onClick={load} style={{ display:'flex', alignItems:'center', gap:'.35rem' }}>
            <RefreshCw size={12}/> Retry
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="db-stats">
        {statCards.map((s, i) => (
          <div key={i} className={`db-stat ${s.color}`} style={{ animationDelay:`${i*0.07}s` }}>
            <div className="db-stat-icon"><s.Icon size={16}/></div>
            <div className="db-stat-label">{s.label}</div>
            <div className="db-stat-val">{loading ? <span className="db-skel" style={{ display:'block', height:28, width:60 }}/> : s.value}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="db-main">

        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Revenue chart */}
          {!loading && bookings.length > 0 && (
            <div className="db-panel" style={{ animationDelay:'.05s' }}>
              <div className="db-panel-hd">
                <div>
                  <div className="db-panel-title">Monthly Revenue</div>
                  <div className="db-panel-sub">Last 7 months booking revenue</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem', fontSize:'.85rem', color:'var(--gold-dark)', fontWeight:700 }}>
                  <TrendingUp size={15}/> {fmt(chartData.reduce((s,d)=>s+d.value,0))}
                </div>
              </div>
              <div className="db-panel-body">
                <BarChart data={chartData}/>
              </div>
            </div>
          )}

          {/* Bookings table */}
          <div className="db-panel" style={{ animationDelay:'.08s' }}>
            <div className="db-panel-hd">
              <div>
                <div className="db-panel-title">{t?.recentBookings || 'Recent Bookings'}</div>
                <div className="db-panel-sub">{loading ? 'Loading…' : `${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}`}</div>
              </div>
              <button className="db-view-all" onClick={() => setPage('bookings')}>
                {t?.viewAll || 'View All'} <ChevronRight size={13}/>
              </button>
            </div>

            {loading ? (
              <div style={{ padding:'3rem 2rem', textAlign:'center' }}>
                <div className="db-spin"/>
                <div style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>Fetching your bookings…</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-ico"><Hotel size={44} strokeWidth={1}/></div>
                <div className="db-empty-title">No bookings yet</div>
                <div className="db-empty-sub">Your reservations will appear here once you book a room.</div>
                <button className="db-book-btn" onClick={() => setPage('bookings')}>
                  <BedDouble size={14}/> Book a Room
                </button>
              </div>
            ) : (
              <>
                <div style={{ overflowX:'auto' }}>
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Check-in / Check-out</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="db-room-cell">
                              <div className="db-room-ico">{getRoomIcon(b.roomType)}</div>
                              <div className="db-room-name">{b.roomType}</div>
                            </div>
                          </td>
                          <td>
                            <div className="db-date-sm">{fmtDate(b.checkInDate)}</div>
                            <div className="db-date-sm" style={{ color:'#cbd5e1' }}>→ {fmtDate(b.checkOutDate)}</div>
                          </td>
                          <td><span style={{ fontWeight:700, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmt(b.totalAmount)}</span></td>
                          <td><StatusPill status={b.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="db-pager">
                  <div className="db-pager-info">
                    Showing <strong>{pageStart+1}–{Math.min(pageStart+PAGE_SIZE,bookings.length)}</strong> of <strong>{bookings.length}</strong>
                  </div>
                  <div className="db-pager-btns">
                    <button className="db-pg wide" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>← Prev</button>
                    {pageBtns().map((p, i) =>
                      p === '…'
                        ? <span key={i} style={{ color:'#cbd5e1', fontSize:'.78rem', padding:'0 .1rem' }}>…</span>
                        : <button key={i} className={`db-pg${currentPage===p?' on':''}`} onClick={()=>setCurrentPage(p)}>{p}</button>
                    )}
                    <button className="db-pg wide" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Quick Actions */}
          <div className="db-panel">
            <div className="db-panel-hd">
              <div className="db-panel-title">Quick Actions</div>
            </div>
            <div className="db-panel-body">
              <div className="db-qa">
                {quickActions.map((a, i) => (
                  <div key={i} className="db-qa-item" onClick={a.act}>
                    <div className="db-qa-ico"><a.Icon size={16}/></div>
                    <div>
                      <div className="db-qa-label">{a.label}</div>
                      <div className="db-qa-sub">{a.sub}</div>
                    </div>
                    <span className="db-qa-arr"><ChevronRight size={15}/></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          {!loading && bookings.length > 0 && (
            <div className="db-panel" style={{ animationDelay:'.08s' }}>
              <div className="db-panel-hd">
                <div className="db-panel-title">Booking Status</div>
              </div>
              <div className="db-panel-body">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="db-sbar-item">
                    <div className="db-sbar-row">
                      <span className="db-sbar-lbl">{status.charAt(0)+status.slice(1).toLowerCase()}</span>
                      <span className="db-sbar-cnt">{count}</span>
                    </div>
                    <div className="db-sbar-track">
                      <div className="db-sbar-fill" style={{ width: bookings.length ? `${(count/bookings.length)*100}%` : '0%', background: STATUS_COLORS[status] }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="db-panel" style={{ animationDelay:'.12s' }}>
            <div className="db-panel-hd">
              <div className="db-panel-title">Recent Activity</div>
            </div>
            <div className="db-panel-body">
              {bookings.length === 0
                ? <div style={{ color:'var(--text-muted)', fontSize:'.79rem', textAlign:'center', padding:'.5rem 0' }}>No recent activity</div>
                : bookings.slice(0, 5).map((b, i) => (
                    <div key={i} className="db-act-item">
                      <div className="db-act-dot-col">
                        <div className="db-act-dot" style={{ background: STATUS_COLORS[b.status] || '#C9A84C' }}/>
                        {i < 4 && <div className="db-act-line"/>}
                      </div>
                      <div>
                        <div className="db-act-text"><strong>{b.roomType}</strong> — {b.status?.charAt(0)+b.status?.slice(1).toLowerCase()}</div>
                        <div className="db-act-time">{fmtDate(b.checkInDate)}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}