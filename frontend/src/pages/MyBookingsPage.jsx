// MyBookingsPage.jsx — Guest booking management: view, update special requests, request cancellation with approval
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { fmt, fmtDate } from '../utils/format';
import { API_BASE } from '../constants/config';
import {
  BedDouble, Calendar, Users, Clock, CreditCard, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Edit3, Trash2, ChevronDown,
  ChevronUp, Hotel, Banknote, ShieldAlert, Info, X,
  ArrowRightLeft, Send, FileEdit, ClipboardCheck, Bell,
  Clock as ClockIcon, Loader2, TrendingUp, TrendingDown, Minus,
  ExternalLink, DollarSign, Star, ArrowUp, ArrowDown,
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
    --purple:     #8b5cf6;
    --purple-bg:  rgba(139,92,246,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.5); border-radius:99px; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes errShake{ 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }

  .mb-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .mb-root { padding:1.25rem 1rem; } }

  /* Header */
  .mb-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .mb-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; }
  .mb-sub   { font-size:.82rem; color:var(--text-muted); }

  /* Filter tabs */
  .mb-tabs { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:1.25rem; }
  .mb-tab {
    padding:.38rem .9rem; border-radius:99px; font-size:.76rem; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; border:1px solid var(--border);
    background:#fff; color:var(--text-muted); transition:all .18s;
  }
  .mb-tab:hover { border-color:var(--gold); color:var(--gold-dark); }
  .mb-tab.on { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; border-color:var(--gold); }

  /* Stats row */
  .mb-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:.85rem; margin-bottom:1.5rem; }
  @media(max-width:1100px){ .mb-stats { grid-template-columns:repeat(3,1fr); } }
  @media(max-width:700px){ .mb-stats { grid-template-columns:repeat(2,1fr); } }

  .mb-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    padding:.85rem 1rem; position:relative; overflow:hidden;
    box-shadow:0 1px 4px rgba(0,0,0,.04); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .mb-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .mb-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }
  .mb-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .mb-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .mb-stat.orange::before { background:linear-gradient(to right,#d97706,#fbbf24); }
  .mb-stat.purple::before { background:linear-gradient(to right,#7c3aed,#a78bfa); }
  .mb-stat-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:.45rem; }
  .mb-stat.gold   .mb-stat-icon { background:rgba(201,168,76,0.12); color:#9a7a2e; }
  .mb-stat.green  .mb-stat-icon { background:rgba(45,155,111,0.12); color:#2d9b6f; }
  .mb-stat.blue   .mb-stat-icon { background:rgba(59,130,246,0.12); color:#3b82f6; }
  .mb-stat.orange .mb-stat-icon { background:rgba(245,158,11,0.12); color:#f59e0b; }
  .mb-stat.purple .mb-stat-icon { background:rgba(139,92,246,0.12); color:#8b5cf6; }
  .mb-stat-label { font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:.2rem; }
  .mb-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:600; color:var(--text); line-height:1; }

  /* Booking card */
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
  .mb-card.status-CANCELLATION_PENDING::before { background:linear-gradient(to right,#8b5cf6,#a78bfa); }

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
  .mb-pill.CANCELLATION_PENDING { background:var(--purple-bg); color:var(--purple); border-color:rgba(139,92,246,0.25); }

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
  .mb-action-btn.change { background:#fff; color:var(--blue); border-color:rgba(59,130,246,0.3); }
  .mb-action-btn.change:hover { background:var(--blue-bg); border-color:var(--blue); }
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

  .mb-detail-label { font-size:.63rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); font-weight:700; margin-bottom:.18rem; }
  .mb-detail-val   { font-size:.84rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.35rem; }

  .mb-requests-box {
    background:#fff; border:1px solid var(--border); border-radius:9px;
    padding:.65rem .9rem; font-size:.8rem; color:var(--text-sub); font-style:italic;
    margin-top:.25rem;
  }

  .mb-amounts { display:flex; gap:.65rem; flex-wrap:wrap; margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--border); }
  .mb-amt-box {
    flex:1; min-width:110px; background:#fff; border:1px solid var(--border);
    border-radius:9px; padding:.6rem .85rem;
  }
  .mb-amt-label { font-size:.62rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); font-weight:700; margin-bottom:.18rem; }
  .mb-amt-val   { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:var(--text); }
  .mb-amt-val.green  { color:var(--green); }
  .mb-amt-val.orange { color:var(--orange); }
  .mb-amt-val.red    { color:var(--red); }

  /* Empty */
  .mb-empty { text-align:center; padding:4rem 2rem; background:var(--surface); border:1px solid var(--border); border-radius:14px; }
  .mb-empty-ico { display:flex; justify-content:center; margin-bottom:.75rem; opacity:.3; }
  .mb-empty-text { font-size:.85rem; color:var(--text-muted); line-height:1.7; }

  /* Skeleton */
  .mb-skel { display:block; border-radius:6px; background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%); background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite; }
  .mb-spin { width:20px; height:20px; border:2.5px solid #e2e8f0; border-top-color:var(--gold); border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }

  /* Modals */
  .mb-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); }
  .mb-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1.25rem 1.5rem; }
  .mb-modal .modal-body    { background:#fff; padding:1.5rem; max-height:75vh; overflow-y:auto; }
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

  /* Cancel request info box */
  .mb-cancel-request-box {
    background:var(--purple-bg); border:1px solid rgba(139,92,246,0.25);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
  }
  .mb-cancel-request-title { font-size:.8rem; font-weight:700; color:#8b5cf6; margin-bottom:.5rem; display:flex; align-items:center; gap:.4rem; }
  .mb-cancel-request-row { display:flex; justify-content:space-between; font-size:.8rem; color:var(--text-sub); margin-bottom:.28rem; }

  /* History item */
  .mb-history-item {
    display:flex; gap:.75rem; padding:.75rem; border-radius:10px;
    border:1px solid var(--border); background:#fff; margin-bottom:.5rem;
    animation:fadeUp .3s ease both;
  }
  .mb-history-icon { width:34px; height:34px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .mb-history-icon.pending         { background:var(--orange-bg); color:var(--orange); }
  .mb-history-icon.approved        { background:var(--green-bg);  color:var(--green); }
  .mb-history-icon.rejected        { background:var(--red-bg);    color:var(--red); }
  .mb-history-icon.payment_pending { background:var(--blue-bg);   color:var(--blue); }

  .mb-btn-cancel-action {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#8b5cf6,#a78bfa); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(139,92,246,0.25);
  }
  .mb-btn-cancel-action:hover:not(:disabled) { background:linear-gradient(135deg,#7c3aed,#8b5cf6); }
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

  /* Change Request Modal — tabs */
  .mb-cr-tabs { display:flex; gap:.4rem; flex-wrap:wrap; }
  .mb-cr-tab {
    flex:1; min-width:90px; padding:.45rem .75rem; border-radius:8px; font-size:.75rem;
    font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .18s;
    border:1.5px solid var(--border); background:#fff; color:var(--text-muted); text-align:center;
  }
  .mb-cr-tab:hover { border-color:var(--blue); color:var(--blue); background:var(--blue-bg); }
  .mb-cr-tab.on {
    background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff;
    border-color:var(--blue); box-shadow:0 2px 8px rgba(59,130,246,0.25);
  }

  /* Change Request Modal — input & select */
  .mb-input, .mb-select {
    background:#fff; border:1.5px solid var(--border); color:var(--text);
    border-radius:8px; padding:.6rem .85rem; font-size:.84rem;
    font-family:'DM Sans',sans-serif; outline:none; width:100%;
    transition:border-color .2s, box-shadow .2s; appearance:none;
  }
  .mb-input:focus, .mb-select:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
  .mb-select { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a96a8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right .75rem center; padding-right:2.2rem; cursor:pointer; }

  /* Change Request Modal — 2-col date grid */
  .mb-field-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  @media(max-width:480px){ .mb-field-grid2 { grid-template-columns:1fr; } }

  /* Change Request Modal — notice box */
  .mb-notice-box {
    display:flex; gap:.6rem; align-items:flex-start;
    background:var(--blue-bg); border:1px solid rgba(59,130,246,0.22);
    border-radius:10px; padding:.8rem 1rem; margin-bottom:1rem;
    font-size:.79rem; color:#2563eb; line-height:1.55;
  }

  /* Change Request Modal — blue submit btn */
  .mb-btn-blue {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(59,130,246,0.25);
  }
  .mb-btn-blue:hover:not(:disabled) { background:linear-gradient(135deg,#1d4ed8,#2563eb); }
  .mb-btn-blue:disabled { opacity:.5; cursor:not-allowed; }

  .mb-btn-green {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#059669,#34d399); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(5,150,105,0.25);
  }
  .mb-btn-green:hover:not(:disabled) { background:linear-gradient(135deg,#047857,#059669); }
  .mb-btn-green:disabled { opacity:.5; cursor:not-allowed; }

  /* Change Request Modal — history section */
  .mb-cr-history { margin-top:.75rem; }
  .mb-cr-type  { font-size:.8rem; font-weight:600; color:var(--text); margin-bottom:.18rem; }
  .mb-cr-detail { font-size:.76rem; color:var(--text-muted); line-height:1.5; }
  .mb-cr-note  {
    font-size:.73rem; color:#2563eb; background:var(--blue-bg);
    border-radius:6px; padding:.25rem .55rem; margin-top:.3rem; display:inline-block;
  }

  /* Booking info strip inside change-request modal */
  .mb-cr-booking-strip {
    background:var(--surface2); border:1px solid var(--border); border-radius:10px;
    padding:.75rem 1rem; margin-bottom:1rem;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem;
  }

  .mb-warn-box {
    display:flex; gap:.65rem; background:var(--red-bg); border:1px solid rgba(220,53,69,0.22);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem; font-size:.8rem; color:var(--red);
    line-height:1.55;
  }

  .mb-refund-box {
    background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.25);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
  }
  .mb-refund-title { font-size:.8rem; font-weight:700; color:#9a7a2e; margin-bottom:.5rem; display:flex; align-items:center; gap:.4rem; }
  .mb-refund-row { display:flex; justify-content:space-between; font-size:.8rem; color:var(--text-sub); margin-bottom:.28rem; }
  .mb-refund-row.total { font-weight:700; color:var(--text); border-top:1px solid rgba(201,168,76,0.2); padding-top:.35rem; margin-top:.35rem; }

  /* ── Room type grid ── */
  .mb-room-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:.65rem; margin-top:.4rem;
  }
  .mb-room-card {
    border:2px solid var(--border); border-radius:10px; padding:.75rem;
    cursor:pointer; transition:all .18s; background:#fff; position:relative;
  }
  .mb-room-card:hover { border-color:var(--blue); background:var(--blue-bg); }
  .mb-room-card.selected { border-color:var(--blue); background:var(--blue-bg); }
  .mb-room-card.current  { border-color:var(--gold); background:var(--gold-bg); cursor:pointer; }
  .mb-room-card.unavailable { opacity:.45; cursor:not-allowed; }
  .mb-room-card-name  { font-size:.8rem; font-weight:700; color:var(--text); margin-bottom:.25rem; }
  .mb-room-card-price { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--gold-dark); }
  .mb-room-card-sub   { font-size:.67rem; color:var(--text-muted); margin-top:.12rem; }
  .mb-room-card-badge {
    position:absolute; top:.4rem; right:.4rem; font-size:.6rem; font-weight:700;
    padding:.12rem .45rem; border-radius:99px; text-transform:uppercase; letter-spacing:.04em;
  }
  .mb-room-card-badge.current   { background:var(--gold-bg);   color:#9a7a2e;        border:1px solid rgba(201,168,76,0.3); }
  .mb-room-card-badge.upgrade   { background:var(--orange-bg); color:var(--orange);  border:1px solid rgba(245,158,11,0.3); }
  .mb-room-card-badge.downgrade { background:var(--green-bg);  color:var(--green);   border:1px solid rgba(45,155,111,0.3); }
  .mb-room-card-badge.booked    { background:var(--red-bg);    color:var(--red);     border:1px solid rgba(220,53,69,0.25); }

  /* ── Individual room grid (Step 2) ── */
  .mb-ind-room-grid {
    display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:.55rem; margin-top:.4rem;
  }
  .mb-ind-room-card {
    border:2px solid var(--border); border-radius:9px; padding:.6rem .75rem;
    cursor:pointer; transition:all .18s; background:#fff; position:relative; text-align:center;
  }
  .mb-ind-room-card:hover:not(.unavailable):not(.current-room) { border-color:var(--blue); background:var(--blue-bg); }
  .mb-ind-room-card.selected    { border-color:var(--blue); background:var(--blue-bg); }
  .mb-ind-room-card.current-room{ border-color:var(--gold); background:var(--gold-bg); cursor:default; }
  .mb-ind-room-card.unavailable { opacity:.4; cursor:not-allowed; }
  .mb-ind-room-num  { font-size:.95rem; font-weight:700; color:var(--text); }
  .mb-ind-room-stat { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; margin-top:.18rem; }
  .mb-ind-room-stat.clean       { color:var(--green); }
  .mb-ind-room-stat.dirty       { color:var(--orange); }
  .mb-ind-room-stat.maintenance { color:var(--red); }
  .mb-ind-room-stat.occupied    { color:#64748b; }
  .mb-ind-room-stat.booked      { color:var(--red); }

  /* Step breadcrumb */
  .mb-step-back {
    display:inline-flex; align-items:center; gap:.3rem; font-size:.75rem; font-weight:600;
    color:var(--blue); cursor:pointer; background:none; border:none;
    font-family:'DM Sans',sans-serif; padding:0; margin-bottom:.6rem;
  }
  .mb-step-back:hover { opacity:.75; }

  /* ── Price preview panel ── */
  .mb-price-preview {
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem; border:1px solid;
    animation:slideUp .25s ease both;
  }
  .mb-price-preview.upgrade  { background:rgba(245,158,11,0.07); border-color:rgba(245,158,11,0.3); }
  .mb-price-preview.refund   { background:var(--green-bg); border-color:rgba(45,155,111,0.25); }
  .mb-price-preview.nochange { background:var(--surface2); border-color:var(--border); }
  .mb-price-preview-title { font-size:.8rem; font-weight:700; margin-bottom:.55rem; display:flex; align-items:center; gap:.4rem; }
  .mb-price-preview.upgrade  .mb-price-preview-title { color:var(--orange); }
  .mb-price-preview.refund   .mb-price-preview-title { color:var(--green); }
  .mb-price-preview.nochange .mb-price-preview-title { color:var(--text-muted); }
  .mb-price-row { display:flex; justify-content:space-between; font-size:.8rem; color:var(--text-sub); margin-bottom:.28rem; }
  .mb-price-row.total { font-weight:700; color:var(--text); border-top:1px solid rgba(0,0,0,.08); padding-top:.35rem; margin-top:.35rem; }

  /* ── Payment pending notice ── */
  .mb-payment-pending-box {
    background:var(--blue-bg); border:1px solid rgba(59,130,246,0.3);
    border-radius:10px; padding:.9rem 1rem; margin-bottom:1rem;
  }
  .mb-payment-pending-title { font-size:.82rem; font-weight:700; color:#2563eb; margin-bottom:.45rem; display:flex; align-items:center; gap:.4rem; }
  .mb-payment-pending-row { font-size:.79rem; color:var(--text-sub); margin-bottom:.2rem; }

  /* Spinner inline */
  .spinner { animation: spin .7s linear infinite; }

  /* 24-hour grace period badge */
  .mb-grace-badge {
    display:inline-flex; align-items:center; gap:.28rem; padding:.2rem .65rem;
    border-radius:99px; font-size:.65rem; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; white-space:nowrap;
    background:rgba(5,150,105,0.12); color:#059669;
    border:1px solid rgba(5,150,105,0.3); animation:pulse 2.5s infinite;
  }

  /* Grace period info box inside cancel modal */
  .mb-grace-box {
    display:flex; gap:.65rem; align-items:flex-start;
    background:rgba(5,150,105,0.08); border:1px solid rgba(5,150,105,0.25);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
    font-size:.8rem; color:#047857; line-height:1.55;
  }
  .mb-grace-box strong { color:#065f46; }

  /* Grace period countdown timer */
  .mb-grace-timer {
    font-family:'Cormorant Garamond',serif; font-size:1.15rem;
    font-weight:600; color:#047857; display:block; margin-top:.25rem;
  }

  /* Instant cancel button */
  .mb-btn-instant-cancel {
    padding:.6rem 1.4rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#dc2626,#ef4444); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.4rem; box-shadow:0 2px 8px rgba(220,38,38,0.3);
  }
  .mb-btn-instant-cancel:hover:not(:disabled) { background:linear-gradient(135deg,#b91c1c,#dc2626); }
  .mb-btn-instant-cancel:disabled { opacity:.5; cursor:not-allowed; }
`;

const STATUS_LABEL = {
  CONFIRMED:            'Confirmed',
  PENDING_DEPOSIT:      'Pending Deposit',
  CHECKED_IN:           'Checked In',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
  CANCELLATION_PENDING: 'Cancellation Requested',
};

const CANCELLABLE = ['CONFIRMED', 'PENDING_DEPOSIT'];
const CHANGEABLE  = ['CONFIRMED', 'PENDING_DEPOSIT'];

/** Returns true when the booking was created less than 24 hours ago. */
function isWithin24h(booking) {
  const created = booking.createdAt || booking.created_at;
  if (!created) return false;
  return (Date.now() - new Date(created).getTime()) < 86_400_000;
}

/** Returns a human-readable countdown string, e.g. "3h 42m remaining". */
function graceTimeRemaining(booking) {
  const created = booking.createdAt || booking.created_at;
  if (!created) return '';
  const ms = 86_400_000 - (Date.now() - new Date(created).getTime());
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

function StatusPill({ status }) {
  return (
    <span className={`mb-pill ${status}`}>
      <span className="mb-pill-dot"/>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function BookingCard({ booking, onEdit, onCancelRequest, onChangeRequest }) {
  const [expanded, setExpanded] = useState(false);
  const canEdit          = CANCELLABLE.includes(booking.status) && booking.status !== 'CANCELLATION_PENDING';
  const canCancel        = CANCELLABLE.includes(booking.status) && booking.status !== 'CANCELLATION_PENDING';
  const canChange        = CHANGEABLE.includes(booking.status)  && booking.status !== 'CANCELLATION_PENDING';
  const hasPendingCancel = booking.cancellationRequest?.status === 'PENDING';
  const hasPendingChange = booking.pendingChangeRequest;
  const gracePeriod      = canCancel && isWithin24h(booking);

  return (
    <div className={`mb-card status-${booking.status === 'CANCELLATION_PENDING' ? 'CANCELLATION_PENDING' : booking.status}`}>
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
          {gracePeriod && (
            <span className="mb-grace-badge">
              <CheckCircle2 size={11}/> Free Cancel
            </span>
          )}
          {hasPendingCancel && (
            <span className="mb-pill CANCELLATION_PENDING" style={{ animation:'pulse 2s infinite' }}>
              <ClockIcon size={11}/> Awaiting Approval
            </span>
          )}
          {hasPendingChange && (
            <span className="mb-pill" style={{ background:'var(--purple-bg)', color:'var(--purple)', borderColor:'rgba(139,92,246,0.25)' }}>
              <ClockIcon size={11}/> Change Pending
            </span>
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
            <button className="mb-action-btn cancel" onClick={() => onCancelRequest(booking)}>
              <Trash2 size={13}/> {gracePeriod ? 'Cancel Now' : 'Request Cancellation'}
            </button>
          )}
          <button className="mb-expand-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

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
          </div>

          {hasPendingCancel && (
            <div className="mb-cancel-request-box" style={{ marginTop:'.75rem' }}>
              <div className="mb-cancel-request-title">
                <Bell size={14}/> Cancellation Request Pending
              </div>
              <div className="mb-cancel-request-row">
                <span>Requested on:</span>
                <span>{fmtDate(booking.cancellationRequest?.createdAt)}</span>
              </div>
              <div className="mb-cancel-request-row">
                <span>Reason:</span>
                <span>{booking.cancellationRequest?.reason || 'No reason provided'}</span>
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.5rem' }}>
                Your cancellation request is being reviewed.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Type Card — shown in the change-request modal
// ─────────────────────────────────────────────────────────────────────────────
function RoomTypeCard({ room, currentType, currentPricePerNight, selected, onClick, currentNights }) {
  const isCurrent  = room.roomType === currentType;
  // A card is "selected" only when the user has explicitly clicked it AND it's not the current type
  const isSelected = !isCurrent && selected === room.roomType;

  // Badge: show Current on the existing room, Upgrade/Downgrade on others
  let badgeLabel = null;
  let badgeClass = '';
  if (isCurrent) {
    badgeLabel = 'Current'; badgeClass = 'current';
  } else if (currentPricePerNight != null) {
    if (room.pricePerNight > currentPricePerNight)      { badgeLabel = 'Upgrade';   badgeClass = 'upgrade'; }
    else if (room.pricePerNight < currentPricePerNight) { badgeLabel = 'Downgrade'; badgeClass = 'downgrade'; }
  }

  return (
    <div
      className={`mb-room-card${isCurrent ? ' current' : isSelected ? ' selected' : ''}`}
      onClick={onClick}
    >
      {badgeLabel && <span className={`mb-room-card-badge ${badgeClass}`}>{badgeLabel}</span>}
      <div className="mb-room-card-name">{room.roomType}</div>
      <div className="mb-room-card-price">
        {fmt(room.pricePerNight)}
        <span style={{ fontSize:'.68rem', fontWeight:400, color:'var(--text-muted)' }}>/night</span>
      </div>
      {currentNights > 0 && (
        <div className="mb-room-card-sub">{fmt(room.pricePerNight * currentNights)} for {currentNights} nights</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Room Card — Step 2, pick a specific room number
// ─────────────────────────────────────────────────────────────────────────────
function IndividualRoomCard({ room, currentRoomId, selectedRoomId, onClick }) {
  const isCurrentRoom = room.id === currentRoomId;
  const isSelected    = !isCurrentRoom && room.id === selectedRoomId;
  const isUnavailable = !room.availableForDates && !isCurrentRoom;

  const statusLabel = isCurrentRoom
    ? 'Current'
    : !room.availableForDates
    ? 'Booked'
    : (room.status || 'CLEAN');

  const statusClass = isCurrentRoom
    ? ''
    : !room.availableForDates
    ? 'booked'
    : (room.status || 'clean').toLowerCase();

  return (
    <div
      className={`mb-ind-room-card${isCurrentRoom ? ' current-room' : isSelected ? ' selected' : isUnavailable ? ' unavailable' : ''}`}
      onClick={() => { if (!isCurrentRoom && !isUnavailable) onClick(room); }}
    >
      <div className="mb-ind-room-num">#{room.roomNumber}</div>
      <div className={`mb-ind-room-stat ${statusClass}`}>{statusLabel}</div>
    </div>
  );
}


function PricePreview({ preview, loading }) {
  if (loading) {
    return (
      <div className="mb-price-preview nochange">
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', color:'var(--text-muted)', fontSize:'.8rem' }}>
          <Loader2 size={14} className="spinner"/> Calculating…
        </div>
      </div>
    );
  }
  if (!preview) return null;

  const { scenario, currentNights, newNights, currentTotal, newTotal, priceDifference, additionalDeposit, refundAmount, pricePerNight } = preview;

  if (scenario === 'UPGRADE') {
    return (
      <div className="mb-price-preview upgrade">
        <div className="mb-price-preview-title"><TrendingUp size={14}/> Upgrade — Additional Payment Required</div>
        <div className="mb-price-row"><span>Current total ({currentNights} nights)</span><span>{fmt(currentTotal)}</span></div>
        <div className="mb-price-row"><span>New total ({newNights} nights @ {fmt(pricePerNight)}/night)</span><span>{fmt(newTotal)}</span></div>
        <div className="mb-price-row total"><span>Price difference</span><span style={{ color:'var(--orange)' }}>+{fmt(priceDifference)}</span></div>
        <div className="mb-price-row" style={{ marginTop:'.4rem' }}>
          <span style={{ fontWeight:700, color:'var(--orange)' }}>Additional deposit due (50%)</span>
          <span style={{ fontWeight:700, color:'var(--orange)' }}>{fmt(additionalDeposit)}</span>
        </div>
        <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.4rem' }}>
          Payment link will be sent after admin approval. Booking updates once paid.
        </div>
      </div>
    );
  }

  if (scenario === 'REFUND') {
    return (
      <div className="mb-price-preview refund">
        <div className="mb-price-preview-title"><TrendingDown size={14}/> Downgrade — Partial Refund</div>
        <div className="mb-price-row"><span>Current total ({currentNights} nights)</span><span>{fmt(currentTotal)}</span></div>
        <div className="mb-price-row"><span>New total ({newNights} nights @ {fmt(pricePerNight)}/night)</span><span>{fmt(newTotal)}</span></div>
        <div className="mb-price-row total"><span>Price difference</span><span style={{ color:'var(--green)' }}>{fmt(priceDifference)}</span></div>
        <div className="mb-price-row" style={{ marginTop:'.4rem' }}>
          <span style={{ fontWeight:700, color:'var(--green)' }}>Estimated refund (50%)</span>
          <span style={{ fontWeight:700, color:'var(--green)' }}>{fmt(refundAmount)}</span>
        </div>
        <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.4rem' }}>
          Refund is processed after admin approval within 5–7 business days.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-price-preview nochange">
      <div className="mb-price-preview-title"><Minus size={14}/> No Price Change</div>
      <div className="mb-price-row"><span>Current total</span><span>{fmt(currentTotal)}</span></div>
      <div className="mb-price-row"><span>New total</span><span>{fmt(newTotal)}</span></div>
      <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.3rem' }}>
        No additional payment required. Booking updates after admin approval.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export function MyBookingsPage({ token }) {
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');

  // Edit modal
  const [editBooking,  setEditBooking]  = useState(null);
  const [editRequests, setEditRequests] = useState('');
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState('');
  const [editSuccess,  setEditSuccess]  = useState(false);

  // Cancellation Request modal
  const [cancelBooking,         setCancelBooking]         = useState(null);
  const [cancelReason,          setCancelReason]          = useState('');
  const [cancelling,            setCancelling]            = useState(false);
  const [cancelError,           setCancelError]           = useState('');
  const [cancelSuccess,         setCancelSuccess]         = useState(null);
  const [cancelRequestHistory,  setCancelRequestHistory]  = useState([]);

  // Change request modal
  const [crBooking,    setCrBooking]    = useState(null);
  const [crTab,        setCrTab]        = useState('dates');
  const [crCheckIn,    setCrCheckIn]    = useState('');
  const [crCheckOut,   setCrCheckOut]   = useState('');
  const [crRoomType,   setCrRoomType]   = useState('');
  const [crReason,     setCrReason]     = useState('');
  const [crSubmitting, setCrSubmitting] = useState(false);
  const [crError,      setCrError]      = useState('');
  const [crSuccess,    setCrSuccess]    = useState(false);
  const [crHistory,    setCrHistory]    = useState([]);

  // ── NEW: room type pricing + preview ──
  const [roomTypes,        setRoomTypes]        = useState([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(false);
  const [preview,          setPreview]          = useState(null);
  const [previewLoading,   setPreviewLoading]   = useState(false);
  const previewTimer = useRef(null);

  // ── NEW: individual rooms within a selected type (Step 2) ──
  const [selectedRoomType,     setSelectedRoomType]     = useState('');   // type chosen in Step 1
  const [individualRooms,      setIndividualRooms]      = useState([]);   // rooms of that type
  const [individualRoomsLoading, setIndividualRoomsLoading] = useState(false);
  const [selectedRoomId,       setSelectedRoomId]       = useState(null); // specific room picked in Step 2
  const [selectedRoomNumber,   setSelectedRoomNumber]   = useState('');   // room_number for display

  // ── NEW: PAYMENT_PENDING polling ──
  const [crPaymentPending,   setCrPaymentPending]   = useState(null); // { changeRequestId, checkoutUrl, additionalDeposit }
  const [crWaitingApproval,  setCrWaitingApproval]  = useState(null); // { changeRequestId, additionalDeposit } — submitted but admin hasn't approved yet
  const pollRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/bookings/my-bookings/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  // ── Load room types with pricing when modal opens ──
  const loadRoomTypes = async () => {
    setRoomTypesLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/bookings/room-types-pricing/`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRoomTypes(Array.isArray(data) ? data : []);
    } catch { setRoomTypes([]); }
    finally { setRoomTypesLoading(false); }
  };

  // ── Load individual rooms for a chosen room type (Step 2) ──
  const loadIndividualRooms = async (roomType, booking) => {
    setIndividualRoomsLoading(true);
    setIndividualRooms([]);
    try {
      const params = new URLSearchParams();
      if (crCheckIn)  params.set('checkIn',  crCheckIn);
      if (crCheckOut) params.set('checkOut', crCheckOut);
      if (booking?.id) params.set('excludeBookingId', booking.id);

      const res  = await fetch(
        `${API_BASE}/bookings/rooms-by-type/${encodeURIComponent(roomType)}/?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setIndividualRooms(Array.isArray(data) ? data : []);
    } catch { setIndividualRooms([]); }
    finally { setIndividualRoomsLoading(false); }
  };

  // ── Handle Step 1 → Step 2: user picks a room type ──
  // Any type is clickable — including the current one — so the guest can
  // browse its rooms. crRoomType always reflects what they are browsing;
  // the submit handler validates whether it's actually a different type.
  const handleSelectRoomType = (roomType, booking) => {
    setSelectedRoomType(roomType);
    setCrRoomType(roomType);          // always keep crRoomType in sync
    setSelectedRoomId(null);
    setSelectedRoomNumber('');
    setPreview(null);
    loadIndividualRooms(roomType, booking);
  };

  // ── Handle Step 2: user picks a specific room ──
  const handleSelectRoom = (room) => {
    setSelectedRoomId(room.id);
    setSelectedRoomNumber(room.roomNumber);
    setCrRoomType(room.roomType);     // keep crRoomType in sync (needed for payload + preview)
    // Trigger price preview
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      fetchPreview(crBooking, crCheckIn, crCheckOut, room.roomType, crTab);
    }, 300);
  };

  // ── Go back from Step 2 to Step 1 ──
  const handleBackToTypeSelection = () => {
    setSelectedRoomType('');
    setCrRoomType('');
    setSelectedRoomId(null);
    setSelectedRoomNumber('');
    setIndividualRooms([]);
    setPreview(null);
  };

  // ── Debounced price preview ──
  const fetchPreview = async (booking, checkIn, checkOut, roomType, tab) => {
    const hasDateChange = (tab === 'dates' || tab === 'both') && checkIn && checkOut;
    const hasRoomChange = (tab === 'room' || tab === 'both') && roomType && roomType !== (booking.room?.roomType || booking.roomType);
    if (!hasDateChange && !hasRoomChange) { setPreview(null); return; }

    setPreviewLoading(true);
    try {
      const body = {};
      if (hasDateChange) { body.requestedCheckin = checkIn; body.requestedCheckout = checkOut; }
      if (hasRoomChange) { body.requestedRoomType = roomType; }

      const res  = await fetch(`${API_BASE}/bookings/${booking.id}/change-request/preview/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) { setPreview(await res.json()); }
      else        { setPreview(null); }
    } catch { setPreview(null); }
    finally { setPreviewLoading(false); }
  };

  // Trigger preview with 600ms debounce on date changes (room triggers handled in handleSelectRoom)
  useEffect(() => {
    if (!crBooking) return;
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      fetchPreview(crBooking, crCheckIn, crCheckOut, crRoomType, crTab);
    }, 600);
    return () => clearTimeout(previewTimer.current);
  }, [crBooking, crCheckIn, crCheckOut, crTab]);

  // ── Poll PAYMENT_PENDING change requests ──
  const startPolling = (changeRequestId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings/change-requests/${changeRequestId}/payment-status/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'APPROVED' && data.payment_completed) {
          // Fully done — payment confirmed
          stopPolling();
          setCrPaymentPending(null);
          setCrWaitingApproval(null);
          setCrSuccess(true);
          load();
        } else if (data.status === 'PAYMENT_PENDING') {
          // Admin approved — payment link is ready. Transition out of "waiting" into payment view.
          setCrWaitingApproval(null);
          setCrPaymentPending(prev => ({
            changeRequestId,
            additionalDeposit: data.additional_deposit ?? prev?.additionalDeposit ?? 0,
            checkoutUrl: data.checkout_url || prev?.checkoutUrl || null,
          }));
        } else if (data.status === 'REJECTED') {
          stopPolling();
          setCrPaymentPending(null);
          setCrWaitingApproval(null);
          setCrError('Your change request was rejected by the hotel.');
        }
        // status === 'PENDING' → still waiting for admin, keep polling silently
      } catch { /* ignore */ }
    }, 4000);
  };

  const stopPolling = () => { clearInterval(pollRef.current); pollRef.current = null; };
  useEffect(() => () => stopPolling(), []);

  const FILTERS = [
    { key:'all',                  label:'All' },
    { key:'CONFIRMED',            label:'Confirmed' },
    { key:'PENDING_DEPOSIT',      label:'Pending' },
    { key:'CHECKED_IN',           label:'Checked In' },
    { key:'COMPLETED',            label:'Completed' },
    { key:'CANCELLED',            label:'Cancelled' },
    { key:'CANCELLATION_PENDING', label:'Pending Cancellation' },
  ];

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const stats = [
    { color:'gold',   Icon: BedDouble,    label:'Total',                value: bookings.length },
    { color:'blue',   Icon: CheckCircle2, label:'Confirmed',            value: bookings.filter(b=>b.status==='CONFIRMED').length },
    { color:'green',  Icon: Hotel,        label:'Completed',            value: bookings.filter(b=>b.status==='COMPLETED').length },
    { color:'orange', Icon: XCircle,      label:'Cancelled',            value: bookings.filter(b=>b.status==='CANCELLED').length },
    { color:'purple', Icon: ClockIcon,    label:'Pending Cancellation', value: bookings.filter(b=>b.status==='CANCELLATION_PENDING').length },
  ];

  // ── Edit handlers ──
  const openEdit = (booking) => {
    setEditBooking(booking); setEditRequests(booking.specialRequests || '');
    setEditError(''); setEditSuccess(false);
  };
  const handleEditSave = async () => {
    setEditSaving(true); setEditError('');
    try {
      const res = await fetch(`${API_BASE}/bookings/${editBooking.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ specialRequests: editRequests }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to update booking.'); }
      setEditSuccess(true);
      setBookings(prev => prev.map(b => b.id === editBooking.id ? { ...b, specialRequests: editRequests } : b));
      setTimeout(() => { setEditBooking(null); setEditSuccess(false); }, 1200);
    } catch (e) { setEditError(e.message); }
    finally { setEditSaving(false); }
  };

  // ── Cancellation Request handlers ──
  const openCancelRequest = (booking) => {
    setCancelBooking(booking); setCancelReason(''); setCancelError(''); setCancelSuccess(null);
    loadCancelRequestHistory(booking.id);
  };
  const loadCancelRequestHistory = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel-requests/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCancelRequestHistory((await res.json()) || []);
      else setCancelRequestHistory([]);
    } catch { setCancelRequestHistory([]); }
  };
  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) { setCancelError('Please provide a reason for cancellation.'); return; }
    setCancelling(true); setCancelError('');
    try {
      const res = await fetch(`${API_BASE}/bookings/${cancelBooking.id}/cancel-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to submit.'); }
      const data = await res.json();
      if (data.instant) {
        // Booking was cancelled immediately — reflect that in local state
        setCancelSuccess('instant');
        setBookings(prev => prev.map(b => b.id === cancelBooking.id
          ? { ...b, status: 'CANCELLED', cancellationRequest: { reason: cancelReason, status: 'APPROVED', createdAt: new Date().toISOString() } }
          : b
        ));
      } else {
        setCancelSuccess('pending');
        setBookings(prev => prev.map(b => b.id === cancelBooking.id
          ? { ...b, status: 'CANCELLATION_PENDING', cancellationRequest: { reason: cancelReason, status: 'PENDING', createdAt: new Date().toISOString() } }
          : b
        ));
      }
    } catch (e) { setCancelError(e.message); }
    finally { setCancelling(false); }
  };

  // ── Change Request handlers ──
  const openChangeRequest = (booking) => {
    setCrBooking(booking);
    setCrTab('dates');
    setCrCheckIn(booking.checkInDate || '');
    setCrCheckOut(booking.checkOutDate || '');
    setCrRoomType('');          // ← start empty so no card appears pre-selected
    setCrReason('');
    setCrError('');
    setCrSuccess(false);
    setPreview(null);
    setCrPaymentPending(null);
    setCrWaitingApproval(null);
    // Reset room picker steps
    setSelectedRoomType('');
    setSelectedRoomId(null);
    setSelectedRoomNumber('');
    setIndividualRooms([]);
    loadCrHistory(booking.id);
    loadRoomTypes();
  };

  const loadCrHistory = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/change-requests/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCrHistory(Array.isArray(data) ? data : []);

        // If any request is PAYMENT_PENDING, show payment box immediately and poll.
        const pending = data.find(cr => cr.status === 'PAYMENT_PENDING');
        if (pending) {
          setCrWaitingApproval(null);
          setCrPaymentPending({
            changeRequestId: pending.id,
            checkoutUrl:     pending.checkout_url || null,
            additionalDeposit: pending.additional_deposit || 0,
          });
          startPolling(pending.id);
        }
      } else { setCrHistory([]); }
    } catch { setCrHistory([]); }
  };

  const handleChangeRequest = async () => {
    if (crTab === 'dates' || crTab === 'both') {
      if (!crCheckIn || !crCheckOut) { setCrError('Please select both check-in and check-out dates.'); return; }
      if (new Date(crCheckOut) <= new Date(crCheckIn)) { setCrError('Check-out must be after check-in.'); return; }
    }
    if (crTab === 'room' || crTab === 'both') {
      if (!selectedRoomType) { setCrError('Please select a room type first.'); return; }
      if (!selectedRoomId)   { setCrError('Please select a specific room number.'); return; }
      // Changing to the exact same room makes no sense
      const isSameRoom = selectedRoomType === currentRoomType &&
                         selectedRoomId === (crBooking?.room?.id || crBooking?.roomId);
      if (isSameRoom) { setCrError('That is already your current room. Please select a different room.'); return; }
    }
    if (!crReason.trim()) { setCrError('Please provide a reason for the change request.'); return; }

    setCrSubmitting(true); setCrError('');
    try {
      const payload = {
        reason: crReason.trim(),
        ...(crTab !== 'room'  && { requestedCheckin: crCheckIn, requestedCheckout: crCheckOut }),
        ...(crTab !== 'dates' && { requestedRoomType: crRoomType, requestedRoomId: selectedRoomId }),
      };
      const res = await fetch(`${API_BASE}/bookings/${crBooking.id}/change-request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || d.message || 'Failed to submit change request.'); }

      const data = await res.json();

      if (data.scenario === 'UPGRADE') {
        // Show "waiting for admin approval" state immediately — no modal close needed.
        // Polling will transition to the payment link the moment admin approves.
        setCrWaitingApproval({
          changeRequestId: data.change_request_id,
          additionalDeposit: data.additional_deposit,
        });
        startPolling(data.change_request_id);
        setBookings(prev => prev.map(b => b.id === crBooking.id ? { ...b, pendingChangeRequest: true } : b));
        loadCrHistory(crBooking.id);
      } else {
        setCrSuccess(true);
        setBookings(prev => prev.map(b => b.id === crBooking.id ? { ...b, pendingChangeRequest: true } : b));
        loadCrHistory(crBooking.id);
      }
    } catch (e) { setCrError(e.message); }
    finally { setCrSubmitting(false); }
  };

  const currentRoomType = crBooking?.room?.roomType || crBooking?.roomType || '';

  return (
    <div className="mb-root">
      <style>{css}</style>

      <div className="mb-hd">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
          <div>
            <div className="mb-title">My Bookings</div>
            <div className="mb-sub">Manage your reservations — changes require hotel approval</div>
          </div>
          <button onClick={load} style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.45rem .9rem', borderRadius:8, border:'1px solid var(--border)', background:'#fff', color:'var(--text-sub)', fontSize:'.78rem', fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:'pointer' }}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

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
            {filter === 'all' ? 'You have no bookings yet.' : `No ${STATUS_LABEL[filter]?.toLowerCase() || filter} bookings found.`}
          </div>
        </div>
      ) : (
        filtered.map(booking => (
          <BookingCard key={booking.id} booking={booking}
            onEdit={openEdit} onCancelRequest={openCancelRequest} onChangeRequest={openChangeRequest}
          />
        ))
      )}

      {/* ── Edit Modal ── */}
      <Modal show={!!editBooking} onHide={() => setEditBooking(null)} centered className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><Edit3 size={17}/> Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError   && <div className="mb-modal-err"><AlertTriangle size={15}/> {editError}</div>}
          {editSuccess && <div style={{ display:'flex', alignItems:'center', gap:'.6rem', background:'var(--green-bg)', border:'1px solid rgba(45,155,111,0.25)', borderRadius:9, padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'var(--green)', fontWeight:600 }}><CheckCircle2 size={15}/> Booking updated successfully!</div>}
          {editBooking && (
            <>
              <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'.75rem 1rem', marginBottom:'1rem' }}>
                <div style={{ fontSize:'.72rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:'.45rem' }}>{editBooking.bookingReference}</div>
                <div style={{ display:'flex', gap:'1.1rem', flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.8rem', color:'var(--text-sub)' }}><BedDouble size={13}/> {editBooking.room?.roomType || editBooking.roomType} Room</span>
                  <span style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.8rem', color:'var(--text-sub)' }}><Calendar size={13}/> {fmtDate(editBooking.checkInDate)} → {fmtDate(editBooking.checkOutDate)}</span>
                </div>
              </div>
              <div className="mb-field">
                <label className="mb-label">Special Requests</label>
                <textarea className="mb-textarea" value={editRequests} onChange={e => setEditRequests(e.target.value)} placeholder="e.g. high floor, early check-in, extra pillows…" rows={4}/>
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

      {/* ── Cancellation Request Modal ── */}
      <Modal show={!!cancelBooking} onHide={() => { setCancelBooking(null); setCancelSuccess(null); }} centered className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><Trash2 size={17} color="var(--red)"/>
            {cancelBooking && isWithin24h(cancelBooking) ? ' Cancel Booking' : ' Request Cancellation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cancelError && <div className="mb-modal-err"><AlertTriangle size={15}/> {cancelError}</div>}

          {/* ── Instant-cancel success ── */}
          {cancelSuccess === 'instant' ? (
            <div style={{ textAlign:'center', padding:'1rem 0' }}>
              <CheckCircle2 size={48} strokeWidth={1.5} color="var(--green)" style={{ display:'block', margin:'0 auto .75rem' }}/>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:600, marginBottom:'.4rem' }}>Booking Cancelled</div>
              <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'1rem', lineHeight:1.65 }}>
                Your booking has been <strong>cancelled immediately</strong> — no approval needed because you cancelled within 24 hours of booking.
              </p>
              <button className="mb-btn-save" onClick={() => { setCancelBooking(null); setCancelSuccess(null); }}>Done ✓</button>
            </div>

          /* ── Approval-required success ── */
          ) : cancelSuccess === 'pending' ? (
            <div style={{ textAlign:'center', padding:'1rem 0' }}>
              <CheckCircle2 size={48} strokeWidth={1.5} color="var(--green)" style={{ display:'block', margin:'0 auto .75rem' }}/>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.35rem', fontWeight:600, marginBottom:'.4rem' }}>Cancellation Requested</div>
              <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'1rem', lineHeight:1.65 }}>Your request has been submitted. Our team will review and notify you.</p>
              <button className="mb-btn-save" onClick={() => { setCancelBooking(null); setCancelSuccess(null); }}>Done ✓</button>
            </div>

          ) : cancelBooking && (() => {
            const grace = isWithin24h(cancelBooking);
            return (
              <>
                {/* Grace period banner */}
                {grace ? (
                  <div className="mb-grace-box">
                    <CheckCircle2 size={18} style={{ flexShrink:0, marginTop:2 }}/>
                    <div>
                      <strong>Free Cancellation Available</strong><br/>
                      You booked within the last 24 hours, so you can cancel immediately with no fee and no approval required.
                      <span className="mb-grace-timer">⏱ {graceTimeRemaining(cancelBooking)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-warn-box"><ShieldAlert size={18} style={{ flexShrink:0, marginTop:2 }}/><div><strong>Request Cancellation?</strong><br/>This will be reviewed by our team before taking effect.</div></div>
                )}

                {/* Refund policy — only shown outside grace period */}
                {!grace && parseFloat(cancelBooking.depositAmount || 0) > 0 && (
                  <div className="mb-refund-box">
                    <div className="mb-refund-title"><Banknote size={14}/> Cancellation Refund Policy</div>
                    <div className="mb-refund-row"><span>Deposit paid</span><span>{fmt(cancelBooking.depositAmount)}</span></div>
                    <div className="mb-refund-row"><span>Cancellation fee (50%)</span><span style={{ color:'var(--red)' }}>− {fmt(parseFloat(cancelBooking.depositAmount) * 0.5)}</span></div>
                    <div className="mb-refund-row total"><span>Refund (if approved)</span><span style={{ color:'var(--green)' }}>{fmt(parseFloat(cancelBooking.depositAmount) * 0.5)}</span></div>
                    <div style={{ fontSize:'.71rem', color:'var(--text-muted)', marginTop:'.5rem' }}>Refunds processed within 5–7 business days after approval.</div>
                  </div>
                )}

                {/* Full refund note inside grace period */}
                {grace && parseFloat(cancelBooking.depositAmount || 0) > 0 && (
                  <div className="mb-refund-box">
                    <div className="mb-refund-title"><Banknote size={14}/> Full Refund</div>
                    <div className="mb-refund-row"><span>Deposit paid</span><span>{fmt(cancelBooking.depositAmount)}</span></div>
                    <div className="mb-refund-row total"><span>Refund amount</span><span style={{ color:'var(--green)' }}>{fmt(cancelBooking.depositAmount)}</span></div>
                    <div style={{ fontSize:'.71rem', color:'var(--text-muted)', marginTop:'.5rem' }}>Full refund — no cancellation fee within the 24-hour grace period.</div>
                  </div>
                )}

                <div className="mb-field">
                  <label className="mb-label">Reason for cancellation <span style={{ color:'var(--red)' }}>*</span></label>
                  <textarea className="mb-textarea" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="e.g. Change of plans, emergency…" rows={3}/>
                </div>

                {cancelRequestHistory.length > 0 && (
                  <div>
                    <div style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.5rem', paddingTop:'.5rem', borderTop:'1px solid var(--border)' }}>Previous Requests</div>
                    {cancelRequestHistory.map((cr, i) => (
                      <div key={i} className="mb-history-item">
                        <div className={`mb-history-icon ${cr.status?.toLowerCase()}`}>
                          {cr.status==='APPROVED'?<CheckCircle2 size={16}/>:cr.status==='REJECTED'?<XCircle size={16}/>:<ClockIcon size={16}/>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div className="mb-cr-type">Request from {fmtDate(cr.createdAt)}</div>
                          <div className="mb-cr-detail">{cr.reason}</div>
                          {cr.adminNote && <div className="mb-cr-note">Admin note: {cr.adminNote}</div>}
                        </div>
                        <span style={{ fontSize:'.65rem', fontWeight:700, padding:'.2rem .55rem', borderRadius:6, background:cr.status==='APPROVED'?'var(--green-bg)':cr.status==='REJECTED'?'var(--red-bg)':'var(--orange-bg)', color:cr.status==='APPROVED'?'var(--green)':cr.status==='REJECTED'?'var(--red)':'var(--orange)' }}>{cr.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </Modal.Body>
        {!cancelSuccess && (
          <Modal.Footer>
            <button className="mb-btn-secondary" onClick={() => setCancelBooking(null)}>Go Back</button>
            {cancelBooking && isWithin24h(cancelBooking) ? (
              <button className="mb-btn-instant-cancel" disabled={cancelling} onClick={submitCancelRequest}>
                {cancelling ? <><Loader2 size={14} className="spinner"/> Cancelling…</> : <><XCircle size={14}/> Cancel Immediately</>}
              </button>
            ) : (
              <button className="mb-btn-cancel-action" disabled={cancelling} onClick={submitCancelRequest}>
                {cancelling ? <><Loader2 size={14} className="spinner"/> Submitting…</> : <><Bell size={14}/> Submit Cancellation Request</>}
              </button>
            )}
          </Modal.Footer>
        )}
      </Modal>

      {/* ── Change Request Modal ── */}
      <Modal show={!!crBooking} onHide={() => { setCrBooking(null); setCrSuccess(false); setCrWaitingApproval(null); setCrPaymentPending(null); stopPolling(); }} centered size="lg" className="mb-modal">
        <Modal.Header closeButton>
          <Modal.Title><ArrowRightLeft size={17} color="var(--blue)"/> Request Booking Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {crBooking && (() => {
            // ── Booking strip (always shown) ──────────────────────────
            const bookingStrip = (
              <div className="mb-cr-booking-strip">
                <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:'var(--gold-bg)', border:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <BedDouble size={16} color="#9a7a2e"/>
                  </div>
                  <div>
                    <div style={{ fontSize:'.68rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'.1rem' }}>{crBooking.bookingReference}</div>
                    <div style={{ fontSize:'.9rem', fontWeight:700, color:'var(--text)' }}>{currentRoomType} Room</div>
                  </div>
                </div>
                <div style={{ fontSize:'.76rem', color:'var(--text-sub)', display:'flex', alignItems:'center', gap:'.35rem' }}>
                  <Calendar size={12}/> {fmtDate(crBooking.checkInDate)} → {fmtDate(crBooking.checkOutDate)}
                </div>
              </div>
            );

            // ── History (always shown at bottom) ──────────────────────
            const historySection = crHistory.length > 0 && (
              <div className="mb-cr-history">
                <div style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.5rem', paddingTop:'.75rem', borderTop:'1px solid var(--border)' }}>Previous Requests</div>
                {crHistory.map((cr, i) => (
                  <div key={i} className="mb-history-item">
                    <div className={`mb-history-icon ${cr.status?.toLowerCase()}`}>
                      {cr.status==='APPROVED'?<CheckCircle2 size={16}/>:cr.status==='REJECTED'?<XCircle size={16}/>:cr.status==='PAYMENT_PENDING'?<CreditCard size={16}/>:<ClockIcon size={16}/>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="mb-cr-type">
                        {cr.requested_checkin && cr.requested_checkout
                          ? `Date change → ${fmtDate(cr.requested_checkin)} – ${fmtDate(cr.requested_checkout)}`
                          : cr.requested_room_type ? `Room change → ${cr.requested_room_type}` : 'Change request'}
                        {cr.additional_deposit > 0 && (
                          <span style={{ marginLeft:'.4rem', fontSize:'.68rem', background:'var(--orange-bg)', color:'var(--orange)', padding:'.1rem .35rem', borderRadius:4, fontWeight:700 }}>+{fmt(cr.additional_deposit)} deposit</span>
                        )}
                      </div>
                      <div className="mb-cr-detail">{cr.reason}</div>
                      {cr.admin_note && <div className="mb-cr-note">Admin note: {cr.admin_note}</div>}
                    </div>
                    <span className={`mb-pill ${cr.status}`} style={{ fontSize:'.6rem', padding:'.1rem .4rem' }}>
                      {cr.status === 'PAYMENT_PENDING' ? 'PAY PENDING' : cr.status}
                    </span>
                  </div>
                ))}
              </div>
            );

            // ── STATE 1: Success ──────────────────────────────────────
            if (crSuccess) {
              return (
                <>
                  {bookingStrip}
                  <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                    <ClipboardCheck size={48} strokeWidth={1.5} color="var(--green)" style={{ display:'block', margin:'0 auto .75rem' }}/>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, marginBottom:'.4rem' }}>Request Submitted!</div>
                    <p style={{ fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'1.1rem', lineHeight:1.65 }}>Your change request has been submitted. Our team will review and respond within 24 hours.</p>
                    <button className="mb-btn-save" onClick={() => {
                      setCrSuccess(false); setCrReason(''); setPreview(null);
                      setSelectedRoomType(''); setSelectedRoomId(null); setSelectedRoomNumber(''); setIndividualRooms([]);
                    }}>Submit Another Request</button>
                  </div>
                  {historySection}
                </>
              );
            }

            // ── STATE 2: Payment link ready (admin approved) ──────────
            if (crPaymentPending) {
              return (
                <>
                  {bookingStrip}
                  <div className="mb-payment-pending-box">
                    <div className="mb-payment-pending-title"><CreditCard size={14}/> Payment Required — Admin Approved</div>
                    <div className="mb-payment-pending-row" style={{ marginBottom:'.5rem' }}>
                      Your change request has been approved! Please complete the additional deposit of{' '}
                      <strong style={{ color:'var(--blue)' }}>{fmt(crPaymentPending.additionalDeposit)}</strong> to confirm the booking change.
                    </div>
                    {crPaymentPending.checkoutUrl ? (
                      <a
                        href={crPaymentPending.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', marginTop:'.5rem', padding:'.55rem 1.25rem', borderRadius:8, background:'#2563eb', color:'#fff', fontSize:'.83rem', fontWeight:700, textDecoration:'none', boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}
                      >
                        <ExternalLink size={13}/> Open Payment Page
                      </a>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginTop:'.5rem', fontSize:'.8rem', color:'#2563eb' }}>
                        <Loader2 size={13} className="spinner"/> Loading payment link…
                      </div>
                    )}
                    <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.65rem' }}>
                      This window will update automatically once your payment is confirmed.
                    </div>
                  </div>
                  {historySection}
                </>
              );
            }

            // ── STATE 3: Waiting for admin approval (just submitted UPGRADE) ─
            if (crWaitingApproval) {
              return (
                <>
                  {bookingStrip}
                  <div style={{ background:'var(--orange-bg)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'1.1rem 1.1rem', marginBottom:'1rem' }}>
                    <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--orange)', marginBottom:'.5rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                      <ClockIcon size={15}/> Awaiting Admin Approval
                    </div>
                    <div style={{ fontSize:'.8rem', color:'var(--text-sub)', lineHeight:1.65, marginBottom:'.5rem' }}>
                      Your upgrade request has been received. Once our team approves it, your payment link will appear right here — <strong>no need to close this window</strong>.
                    </div>
                    {crWaitingApproval.additionalDeposit > 0 && (
                      <div style={{ fontSize:'.8rem', color:'var(--text-sub)', marginBottom:'.5rem' }}>
                        Additional deposit required: <strong style={{ color:'var(--orange)' }}>{fmt(crWaitingApproval.additionalDeposit)}</strong>
                      </div>
                    )}
                    <div style={{ fontSize:'.75rem', color:'var(--orange)', fontWeight:600, display:'flex', alignItems:'center', gap:'.35rem' }}>
                      <Loader2 size={12} className="spinner"/> Checking for approval every few seconds…
                    </div>
                  </div>
                  {historySection}
                </>
              );
            }

            // ── STATE 4: Default — the form ───────────────────────────
            return (
              <>
                {bookingStrip}
                {crError && <div className="mb-modal-err"><AlertTriangle size={15}/> {crError}</div>}

                <div className="mb-notice-box">
                  <Info size={15} style={{ flexShrink:0, marginTop:1 }}/>
                  <span>Changes are reviewed by our team within 24 hours. If an upgrade, a payment link will appear in this window after approval.</span>
                </div>

                {/* What to change tabs */}
                <div className="mb-field">
                  <label className="mb-label">What would you like to change?</label>
                  <div className="mb-cr-tabs">
                    {[{ key:'dates', label:'Dates Only' }, { key:'room', label:'Room Type Only' }, { key:'both', label:'Dates & Room' }].map(tab => (
                      <button key={tab.key} className={`mb-cr-tab${crTab===tab.key?' on':''}`} onClick={() => {
                        setCrTab(tab.key); setCrError(''); setPreview(null);
                        setSelectedRoomType(''); setSelectedRoomId(null); setSelectedRoomNumber('');
                        setCrRoomType(''); setIndividualRooms([]);
                      }}>{tab.label}</button>
                    ))}
                  </div>
                </div>

                {/* Date inputs */}
                {(crTab === 'dates' || crTab === 'both') && (
                  <div className="mb-field">
                    <label className="mb-label">Requested Dates</label>
                    <div className="mb-field-grid2">
                      <div>
                        <div style={{ fontSize:'.68rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.3rem' }}>New Check-In</div>
                        <input type="date" className="mb-input" value={crCheckIn} min={new Date().toISOString().split('T')[0]}
                          onChange={e => { setCrCheckIn(e.target.value); if (crCheckOut && new Date(crCheckOut) <= new Date(e.target.value)) setCrCheckOut(''); }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'.68rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'.3rem' }}>New Check-Out</div>
                        <input type="date" className="mb-input" value={crCheckOut} min={crCheckIn || new Date().toISOString().split('T')[0]}
                          onChange={e => setCrCheckOut(e.target.value)}/>
                      </div>
                    </div>
                  </div>
                )}

                {/* Room picker: Step 1 (type) → Step 2 (specific room) */}
                {(crTab === 'room' || crTab === 'both') && (
                  <div className="mb-field">
                    {selectedRoomType ? (
                      <>
                        <label className="mb-label">
                          Step 2 — Pick a Room Number
                          <span style={{ marginLeft:'.5rem', fontWeight:400, color:'var(--text-muted)', textTransform:'none', letterSpacing:0 }}>({selectedRoomType})</span>
                        </label>
                        <button className="mb-step-back" onClick={handleBackToTypeSelection}>← Back to room types</button>
                        {individualRoomsLoading ? (
                          <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                            {[1,2,3,4,5,6].map(i => <span key={i} className="mb-skel" style={{ height:58, borderRadius:9, width:80 }}/>)}
                          </div>
                        ) : individualRooms.length === 0 ? (
                          <div style={{ fontSize:'.82rem', color:'var(--text-muted)', padding:'.75rem', textAlign:'center' }}>No rooms found for {selectedRoomType}.</div>
                        ) : (
                          <>
                            <div className="mb-ind-room-grid">
                              {individualRooms.map(room => (
                                <IndividualRoomCard
                                  key={room.id}
                                  room={room}
                                  currentRoomId={crBooking.room?.id || crBooking.roomId}
                                  selectedRoomId={selectedRoomId}
                                  onClick={handleSelectRoom}
                                />
                              ))}
                            </div>
                            {selectedRoomId ? (
                              <div style={{ fontSize:'.72rem', color:'var(--blue)', marginTop:'.35rem', fontWeight:600 }}>
                                ✓ Room #{selectedRoomNumber} selected
                              </div>
                            ) : (
                              <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.35rem' }}>
                                Click a room above. Greyed-out rooms are booked for your requested dates.
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="mb-label">Step 1 — Select Room Type</label>
                        {roomTypesLoading ? (
                          <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap' }}>
                            {[1,2,3,4].map(i => <span key={i} className="mb-skel" style={{ height:80, borderRadius:10, flex:'1 1 140px' }}/>)}
                          </div>
                        ) : roomTypes.length === 0 ? (
                          <div style={{ fontSize:'.82rem', color:'var(--text-muted)', padding:'.75rem', textAlign:'center' }}>No room types found.</div>
                        ) : (
                          <>
                            <div className="mb-room-grid">
                              {roomTypes.map(room => {
                                const currentRoomData = roomTypes.find(r => r.roomType === currentRoomType);
                                const currentPPn = currentRoomData?.pricePerNight ?? null;
                                return (
                                  <RoomTypeCard
                                    key={room.roomType}
                                    room={room}
                                    currentType={currentRoomType}
                                    currentPricePerNight={currentPPn}
                                    selected={crRoomType}
                                    currentNights={crBooking.numberOfNights || 0}
                                    onClick={() => handleSelectRoomType(room.roomType, crBooking)}
                                  />
                                );
                              })}
                            </div>
                            <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.35rem' }}>
                              Click any room type to browse its available rooms. Gold = your current type.
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Price preview */}
                <PricePreview preview={preview} loading={previewLoading}/>

                {/* Reason */}
                <div className="mb-field">
                  <label className="mb-label">Reason for Change <span style={{ color:'var(--red)' }}>*</span></label>
                  <textarea className="mb-textarea" value={crReason} onChange={e => setCrReason(e.target.value)}
                    placeholder="e.g. Family emergency changed our travel dates, we need a larger room…" rows={3}/>
                </div>

                {historySection}
              </>
            );
          })()}
        </Modal.Body>

        {/* Footer buttons depend on current state */}
        <Modal.Footer>
          <button className="mb-btn-secondary" onClick={() => {
            setCrBooking(null); setCrSuccess(false); setCrWaitingApproval(null);
            setCrPaymentPending(null); stopPolling();
          }}>Close</button>

          {/* Show submit only on the form state */}
          {!crSuccess && !crWaitingApproval && !crPaymentPending && (
            <button className="mb-btn-blue" disabled={crSubmitting} onClick={handleChangeRequest}>
              {crSubmitting
                ? <><Loader2 size={14} className="spinner"/> Submitting…</>
                : <><Send size={14}/> Submit Request</>}
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}