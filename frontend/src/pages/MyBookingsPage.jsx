// MyBookingsPage.jsx — Guest booking management: view, update special requests, cancel with 50% refund
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { fmt, fmtDate } from '../utils/format';
import { API_BASE } from '../constants/config';
import {
  BedDouble, Calendar, Users, Clock, CreditCard, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Edit3, Trash2, ChevronDown,
  ChevronUp, Hotel, Banknote, ShieldAlert, Info, X,
  ArrowRightLeft, Send, FileEdit, ClipboardCheck,
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
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes errShake{ 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }

  .mb-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .mb-root { padding:1.25rem 1rem; } }

  /* ── Header ── */
  .mb-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .mb-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .mb-sub   { font-size:.82rem; color:var(--text-muted); }

  /* ── Filter tabs ── */
  .mb-tabs { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:1.25rem; }
  .mb-tab {
    padding:.38rem .9rem; border-radius:99px; font-size:.76rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; border:1px solid var(--border);
    background:#fff; color:var(--text-muted); transition:all .18s;
  }
  .mb-tab:hover { border-color:var(--gold); color:var(--gold-dark); }
  .mb-tab.on { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; border-color:var(--gold); }

  /* ── Stats row ── */
  .mb-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:.85rem; margin-bottom:1.5rem; }
  @media(max-width:900px){ .mb-stats { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px){ .mb-stats { grid-template-columns:1fr 1fr; } }

  .mb-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.95rem 1.1rem; position:relative; overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .mb-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .mb-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .mb-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .mb-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .mb-stat.orange::before { background:linear-gradient(to right,#d97706,#fbbf24); }
  .mb-stat-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:.55rem; }
  .mb-stat.gold   .mb-stat-icon { background:rgba(201,168,76,0.12); color:#9a7a2e; }
  .mb-stat.green  .mb-stat-icon { background:rgba(45,155,111,0.12); color:#2d9b6f; }
  .mb-stat.blue   .mb-stat-icon { background:rgba(59,130,246,0.12); color:#3b82f6; }
  .mb-stat.orange .mb-stat-icon { background:rgba(245,158,11,0.12); color:#f59e0b; }
  .mb-stat-label { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:.2rem; }
  .mb-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.65rem; font-weight:600; color:var(--text); line-height:1; }

  /* ── Booking card ── */
  .mb-card {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    margin-bottom:.85rem; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05);
    animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both; transition:border-color .2s, box-shadow .2s;
    position:relative;
  }
  .mb-card:hover { border-color:rgba(201,168,76,0.3); box-shadow:0 4px 18px rgba(0,0,0,.09); }
  .mb-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .mb-card.status-CONFIRMED::before     { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .mb-card.status-PENDING_DEPOSIT::before { background:linear-gradient(to right,#d97706,#fbbf24); }
  .mb-card.status-CHECKED_IN::before    { background:linear-gradient(to right,#059669,#34d399); }
  .mb-card.status-COMPLETED::before     { background:linear-gradient(to right,#64748b,#94a3b8); }
  .mb-card.status-CANCELLED::before     { background:linear-gradient(to right,#dc2626,#f87171); }

  .mb-card-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 1.25rem; gap:.75rem; flex-wrap:wrap;
  }
  .mb-card-left  { display:flex; align-items:center; gap:.85rem; }
  .mb-room-ico {
    width:42px; height:42px; border-radius:11px; flex-shrink:0;
    background:var(--gold-bg); border:1px solid rgba(201,168,76,0.2);
    display:flex; align-items:center; justify-content:center; color:#9a7a2e;
  }
  .mb-ref   { font-size:.72rem; color:var(--text-muted); font-weight:600; letter-spacing:.04em; margin-bottom:.12rem; }
  .mb-rtype { font-size:.96rem; font-weight:700; color:var(--text); }
  .mb-card-right { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }

  /* Status pill */
  .mb-pill {
    display:inline-flex; align-items:center; gap:.28rem; padding:.22rem .7rem;
    border-radius:99px; font-size:.67rem; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; border:1px solid transparent; white-space:nowrap;
  }
  .mb-pill-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
  .mb-pill.CONFIRMED       { background:var(--blue-bg);   color:var(--blue);   border-color:rgba(59,130,246,0.25); }
  .mb-pill.PENDING_DEPOSIT { background:var(--orange-bg); color:var(--orange); border-color:rgba(245,158,11,0.25); }
  .mb-pill.CHECKED_IN      { background:var(--green-bg);  color:var(--green);  border-color:rgba(45,155,111,0.25); }
  .mb-pill.COMPLETED       { background:#f1f5f9;           color:#64748b;       border-color:#e2e8f0; }
  .mb-pill.CANCELLED       { background:var(--red-bg);    color:var(--red);    border-color:rgba(220,53,69,0.25); }

  /* Action buttons */
  .mb-action-btn {
    display:inline-flex; align-items:center; gap:.35rem;
    padding:.38rem .85rem; border-radius:8px; font-size:.76rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s; border:1px solid;
  }
  .mb-action-btn.edit   { background:#fff; color:var(--text-sub); border-color:var(--border); }
  .mb-action-btn.edit:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }
  .mb-action-btn.cancel { background:#fff; color:var(--red); border-color:rgba(220,53,69,0.3); }
  .mb-action-btn.cancel:hover { background:var(--red-bg); border-color:var(--red); }
  .mb-action-btn:disabled { opacity:.4; cursor:not-allowed; }

  /* Expand toggle */
  .mb-expand-btn {
    background:none; border:none; color:var(--text-muted); cursor:pointer;
    display:flex; align-items:center; gap:.25rem; font-size:.74rem; font-weight:600;
    font-family:'DM Sans',sans-serif; padding:.35rem .6rem; border-radius:7px; transition:all .15s;
  }
  .mb-expand-btn:hover { background:var(--surface2); color:var(--text); }

  /* Card detail body */
  .mb-card-body {
    border-top:1px solid var(--border); padding:1rem 1.25rem;
    background:var(--surface2); animation:slideUp .2s ease both;
  }
  .mb-detail-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-bottom:.85rem; }
  @media(max-width:700px){ .mb-detail-grid { grid-template-columns:1fr 1fr; } }
  @media(max-width:480px){ .mb-detail-grid { grid-template-columns:1fr; } }

  .mb-detail-item { }
  .mb-detail-label { font-size:.63rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); font-weight:700; margin-bottom:.18rem; }
  .mb-detail-val   { font-size:.84rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.35rem; }

  .mb-requests-box {
    background:#fff; border:1px solid var(--border); border-radius:9px;
    padding:.65rem .9rem; font-size:.8rem; color:var(--text-sub); font-style:italic;
    margin-top:.25rem;
  }

  /* Amount row */
  .mb-amounts { display:flex; gap:.65rem; flex-wrap:wrap; margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--border); }
  .mb-amt-box {
    flex:1; min-width:120px; background:#fff; border:1px solid var(--border);
    border-radius:9px; padding:.6rem .85rem;
  }
  .mb-amt-label { font-size:.62rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); font-weight:700; margin-bottom:.18rem; }
  .mb-amt-val   { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:var(--text); }
  .mb-amt-val.green  { color:var(--green); }
  .mb-amt-val.orange { color:var(--orange); }
  .mb-amt-val.red    { color:var(--red); }

  /* ── Empty ── */
  .mb-empty { text-align:center; padding:4rem 2rem; background:var(--surface); border:1px solid var(--border); border-radius:14px; }
  .mb-empty-ico { display:flex; justify-content:center; margin-bottom:.75rem; opacity:.3; }
  .mb-empty-text { font-size:.85rem; color:var(--text-muted); line-height:1.7; }

  /* ── Skeleton ── */
  .mb-skel { display:block; border-radius:6px; background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }

  /* ── Spinner ── */
  .mb-spin { width:20px; height:20px; border:2.5px solid #e2e8f0; border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }

  /* ── Modals ── */
  .mb-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); }
  .mb-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1.25rem 1.5rem; }
  .mb-modal .modal-body    { background:#fff; padding:1.5rem; }
  .mb-modal .modal-footer  { background:#fafbfc; border-top:1px solid var(--border); padding:1rem 1.5rem; gap:.6rem; }
  .mb-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.15rem; color:var(--text); font-weight:600; display:flex; align-items:center; gap:.5rem; }

  .mb-modal-err {
    display:flex; align-items:center; gap:.6rem;
    background:var(--red-bg); border:1px solid rgba(220,53,69,0.25); border-radius:9px;
    padding:.65rem .9rem; margin-bottom:1rem; font-size:.8rem; color:var(--red);
    animation:errShake .3s ease;
  }

  .mb-field { display:flex; flex-direction:column; gap:.38rem; margin-bottom:.85rem; }
  .mb-label { font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); font-weight:700; }
  .mb-textarea {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.65rem .9rem; font-size:.85rem;
    font-family:'DM Sans',sans-serif; outline:none; resize:vertical; min-height:90px;
    transition:border-color .2s, box-shadow .2s;
  }
  .mb-textarea:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

  /* Refund info box */
  .mb-refund-box {
    background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.25);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
  }
  .mb-refund-title { font-size:.8rem; font-weight:700; color:#9a7a2e; margin-bottom:.5rem; display:flex; align-items:center; gap:.4rem; }
  .mb-refund-row { display:flex; justify-content:space-between; font-size:.8rem; color:var(--text-sub); margin-bottom:.28rem; }
  .mb-refund-row.total { font-weight:700; color:var(--text); border-top:1px solid rgba(201,168,76,0.2); padding-top:.35rem; margin-top:.35rem; }
  .mb-refund-val { font-weight:700; }
  .mb-refund-val.green { color:var(--green); }
  .mb-refund-val.red   { color:var(--red); }

  /* Warning box in cancel */
  .mb-warn-box {
    display:flex; gap:.65rem; background:var(--red-bg); border:1px solid rgba(220,53,69,0.22);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem; font-size:.8rem; color:var(--red);
    line-height:1.55;
  }

  /* Confirm buttons */
  .mb-btn-cancel-action {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#dc2626,#f87171); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(220,38,38,0.25);
  }
  .mb-btn-cancel-action:hover:not(:disabled) { background:linear-gradient(135deg,#b91c1c,#ef4444); }
  .mb-btn-cancel-action:disabled { opacity:.5; cursor:not-allowed; }

  .mb-btn-save {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(201,168,76,0.3);
  }
  .mb-btn-save:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); }
  .mb-btn-save:disabled { opacity:.5; cursor:not-allowed; }

  .mb-btn-secondary {
    padding:.6rem 1.25rem; border:1px solid var(--border); border-radius:8px;
    background:#fff; color:var(--text-muted); font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .2s;
  }
  .mb-btn-secondary:hover { background:#f8fafc; color:var(--text); }

  /* ── Change Request styles ── */
  .mb-action-btn.change { background:#fff; color:var(--blue); border-color:rgba(59,130,246,0.3); }
  .mb-action-btn.change:hover { background:var(--blue-bg); border-color:var(--blue); }

  .mb-cr-tabs { display:flex; gap:.4rem; margin-bottom:1.1rem; background:var(--surface2); border-radius:10px; padding:.3rem; }
  .mb-cr-tab {
    flex:1; padding:.5rem; border:none; border-radius:8px; font-size:.78rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s;
    background:transparent; color:var(--text-muted);
  }
  .mb-cr-tab.on { background:#fff; color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,.08); }

  .mb-input {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.62rem .85rem; font-size:.85rem;
    font-family:'DM Sans',sans-serif; outline:none; width:100%;
    transition:border-color .2s, box-shadow .2s;
  }
  .mb-input:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
  .mb-input:disabled { background:var(--surface2); color:var(--text-muted); cursor:not-allowed; }
  .mb-select {
    background:#fff; border:1px solid var(--border); color:var(--text);
    border-radius:8px; padding:.62rem .85rem; font-size:.85rem;
    font-family:'DM Sans',sans-serif; outline:none; width:100%;
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.5rem;
    transition:border-color .2s, box-shadow .2s;
  }
  .mb-select:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1); }

  .mb-field-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:560px){ .mb-field-grid2 { grid-template-columns:1fr; } }

  .mb-notice-box {
    display:flex; gap:.55rem; align-items:flex-start;
    background:var(--blue-bg); border:1px solid rgba(59,130,246,0.2);
    border-radius:9px; padding:.65rem .9rem; margin-bottom:.9rem;
    font-size:.78rem; color:#1d4ed8; line-height:1.55;
  }

  .mb-pending-badge {
    display:inline-flex; align-items:center; gap:.3rem;
    padding:.2rem .65rem; border-radius:99px; font-size:.65rem; font-weight:700;
    background:var(--orange-bg); color:var(--orange); border:1px solid rgba(245,158,11,0.25);
    text-transform:uppercase; letter-spacing:.04em;
  }

  .mb-cr-history { margin-top:.75rem; }
  .mb-cr-item {
    display:flex; gap:.75rem; padding:.75rem; border-radius:10px;
    border:1px solid var(--border); background:#fff; margin-bottom:.5rem;
    animation:fadeUp .3s ease both;
  }
  .mb-cr-item-icon { width:34px; height:34px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .mb-cr-item-icon.pending  { background:var(--orange-bg); color:var(--orange); }
  .mb-cr-item-icon.approved { background:var(--green-bg);  color:var(--green); }
  .mb-cr-item-icon.rejected { background:var(--red-bg);    color:var(--red); }
  .mb-cr-type { font-size:.8rem; font-weight:700; color:var(--text); margin-bottom:.12rem; }
  .mb-cr-detail { font-size:.75rem; color:var(--text-muted); line-height:1.5; }
  .mb-cr-note { font-size:.74rem; color:var(--text-sub); margin-top:.25rem; font-style:italic; }
  .mb-btn-blue {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#1d4ed8,#3b82f6); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(59,130,246,0.25);
  }
  .mb-btn-blue:hover:not(:disabled) { background:linear-gradient(135deg,#1e40af,#2563eb); }
  .mb-btn-blue:disabled { opacity:.5; cursor:not-allowed; }
`;

const STATUS_LABEL = {
  CONFIRMED:       'Confirmed',
  PENDING_DEPOSIT: 'Pending Deposit',
  CHECKED_IN:      'Checked In',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
};

const CANCELLABLE = ['CONFIRMED', 'PENDING_DEPOSIT'];
const EDITABLE    = ['CONFIRMED', 'PENDING_DEPOSIT'];
const CHANGEABLE  = ['CONFIRMED', 'PENDING_DEPOSIT'];

function StatusPill({ status }) {
  return (
    <span className={`mb-pill ${status}`}>
      <span className="mb-pill-dot"/>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function BookingCard({ booking, onEdit, onCancel, onChangeRequest }) {
  const [expanded, setExpanded] = useState(false);
  const canEdit         = EDITABLE.includes(booking.status);
  const canCancel       = CANCELLABLE.includes(booking.status);
  const canChange       = CHANGEABLE.includes(booking.status);
  const refund          = booking.depositAmount ? (parseFloat(booking.depositAmount) * 0.5) : 0;
  const hasPendingChange = booking.pendingChangeRequest;

  return (
    <div className={`mb-card status-${booking.status}`}>
      {/* Card header */}
      <div className="mb-card-hd">
        <div className="mb-card-left">
          <div className="mb-room-ico"><BedDouble size={20}/></div>
          <div>
            <div className="mb-ref">{booking.bookingReference}</div>
            <div className="mb-rtype">{booking.room?.roomType || booking.roomType} Room</div>
          </div>
        </div>
        <div className="mb-card-right">
          <StatusPill status={booking.status}/>
          {hasPendingChange && (
            <span className="mb-pending-badge"><Clock size={11}/> Change Pending</span>
          )}
          {canEdit && (
            <button className="mb-action-btn edit" onClick={() => onEdit(booking)}>
              <Edit3 size={13}/> Edit
            </button>
          )}
          {canChange && (
            <button className="mb-action-btn change" onClick={() => onChangeRequest(booking)}>
              <ArrowRightLeft size={13}/> Request Change
            </button>
          )}
          {canCancel && (
            <button className="mb-action-btn cancel" onClick={() => onCancel(booking)}>
              <Trash2 size={13}/> Cancel
            </button>
          )}
          <button className="mb-expand-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

      {/* Quick info strip */}
      <div style={{ display:'flex', gap:'1.25rem', padding:'.55rem 1.25rem', borderTop:'1px solid #f1f5f9', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.38rem', fontSize:'.78rem', color:'var(--text-sub)' }}>
          <Calendar size={13} color="var(--text-muted)"/>
          <span>{fmtDate(booking.checkInDate)} → {fmtDate(booking.checkOutDate)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.38rem', fontSize:'.78rem', color:'var(--text-sub)' }}>
          <Users size={13} color="var(--text-muted)"/>
          <span>{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'Guest' : 'Guests'} · {booking.numberOfNights} {booking.numberOfNights === 1 ? 'night' : 'nights'}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.38rem', fontSize:'.78rem', color:'var(--text-sub)' }}>
          <CreditCard size={13} color="var(--text-muted)"/>
          <span style={{ fontWeight:700, color:'var(--text)' }}>{fmt(booking.totalAmount)}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mb-card-body">
          <div className="mb-detail-grid">
            <div className="mb-detail-item">
              <div className="mb-detail-label">Check-In</div>
              <div className="mb-detail-val"><Calendar size={13}/>{fmtDate(booking.checkInDate)}</div>
            </div>
            <div className="mb-detail-item">
              <div className="mb-detail-label">Check-Out</div>
              <div className="mb-detail-val"><Calendar size={13}/>{fmtDate(booking.checkOutDate)}</div>
            </div>
            <div className="mb-detail-item">
              <div className="mb-detail-label">Duration</div>
              <div className="mb-detail-val"><Clock size={13}/>{booking.numberOfNights} {booking.numberOfNights === 1 ? 'night' : 'nights'}</div>
            </div>
            <div className="mb-detail-item">
              <div className="mb-detail-label">Guests</div>
              <div className="mb-detail-val"><Users size={13}/>{booking.numberOfGuests}</div>
            </div>
            <div className="mb-detail-item">
              <div className="mb-detail-label">Room</div>
              <div className="mb-detail-val"><Hotel size={13}/>{booking.room?.roomNumber || booking.roomNumber || '—'}</div>
            </div>
            <div className="mb-detail-item">
              <div className="mb-detail-label">Payment Status</div>
              <div className="mb-detail-val">
                <span style={{ fontSize:'.72rem', fontWeight:700, padding:'.15rem .55rem', borderRadius:6, background: booking.paymentStatus === 'PAID' ? 'var(--green-bg)' : 'var(--orange-bg)', color: booking.paymentStatus === 'PAID' ? 'var(--green)' : 'var(--orange)' }}>
                  {booking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {booking.specialRequests && (
            <div>
              <div className="mb-detail-label" style={{ marginBottom:'.3rem' }}>Special Requests</div>
              <div className="mb-requests-box">{booking.specialRequests}</div>
            </div>
          )}

          <div className="mb-amounts">
            <div className="mb-amt-box">
              <div className="mb-amt-label">Total Amount</div>
              <div className="mb-amt-val">{fmt(booking.totalAmount)}</div>
            </div>
            <div className="mb-amt-box">
              <div className="mb-amt-label">Deposit Paid</div>
              <div className="mb-amt-val green">{fmt(booking.depositAmount)}</div>
            </div>
            <div className="mb-amt-box">
              <div className="mb-amt-label">Remaining</div>
              <div className={`mb-amt-val ${booking.remainingAmount > 0 ? 'orange' : 'green'}`}>
                {fmt(booking.remainingAmount)}
              </div>
            </div>
            {canCancel && refund > 0 && (
              <div className="mb-amt-box" style={{ borderColor:'rgba(201,168,76,0.3)', background:'rgba(201,168,76,0.04)' }}>
                <div className="mb-amt-label">Cancel Refund</div>
                <div className="mb-amt-val" style={{ color:'#9a7a2e' }}>{fmt(refund)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MyBookingsPage({ token }) {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');

  // Edit modal
  const [editBooking,   setEditBooking]   = useState(null);
  const [editRequests,  setEditRequests]  = useState('');
  const [editSaving,    setEditSaving]    = useState(false);
  const [editError,     setEditError]     = useState('');
  const [editSuccess,   setEditSuccess]   = useState(false);

  // Cancel modal
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelReason,  setCancelReason]  = useState('');
  const [cancelling,    setCancelling]    = useState(false);
  const [cancelError,   setCancelError]   = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(null);

  // Change request modal
  const [crBooking,     setCrBooking]     = useState(null);
  const [crTab,         setCrTab]         = useState('dates'); // 'dates' | 'room' | 'both'
  const [crCheckIn,     setCrCheckIn]     = useState('');
  const [crCheckOut,    setCrCheckOut]    = useState('');
  const [crRoomType,    setCrRoomType]    = useState('');
  const [crReason,      setCrReason]      = useState('');
  const [crSubmitting,  setCrSubmitting]  = useState(false);
  const [crError,       setCrError]       = useState('');
  const [crSuccess,     setCrSuccess]     = useState(false);
  const [crHistory,     setCrHistory]     = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/my-bookings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const FILTERS = [
    { key:'all',             label:'All' },
    { key:'CONFIRMED',       label:'Confirmed' },
    { key:'PENDING_DEPOSIT', label:'Pending' },
    { key:'CHECKED_IN',      label:'Checked In' },
    { key:'COMPLETED',       label:'Completed' },
    { key:'CANCELLED',       label:'Cancelled' },
  ];

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const stats = [
    { color:'gold',   Icon: BedDouble,    label:'Total',     value: bookings.length },
    { color:'blue',   Icon: CheckCircle2, label:'Confirmed', value: bookings.filter(b=>b.status==='CONFIRMED').length },
    { color:'green',  Icon: Hotel,        label:'Completed', value: bookings.filter(b=>b.status==='COMPLETED').length },
    { color:'orange', Icon: XCircle,      label:'Cancelled', value: bookings.filter(b=>b.status==='CANCELLED').length },
  ];

  // ── Edit handlers ──
  const openEdit = (booking) => {
    setEditBooking(booking);
    setEditRequests(booking.specialRequests || '');
    setEditError('');
    setEditSuccess(false);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${API_BASE}/bookings/${editBooking.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ specialRequests: editRequests }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to update booking.');
      }
      setEditSuccess(true);
      setBookings(prev => prev.map(b =>
        b.id === editBooking.id ? { ...b, specialRequests: editRequests } : b
      ));
      setTimeout(() => { setEditBooking(null); setEditSuccess(false); }, 1200);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Cancel handlers ──
  const openCancel = (booking) => {
    setCancelBooking(booking);
    setCancelReason('');
    setCancelError('');
    setCancelSuccess(null);
  };

  // ── Change Request handlers ──
  const openChangeRequest = (booking) => {
    setCrBooking(booking);
    setCrTab('dates');
    setCrCheckIn(booking.checkInDate || '');
    setCrCheckOut(booking.checkOutDate || '');
    setCrRoomType(booking.room?.roomType || booking.roomType || '');
    setCrReason('');
    setCrError('');
    setCrSuccess(false);
    // Load existing change requests for this booking
    loadCrHistory(booking.id);
  };

  const loadCrHistory = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/change-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCrHistory(Array.isArray(data) ? data : []);
      } else {
        setCrHistory([]);
      }
    } catch { setCrHistory([]); }
  };

  const handleChangeRequest = async () => {
    // Validate
    if (crTab === 'dates' || crTab === 'both') {
      if (!crCheckIn || !crCheckOut) { setCrError('Please select both check-in and check-out dates.'); return; }
      if (new Date(crCheckOut) <= new Date(crCheckIn)) { setCrError('Check-out must be after check-in.'); return; }
    }
    if (crTab === 'room' || crTab === 'both') {
      if (!crRoomType) { setCrError('Please select a room type.'); return; }
    }
    if (!crReason.trim()) { setCrError('Please provide a reason for the change request.'); return; }

    setCrSubmitting(true);
    setCrError('');
    try {
      const payload = {
        reason: crReason.trim(),
        ...(crTab !== 'room'  && { requestedCheckin:  crCheckIn,  requestedCheckout: crCheckOut }),
        ...(crTab !== 'dates' && { requestedRoomType: crRoomType }),
      };

      const res = await fetch(`${API_BASE}/bookings/${crBooking.id}/change-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to submit change request.');
      }

      setCrSuccess(true);
      // Mark booking as having a pending change
      setBookings(prev => prev.map(b =>
        b.id === crBooking.id ? { ...b, pendingChangeRequest: true } : b
      ));
      // Refresh history
      loadCrHistory(crBooking.id);
    } catch (e) {
      setCrError(e.message);
    } finally {
      setCrSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`${API_BASE}/bookings/${cancelBooking.id}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to cancel booking.');
      }
      const refund = parseFloat(cancelBooking.depositAmount || 0) * 0.5;
      setCancelSuccess(refund);
      setBookings(prev => prev.map(b =>
        b.id === cancelBooking.id ? { ...b, status: 'CANCELLED' } : b
      ));
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const refundAmount = cancelBooking
    ? parseFloat(cancelBooking.depositAmount || 0) * 0.5
    : 0;

  return (
    <div className="mb-root">
      <style>{css}</style>

      {/* Header */}
      <div className="mb-hd">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
          <div>
            <div className="mb-title">My Bookings</div>
            <div className="mb-sub">Manage your reservations at Cebu Grand Hotel</div>
          </div>
          <button onClick={load} style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.45rem .9rem', borderRadius:8, border:'1px solid var(--border)', background:'#fff', color:'var(--text-sub)', fontSize:'.78rem', fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:'pointer', transition:'all .18s' }}
            onMouseOver={e=>e.currentTarget.style.borderColor='var(--gold)'}
            onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-stats">
        {stats.map((s, i) => (
          <div key={i} className={`mb-stat ${s.color}`} style={{ animationDelay:`${i*0.06}s` }}>
            <div className="mb-stat-icon"><s.Icon size={15}/></div>
            <div className="mb-stat-label">{s.label}</div>
            <div className="mb-stat-val">
              {loading ? <span className="mb-skel" style={{ display:'block', height:24, width:40 }}/> : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-tabs">
        {FILTERS.map(f => (
          <button key={f.key} className={`mb-tab${filter===f.key?' on':''}`} onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key !== 'all' && (
              <span style={{ marginLeft:'.35rem', background:'rgba(0,0,0,0.08)', borderRadius:99, padding:'0 .4rem', fontSize:'.65rem' }}>
                {bookings.filter(b => b.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {loading ? (
        [1,2,3].map(i => (
          <div key={i} className="mb-card" style={{ marginBottom:'.85rem' }}>
            <div style={{ padding:'1rem 1.25rem', display:'flex', gap:'.85rem', alignItems:'center' }}>
              <span className="mb-skel" style={{ width:42, height:42, borderRadius:11 }}/>
              <div style={{ flex:1 }}>
                <span className="mb-skel" style={{ display:'block', height:10, width:'25%', marginBottom:'.4rem' }}/>
                <span className="mb-skel" style={{ display:'block', height:15, width:'40%' }}/>
              </div>
              <span className="mb-skel" style={{ width:90, height:24, borderRadius:99 }}/>
            </div>
          </div>
        ))
      ) : filtered.length === 0 ? (
        <div className="mb-empty">
          <div className="mb-empty-ico"><BedDouble size={44} strokeWidth={1}/></div>
          <div className="mb-empty-text">
            {filter === 'all'
              ? 'You have no bookings yet.'
              : `No ${STATUS_LABEL[filter]?.toLowerCase() || filter} bookings found.`
            }
          </div>
        </div>
      ) : (
        filtered.map((booking, idx) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onEdit={openEdit}
            onCancel={openCancel}
            onChangeRequest={openChangeRequest}
          />
        ))
      )}

      {/* ══ Edit Modal ══ */}
      <Modal show={!!editBooking} onHide={() => setEditBooking(null)} centered className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><Edit3 size={17}/> Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && (
            <div className="mb-modal-err">
              <AlertTriangle size={15}/> {editError}
            </div>
          )}
          {editSuccess && (
            <div style={{ display:'flex', alignItems:'center', gap:'.6rem', background:'var(--green-bg)', border:'1px solid rgba(45,155,111,0.25)', borderRadius:9, padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'var(--green)', fontWeight:600 }}>
              <CheckCircle2 size={15}/> Booking updated successfully!
            </div>
          )}

          {editBooking && (
            <>
              {/* Booking summary */}
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'.75rem 1rem', marginBottom:1 }}>
                <div style={{ fontSize:'.72rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:'.45rem' }}>
                  {editBooking.bookingReference}
                </div>
                <div style={{ display:'flex', gap:'1.1rem', flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.8rem', color:'var(--text-sub)' }}>
                    <BedDouble size={13}/> {editBooking.room?.roomType || editBooking.roomType} Room
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.8rem', color:'var(--text-sub)' }}>
                    <Calendar size={13}/> {fmtDate(editBooking.checkInDate)} → {fmtDate(editBooking.checkOutDate)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop:'.85rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem', fontSize:'.75rem', color:'var(--text-muted)', background:'var(--blue-bg)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'.5rem .8rem', marginBottom:'.85rem' }}>
                  <Info size={13} color="var(--blue)"/>
                  <span>You can update your special requests. Check-in/out dates and room type require contacting hotel support.</span>
                </div>
              </div>

              <div className="mb-field">
                <label className="mb-label">Special Requests</label>
                <textarea
                  className="mb-textarea"
                  value={editRequests}
                  onChange={e => setEditRequests(e.target.value)}
                  placeholder="e.g. high floor, early check-in, extra pillows, baby crib…"
                  rows={4}
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="mb-btn-secondary" onClick={() => setEditBooking(null)}>Cancel</button>
          <button className="mb-btn-save" disabled={editSaving || editSuccess} onClick={handleEditSave}>
            {editSaving ? <><span className="mb-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Saving…</> : <><CheckCircle2 size={14}/> Save Changes</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ══ Cancel Modal ══ */}
      <Modal show={!!cancelBooking} onHide={() => { setCancelBooking(null); setCancelSuccess(null); }} centered className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><XCircle size={17} color="var(--red)"/> Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelError && (
            <div className="mb-modal-err">
              <AlertTriangle size={15}/> {cancelError}
            </div>
          )}

          {cancelSuccess !== null ? (
            /* Success state */
            <div style={{ textAlign:'center', padding:'1rem 0' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'.75rem' }}>
                <CheckCircle2 size={48} strokeWidth={1.5} color="var(--green)"/>
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:600, color:'var(--text)', marginBottom:'.4rem' }}>
                Booking Cancelled
              </div>
              <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'1rem', lineHeight:1.65 }}>
                Your booking has been cancelled successfully.
              </p>
              {cancelSuccess > 0 && (
                <div style={{ background:'var(--green-bg)', border:'1px solid rgba(45,155,111,0.25)', borderRadius:10, padding:'.85rem 1rem', marginBottom:'1rem' }}>
                  <div style={{ fontSize:'.75rem', color:'var(--green)', fontWeight:700, marginBottom:'.25rem', display:'flex', alignItems:'center', gap:'.35rem', justifyContent:'center' }}>
                    <Banknote size={14}/> Refund Issued
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.6rem', fontWeight:600, color:'var(--green)' }}>
                    {fmt(cancelSuccess)}
                  </div>
                  <div style={{ fontSize:'.73rem', color:'var(--text-muted)', marginTop:'.2rem' }}>
                    50% of deposit will be refunded within 5-7 business days
                  </div>
                </div>
              )}
              <button className="mb-btn-save" onClick={() => { setCancelBooking(null); setCancelSuccess(null); }}>
                Done ✓
              </button>
            </div>
          ) : (
            <>
              {cancelBooking && (
                <>
                  {/* Warning */}
                  <div className="mb-warn-box">
                    <ShieldAlert size={18} style={{ flexShrink:0, marginTop:2 }}/>
                    <div>
                      <strong>Are you sure you want to cancel?</strong><br/>
                      This action cannot be undone. Your booking <strong>{cancelBooking.bookingReference}</strong> will be permanently cancelled.
                    </div>
                  </div>

                  {/* Refund breakdown */}
                  {parseFloat(cancelBooking.depositAmount || 0) > 0 && (
                    <div className="mb-refund-box">
                      <div className="mb-refund-title">
                        <Banknote size={14}/> Cancellation Refund Policy
                      </div>
                      <div className="mb-refund-row">
                        <span>Deposit paid</span>
                        <span className="mb-refund-val">{fmt(cancelBooking.depositAmount)}</span>
                      </div>
                      <div className="mb-refund-row">
                        <span>Cancellation fee (50%)</span>
                        <span className="mb-refund-val red">− {fmt(refundAmount)}</span>
                      </div>
                      <div className="mb-refund-row total">
                        <span>Your refund</span>
                        <span className="mb-refund-val green">{fmt(refundAmount)}</span>
                      </div>
                      <div style={{ fontSize:'.71rem', color:'var(--text-muted)', marginTop:'.5rem' }}>
                        Refunds are processed within 5–7 business days to your original payment method.
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="mb-field">
                    <label className="mb-label">Reason for cancellation <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none' }}>(optional)</span></label>
                    <textarea
                      className="mb-textarea"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="e.g. Change of plans, emergency, found a better rate…"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </Modal.Body>
        {cancelSuccess === null && (
          <Modal.Footer>
            <button className="mb-btn-secondary" onClick={() => setCancelBooking(null)}>Keep Booking</button>
            <button className="mb-btn-cancel-action" disabled={cancelling} onClick={handleCancel}>
              {cancelling
                ? <><span className="mb-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Cancelling…</>
                : <><XCircle size={14}/> Confirm Cancellation</>
              }
            </button>
          </Modal.Footer>
        )}
      </Modal>

      {/* ══ Change Request Modal ══ */}
      <Modal show={!!crBooking} onHide={() => { setCrBooking(null); setCrSuccess(false); }} centered size="lg" className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><ArrowRightLeft size={17} color="var(--blue)"/> Request Booking Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {crBooking && (
            <>
              {/* Booking reference strip */}
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'.7rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                  <BedDouble size={16} color="#9a7a2e"/>
                  <div>
                    <div style={{ fontSize:'.7rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase' }}>{crBooking.bookingReference}</div>
                    <div style={{ fontSize:'.84rem', fontWeight:700, color:'var(--text)' }}>{crBooking.room?.roomType || crBooking.roomType} Room</div>
                  </div>
                </div>
                <div style={{ fontSize:'.78rem', color:'var(--text-sub)', display:'flex', alignItems:'center', gap:'.35rem' }}>
                  <Calendar size={12}/> {fmtDate(crBooking.checkInDate)} → {fmtDate(crBooking.checkOutDate)}
                </div>
              </div>

              {/* Notice */}
              <div className="mb-notice-box">
                <Info size={15} style={{ flexShrink:0, marginTop:1 }}/>
                <span>Change requests are reviewed by our team within 24 hours. You'll be notified once your request is approved or rejected. Availability is subject to confirmation.</span>
              </div>

              {crError && (
                <div className="mb-modal-err"><AlertTriangle size={15}/> {crError}</div>
              )}

              {crSuccess ? (
                <div style={{ textAlign:'center', padding:'1rem 0' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'.75rem' }}>
                    <ClipboardCheck size={48} strokeWidth={1.5} color="var(--green)"/>
                  </div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--text)', marginBottom:'.4rem' }}>
                    Request Submitted!
                  </div>
                  <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'1.1rem', lineHeight:1.65 }}>
                    Your change request has been submitted. Our team will review it and respond within 24 hours.
                  </p>
                  <button className="mb-btn-save" onClick={() => { setCrSuccess(false); setCrReason(''); }}>
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <>
                  {/* What to change tabs */}
                  <div className="mb-field">
                    <label className="mb-label">What would you like to change?</label>
                    <div className="mb-cr-tabs">
                      {[
                        { key:'dates', label:'Dates Only' },
                        { key:'room',  label:'Room Type Only' },
                        { key:'both',  label:'Dates & Room' },
                      ].map(tab => (
                        <button key={tab.key} className={`mb-cr-tab${crTab===tab.key?' on':''}`} onClick={() => { setCrTab(tab.key); setCrError(''); }}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date fields */}
                  {(crTab === 'dates' || crTab === 'both') && (
                    <div className="mb-field">
                      <label className="mb-label">Requested Dates</label>
                      <div className="mb-field-grid2">
                        <div>
                          <div style={{ fontSize:'.68rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.3rem' }}>New Check-In</div>
                          <input type="date" className="mb-input" value={crCheckIn}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => { setCrCheckIn(e.target.value); if (crCheckOut && new Date(crCheckOut) <= new Date(e.target.value)) setCrCheckOut(''); }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize:'.68rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.3rem' }}>New Check-Out</div>
                          <input type="date" className="mb-input" value={crCheckOut}
                            min={crCheckIn || new Date().toISOString().split('T')[0]}
                            onChange={e => setCrCheckOut(e.target.value)}
                          />
                        </div>
                      </div>
                      {crCheckIn && crCheckOut && new Date(crCheckOut) > new Date(crCheckIn) && (
                        <div style={{ fontSize:'.75rem', color:'var(--gold-dark)', fontWeight:600, marginTop:'.35rem', display:'flex', alignItems:'center', gap:'.35rem' }}>
                          <Clock size={12}/>
                          {Math.max(1, Math.ceil((new Date(crCheckOut) - new Date(crCheckIn)) / 86400000))} nights requested
                        </div>
                      )}
                    </div>
                  )}

                  {/* Room type field */}
                  {(crTab === 'room' || crTab === 'both') && (
                    <div className="mb-field">
                      <label className="mb-label">Requested Room Type</label>
                      <select className="mb-select" value={crRoomType} onChange={e => setCrRoomType(e.target.value)}>
                        <option value="">Select a room type…</option>
                        {['STANDARD','DELUXE','SUITE','PRESIDENTIAL','VILLA'].map(rt => (
                          <option key={rt} value={rt} disabled={rt === (crBooking.room?.roomType || crBooking.roomType)}>
                            {rt}{rt === (crBooking.room?.roomType || crBooking.roomType) ? ' (current)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="mb-field">
                    <label className="mb-label">Reason for Change <span style={{ color:'var(--red)' }}>*</span></label>
                    <textarea className="mb-textarea" value={crReason} onChange={e => setCrReason(e.target.value)}
                      placeholder="e.g. Family emergency changed our travel dates, we need a larger room for an extra guest…"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Change request history */}
              {crHistory.length > 0 && (
                <div className="mb-cr-history">
                  <div style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.5rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>
                    Previous Requests
                  </div>
                  {crHistory.map((cr, i) => (
                    <div key={i} className="mb-cr-item">
                      <div className={`mb-cr-item-icon ${cr.status?.toLowerCase()}`}>
                        {cr.status === 'APPROVED' ? <CheckCircle2 size={16}/> :
                         cr.status === 'REJECTED' ? <XCircle size={16}/> :
                         <Clock size={16}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div className="mb-cr-type">
                          {cr.requestedCheckin && cr.requestedCheckout
                            ? `Date change → ${fmtDate(cr.requestedCheckin)} – ${fmtDate(cr.requestedCheckout)}`
                            : cr.requestedRoomType
                            ? `Room change → ${cr.requestedRoomType}`
                            : 'Change request'
                          }
                        </div>
                        <div className="mb-cr-detail">{cr.reason}</div>
                        {cr.adminNote && <div className="mb-cr-note">Admin note: {cr.adminNote}</div>}
                      </div>
                      <span style={{
                        fontSize:'.65rem', fontWeight:700, padding:'.2rem .55rem', borderRadius:6,
                        textTransform:'uppercase', whiteSpace:'nowrap',
                        background: cr.status==='APPROVED' ? 'var(--green-bg)' : cr.status==='REJECTED' ? 'var(--red-bg)' : 'var(--orange-bg)',
                        color:      cr.status==='APPROVED' ? 'var(--green)'    : cr.status==='REJECTED' ? 'var(--red)'    : 'var(--orange)',
                      }}>
                        {cr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        {!crSuccess && (
          <Modal.Footer>
            <button className="mb-btn-secondary" onClick={() => setCrBooking(null)}>Close</button>
            <button className="mb-btn-blue" disabled={crSubmitting} onClick={handleChangeRequest}>
              {crSubmitting
                ? <><span className="mb-spin" style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff' }}/> Submitting…</>
                : <><Send size={14}/> Submit Request</>
              }
            </button>
          </Modal.Footer>
        )}
      </Modal>

    </div>
  );
}