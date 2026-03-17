// PaymentsPage.jsx – Light card UI with Lucide icons
import { useState, useEffect } from 'react';
import { fetchPayments } from '../services/api';
import { fmt, fmtDate } from '../utils/format';
import {
  Wallet, RotateCcw, Receipt, Clock,
  Search, CheckCircle2, AlertCircle, XCircle,
  CreditCard, ArrowDownLeft,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

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
    --orange:     #f59e0b;
    --orange-bg:  rgba(245,158,11,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:linear-gradient(to bottom,rgba(201,168,76,.5),rgba(201,168,76,.2)); border-radius:99px; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

  .py-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .py-root { padding:1.25rem 1rem; } }

  .py-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .py-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .py-sub   { font-size:.82rem; color:var(--text-muted); }

  /* ── Stat cards ── */
  .py-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
  @media(max-width:900px){ .py-stats { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px){ .py-stats { grid-template-columns:1fr 1fr; } }

  .py-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1.1rem 1.15rem; position:relative; overflow:hidden;
    box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s,box-shadow .2s;
  }
  .py-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
  .py-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .py-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .py-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .py-stat.slate::before  { background:linear-gradient(to right,#475569,#94a3b8); }
  .py-stat.red::before    { background:linear-gradient(to right,#dc2626,#f87171); }

  .py-stat-icon {
    width:32px; height:32px; border-radius:8px; margin-bottom:.6rem;
    display:flex; align-items:center; justify-content:center;
  }
  .py-stat.green .py-stat-icon { background:rgba(45,155,111,0.12); color:var(--green); }
  .py-stat.gold  .py-stat-icon { background:rgba(201,168,76,0.12);  color:var(--gold-dark); }
  .py-stat.slate .py-stat-icon { background:#f1f5f9; color:#64748b; }
  .py-stat.red   .py-stat-icon { background:rgba(220,53,69,0.1);   color:var(--red); }

  .py-stat-label { font-size:.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:.28rem; }
  .py-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.85rem; font-weight:600; line-height:1; }
  .py-stat-val.green { color:var(--green); }
  .py-stat-val.gold  { color:var(--gold-dark); }
  .py-stat-val.red   { color:var(--red); }
  .py-stat-val.slate { color:var(--text); }

  /* ── Panel ── */
  .py-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .py-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .py-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); }
  .py-panel-count { font-size:.75rem; color:var(--text-muted); }
  .py-panel-body  { padding:1.15rem 1.25rem; }

  /* ── Toolbar ── */
  .py-toolbar { display:flex; gap:.75rem; align-items:center; margin-bottom:1rem; flex-wrap:wrap; }
  .py-search-wrap { position:relative; flex:1; min-width:160px; }
  .py-search-ico { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; display:flex; }
  .py-search {
    width:100%; background:var(--surface2); border:1px solid var(--border);
    color:var(--text); border-radius:8px; padding:.62rem .85rem .62rem 2.2rem; font-size:.83rem;
    font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s,box-shadow .18s;
  }
  .py-search::placeholder { color:var(--text-muted); }
  .py-search:focus { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

  .py-chips { display:flex; gap:.4rem; flex-wrap:wrap; }
  .py-chip {
    padding:.34rem .82rem; border-radius:99px; font-size:.73rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s;
    border:1px solid var(--border); background:#fff; color:var(--text-muted);
  }
  .py-chip:hover { border-color:var(--gold); color:var(--gold-dark); }
  .py-chip.f-all      { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; border-color:var(--gold); }
  .py-chip.f-paid     { background:var(--green-bg); color:var(--green); border-color:rgba(45,155,111,0.3); }
  .py-chip.f-pending  { background:var(--orange-bg); color:var(--orange); border-color:rgba(245,158,11,0.3); }
  .py-chip.f-failed   { background:var(--red-bg); color:var(--red); border-color:rgba(220,53,69,0.25); }
  .py-chip.f-refunded { background:rgba(220,53,69,0.08); color:var(--red); border-color:rgba(220,53,69,0.2); }

  /* ── Transaction row ── */
  .py-row {
    display:flex; align-items:center; gap:.95rem;
    padding:.88rem .45rem; border-bottom:1px solid #f8f9fb;
    border-radius:8px; margin:0 -.45rem;
    transition:background .15s; animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;
  }
  .py-row:last-child { border-bottom:none; }
  .py-row:hover { background:var(--surface2); }

  .py-ico-wrap {
    width:40px; height:40px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border:1px solid var(--border);
  }
  .py-ico-wrap.paid     { background:var(--green-bg); border-color:rgba(45,155,111,0.22); color:var(--green); }
  .py-ico-wrap.pending  { background:var(--orange-bg); border-color:rgba(245,158,11,0.22); color:var(--orange); }
  .py-ico-wrap.failed   { background:var(--red-bg); border-color:rgba(220,53,69,0.2); color:var(--red); }
  .py-ico-wrap.refund   { background:rgba(220,53,69,0.08); border-color:rgba(220,53,69,0.2); color:var(--red); }

  .py-info { flex:1; min-width:0; }
  .py-desc { font-size:.845rem; color:var(--text); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:.2rem; }
  .py-meta { display:flex; gap:.6rem; font-size:.7rem; color:var(--text-muted); flex-wrap:wrap; align-items:center; }
  .py-dot  { width:3px; height:3px; border-radius:50%; background:#e2e8f0; }

  .py-right  { text-align:right; flex-shrink:0; }
  .py-amount { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); margin-bottom:.25rem; }

  .py-pill {
    display:inline-flex; align-items:center; gap:.28rem;
    padding:.18rem .62rem; border-radius:99px;
    font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
    border:1px solid transparent;
  }
  .py-pill-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
  .py-pill.paid     { background:var(--green-bg);  color:var(--green);  border-color:rgba(45,155,111,0.25); }
  .py-pill.pending  { background:var(--orange-bg); color:var(--orange); border-color:rgba(245,158,11,0.25); }
  .py-pill.failed   { background:var(--red-bg);    color:var(--red);    border-color:rgba(220,53,69,0.25); }
  .py-pill.refund   { background:rgba(220,53,69,0.08); color:var(--red); border-color:rgba(220,53,69,0.2); }

  .py-skel {
    display:block; border-radius:6px;
    background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%);
    background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite;
  }

  .py-empty { text-align:center; padding:3rem 2rem; }
  .py-empty-ico  { display:flex; justify-content:center; margin-bottom:.65rem; opacity:.3; }
  .py-empty-text { font-size:.82rem; color:var(--text-muted); }

  .py-pager { display:flex; justify-content:center; align-items:center; gap:.35rem; padding-top:.95rem; border-top:1px solid var(--border); margin-top:.5rem; }
  .py-pg {
    width:30px; height:30px; border-radius:7px; border:1px solid var(--border);
    background:#fff; color:var(--text-muted); font-size:.78rem;
    font-family:'DM Sans',sans-serif; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s;
  }
  .py-pg:hover:not(:disabled) { border-color:var(--gold); color:var(--gold-dark); }
  .py-pg.on { background:linear-gradient(135deg,#9a7a2e,#C9A84C); border-color:var(--gold); color:#fff; font-weight:700; }
  .py-pg:disabled { opacity:.3; cursor:not-allowed; }
`;

const PAGE_SIZE = 8;

// Detect refund by description — backend stores as type=OTHER with description starting with "Refund"
const isRefund = (p) =>
  p.description?.toLowerCase().startsWith('refund') ||
  p.type === 'REFUND';

const FILTERS = [
  { key:'all',      label:'All'      },
  { key:'PAID',     label:'Paid'     },
  { key:'PENDING',  label:'Pending'  },
  { key:'FAILED',   label:'Failed'   },
  { key:'REFUNDED', label:'Refunded' }, // ← filters by isRefund, not by status field
];

export function PaymentsPage({ token }) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPayments(token)
      .then(data => { if (!cancelled) { setPayments(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(()   => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  // ✅ Fixed filter — REFUNDED filter checks isRefund(), not p.status
  const filtered = payments.filter(p => {
    const matchSearch = !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search);

    let matchFilter = true;
    if (filter === 'REFUNDED') matchFilter = isRefund(p);
    else if (filter !== 'all') matchFilter = p.status === filter && !isRefund(p);

    return matchFilter && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const paid     = payments.filter(p => p.status === 'PAID' && !isRefund(p));
  const refunds  = payments.filter(p => isRefund(p));
  const pending  = payments.filter(p => p.status === 'PENDING');

  const totalPaid    = paid.reduce((s,p) => s + parseFloat(p.amount||0), 0);
  const totalRefunds = refunds.reduce((s,p) => s + parseFloat(p.amount||0), 0);
  const netSpent     = Math.max(0, totalPaid - totalRefunds);

  const stats = [
    { label:'Net Spent',     value: fmt(netSpent),     Icon: Wallet,     color:'green', vc:'green' },
    { label:'Total Refunds', value: fmt(totalRefunds), Icon: RotateCcw,  color:'red',   vc:'red'   },
    { label:'Transactions',  value: payments.length,   Icon: Receipt,    color:'slate', vc:'slate' },
    { label:'Pending',       value: fmt(pending.reduce((s,p)=>s+parseFloat(p.amount||0),0)), Icon: Clock, color:'gold', vc:'gold' },
  ];

  const chipCls = (key) => {
    if (filter !== key) return 'py-chip';
    return `py-chip f-${key.toLowerCase()}`;
  };

  return (
    <div className="py-root">
      <style>{css}</style>

      {/* Header */}
      <div className="py-hd">
        <h1 className="py-title">Payment History</h1>
        <p className="py-sub">Track all your transactions and payment statuses</p>
      </div>

      {/* Stats */}
      <div className="py-stats">
        {stats.map((s, i) => (
          <div key={i} className={`py-stat ${s.color}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="py-stat-icon"><s.Icon size={16}/></div>
            <div className="py-stat-label">{s.label}</div>
            <div className={`py-stat-val ${s.vc}`}>
              {loading ? <span className="py-skel" style={{ display:'block', height:26, width:60 }}/> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Transactions panel */}
      <div className="py-panel" style={{ animationDelay:'.1s' }}>
        <div className="py-panel-hd">
          <div className="py-panel-title">Transactions</div>
          <div className="py-panel-count">{!loading && `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}</div>
        </div>
        <div className="py-panel-body">

          {/* Toolbar */}
          <div className="py-toolbar">
            <div className="py-search-wrap">
              <span className="py-search-ico"><Search size={14}/></span>
              <input
                type="text" className="py-search" placeholder="Search transactions…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="py-chips">
              {FILTERS.map(({ key, label }) => (
                <button key={key} className={chipCls(key)} onClick={() => { setFilter(key); setPage(1); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="py-row">
                <span className="py-skel" style={{ width:40, height:40, borderRadius:10, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <span className="py-skel" style={{ display:'block', height:13, width:'55%', marginBottom:'.4rem' }}/>
                  <span className="py-skel" style={{ display:'block', height:10, width:'38%' }}/>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span className="py-skel" style={{ display:'block', height:17, width:65, marginBottom:'.38rem' }}/>
                  <span className="py-skel" style={{ display:'block', height:18, width:52, borderRadius:99 }}/>
                </div>
              </div>
            ))
          ) : items.length ? (
            items.map((p, idx) => {
              const refund = isRefund(p);
              const sk     = refund ? 'refund' : (p.status || '').toLowerCase();
              return (
                <div key={p.id} className="py-row" style={{ animationDelay:`${idx*0.04}s` }}>

                  {/* Icon */}
                  <div className={`py-ico-wrap ${sk}`}>
                    {refund
                      ? <ArrowDownLeft size={18}/>
                      : p.status === 'PAID'    ? <CheckCircle2 size={18}/>
                      : p.status === 'PENDING' ? <Clock size={18}/>
                      : p.status === 'FAILED'  ? <XCircle size={18}/>
                      : <CreditCard size={18}/>
                    }
                  </div>

                  {/* Info */}
                  <div className="py-info">
                    <div className="py-desc" style={ refund ? { color:'var(--red)' } : {}}>
                      {p.description || 'Payment'}
                    </div>
                    <div className="py-meta">
                      <span style={{ display:'flex', alignItems:'center', gap:'.3rem' }}>
                        {refund
                          ? <><RotateCcw size={11}/> Refund</>
                          : <><CreditCard size={11}/> {p.type?.replace(/_/g,' ') || 'Payment'}</>
                        }
                      </span>
                      {p.bookingId && <><span className="py-dot"/><span>Booking #{p.bookingId}</span></>}
                      <span className="py-dot"/><span>{fmtDate(p.createdAt)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="py-right">
                    <div className="py-amount" style={{ color: refund ? 'var(--red)' : 'var(--text)' }}>
                      {refund ? '−' : ''}{fmt(p.amount)}
                    </div>
                    <div className={`py-pill ${sk}`}>
                      <div className="py-pill-dot"/>
                      {refund ? 'Refunded' : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-empty">
              <div className="py-empty-ico"><Receipt size={44} strokeWidth={1}/></div>
              <div className="py-empty-text">No transactions found</div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="py-pager">
              <button className="py-pg" disabled={page===1} onClick={()=>setPage(page-1)}>‹</button>
              {Array.from({ length:totalPages }, (_,i) => (
                <button key={i} className={`py-pg${page===i+1?' on':''}`} onClick={()=>setPage(i+1)}>{i+1}</button>
              ))}
              <button className="py-pg" disabled={page===totalPages} onClick={()=>setPage(page+1)}>›</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}