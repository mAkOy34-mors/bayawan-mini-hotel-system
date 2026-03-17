// AdminChangeRequests.jsx — View and manage guest booking change requests
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import {
  ArrowRightLeft, Calendar, BedDouble, User, CheckCircle2,
  XCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Filter, Search, MessageSquare,
} from 'lucide-react';

import { API_BASE } from '../constants/config';
import { adminGetChangeRequests, adminApproveChangeReq, adminRejectChangeReq } from './adminApi';
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:      #C9A84C; --gold-dark: #9a7a2e; --gold-bg: rgba(201,168,76,0.1);
    --bg:        #f4f6f8; --surface:   #ffffff;  --surface2: #f8f9fb;
    --text:      #1a1f2e; --text-sub:  #4a5568;  --text-muted: #8a96a8;
    --border:    #e2e8f0;
    --green:     #2d9b6f; --green-bg:  rgba(45,155,111,0.1);
    --red:       #dc3545; --red-bg:    rgba(220,53,69,0.1);
    --blue:      #3b82f6; --blue-bg:   rgba(59,130,246,0.1);
    --orange:    #f59e0b; --orange-bg: rgba(245,158,11,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

  .acr-root { min-height:100vh; background:var(--bg); padding:2rem 2.25rem; font-family:'DM Sans',sans-serif; color:var(--text); }
  @media(max-width:768px){ .acr-root { padding:1.25rem 1rem; } }

  /* Header */
  .acr-hd { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:.75rem; margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .acr-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .acr-sub   { font-size:.82rem; color:var(--text-muted); }

  /* Stats */
  .acr-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:.85rem; margin-bottom:1.5rem; }
  @media(max-width:900px){ .acr-stats { grid-template-columns:repeat(2,1fr); } }

  .acr-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.95rem 1.1rem; position:relative; overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s, box-shadow .2s;
  }
  .acr-stat:hover { transform:translateY(-2px); box-shadow:0 5px 16px rgba(0,0,0,.08); }
  .acr-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .acr-stat.orange::before { background:linear-gradient(to right,#d97706,#fbbf24); }
  .acr-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .acr-stat.red::before    { background:linear-gradient(to right,#dc2626,#f87171); }
  .acr-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .acr-stat-ico { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:.5rem; }
  .acr-stat.orange .acr-stat-ico { background:var(--orange-bg); color:var(--orange); }
  .acr-stat.green  .acr-stat-ico { background:var(--green-bg);  color:var(--green); }
  .acr-stat.red    .acr-stat-ico { background:var(--red-bg);    color:var(--red); }
  .acr-stat.blue   .acr-stat-ico { background:var(--blue-bg);   color:var(--blue); }
  .acr-stat-label { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:.2rem; }
  .acr-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.65rem; font-weight:600; color:var(--text); line-height:1; }

  /* Toolbar */
  .acr-toolbar { display:flex; gap:.75rem; align-items:center; margin-bottom:1.1rem; flex-wrap:wrap; }
  .acr-search-wrap { position:relative; flex:1; min-width:180px; }
  .acr-search-ico  { position:absolute; left:.8rem; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
  .acr-search {
    width:100%; background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.62rem .85rem .62rem 2.2rem; font-size:.83rem;
    font-family:'DM Sans',sans-serif; outline:none; transition:border-color .18s, box-shadow .18s;
  }
  .acr-search:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
  .acr-filter-select {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.6rem .85rem; font-size:.82rem;
    font-family:'DM Sans',sans-serif; outline:none; cursor:pointer;
    transition:border-color .18s;
  }
  .acr-filter-select:focus { border-color:var(--gold); }
  .acr-refresh-btn {
    display:flex; align-items:center; gap:.4rem; padding:.6rem .95rem;
    border-radius:8px; border:1px solid var(--border); background:#fff;
    color:var(--text-sub); font-size:.78rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; transition:all .18s; white-space:nowrap;
  }
  .acr-refresh-btn:hover { border-color:var(--gold); color:var(--gold-dark); }

  /* Panel */
  .acr-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .acr-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.9rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .acr-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); }
  .acr-panel-count { font-size:.75rem; color:var(--text-muted); }

  /* Request row */
  .acr-row {
    display:grid; grid-template-columns:2fr 1.5fr 1.2fr 1fr auto;
    align-items:center; gap:.75rem; padding:.85rem 1.25rem;
    border-bottom:1px solid #f8f9fb; transition:background .15s;
    animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;
  }
  @media(max-width:1100px){ .acr-row { grid-template-columns:1fr 1fr auto; } }
  .acr-row:last-child { border-bottom:none; }
  .acr-row:hover { background:#fafbfc; }

  .acr-row-hd {
    display:grid; grid-template-columns:2fr 1.5fr 1.2fr 1fr auto;
    gap:.75rem; padding:.55rem 1.25rem; background:var(--surface2);
    border-bottom:1px solid var(--border);
  }
  @media(max-width:1100px){ .acr-row-hd { display:none; } }
  .acr-th { font-size:.63rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); }

  .acr-booking-ref { font-size:.72rem; color:var(--text-muted); font-weight:600; letter-spacing:.04em; margin-bottom:.12rem; }
  .acr-guest-name  { font-size:.84rem; font-weight:700; color:var(--text); display:flex; align-items:center; gap:.35rem; }
  .acr-room-type   { font-size:.75rem; color:var(--text-sub); margin-top:.08rem; display:flex; align-items:center; gap:.3rem; }

  .acr-change-type { font-size:.8rem; font-weight:600; color:var(--text); margin-bottom:.18rem; display:flex; align-items:center; gap:.35rem; }
  .acr-change-detail { font-size:.73rem; color:var(--text-muted); }

  .acr-date { font-size:.78rem; color:var(--text-sub); display:flex; align-items:center; gap:.3rem; }

  /* Status pill */
  .acr-pill {
    display:inline-flex; align-items:center; gap:.28rem; padding:.2rem .65rem;
    border-radius:99px; font-size:.65rem; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; border:1px solid transparent; white-space:nowrap;
  }
  .acr-pill-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
  .acr-pill.PENDING  { background:var(--orange-bg); color:var(--orange); border-color:rgba(245,158,11,0.25); }
  .acr-pill.APPROVED { background:var(--green-bg);  color:var(--green);  border-color:rgba(45,155,111,0.25); }
  .acr-pill.REJECTED { background:var(--red-bg);    color:var(--red);    border-color:rgba(220,53,69,0.25); }

  .acr-actions { display:flex; gap:.4rem; align-items:center; }
  .acr-btn {
    display:inline-flex; align-items:center; gap:.3rem;
    padding:.35rem .75rem; border-radius:7px; font-size:.74rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s; border:1px solid;
    white-space:nowrap;
  }
  .acr-btn.view     { background:#fff; color:var(--text-sub); border-color:var(--border); }
  .acr-btn.view:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }
  .acr-btn.approve  { background:#fff; color:var(--green); border-color:rgba(45,155,111,0.3); }
  .acr-btn.approve:hover { background:var(--green-bg); border-color:var(--green); }
  .acr-btn.reject   { background:#fff; color:var(--red); border-color:rgba(220,53,69,0.25); }
  .acr-btn.reject:hover { background:var(--red-bg); border-color:var(--red); }
  .acr-btn:disabled { opacity:.4; cursor:not-allowed; }

  /* Empty */
  .acr-empty { text-align:center; padding:3.5rem 2rem; }
  .acr-empty-ico { display:flex; justify-content:center; margin-bottom:.65rem; opacity:.25; }
  .acr-empty-text { font-size:.84rem; color:var(--text-muted); }

  /* Skel */
  .acr-skel { display:block; border-radius:6px; background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }

  /* Modal */
  .acr-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); }
  .acr-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1.25rem 1.5rem; }
  .acr-modal .modal-body    { background:#fff; padding:1.5rem; }
  .acr-modal .modal-footer  { background:#fafbfc; border-top:1px solid var(--border); padding:1rem 1.5rem; gap:.6rem; }
  .acr-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.15rem; color:var(--text); font-weight:600; display:flex; align-items:center; gap:.5rem; }

  .acr-detail-section { margin-bottom:1.1rem; }
  .acr-detail-label { font-size:.65rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); font-weight:700; margin-bottom:.5rem; display:flex; align-items:center; gap:.5rem; }
  .acr-detail-label::after { content:''; flex:1; height:1px; background:var(--border); }
  .acr-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
  .acr-detail-item-label { font-size:.62rem; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); font-weight:700; margin-bottom:.15rem; }
  .acr-detail-item-val   { font-size:.84rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.35rem; }

  .acr-change-box {
    background:var(--blue-bg); border:1px solid rgba(59,130,246,0.2);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
  }
  .acr-change-box-title { font-size:.78rem; font-weight:700; color:#1d4ed8; margin-bottom:.55rem; display:flex; align-items:center; gap:.4rem; }
  .acr-change-row { display:flex; justify-content:space-between; align-items:center; font-size:.8rem; color:var(--text-sub); padding:.3rem 0; border-bottom:1px solid rgba(59,130,246,0.12); }
  .acr-change-row:last-child { border-bottom:none; }
  .acr-change-from { color:var(--text-muted); text-decoration:line-through; font-size:.75rem; }
  .acr-change-to   { font-weight:700; color:var(--text); }
  .acr-arrow       { color:var(--blue); font-size:.7rem; }

  .acr-reason-box { background:var(--surface2); border:1px solid var(--border); border-radius:9px; padding:.7rem .9rem; font-size:.82rem; color:var(--text-sub); font-style:italic; margin-bottom:1rem; line-height:1.55; }

  .acr-note-field {
    width:100%; background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.65rem .9rem; font-size:.84rem;
    font-family:'DM Sans',sans-serif; outline:none; resize:vertical; min-height:80px;
    transition:border-color .2s, box-shadow .2s;
  }
  .acr-note-field:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

  .acr-modal-err { display:flex; align-items:center; gap:.6rem; background:var(--red-bg); border:1px solid rgba(220,53,69,0.25); border-radius:9px; padding:.65rem .9rem; margin-bottom:1rem; font-size:.8rem; color:var(--red); }

  .acr-btn-approve-modal {
    padding:.6rem 1.3rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#059669,#34d399); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(5,150,105,0.25);
  }
  .acr-btn-approve-modal:hover:not(:disabled) { background:linear-gradient(135deg,#047857,#10b981); }
  .acr-btn-approve-modal:disabled { opacity:.5; cursor:not-allowed; }

  .acr-btn-reject-modal {
    padding:.6rem 1.3rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#dc2626,#f87171); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(220,38,38,0.22);
  }
  .acr-btn-reject-modal:hover:not(:disabled) { background:linear-gradient(135deg,#b91c1c,#ef4444); }
  .acr-btn-reject-modal:disabled { opacity:.5; cursor:not-allowed; }

  .acr-btn-secondary {
    padding:.6rem 1.25rem; border:1px solid var(--border); border-radius:8px;
    background:#fff; color:var(--text-muted); font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .2s;
  }
  .acr-btn-secondary:hover { background:#f8fafc; color:var(--text); }

  @keyframes spin2 { to{transform:rotate(360deg)} }
  .acr-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin2 .7s linear infinite; display:inline-block; }
`;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

export function AdminChangeRequests({ token }) {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);
  const [error,     setError]     = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  

const load = async () => {
  setLoading(true);
  try {
    const data = await adminGetChangeRequests(token);
    setRequests(Array.isArray(data) ? data : []);
  } catch { setRequests([]); }
  finally { setLoading(false); }
};

  useEffect(() => { load(); }, [token]);

  const filtered = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !search ||
      r.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      r.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      r.guestEmail?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = [
    { color:'orange', Icon: Clock,        label:'Pending',  value: requests.filter(r=>r.status==='PENDING').length },
    { color:'green',  Icon: CheckCircle2, label:'Approved', value: requests.filter(r=>r.status==='APPROVED').length },
    { color:'red',    Icon: XCircle,      label:'Rejected', value: requests.filter(r=>r.status==='REJECTED').length },
    { color:'blue',   Icon: ArrowRightLeft, label:'Total',  value: requests.length },
  ];

  const openModal = (req) => {
    setSelected(req);
    setAdminNote(req.adminNote || '');
    setError('');
    setActionSuccess('');
  };

  const handleAction = async (action) => {
  setActioning(true);
  setError('');
  try {
    if (action === 'approve') {
      await adminApproveChangeReq(token, selected.id, adminNote);
    } else {
      await adminRejectChangeReq(token, selected.id, adminNote);
    }
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    setActionSuccess(newStatus);
    setRequests(prev => prev.map(r =>
      r.id === selected.id ? { ...r, status: newStatus, adminNote } : r
    ));
    setSelected(prev => ({ ...prev, status: newStatus, adminNote }));
  } catch (e) {
    setError(e.message);
  } finally {
    setActioning(false);
  }
};

  return (
    <div className="acr-root">
      <style>{css}</style>

      {/* Header */}
      <div className="acr-hd">
        <div>
          <div className="acr-title">Change Requests</div>
          <div className="acr-sub">Review and manage guest booking modification requests</div>
        </div>
        <button className="acr-refresh-btn" onClick={load}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="acr-stats">
        {stats.map((s, i) => (
          <div key={i} className={`acr-stat ${s.color}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="acr-stat-ico"><s.Icon size={15}/></div>
            <div className="acr-stat-label">{s.label}</div>
            <div className="acr-stat-val">
              {loading ? <span className="acr-skel" style={{ display:'block', height:24, width:36 }}/> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="acr-toolbar">
        <div className="acr-search-wrap">
          <Search size={14} className="acr-search-ico"/>
          <input className="acr-search" placeholder="Search by guest name, email or booking ref…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="acr-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Requests</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table Panel */}
      <div className="acr-panel">
        <div className="acr-panel-hd">
          <div className="acr-panel-title">Requests</div>
          <div className="acr-panel-count">{!loading && `${filtered.length} record${filtered.length!==1?'s':''}`}</div>
        </div>

        {/* Column headers */}
        <div className="acr-row-hd">
          <div className="acr-th">Guest / Booking</div>
          <div className="acr-th">Requested Change</div>
          <div className="acr-th">Submitted</div>
          <div className="acr-th">Status</div>
          <div className="acr-th">Actions</div>
        </div>

        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="acr-row">
              <div>
                <span className="acr-skel" style={{ display:'block', height:12, width:'60%', marginBottom:'.4rem' }}/>
                <span className="acr-skel" style={{ display:'block', height:15, width:'45%' }}/>
              </div>
              <div><span className="acr-skel" style={{ display:'block', height:13, width:'75%' }}/></div>
              <div><span className="acr-skel" style={{ display:'block', height:12, width:'55%' }}/></div>
              <div><span className="acr-skel" style={{ display:'block', height:22, width:70, borderRadius:99 }}/></div>
              <div style={{ display:'flex', gap:'.4rem' }}>
                <span className="acr-skel" style={{ display:'block', height:30, width:55, borderRadius:7 }}/>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="acr-empty">
            <div className="acr-empty-ico"><ArrowRightLeft size={44} strokeWidth={1}/></div>
            <div className="acr-empty-text">
              {filter === 'all' ? 'No change requests yet.' : `No ${filter.toLowerCase()} requests found.`}
            </div>
          </div>
        ) : filtered.map((req, idx) => (
          <div key={req.id} className="acr-row" style={{ animationDelay:`${idx*0.04}s` }}>
            {/* Guest / Booking */}
            <div>
              <div className="acr-booking-ref">{req.bookingReference}</div>
              <div className="acr-guest-name"><User size={12}/>{req.guestName || req.guestEmail?.split('@')[0] || '—'}</div>
              <div className="acr-room-type"><BedDouble size={11}/>{req.roomType || req.currentRoomType} Room</div>
            </div>

            {/* Requested change */}
            <div>
              {req.requestedCheckin && req.requestedCheckout && (
                <div className="acr-change-type"><Calendar size={13} color="var(--blue)"/>Date Change</div>
              )}
              {req.requestedRoomType && (
                <div className="acr-change-type"><BedDouble size={13} color="var(--blue)"/>Room Change</div>
              )}
              <div className="acr-change-detail">
                {req.requestedCheckin && req.requestedCheckout
                  ? `${fmtDate(req.requestedCheckin)} → ${fmtDate(req.requestedCheckout)}`
                  : req.requestedRoomType
                  ? `→ ${req.requestedRoomType}`
                  : '—'
                }
                {req.requestedCheckin && req.requestedCheckout && req.requestedRoomType &&
                  ` · → ${req.requestedRoomType}`
                }
              </div>
            </div>

            {/* Date submitted */}
            <div className="acr-date"><Clock size={12}/>{fmtDate(req.createdAt)}</div>

            {/* Status */}
            <div>
              <span className={`acr-pill ${req.status}`}>
                <span className="acr-pill-dot"/>
                {req.status}
              </span>
            </div>

            {/* Actions */}
            <div className="acr-actions">
              <button className="acr-btn view" onClick={() => openModal(req)}>
                View
              </button>
              {req.status === 'PENDING' && (
                <>
                  <button className="acr-btn approve" onClick={() => { openModal(req); }}>
                    <CheckCircle2 size={12}/> Approve
                  </button>
                  <button className="acr-btn reject" onClick={() => { openModal(req); }}>
                    <XCircle size={12}/> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ══ Detail / Action Modal ══ */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg" className="acr-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <ArrowRightLeft size={17} color="var(--blue)"/>
            Change Request — {selected?.bookingReference}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              {error && <div className="acr-modal-err"><AlertTriangle size={14}/> {error}</div>}

              {actionSuccess && (
                <div style={{ display:'flex', alignItems:'center', gap:'.6rem', background: actionSuccess==='APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)', border:`1px solid ${actionSuccess==='APPROVED' ? 'rgba(45,155,111,0.25)' : 'rgba(220,53,69,0.25)'}`, borderRadius:9, padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color: actionSuccess==='APPROVED' ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                  {actionSuccess === 'APPROVED' ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
                  Request {actionSuccess === 'APPROVED' ? 'approved' : 'rejected'} successfully.
                </div>
              )}

              {/* Guest & Booking info */}
              <div className="acr-detail-section">
                <div className="acr-detail-label">Guest & Booking</div>
                <div className="acr-detail-grid">
                  <div>
                    <div className="acr-detail-item-label">Guest</div>
                    <div className="acr-detail-item-val"><User size={13}/>{selected.guestName || '—'}</div>
                  </div>
                  <div>
                    <div className="acr-detail-item-label">Email</div>
                    <div className="acr-detail-item-val" style={{ fontSize:'.78rem' }}>{selected.guestEmail || '—'}</div>
                  </div>
                  <div>
                    <div className="acr-detail-item-label">Booking Ref</div>
                    <div className="acr-detail-item-val">{selected.bookingReference}</div>
                  </div>
                  <div>
                    <div className="acr-detail-item-label">Current Room</div>
                    <div className="acr-detail-item-val"><BedDouble size={13}/>{selected.roomType} Room</div>
                  </div>
                  <div>
                    <div className="acr-detail-item-label">Current Check-In</div>
                    <div className="acr-detail-item-val"><Calendar size={13}/>{fmtDate(selected.currentCheckin)}</div>
                  </div>
                  <div>
                    <div className="acr-detail-item-label">Current Check-Out</div>
                    <div className="acr-detail-item-val"><Calendar size={13}/>{fmtDate(selected.currentCheckout)}</div>
                  </div>
                </div>
              </div>

              {/* Requested changes */}
              <div className="acr-detail-section">
                <div className="acr-detail-label">Requested Changes</div>
                <div className="acr-change-box">
                  <div className="acr-change-box-title"><ArrowRightLeft size={13}/> What the guest wants changed</div>
                  {selected.requestedCheckin && selected.requestedCheckout && (
                    <div className="acr-change-row">
                      <span style={{ display:'flex', alignItems:'center', gap:'.35rem', color:'var(--text-muted)', fontSize:'.8rem' }}><Calendar size={12}/>Check-in Date</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <span className="acr-change-from">{fmtDate(selected.currentCheckin)}</span>
                        <span className="acr-arrow">→</span>
                        <span className="acr-change-to">{fmtDate(selected.requestedCheckin)}</span>
                      </div>
                    </div>
                  )}
                  {selected.requestedCheckin && selected.requestedCheckout && (
                    <div className="acr-change-row">
                      <span style={{ display:'flex', alignItems:'center', gap:'.35rem', color:'var(--text-muted)', fontSize:'.8rem' }}><Calendar size={12}/>Check-out Date</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <span className="acr-change-from">{fmtDate(selected.currentCheckout)}</span>
                        <span className="acr-arrow">→</span>
                        <span className="acr-change-to">{fmtDate(selected.requestedCheckout)}</span>
                      </div>
                    </div>
                  )}
                  {selected.requestedRoomType && (
                    <div className="acr-change-row">
                      <span style={{ display:'flex', alignItems:'center', gap:'.35rem', color:'var(--text-muted)', fontSize:'.8rem' }}><BedDouble size={12}/>Room Type</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <span className="acr-change-from">{selected.roomType}</span>
                        <span className="acr-arrow">→</span>
                        <span className="acr-change-to">{selected.requestedRoomType}</span>
                      </div>
                    </div>
                  )}
                  {selected.requestedCheckin && selected.requestedCheckout && (
                    <div style={{ marginTop:'.45rem', fontSize:'.74rem', color:'var(--blue)', fontWeight:600 }}>
                      New duration: {Math.max(1, Math.ceil((new Date(selected.requestedCheckout) - new Date(selected.requestedCheckin)) / 86400000))} nights
                    </div>
                  )}
                </div>
              </div>

              {/* Guest reason */}
              <div className="acr-detail-section">
                <div className="acr-detail-label">Guest Reason</div>
                <div className="acr-reason-box">{selected.reason || 'No reason provided.'}</div>
              </div>

              {/* Admin note */}
              {selected.status === 'PENDING' ? (
                <div className="acr-detail-section">
                  <div className="acr-detail-label">Admin Note <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none', fontSize:'.72rem' }}>(optional — shown to guest)</span></div>
                  <textarea
                    className="acr-note-field"
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder="e.g. Approved — room has been reassigned. / Rejected — requested dates are fully booked."
                  />
                </div>
              ) : selected.adminNote ? (
                <div className="acr-detail-section">
                  <div className="acr-detail-label">Admin Note</div>
                  <div className="acr-reason-box" style={{ fontStyle:'normal', color:'var(--text)' }}>{selected.adminNote}</div>
                </div>
              ) : null}

              {/* Status badge if already actioned */}
              {selected.status !== 'PENDING' && !actionSuccess && (
                <div style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.75rem 1rem', borderRadius:10, background: selected.status==='APPROVED' ? 'var(--green-bg)' : 'var(--red-bg)', border:`1px solid ${selected.status==='APPROVED'?'rgba(45,155,111,0.2)':'rgba(220,53,69,0.2)'}` }}>
                  {selected.status === 'APPROVED' ? <CheckCircle2 size={16} color="var(--green)"/> : <XCircle size={16} color="var(--red)"/>}
                  <span style={{ fontSize:'.83rem', fontWeight:600, color: selected.status==='APPROVED' ? 'var(--green)' : 'var(--red)' }}>
                    This request was {selected.status.toLowerCase()} on {fmtDate(selected.updatedAt || selected.createdAt)}.
                  </span>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="acr-btn-secondary" onClick={() => setSelected(null)}>Close</button>
          {selected?.status === 'PENDING' && !actionSuccess && (
            <>
              <button className="acr-btn-reject-modal" disabled={actioning} onClick={() => handleAction('reject')}>
                {actioning ? <><span className="acr-spin"/> Processing…</> : <><XCircle size={14}/> Reject Request</>}
              </button>
              <button className="acr-btn-approve-modal" disabled={actioning} onClick={() => handleAction('approve')}>
                {actioning ? <><span className="acr-spin"/> Processing…</> : <><CheckCircle2 size={14}/> Approve Request</>}
              </button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}