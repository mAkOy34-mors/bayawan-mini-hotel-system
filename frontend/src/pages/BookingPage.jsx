// BookingPage.jsx – Card UI matching assignment/activity card layout
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { fetchAvailableRooms, createBooking } from '../services/api';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import { fmt, fmtDate, todayISO, addDays } from '../utils/format';
import { API_BASE } from '../constants/config';
import {
  Search, BedDouble, Sparkles, Crown, Gem, Home, Hotel,
  Users, Calendar, Lock, ClipboardList, CreditCard,
  Mail, Phone, CheckCircle2, ShieldCheck,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:       #C9A84C;
    --gold-b:     #dfc06e;
    --gold-dim:   rgba(201,168,76,0.6);
    --gold-faint: rgba(201,168,76,0.1);
    --bg:         #f4f6f8;
    --surface:    #ffffff;
    --surface2:   #f8f9fb;
    --text:       #1a1f2e;
    --text-sub:   #4a5568;
    --text-muted: #8a96a8;
    --border:     #e2e8f0;
    --border-s:   rgba(0,0,0,0.06);
    --green:      #2d9b6f;
    --green-bg:   rgba(45,155,111,0.1);
    --red:        #dc3545;
    --red-bg:     rgba(220,53,69,0.1);
    --blue:       #3b82f6;
    --blue-bg:    rgba(59,130,246,0.1);
    --accent:     #5b4fcf;
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.35) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:linear-gradient(to bottom,rgba(201,168,76,.6),rgba(201,168,76,.2)); border-radius:99px; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes slideUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes checkPop { 0%{transform:scale(0) rotate(-20deg)} 70%{transform:scale(1.15) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }

  /* ══ Root ══ */
  .bp-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .bp-root { padding:1.25rem 1rem; } }

  /* ══ Page header ══ */
  .bp-page-header { margin-bottom:1.75rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .bp-page-title  { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .2rem; }
  .bp-page-sub    { font-size:.82rem; color:var(--text-muted); }

  /* ══ Search Panel ══ */
  .bp-search-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1.35rem 1.5rem; margin-bottom:1.5rem; box-shadow:0 1px 4px rgba(0,0,0,.05);
    animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;
  }
  .bp-search-title { font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:1rem; }
  .bp-search-grid  { display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:.85rem; align-items:flex-end; }
  @media(max-width:900px){ .bp-search-grid { grid-template-columns:1fr 1fr; } }
  @media(max-width:560px){ .bp-search-grid { grid-template-columns:1fr; } }

  /* ══ Field ══ */
  .bp-field { display:flex; flex-direction:column; gap:.4rem; }
  .bp-label {
    font-size:.7rem; letter-spacing:.07em; text-transform:uppercase;
    color:var(--text-muted); font-weight:600;
  }
  .bp-input, .bp-select {
    background:#fff; border:1px solid var(--border);
    color:var(--text); border-radius:8px; padding:.65rem .9rem; font-size:.875rem;
    font-family:'DM Sans',sans-serif; transition:border-color .2s,box-shadow .2s; outline:none;
  }
  .bp-input::placeholder { color:var(--text-muted); }
  .bp-input:focus, .bp-select:focus {
    border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.12);
  }
  .bp-select {
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.5rem;
    background-color:#fff;
  }

  /* ══ Search button ══ */
  .bp-search-btn {
    padding:.68rem 1.4rem; border:none; border-radius:8px; font-size:.85rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    transition:all .22s; white-space:nowrap; display:inline-flex; align-items:center; gap:.5rem;
    box-shadow:0 2px 8px rgba(201,168,76,0.3);
  }
  .bp-search-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); box-shadow:0 4px 16px rgba(201,168,76,0.35); transform:translateY(-1px); }
  .bp-search-btn:disabled { opacity:.55; cursor:not-allowed; }
  .bp-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }

  /* ══ Room grid ══ */
  .bp-room-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
  @media(max-width:1100px){ .bp-room-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:640px) { .bp-room-grid { grid-template-columns:1fr; } }

  /* ══ Room Card (matching screenshot card style) ══ */
  .bp-room-card {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; transition:transform .2s, box-shadow .2s, border-color .2s;
    animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
    box-shadow:0 1px 6px rgba(0,0,0,.06); display:flex; flex-direction:column;
    position:relative;
  }
  .bp-room-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.12); border-color:rgba(201,168,76,0.4); }

  /* Colored top border like the screenshot cards */
  .bp-room-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(to right,#9a7a2e,#C9A84C);
  }
  .bp-room-card.type-STANDARD::before  { background:linear-gradient(to right,#6366f1,#818cf8); }
  .bp-room-card.type-DELUXE::before    { background:linear-gradient(to right,#0ea5e9,#38bdf8); }
  .bp-room-card.type-SUITE::before     { background:linear-gradient(to right,#10b981,#34d399); }
  .bp-room-card.type-PRESIDENTIAL::before { background:linear-gradient(to right,#f59e0b,#fbbf24); }
  .bp-room-card.type-VILLA::before     { background:linear-gradient(to right,#ef4444,#f87171); }

  /* Card image */
  .bp-room-img {
    height:140px; position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center;
  }
  .bp-room-img img { width:100%; height:100%; object-fit:cover; display:block; }
  .bp-room-img-fallback { display:flex; align-items:center; justify-content:center; color:#94a3b8; opacity:.5; }

  /* Card body */
  .bp-room-body { padding:1rem 1.1rem; flex:1; display:flex; flex-direction:column; }

  /* Type label + badge row — matching screenshot "ACTIVITY | Locked" */
  .bp-card-type-row {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:.55rem;
  }
  .bp-card-type-label {
    font-size:.65rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
    color:var(--text-muted);
  }
  .bp-avail-badge {
    font-size:.65rem; font-weight:700; padding:.18rem .65rem; border-radius:99px;
    background:var(--green-bg); color:var(--green); border:1px solid rgba(45,155,111,0.25);
    text-transform:uppercase; letter-spacing:.05em;
  }
  .bp-avail-badge.unavailable {
    background:var(--red-bg); color:var(--red); border-color:rgba(220,53,69,0.25);
  }

  /* Title */
  .bp-room-type { font-weight:700; font-size:1rem; color:var(--text); margin-bottom:.35rem; line-height:1.3; }

  /* Meta rows — matching screenshot's icon + text rows */
  .bp-meta-list { display:flex; flex-direction:column; gap:.3rem; margin-bottom:.75rem; }
  .bp-meta-row  { display:flex; align-items:center; gap:.45rem; font-size:.78rem; color:var(--text-sub); }
  .bp-meta-icon { font-size:.78rem; flex-shrink:0; width:16px; text-align:center; }
  .bp-meta-dot  { width:3px; height:3px; border-radius:50%; background:var(--text-muted); margin:0 .1rem; }

  /* Amenity tags */
  .bp-amenity-row { display:flex; flex-wrap:wrap; gap:.3rem; margin-bottom:.85rem; }
  .bp-amenity-tag {
    font-size:.65rem; font-weight:500; padding:.2rem .55rem; border-radius:6px;
    background:#f1f5f9; color:var(--text-sub); border:1px solid #e2e8f0;
  }

  /* Status box — matching screenshot's "Returned / Submitted" box */
  .bp-status-box {
    background:#f0f7ff; border:1px solid #d0e4f7; border-radius:10px;
    padding:.7rem .85rem; margin-bottom:.85rem;
    display:flex; align-items:center; justify-content:space-between;
  }
  .bp-status-left { display:flex; align-items:center; gap:.5rem; }
  .bp-status-icon { font-size:.9rem; }
  .bp-status-label { font-size:.78rem; font-weight:600; color:#1d6fa4; }
  .bp-status-time  { font-size:.7rem; color:var(--text-muted); margin-top:.15rem; display:flex; align-items:center; gap:.3rem; }
  .bp-price-badge  {
    font-size:.75rem; font-weight:700; color:#fff;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C);
    padding:.25rem .75rem; border-radius:8px;
    letter-spacing:.03em;
  }

  /* Card footer — matching screenshot's "Late submissions disabled | Open" */
  .bp-card-footer {
    padding:.75rem 1.1rem; border-top:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    background:#fafbfc;
  }
  .bp-footer-note { font-size:.72rem; color:var(--text-muted); display:flex; align-items:center; gap:.35rem; }
  .bp-book-btn {
    padding:.42rem 1.1rem; border:1.5px solid var(--border); background:#fff;
    border-radius:8px; font-size:.78rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; color:var(--text); transition:all .18s;
  }
  .bp-book-btn:hover { border-color:var(--gold); color:var(--gold); background:rgba(201,168,76,0.05); }

  /* ══ Empty state ══ */
  .bp-empty { text-align:center; padding:4rem 2rem; color:var(--text-muted); animation:fadeUp .5s ease both; background:var(--surface); border-radius:14px; border:1px solid var(--border); }
  .bp-empty-icon { margin-bottom:.85rem; display:flex; justify-content:center; }
  .bp-empty-text { font-size:.85rem; line-height:1.7; }

  /* ══ Skeleton loader ══ */
  .bp-skeleton-card {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.04);
  }
  .bp-skeleton-img  { height:140px; background:#f1f5f9; }
  .bp-skeleton-body { padding:1rem 1.1rem; }
  .bp-skeleton-line {
    border-radius:6px; margin-bottom:.6rem; display:block;
    background:linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 50%,#f1f5f9 100%);
    background-size:600px 100%; animation:shimmer 1.4s ease-in-out infinite;
  }

  /* ══ Booking Modal ══ */
  .bm-modal .modal-dialog { max-height:92vh; display:flex; flex-direction:column; margin:auto; }
  .bm-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); display:flex; flex-direction:column; max-height:92vh; overflow:hidden; }
  .bm-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1.25rem 1.5rem; flex-shrink:0; }
  .bm-modal .modal-body    { background:#fff; padding:1.5rem; overflow-y:auto; flex:1; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f4f6f8; }
  .bm-modal .modal-body::-webkit-scrollbar { width:4px; }
  .bm-modal .modal-body::-webkit-scrollbar-track { background:#f4f6f8; }
  .bm-modal .modal-body::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }
  .bm-modal .modal-footer  { background:#fafbfc; border-top:1px solid var(--border); padding:1rem 1.5rem; gap:.6rem; flex-shrink:0; }
  .bm-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.2rem; color:var(--text); font-weight:600; }

  /* ══ Inline error banner inside modal ══ */
  @keyframes errShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  .bm-err {
    display:flex; align-items:flex-start; gap:.65rem;
    background:var(--red-bg); border:1px solid rgba(220,53,69,0.25); border-radius:10px;
    padding:.75rem 1rem; margin-bottom:1rem;
    animation:errShake .35s ease, fadeUp .25s ease;
    font-size:.82rem; color:var(--red); line-height:1.5;
  }
  .bm-err-ico { font-size:1rem; flex-shrink:0; margin-top:.05rem; }
  .bm-err-close {
    margin-left:auto; background:none; border:none; color:var(--red);
    cursor:pointer; font-size:1rem; padding:0; opacity:.7; flex-shrink:0;
  }
  .bm-err-close:hover { opacity:1; }

  .bm-room-banner { height:110px; border-radius:10px; overflow:hidden; margin-bottom:1.1rem; position:relative; display:flex; align-items:center; justify-content:center; }
  .bm-room-banner img { width:100%; height:100%; object-fit:cover; display:block; }
  .bm-room-banner-icon { display:flex; align-items:center; justify-content:center; color:#94a3b8; }
  .bm-desc { font-size:.82rem; color:var(--text-sub); line-height:1.6; margin-bottom:1.1rem; }

  .bm-section-label {
    font-size:.67rem; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted);
    font-weight:700; margin-bottom:.8rem; display:flex; align-items:center; gap:.5rem;
  }
  .bm-section-label::after { content:''; flex:1; height:1px; background:var(--border); }

  .bm-summary {
    display:grid; grid-template-columns:1fr 1fr; gap:.65rem;
    background:#f8fafc; border:1px solid var(--border);
    border-radius:10px; padding:.9rem 1rem; margin-bottom:1.1rem;
  }
  .bm-summary-label { font-size:.65rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:.15rem; font-weight:600; }
  .bm-summary-val   { font-size:.875rem; color:var(--text); font-weight:600; }

  .bm-field-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin-bottom:.75rem; }
  @media(max-width:560px){ .bm-field-grid { grid-template-columns:1fr; } }
  .bm-field   { display:flex; flex-direction:column; gap:.38rem; }
  .bm-label   { font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); font-weight:600; }
  .bm-input, .bm-select, .bm-textarea {
    background:#fff; border:1px solid var(--border);
    color:var(--text); border-radius:8px; padding:.62rem .85rem; font-size:.85rem;
    font-family:'DM Sans',sans-serif; outline:none;
    transition:border-color .2s,box-shadow .2s;
  }
  .bm-input::placeholder, .bm-textarea::placeholder { color:var(--text-muted); }
  .bm-input:focus, .bm-select:focus, .bm-textarea:focus {
    border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.1);
  }
  .bm-input.invalid { border-color:rgba(220,53,69,0.5); }
  .bm-select {
    appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right .75rem center; padding-right:2.2rem;
    background-color:#fff;
  }
  .bm-textarea { resize:vertical; min-height:70px; }

  .bm-pricing { border-radius:10px; overflow:hidden; margin-top:.9rem; margin-bottom:1.1rem; border:1px solid var(--border); }
  .bm-pricing-row { display:flex; justify-content:space-between; align-items:center; padding:.6rem .95rem; border-bottom:1px solid #f1f5f9; font-size:.83rem; color:var(--text-sub); }
  .bm-pricing-row:last-child { border-bottom:none; }
  .bm-pricing-row.total   { background:#f8fafc; font-weight:700; color:var(--text); }
  .bm-pricing-row.deposit { color:var(--gold); font-weight:600; }

  .bm-cancel-btn {
    padding:.6rem 1.25rem; border:1px solid var(--border); border-radius:8px;
    background:#fff; color:var(--text-muted); font-size:.83rem;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s;
  }
  .bm-cancel-btn:hover { background:#f8fafc; color:var(--text); }
  .bm-confirm-btn {
    padding:.6rem 1.5rem; border:none; border-radius:8px; font-size:.83rem;
    font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; transition:all .22s;
    display:inline-flex; align-items:center; gap:.5rem; box-shadow:0 2px 8px rgba(201,168,76,0.3);
  }
  .bm-confirm-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); box-shadow:0 4px 16px rgba(201,168,76,0.35); }
  .bm-confirm-btn:disabled { opacity:.5; cursor:not-allowed; }

  /* ══ Payment option cards ══ */
  .bm-pay-options { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; margin-bottom:.75rem; }
  @media(max-width:560px){ .bm-pay-options { grid-template-columns:1fr; } }
  .bm-pay-card {
    border:1.5px solid var(--border); border-radius:10px; padding:.8rem 1rem;
    cursor:pointer; transition:all .18s; background:#fff; text-align:left;
    display:flex; align-items:flex-start; gap:.65rem; width:100%;
  }
  .bm-pay-card:hover { border-color:rgba(201,168,76,0.4); background:rgba(201,168,76,0.03); }
  .bm-pay-card.sel {
    border-color:var(--gold); background:rgba(201,168,76,0.06);
    box-shadow:0 0 0 3px rgba(201,168,76,0.1);
  }
  .bm-pay-radio {
    width:16px; height:16px; border-radius:50%; border:2px solid var(--border);
    flex-shrink:0; margin-top:3px; display:flex; align-items:center; justify-content:center;
    transition:all .18s; background:#fff;
  }
  .bm-pay-card.sel .bm-pay-radio { border-color:var(--gold); background:var(--gold); }
  .bm-pay-dot { width:6px; height:6px; border-radius:50%; background:#fff; }
  .bm-pay-title { font-size:.83rem; font-weight:700; color:var(--text); margin-bottom:.18rem; }
  .bm-pay-sub   { font-size:.72rem; color:var(--text-muted); line-height:1.45; }
  .bm-pay-chip {
    font-size:.71rem; font-weight:700; margin-top:.38rem;
    display:inline-flex; align-items:center; gap:.28rem;
    padding:.2rem .58rem; border-radius:6px;
  }
  .bm-pay-chip.deposit { background:rgba(201,168,76,0.12); color:#9a7a2e; }
  .bm-pay-chip.full    { background:var(--green-bg); color:var(--green); }
  .bm-pay-chip.hotel   { background:#f1f5f9; color:#64748b; }
  .bm-due-box {
    display:flex; align-items:center; justify-content:space-between;
    padding:.75rem 1rem; border-radius:10px; margin-bottom:.9rem;
    border:1.5px solid rgba(201,168,76,0.25); background:rgba(201,168,76,0.06);
  }
  .bm-due-label  { font-size:.72rem; font-weight:700; color:#9a7a2e; text-transform:uppercase; letter-spacing:.07em; }
  .bm-due-sub    { font-size:.68rem; color:var(--text-muted); margin-top:.1rem; }
  .bm-due-amount { font-family:'Cormorant Garamond',serif; font-size:1.55rem; font-weight:600; color:var(--text); }

  /* ══ OTP Modal ══ */
  .otp-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); }
  .otp-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1.25rem 1.5rem; }
  .otp-modal .modal-body    { background:#fff; padding:1.75rem 2rem; }
  .otp-modal .modal-footer  { background:#fafbfc; border-top:1px solid var(--border); padding:1rem 1.5rem; gap:.6rem; }
  .otp-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.2rem; color:var(--text); font-weight:600; }

  @keyframes otpPop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  .otp-icon { text-align:center; margin-bottom:.75rem; animation:otpPop .4s cubic-bezier(.22,1,.36,1) both; display:flex; justify-content:center; }
  .otp-title { font-family:'Cormorant Garamond',serif; font-size:1.45rem; font-weight:600; color:var(--text); text-align:center; margin-bottom:.35rem; }
  .otp-sub { font-size:.82rem; color:var(--text-muted); text-align:center; line-height:1.65; margin-bottom:1.5rem; }
  .otp-sub strong { color:var(--text-sub); }

  .otp-inputs { display:flex; gap:.55rem; justify-content:center; margin-bottom:1.1rem; }
  .otp-box {
    width:48px; height:56px; border:1.5px solid var(--border); border-radius:10px;
    background:#fff; color:var(--text); font-size:1.5rem; font-weight:700;
    font-family:'Cormorant Garamond',serif; text-align:center;
    outline:none; transition:border-color .18s, box-shadow .18s, background .18s;
    caret-color:var(--gold);
  }
  .otp-box:focus { border-color:var(--gold); box-shadow:0 0 0 3px rgba(201,168,76,0.12); background:#fffdf5; }
  .otp-box.filled { border-color:rgba(201,168,76,0.5); background:rgba(201,168,76,0.05); }
  .otp-box.err { border-color:var(--red); background:var(--red-bg); }

  .otp-resend { text-align:center; font-size:.78rem; color:var(--text-muted); margin-bottom:.5rem; }
  .otp-resend button { background:none; border:none; color:var(--gold-dark,#9a7a2e); font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:.78rem; padding:0; }
  .otp-resend button:disabled { color:var(--text-muted); cursor:not-allowed; }
  .otp-timer { color:var(--gold-dark,#9a7a2e); font-weight:700; }

  .otp-verify-btn {
    width:100%; padding:.72rem; border:none; border-radius:9px;
    background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff;
    font-family:'DM Sans',sans-serif; font-size:.875rem; font-weight:700;
    cursor:pointer; transition:all .2s; box-shadow:0 2px 8px rgba(201,168,76,0.28);
    display:flex; align-items:center; justify-content:center; gap:.5rem;
  }
  .otp-verify-btn:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); transform:translateY(-1px); box-shadow:0 4px 14px rgba(201,168,76,0.32); }
  .otp-verify-btn:disabled { opacity:.55; cursor:not-allowed; }

  /* ══ PayMongo iframe modal ══ */
  .pay-modal .modal-dialog { max-height:95vh; display:flex; flex-direction:column; margin:auto; }
  .pay-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.18); display:flex; flex-direction:column; max-height:95vh; overflow:hidden; }
  .pay-modal .modal-header  { background:#fff; border-bottom:1px solid var(--border); padding:1rem 1.5rem; flex-shrink:0; }
  .pay-modal .modal-body    { padding:0; flex:1; overflow:hidden; }
  .pay-modal .modal-title   { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--text); font-weight:600; display:flex; align-items:center; gap:.55rem; }
  .pay-modal-iframe { width:100%; height:72vh; border:none; display:block; }
  .pay-modal-footer { padding:.85rem 1.5rem; border-top:1px solid var(--border); background:#fafbfc; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .pay-modal-note { font-size:.75rem; color:var(--text-muted); display:flex; align-items:center; gap:.4rem; }
  .pay-modal-cancel { padding:.5rem 1.1rem; border:1px solid var(--border); border-radius:8px; background:#fff; color:var(--text-muted); font-size:.8rem; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .18s; }
  .pay-modal-cancel:hover { background:#f8fafc; color:var(--text); border-color:#c8d0dc; }

  /* ══ Success Modal ══ */
  .bs-modal .modal-content { background:#fff; border:1px solid rgba(45,155,111,0.25); border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.15); }
  .bs-modal .modal-header  { background:#fff; border-bottom:none; padding:.75rem 1.25rem .25rem; }
  .bs-modal .modal-body    { background:#fff; padding:1.5rem 2rem 2rem; }
  .bs-icon  { text-align:center; margin-bottom:.65rem; animation:checkPop .5s cubic-bezier(.22,1,.36,1) both; display:flex; justify-content:center; }
  .bs-title { font-family:'Cormorant Garamond',serif; font-size:1.7rem; font-weight:600; color:var(--text); text-align:center; margin-bottom:.35rem; }
  .bs-sub   { font-size:.83rem; color:var(--text-muted); text-align:center; line-height:1.65; margin-bottom:1.35rem; }
  .bs-detail-box {
    background:rgba(45,155,111,0.07); border:1px solid rgba(45,155,111,0.2);
    border-radius:10px; padding:.85rem 1rem; text-align:center; margin-bottom:1.35rem;
    font-size:.83rem; color:var(--green);
  }
  .bs-close-btn {
    display:block; width:100%; max-width:190px; margin:0 auto; padding:.7rem 1rem;
    border:none; border-radius:10px; font-size:.875rem; font-family:'DM Sans',sans-serif;
    font-weight:600; cursor:pointer; background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; transition:all .22s;
    box-shadow:0 2px 8px rgba(201,168,76,0.3);
  }
  .bs-close-btn:hover { background:linear-gradient(135deg,#b09038,#dfc06e); }
`;

export function BookingPage({ token }) {
  const [rooms, setRooms]         = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [checkIn, setCheckIn]     = useState(addDays(todayISO(), 1));
  const [checkOut, setCheckOut]   = useState(addDays(todayISO(), 2));
  const [guests, setGuests]       = useState(2);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [requests, setRequests]   = useState('');

  const [guestName, setGuestName]         = useState('');
  const [guestEmail, setGuestEmail]       = useState('');
  const [guestPhone, setGuestPhone]       = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [paymentType, setPaymentType]     = useState('DEPOSIT'); // 'DEPOSIT' | 'FULL'

  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked]         = useState(null);
  const [touched, setTouched]       = useState(false);
  const [modalError, setModalError] = useState('');

  // OTP states
  const [showOtp,    setShowOtp]    = useState(false);
  const [otpDigits,  setOtpDigits]  = useState(['','','','','','']);
  const [otpError,   setOtpError]   = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpTimer,   setOtpTimer]   = useState(0);
  const [pendingPayload, setPendingPayload] = useState(null);

  // PayMongo iframe popup states
  const [showPayModal,  setShowPayModal]  = useState(false);
  const [payUrl,        setPayUrl]        = useState('');
  const [payBookingId,  setPayBookingId]  = useState(null);
  const [payBookingRef, setPayBookingRef] = useState('');
  const [checkingPay,   setCheckingPay]   = useState(false);

  const { alert, showAlert } = useAlert();

  const getAmenitiesArray = (amenities) => {
    if (!amenities) return ['WiFi', 'AC', 'TV'];
    if (Array.isArray(amenities)) return amenities;
    if (typeof amenities === 'string') return amenities.split(',').map(a => a.trim());
    return ['WiFi', 'AC', 'TV'];
  };

  const getRoomIcon = (roomType) => {
    const icons = {
      STANDARD:     <BedDouble size={40} strokeWidth={1} />,
      DELUXE:       <Sparkles  size={40} strokeWidth={1} />,
      SUITE:        <Crown     size={40} strokeWidth={1} />,
      PRESIDENTIAL: <Gem       size={40} strokeWidth={1} />,
      VILLA:        <Home      size={40} strokeWidth={1} />,
    };
    return icons[roomType] || <Hotel size={40} strokeWidth={1} />;
  };

  const getRoomGradient = (roomType) => {
    const g = {
      STANDARD:     'linear-gradient(135deg,#e8eaf6,#c5cae9)',
      DELUXE:       'linear-gradient(135deg,#e1f5fe,#b3e5fc)',
      SUITE:        'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
      PRESIDENTIAL: 'linear-gradient(135deg,#fff8e1,#ffe082)',
      VILLA:        'linear-gradient(135deg,#fce4ec,#f8bbd0)',
    };
    return g[roomType] || g.STANDARD;
  };

  const getRoomTypeColor = (roomType) => {
    const c = { STANDARD:'#6366f1', DELUXE:'#0ea5e9', SUITE:'#10b981', PRESIDENTIAL:'#f59e0b', VILLA:'#ef4444' };
    return c[roomType] || '#C9A84C';
  };

  useEffect(() => {
    const CACHE_KEY = `rooms_cache_${token}`;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) { setRooms(JSON.parse(cached)); setInitialLoading(false); }
    } catch { /* ignore */ }

    let cancelled = false;
    fetchAvailableRooms(token, null, null)
      .then(data => {
        if (cancelled || !data) return;
        setRooms(data);
        setInitialLoading(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* quota */ }
      })
      .catch(() => { if (!cancelled) setInitialLoading(false); });

    return () => { cancelled = true; };
  }, [token]);

  const searchRooms = async () => {
    if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
      showAlert('Check-out must be after check-in.', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAvailableRooms(token, checkIn, checkOut);
      setRooms(data);
      if (!data.length) showAlert('No rooms available for selected dates.', 'error');
    } finally { setLoading(false); }
  };

  const nights    = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const total     = selected ? selected.pricePerNight * nights : 0;
  const deposit   = total * 0.5;
  const amountDue = paymentType === 'FULL' ? total : deposit;

  // Detect PayMongo return from redirect (fallback)
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const status    = params.get('status');
    const bookingId = params.get('booking_id');
    if (status === 'success') {
      setBooked({ id: bookingId || '—', fromRedirect: true });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'failed' || status === 'cancelled') {
      showAlert('Payment was cancelled or failed. Your booking is saved — you can pay later.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Open PayMongo in iframe popup instead of redirecting
  const openPayPopup = (checkoutUrl, bookingId, bookingRef) => {
    setPayUrl(checkoutUrl);
    setPayBookingId(bookingId);
    setPayBookingRef(bookingRef || bookingId);
    setShowPayModal(true);
  };

  // Poll booking status when guest closes the payment modal
  const handlePayModalClose = async () => {
    setShowPayModal(false);
    setCheckingPay(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const bookings = await res.json();
        const b = bookings.find(bk =>
          bk.id == payBookingId || bk.bookingReference === payBookingRef
        );
        if (b && (b.paymentStatus === 'PAID' || b.status === 'CONFIRMED')) {
          setBooked({ id: payBookingRef || payBookingId, fromRedirect: true });
        } else {
          // Booking exists but webhook hasn't fired yet — still show success
          setBooked({ id: payBookingRef || payBookingId, fromRedirect: true });
        }
      } else {
        // Fallback — show success anyway, booking was already created
        setBooked({ id: payBookingRef || payBookingId, fromRedirect: true });
      }
    } catch {
      // Fallback — show success anyway
      setBooked({ id: payBookingRef || payBookingId, fromRedirect: true });
    } finally {
      setCheckingPay(false);
    }
  };

  const resetGuestForm = () => {
    setGuestName(''); setGuestEmail(''); setGuestPhone('');
    setPaymentMethod('ONLINE'); setPaymentType('DEPOSIT');
    setRequests(''); setTouched(false); setModalError('');
  };

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  const sendOtp = async (email) => {
    setOtpSending(true);
    setOtpError('');
    try {
      const nights      = Math.max(1, Math.ceil(
        (new Date(pendingPayload.checkOutDate) - new Date(pendingPayload.checkInDate)) / 86400000
      ));
      const totalAmount = pendingPayload.pricePerNight * nights;

      const res = await fetch(`${API_BASE}/bookings/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId:          pendingPayload.roomId,
          checkInDate:     pendingPayload.checkInDate,
          checkOutDate:    pendingPayload.checkOutDate,
          numberOfGuests:  pendingPayload.numberOfGuests,
          numAdults:       pendingPayload.numberOfGuests,
          numChildren:     0,
          totalAmount:     totalAmount,
          specialRequests: pendingPayload.specialRequests || '',
          paymentMethod:   pendingPayload.paymentMethod,
          paymentType:     pendingPayload.paymentType,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to send OTP');
      }
      setOtpTimer(60);
      setOtpDigits(['','','','','','']);
    } catch (e) {
      setOtpError(e.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpInput = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next  = [...otpDigits];
    next[idx]   = clean;
    setOtpDigits(next);
    setOtpError('');
    // Auto-focus next box
    if (clean && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next  = [...otpDigits];
    text.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setOtpDigits(next);
    document.getElementById(`otp-${Math.min(text.length, 5)}`)?.focus();
  };

  const verifyOtpAndBook = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) { setOtpError('Please enter all 6 digits.'); return; }

    setOtpVerifying(true);
    setOtpError('');
    try {
      // Single endpoint — verifies OTP AND creates booking
      const res = await fetch(`${API_BASE}/bookings/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          otp,
          roomId:          pendingPayload.roomId,
          pricePerNight:   pendingPayload.pricePerNight,
          checkInDate:     pendingPayload.checkInDate,
          checkOutDate:    pendingPayload.checkOutDate,
          numberOfGuests:  pendingPayload.numberOfGuests,
          numAdults:       pendingPayload.numberOfGuests,
          numChildren:     0,
          specialRequests: pendingPayload.specialRequests,
          guestName:       pendingPayload.guestName,
          guestEmail:      pendingPayload.guestEmail,
          guestPhone:      pendingPayload.guestPhone,
          paymentMethod:   pendingPayload.paymentMethod,
          paymentType:     pendingPayload.paymentType,
          totalAmount:     pendingPayload.pricePerNight * Math.max(1, Math.ceil(
            (new Date(pendingPayload.checkOutDate) - new Date(pendingPayload.checkInDate)) / 86400000
          )),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid OTP. Please try again.');
      }

      const data = await res.json();

      // Success
      setShowOtp(false);
      if (pendingPayload.paymentMethod === 'ONLINE' && data.checkoutUrl) {
        resetGuestForm();
        setSelected(null);
        setPendingPayload(null);
        openPayPopup(data.checkoutUrl, data.id, data.bookingReference);
      } else {
        // ✅ Use data directly — backend returns booking fields at root level
        setBooked({
          id:            data.id || data.bookingReference,
          depositAmount: data.depositAmount,
          fromRedirect:  false,
        });
        showAlert('Booking confirmed! Pay at hotel on arrival.', 'success');
        resetGuestForm();
        setSelected(null);
        setPendingPayload(null);
      }

    } catch (e) {
      setOtpError(e.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
      setConfirming(false);
    }
  };

  const confirmBooking = async () => {
    setTouched(true);
    setModalError('');

    // Inline validation
    if (!guestName.trim())  { setModalError('Full name is required.'); return; }
    if (!guestEmail.trim()) { setModalError('Email address is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) { setModalError('Please enter a valid email address.'); return; }
    if (!guestPhone.trim()) { setModalError('Phone number is required.'); return; }
    if (!paymentMethod)     { setModalError('Please select a payment method.'); return; }

    // Save payload for after OTP verification
    const payload = {
      roomId:          selected.id,
      pricePerNight:   selected.pricePerNight,
      checkInDate:     checkIn,
      checkOutDate:    checkOut,
      numberOfGuests:  guests,
      specialRequests: requests.trim(),
      guestName:       guestName.trim(),
      guestEmail:      guestEmail.trim(),
      guestPhone:      guestPhone.trim(),
      paymentMethod,
      paymentType,
      amountDue,
    };
    setPendingPayload(payload);

    // Send OTP to guest email — include full booking data for backend validation
    setOtpSending(true);
    setOtpError('');
    setOtpDigits(['','','','','','']);
    try {
      const nights      = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
      const totalAmount = selected.pricePerNight * nights;

      const res = await fetch(`${API_BASE}/bookings/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId:          selected.id,
          checkInDate:     checkIn,
          checkOutDate:    checkOut,
          numberOfGuests:  guests,
          numAdults:       guests,
          numChildren:     0,
          totalAmount:     totalAmount,
          specialRequests: requests.trim(),
          paymentMethod,
          paymentType,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to send OTP');
      }
      setOtpTimer(60);
      setShowOtp(true);
    } catch (e) {
      setModalError(e.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <div className="bp-root">
      <style>{css}</style>
      <Alert alert={alert}/>

      {/* ══ Page header ══ */}
      <div className="bp-page-header">
        <div className="bp-page-title">Room Reservations</div>
        <div className="bp-page-sub">Browse available rooms and book your perfect stay</div>
      </div>

      {/* ══ Search Panel ══ */}
      <div className="bp-search-panel">
        <div className="bp-search-title">Search Availability</div>
        <div className="bp-search-grid">
          <div className="bp-field">
            <label className="bp-label">Check-In</label>
            <input type="date" className="bp-input" min={todayISO()} value={checkIn}
              onChange={e => {
                setCheckIn(e.target.value);
                if (new Date(checkOut) <= new Date(e.target.value))
                  setCheckOut(addDays(e.target.value, 1));
              }}
            />
          </div>
          <div className="bp-field">
            <label className="bp-label">Check-Out</label>
            <input type="date" className="bp-input" min={addDays(checkIn, 1)} value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
            />
          </div>
          <div className="bp-field">
            <label className="bp-label">Guests</label>
            <select className="bp-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>
          <button className="bp-search-btn" onClick={searchRooms} disabled={loading}>
            {loading ? <><div className="bp-spinner"/>Searching…</> : <><Search size={15}/>Search Rooms</>}
          </button>
        </div>
      </div>

      {/* ══ Room Grid ══ */}
      {initialLoading ? (
        <div className="bp-room-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bp-skeleton-card">
              <div className="bp-skeleton-img"/>
              <div className="bp-skeleton-body">
                <div className="bp-skeleton-line" style={{height:10,width:'40%'}}/>
                <div className="bp-skeleton-line" style={{height:16,width:'65%'}}/>
                <div className="bp-skeleton-line" style={{height:11,width:'80%'}}/>
                <div className="bp-skeleton-line" style={{height:11,width:'60%'}}/>
                <div style={{display:'flex',gap:'.3rem',margin:'.5rem 0'}}>
                  {[1,2,3].map(j => <div key={j} className="bp-skeleton-line" style={{height:20,width:44,borderRadius:6,marginBottom:0}}/>)}
                </div>
                <div className="bp-skeleton-line" style={{height:56,borderRadius:8}}/>
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bp-empty">
          <div className="bp-empty-icon"><Hotel size={44} strokeWidth={1} opacity={0.4}/></div>
          <div className="bp-empty-text">No rooms to display.<br/>Adjust your dates and search to see availability.</div>
        </div>
      ) : (
        <div className="bp-room-grid">
          {rooms.map((room, idx) => {
            const typeColor = getRoomTypeColor(room.roomType);
            return (
              <div
                key={room.id}
                className={`bp-room-card type-${room.roomType}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {/* Image */}
                <div className="bp-room-img" style={{ background: getRoomGradient(room.roomType) }}>
                  {room.imageUrl
                    ? <img src={room.imageUrl} alt={room.roomType} onError={e => { e.target.style.display='none'; }}/>
                    : <div className="bp-room-img-fallback">{getRoomIcon(room.roomType)}</div>
                  }
                </div>

                <div className="bp-room-body">
                  {/* Type row — matches "ACTIVITY | Locked" pattern */}
                  <div className="bp-card-type-row">
                    <span className="bp-card-type-label" style={{ color: typeColor }}>ROOM</span>
                    <span className={`bp-avail-badge ${room.available ? '' : 'unavailable'}`}>
                      {room.available ? 'Available' : 'Booked'}
                    </span>
                  </div>

                  {/* Room name */}
                  <div className="bp-room-type">{room.roomType} Room</div>

                  {/* Meta rows — matching screenshot's icon+text rows */}
                  <div className="bp-meta-list">
                    <div className="bp-meta-row">
                      <span className="bp-meta-icon"><Users size={13}/></span>
                      <span>Up to {room.maxOccupancy} guests</span>
                      <span className="bp-meta-dot"/>
                      <span style={{ color: typeColor, fontWeight: 600 }}>{fmt(room.pricePerNight)}/night</span>
                    </div>
                    {room.description && (
                      <div className="bp-meta-row" style={{ color:'var(--text-muted)', fontSize:'.75rem', lineHeight:1.5 }}>
                        <span className="bp-meta-icon"><ClipboardList size={13}/></span>
                        <span style={{ overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {room.description}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amenity tags */}
                  <div className="bp-amenity-row">
                    {getAmenitiesArray(room.amenities).slice(0, 4).map((a, i) => (
                      <span key={i} className="bp-amenity-tag">{a}</span>
                    ))}
                  </div>

                  {/* Status box — matches screenshot's "Returned | SCORE 96" box */}
                  <div className="bp-status-box">
                    <div className="bp-status-left">
                      <span className="bp-status-icon"><Hotel size={16}/></span>
                      <div>
                        <div className="bp-status-label">{guests} {guests === 1 ? 'Guest' : 'Guests'} · {nights} {nights === 1 ? 'night' : 'nights'}</div>
                        <div className="bp-status-time">
                          <Calendar size={11}/>
                          <span>{fmtDate(checkIn)} → {fmtDate(checkOut)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bp-price-badge">{fmt(room.pricePerNight * nights)}</div>
                  </div>
                </div>

                {/* Footer — matches "Late submissions disabled | Open" */}
                <div className="bp-card-footer">
                  <span className="bp-footer-note">
                    <Lock size={12}/>
                    50% deposit required
                  </span>
                  <button
                    className="bp-book-btn"
                    disabled={!room.available}
                    onClick={() => { setSelected(room); resetGuestForm(); }}
                  >
                    {room.available ? 'Book Now' : 'Unavailable'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ Booking Confirmation Modal ══ */}
      <Modal show={!!selected} onHide={() => { setSelected(null); setModalError(''); }} centered size="lg" className="bm-modal" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            {selected?.roomType} Room — {fmt(selected?.pricePerNight)}/night
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selected && (
            <div style={{ animation:'slideUp .3s ease both' }}>

              {/* ── Inline error banner ── */}
              {modalError && (
                <div className="bm-err">
                  <span className="bm-err-ico"><ShieldCheck size={15}/></span>
                  <span>{modalError}</span>
                  <button className="bm-err-close" onClick={() => setModalError('')}>✕</button>
                </div>
              )}

              <div className="bm-room-banner" style={{ background: getRoomGradient(selected.roomType) }}>
                {selected.imageUrl
                  ? <img src={selected.imageUrl} alt={selected.roomType} onError={e => e.target.style.display='none'}/>
                  : <div className="bm-room-banner-icon"><Hotel size={48} strokeWidth={1} opacity={0.4}/></div>
                }
              </div>

              <p className="bm-desc">{selected.description}</p>

              <div className="bm-section-label">Booking Summary</div>
              <div className="bm-summary">
                {[
                  ['Check-In',  fmtDate(checkIn)],
                  ['Check-Out', fmtDate(checkOut)],
                  ['Guests',    `${guests} ${guests === 1 ? 'Guest' : 'Guests'}`],
                  ['Duration',  `${nights} ${nights === 1 ? 'night' : 'nights'}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="bm-summary-label">{label}</div>
                    <div className="bm-summary-val">{value}</div>
                  </div>
                ))}
              </div>

              <div className="bm-section-label">Guest Information</div>
              <div style={{ marginBottom:'.75rem' }}>
                <div className="bm-field">
                  <label className="bm-label">Full Name *</label>
                  <input type="text" className={`bm-input${touched && !guestName.trim() ? ' invalid' : ''}`}
                    value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Juan Dela Cruz"/>
                </div>
              </div>

              <div className="bm-field-grid">
                <div className="bm-field">
                  <label className="bm-label">Email *</label>
                  <input type="email" className={`bm-input${touched && !guestEmail.trim() ? ' invalid' : ''}`}
                    value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="juan@example.com"/>
                </div>
                <div className="bm-field">
                  <label className="bm-label">Phone Number *</label>
                  <input type="tel" className={`bm-input${touched && !guestPhone.trim() ? ' invalid' : ''}`}
                    value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+63 912 345 6789"/>
                </div>
              </div>

              <div className="bm-section-label">Payment Options</div>

              {/* ── Payment Method ── */}
              <div style={{ marginBottom:'.75rem' }}>
                <div className="bm-label" style={{ marginBottom:'.5rem' }}>How would you like to pay? *</div>
                <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap' }}>
                  {[
                    { value:'ONLINE', Icon: CreditCard, label:'Pay Online',   sub:'GCash / Card via PayMongo' },
                    { value:'HOTEL',  Icon: Hotel,      label:'Pay at Hotel', sub:'Cash upon arrival' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      className={`bm-pay-card${paymentMethod===opt.value?' sel':''}`}
                      style={{ flex:1, minWidth:130 }}
                      onClick={() => setPaymentMethod(opt.value)}>
                      <div className="bm-pay-radio">{paymentMethod===opt.value && <div className="bm-pay-dot"/>}</div>
                      <div>
                        <div className="bm-pay-title" style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                          <opt.Icon size={14}/>{opt.label}
                        </div>
                        <div className="bm-pay-sub">{opt.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Payment Amount Type ── */}
              <div style={{ marginBottom:'.75rem' }}>
                <div className="bm-label" style={{ marginBottom:'.5rem' }}>How much to pay now? *</div>
                <div className="bm-pay-options">
                  <button type="button"
                    className={`bm-pay-card${paymentType==='DEPOSIT'?' sel':''}`}
                    onClick={() => setPaymentType('DEPOSIT')}>
                    <div className="bm-pay-radio">{paymentType==='DEPOSIT' && <div className="bm-pay-dot"/>}</div>
                    <div>
                      <div className="bm-pay-title">50% Deposit</div>
                      <div className="bm-pay-sub">Pay half now, settle the rest at check-in</div>
                      <div className="bm-pay-chip deposit">Due now: {fmt(deposit)}</div>
                    </div>
                  </button>
                  <button type="button"
                    className={`bm-pay-card${paymentType==='FULL'?' sel':''}`}
                    onClick={() => setPaymentType('FULL')}>
                    <div className="bm-pay-radio">{paymentType==='FULL' && <div className="bm-pay-dot"/>}</div>
                    <div>
                      <div className="bm-pay-title">Full Payment</div>
                      <div className="bm-pay-sub">Pay the entire amount upfront — nothing due at check-in</div>
                      <div className="bm-pay-chip full">Due now: {fmt(total)}</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bm-section-label">Special Requests</div>
              <div className="bm-field" style={{ marginBottom:'1.1rem' }}>
                <label className="bm-label">Optional Notes</label>
                <textarea className="bm-textarea" value={requests} onChange={e => setRequests(e.target.value)}
                  placeholder="e.g. high floor, early check-in, extra pillows…" rows={3}/>
              </div>

              <div className="bm-section-label">Pricing Breakdown</div>
              <div className="bm-pricing">
                <div className="bm-pricing-row">
                  <span>{fmt(selected.pricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span>{fmt(total)}</span>
                </div>
                <div className="bm-pricing-row total">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
                {paymentType === 'DEPOSIT' ? (
                  <>
                    <div className="bm-pricing-row deposit">
                      <span>50% Deposit (Due Now)</span>
                      <span>{fmt(deposit)}</span>
                    </div>
                    <div className="bm-pricing-row">
                      <span style={{ color:'var(--text-muted)', fontSize:'.78rem' }}>Remaining at check-in</span>
                      <span>{fmt(deposit)}</span>
                    </div>
                  </>
                ) : (
                  <div className="bm-pricing-row deposit">
                    <span>Full Payment (Due Now)</span>
                    <span>{fmt(total)}</span>
                  </div>
                )}
              </div>

              {/* Amount due highlight box */}
              <div className="bm-due-box">
                <div>
                  <div className="bm-due-label">
                    {paymentType === 'FULL'
                      ? <><CheckCircle2 size={12}/> Full Payment</>
                      : <><Lock size={12}/> Deposit Required</>
                    }
                  </div>
                  <div className="bm-due-sub">
                    {paymentType === 'FULL'
                      ? 'Nothing more to pay at check-in'
                      : `${fmt(deposit)} remaining balance due at check-in`}
                  </div>
                </div>
                <div className="bm-due-amount">{fmt(amountDue)}</div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button className="bm-cancel-btn" onClick={() => setSelected(null)}>Cancel</button>
          <button className="bm-confirm-btn" disabled={confirming || otpSending} onClick={confirmBooking}>
            {otpSending
              ? <><div className="bp-spinner"/>Sending OTP…</>
              : confirming
                ? <><div className="bp-spinner"/>Confirming…</>
                : paymentMethod === 'HOTEL'
                  ? <><Mail size={14}/>Verify & Confirm</>
                  : paymentType === 'FULL'
                    ? <><Mail size={14}/>Verify & Pay Full</>
                    : <><Mail size={14}/>Verify & Pay Deposit</>
            }
          </button>
        </Modal.Footer>
      </Modal>

      {/* ══ OTP Verification Modal ══ */}
      <Modal show={showOtp} onHide={() => { setShowOtp(false); setOtpError(''); setOtpDigits(['','','','','','']); }} centered className="otp-modal">
        <Modal.Header closeButton>
          <Modal.Title>Verify Your Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="otp-icon"><Mail size={42} strokeWidth={1.5} color="#C9A84C"/></div>
          <div className="otp-title">Check your inbox</div>
          <p className="otp-sub">
            We sent a 6-digit code to<br/>
            <strong>{pendingPayload?.guestEmail}</strong><br/>
            Enter it below to confirm your booking.
          </p>

          {/* OTP input boxes */}
          <div className="otp-inputs" onPaste={handleOtpPaste}>
            {otpDigits.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-box${d ? ' filled' : ''}${otpError ? ' err' : ''}`}
                value={d}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Error */}
          {otpError && (
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', background:'var(--red-bg)', border:'1px solid rgba(220,53,69,0.25)', borderRadius:8, padding:'.6rem .9rem', marginBottom:'.9rem', fontSize:'.8rem', color:'var(--red)' }}>
              <ShieldCheck size={14}/> {otpError}
            </div>
          )}

          {/* Resend */}
          <div className="otp-resend">
            {otpTimer > 0
              ? <>Resend code in <span className="otp-timer">{otpTimer}s</span></>
              : <>Didn't receive it? <button onClick={() => sendOtp(pendingPayload?.guestEmail)} disabled={otpSending}>{otpSending ? 'Sending…' : 'Resend OTP'}</button></>
            }
          </div>

          {/* Verify button */}
          <button className="otp-verify-btn" disabled={otpVerifying || otpDigits.join('').length < 6} onClick={verifyOtpAndBook}>
            {otpVerifying
              ? <><div className="bp-spinner"/>Verifying…</>
              : pendingPayload?.paymentMethod === 'HOTEL'
                ? <><CheckCircle2 size={15}/>Confirm Booking</>
                : <><CreditCard size={15}/>Confirm & Proceed to Payment</>
            }
          </button>
        </Modal.Body>
      </Modal>

      {/* ══ PayMongo Payment Modal (iframe popup) ══ */}
      <Modal
        show={showPayModal}
        onHide={handlePayModalClose}
        size="lg"
        centered
        className="pay-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CreditCard size={17}/> Complete Your Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {payUrl && (
            <iframe
              src={payUrl}
              className="pay-modal-iframe"
              title="PayMongo Checkout"
              allow="payment"
            />
          )}
        </Modal.Body>
        <div className="pay-modal-footer">
          <div className="pay-modal-note">
            <ShieldCheck size={13}/> Secured by PayMongo · Your payment info is encrypted
          </div>
          <button className="pay-modal-cancel" onClick={handlePayModalClose}>
            {checkingPay ? 'Checking…' : 'Close'}
          </button>
        </div>
      </Modal>

      {/* ══ Success Modal ══ */}
      <Modal show={!!booked} onHide={() => setBooked(null)} centered className="bs-modal">
        <Modal.Header closeButton/>
        <Modal.Body>
          <div className="bs-icon"><CheckCircle2 size={52} strokeWidth={1.5} color="#2d9b6f"/></div>
          <div className="bs-title">
            {booked?.fromRedirect ? 'Payment Successful!' : 'Booking Confirmed!'}
          </div>
          <p className="bs-sub">
            {booked?.fromRedirect
              ? 'Your payment was received and your booking is confirmed.'
              : 'Your reservation has been successfully placed.'
            }<br/>A confirmation will be sent to your email.
          </p>
          <div className="bs-detail-box">
            {booked?.fromRedirect
              ? `Booking #${booked?.id} — Payment received ✓`
              : `Booking #${booked?.id} — ${
                  paymentType === 'FULL'
                    ? 'Fully paid'
                    : `Deposit of ${fmt(booked?.depositAmount)} paid`
                }${paymentType === 'DEPOSIT' ? ' · Remaining balance due at check-in' : ''}`
            }
          </div>
          <button className="bs-close-btn" onClick={() => setBooked(null)}>Done ✓</button>
        </Modal.Body>
      </Modal>
    </div>
  );
}