// pages/AdminCommissionDashboard.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Building2, DollarSign, Users, Clock,
  CheckCircle2, AlertCircle, Star, Percent, BarChart2,
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Filter,
  Phone, Mail, Globe, Scissors, Sparkles, Heart, Map,
  Car, UtensilsCrossed, Camera, Mountain, ShoppingBag, MoreHorizontal,
  ChevronRight, Activity, Calendar
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .acd-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    padding: 2rem 2.25rem;
  }
  @media (max-width: 768px) { .acd-root { padding: 1.25rem 1rem; } }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .acd-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.75rem;
    animation: fadeInUp .4s ease both;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .acd-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.9rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .18rem;
  }
  .acd-sub { font-size: .82rem; color: var(--text-muted); }

  .refresh-btn {
    display: flex; align-items: center; gap: .4rem;
    padding: .5rem .9rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: .78rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all .18s;
  }
  .refresh-btn:hover { border-color: var(--gold); color: var(--gold-dark); }

  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 1.1rem;
    display: flex;
    align-items: center;
    gap: .55rem;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  @media (max-width: 1000px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .metrics-grid { grid-template-columns: 1fr 1fr; } }

  .metric-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.15rem 1.2rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
    transition: all .3s cubic-bezier(.4,0,.2,1);
    animation: fadeInUp .5s ease both;
  }
  .metric-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px -8px rgba(0,0,0,.12); }
  .metric-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .metric-card.gold::before { background: linear-gradient(90deg, #9a7a2e, #C9A84C); }
  .metric-card.green::before { background: linear-gradient(90deg, #059669, #34d399); }
  .metric-card.blue::before { background: linear-gradient(90deg, #2563eb, #60a5fa); }
  .metric-card.orange::before { background: linear-gradient(90deg, #d97706, #fbbf24); }
  .metric-card.purple::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  .metric-card.teal::before { background: linear-gradient(90deg, #0d9488, #5eead4); }

  .metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .55rem; }
  .metric-ico {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .metric-ico.gold { background: rgba(201,168,76,.13); color: #b08a2a; }
  .metric-ico.green { background: rgba(5,150,105,.1); color: #059669; }
  .metric-ico.blue { background: rgba(37,99,235,.1); color: #2563eb; }
  .metric-ico.orange { background: rgba(217,119,6,.1); color: #d97706; }
  .metric-ico.purple { background: rgba(124,58,237,.1); color: #7c3aed; }
  .metric-ico.teal { background: rgba(13,148,136,.1); color: #0d9488; }

  .metric-badge {
    display: flex; align-items: center; gap: .2rem;
    font-size: .68rem; font-weight: 700;
    padding: .2rem .5rem; border-radius: 999px;
  }
  .metric-badge.up { background: rgba(5,150,105,.1); color: #059669; }
  .metric-badge.down { background: rgba(220,38,38,.1); color: #dc2626; }
  .metric-badge.neutral { background: rgba(107,114,128,.1); color: #6b7280; }

  .metric-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text);
    line-height: 1.1;
    margin-bottom: .2rem;
  }
  .metric-lbl { font-size: .72rem; color: var(--text-muted); font-weight: 500; }

  .chart-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
    animation: fadeInUp .5s ease both;
    margin-bottom: 1.5rem;
  }
  .chart-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1.1rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
  @media (max-width: 860px) { .two-col { grid-template-columns: 1fr; } }

  .partner-row {
    display: flex;
    align-items: center;
    gap: .9rem;
    padding: .75rem .85rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface2);
    margin-bottom: .55rem;
    transition: all .18s;
  }
  .partner-row:hover { border-color: var(--gold); background: var(--gold-bg); }
  .partner-rank {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: var(--surface);
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: .72rem;
    font-weight: 700;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .partner-rank.top { background: linear-gradient(135deg,#9a7a2e,#C9A84C); border-color: transparent; color: #fff; }
  .partner-info { flex: 1; min-width: 0; }
  .partner-info-name { font-weight: 600; font-size: .875rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .partner-info-cat { font-size: .7rem; color: var(--text-muted); }
  .partner-commval { text-align: right; }
  .partner-commval-amount { font-weight: 700; color: var(--gold-dark); font-size: .9rem; }
  .partner-commval-count { font-size: .68rem; color: var(--text-muted); }

  .req-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .8rem;
  }
  .req-table th {
    text-align: left;
    padding: .55rem .75rem;
    font-size: .65rem;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: var(--text-muted);
    font-weight: 700;
    border-bottom: 1px solid var(--border);
  }
  .req-table td {
    padding: .65rem .75rem;
    border-bottom: 1px solid rgba(0,0,0,.04);
    vertical-align: middle;
  }
  .req-table tr:last-child td { border-bottom: none; }
  .req-table tr:hover td { background: var(--surface2); }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    padding: .2rem .55rem;
    border-radius: 999px;
    font-size: .65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .status-pill.PENDING { background: rgba(245,158,11,.1); color: #d97706; }
  .status-pill.CONFIRMED { background: rgba(37,99,235,.1); color: #2563eb; }
  .status-pill.IN_PROGRESS { background: rgba(124,58,237,.1); color: #7c3aed; }
  .status-pill.COMPLETED { background: rgba(5,150,105,.1); color: #059669; }
  .status-pill.CANCELLED { background: rgba(220,38,38,.1); color: #dc2626; }

  .skel {
    background: linear-gradient(90deg, var(--border) 25%, var(--surface2) 50%, var(--border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  .tab-bar {
    display: flex;
    gap: .5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0;
  }
  .tab-item {
    padding: .55rem 1rem;
    font-size: .8rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all .18s;
    font-family: 'DM Sans', sans-serif;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  .tab-item.active { color: var(--gold-dark); border-bottom-color: var(--gold); }
  .tab-item:hover:not(.active) { color: var(--text); }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 2rem auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const COLORS = ['#C9A84C', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fbbf24', '#5eead4', '#f472b6'];

const CATEGORY_ICONS = {
  'Salon & Hair': <Scissors size={14} />,
  'Spa & Wellness': <Sparkles size={14} />,
  'Massage Therapy': <Heart size={14} />,
  'Tourist Guide': <Map size={14} />,
  'Transportation': <Car size={14} />,
  'Dining & Catering': <UtensilsCrossed size={14} />,
  'Photography': <Camera size={14} />,
  'Adventure & Activities': <Mountain size={14} />,
  'Shopping Concierge': <ShoppingBag size={14} />,
  'Other': <MoreHorizontal size={14} />,
};

const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function AdminCommissionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/services/partners/admin/commission-dashboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        console.error('Failed to fetch data:', res.status);
      }
    } catch (e) { 
      console.error('Error fetching data:', e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const summary = data?.summary || {};
  const momGrowth = summary.mom_growth || 0;

  if (loading) {
    return (
      <div className="acd-root">
        <style>{css}</style>
        <div className="acd-header">
          <div>
            <div className="skel" style={{ width: 260, height: 32, marginBottom: 8 }} />
            <div className="skel" style={{ width: 180, height: 16 }} />
          </div>
        </div>
        <div className="metrics-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="metric-card">
              <div className="skel" style={{ height: 80 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="acd-root">
      <style>{css}</style>

      {/* Header */}
      <div className="acd-header">
        <div>
          <h1 className="acd-title">Commission Analytics</h1>
          <p className="acd-sub">Partner services revenue & commission tracking</p>
        </div>
        <button className="refresh-btn" onClick={fetchData} disabled={refreshing}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin .7s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'partners', label: 'By Partner' },
          { key: 'trends', label: 'Trends' },
          { key: 'requests', label: 'All Requests' },
        ].map(t => (
          <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Metrics */}
          <div className="metrics-grid">
            {[
              {
                color: 'gold', icon: <DollarSign size={18} />, val: fmt(summary.total_commission),
                lbl: 'Total Commission Earned',
              },
              {
                color: 'green', icon: <TrendingUp size={18} />, val: fmt(summary.this_month_commission),
                lbl: "This Month's Commission",
                badge: momGrowth !== 0 ? {
                  type: momGrowth > 0 ? 'up' : 'down',
                  text: `${momGrowth > 0 ? '+' : ''}${momGrowth.toFixed(1)}% MoM`,
                } : null,
              },
              {
                color: 'blue', icon: <Building2 size={18} />, val: summary.active_partners || 0,
                lbl: 'Active Partners',
              },
              {
                color: 'orange', icon: <Activity size={18} />, val: summary.total_requests || 0,
                lbl: 'Total Requests',
              },
              {
                color: 'purple', icon: <Clock size={18} />, val: summary.pending_requests || 0,
                lbl: 'Pending Requests',
                sub: `${summary.confirmed_requests || 0} confirmed · ${summary.in_progress_requests || 0} in progress`,
              },
              {
                color: 'teal', icon: <Calendar size={18} />, val: summary.completed_requests || 0,
                lbl: 'Completed',
                sub: `${summary.cancelled_requests || 0} cancelled`,
              },
            ].map((m, i) => (
              <div key={i} className={`metric-card ${m.color}`} style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="metric-top">
                  <div className={`metric-ico ${m.color}`}>{m.icon}</div>
                  {m.badge && (
                    <div className={`metric-badge ${m.badge.type}`}>
                      {m.badge.icon}{m.badge.text}
                    </div>
                  )}
                </div>
                <div className="metric-val">{m.val}</div>
                <div className="metric-lbl">{m.lbl}</div>
                {m.sub && <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Category breakdown + monthly */}
          <div className="two-col">
            <div className="chart-panel">
              <div className="chart-title"><BarChart2 size={16} /> Commission by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.by_category || []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => fmt(v)}
                  />
                  <Bar dataKey="total_commission" name="Commission" radius={[4, 4, 0, 0]}>
                    {(data?.by_category || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-panel">
              <div className="chart-title"><Activity size={16} /> Requests by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data?.by_category || []}
                    dataKey="request_count"
                    nameKey="category"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    label={({ category, percent }) => `${category.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(data?.by_category || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'trends' && (
        <div className="chart-panel">
          <div className="chart-title"><TrendingUp size={16} /> Monthly Commission Trend (Last 6 Months)</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data?.monthly_trend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v, name) => name === 'Commission' ? fmt(v) : v}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="commission" name="Commission" stroke="#C9A84C" strokeWidth={2.5} fill="url(#commGrad)" dot={{ fill: '#C9A84C', r: 4 }} />
              <Area yAxisId="right" type="monotone" dataKey="requests" name="Requests" stroke="#60a5fa" strokeWidth={2} fill="url(#reqGrad)" dot={{ fill: '#60a5fa', r: 3 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'partners' && (
        <div className="chart-panel">
          <div className="chart-title"><Building2 size={16} /> Top Earning Partners</div>
          {(data?.by_partner || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.82rem' }}>
              No completed partner requests yet.
            </div>
          ) : (
            (data?.by_partner || []).map((p, i) => (
              <div key={p.id} className="partner-row">
                <div className={`partner-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</div>
                <div style={{ color: 'var(--gold-dark)', flexShrink: 0 }}>
                  {CATEGORY_ICONS[p.category] || <Building2 size={14} />}
                </div>
                <div className="partner-info">
                  <div className="partner-info-name">{p.name}</div>
                  <div className="partner-info-cat">{p.category} · {p.request_count} requests</div>
                </div>
                <div className="partner-commval">
                  <div className="partner-commval-amount">{fmt(p.total_commission)}</div>
                  <div className="partner-commval-count">of {fmt(p.total_gross)} gross</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="chart-panel">
          <div className="chart-title">
            <CheckCircle2 size={16} /> 
            All Partner Requests
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: '.5rem' }}>
              (Showing last 15 requests of all statuses)
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="req-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Partner</th>
                  <th>Category</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_requests || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No partner requests yet.
                    </td>
                  </tr>
                ) : (
                  (data?.recent_requests || []).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.guest_name}</td>
                      <td>{r.partner_name}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--text-muted)', fontSize: '.75rem' }}>
                          {CATEGORY_ICONS[r.partner_category] || <Building2 size={12} />}
                          {r.partner_category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>#{r.room_number}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(r.total_amount)}</td>
                      <td style={{ 
                        color: r.status === 'COMPLETED' ? '#059669' : 'var(--text-muted)', 
                        fontWeight: r.status === 'COMPLETED' ? 700 : 400 
                      }}>
                        {r.status === 'COMPLETED' ? fmt(r.commission_amount) : '—'}
                      </td>
                      <td>
                        <span className={`status-pill ${r.status}`}>
                          {r.status === 'PENDING' && '⏳ Pending'}
                          {r.status === 'CONFIRMED' && '✓ Confirmed'}
                          {r.status === 'IN_PROGRESS' && '🔄 In Progress'}
                          {r.status === 'COMPLETED' && '✅ Completed'}
                          {r.status === 'CANCELLED' && '❌ Cancelled'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}