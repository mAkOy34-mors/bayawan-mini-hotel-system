// AdminGuests.jsx
import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { adminGetGuests, adminGetGuest, adminToggleGuest } from './adminApi';
import {
  Users, CheckCircle2, XCircle, Search, UserX, UserCheck,
  User, Phone, Mail, Globe, Calendar, CreditCard,
  ClipboardList, MessageSquare, Wrench, ChevronRight,
  Hash, MapPin, Clock, Star, AlertCircle, CheckCircle,
  XOctagon, RefreshCw, Banknote, BedDouble, ArrowUpRight
} from 'lucide-react';
import { SHARED_CSS, fmtDate, fmtDT, Pill, Skel, Spinner, Pager, Toast, useToast } from './adminShared';

const PAGE_SIZE = 10;

/* ─── Extra styles ─────────────────────────────────────────── */
const GUEST_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .gd-modal .modal-dialog { 
    max-width: 880px; 
    margin: 1.75rem auto;
  }
  .gd-modal .modal-content {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,.18);
    max-height: calc(100vh - 3.5rem);
    display: flex;
    flex-direction: column;
  }
  .gd-modal .modal-header {
    background: linear-gradient(135deg, #1a1209 0%, #2d1f08 60%, #3a2610 100%);
    border-bottom: 1px solid rgba(201,168,76,.25);
    padding: 1rem 1.5rem;
    flex-shrink: 0;
  }
  .gd-modal .modal-title { color: #fff; font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; letter-spacing: .04em; }
  .gd-modal .btn-close { filter: invert(1) brightness(1.4); opacity: .7; }
  .gd-modal .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  /* Hero banner */
  .gd-hero {
    background: linear-gradient(135deg, #1a1209 0%, #2d1f08 50%, #1a1209 100%);
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.1rem;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .gd-hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 70%);
  }
  .gd-avatar-lg {
    width: 56px; height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.5rem; font-weight: 700; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(201,168,76,.35);
    border: 2px solid rgba(201,168,76,.4);
  }
  .gd-hero-info { flex: 1; min-width: 0; }
  .gd-hero-name { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600; color: #fff; line-height: 1.2; }
  .gd-hero-email { font-size: .75rem; color: rgba(255,255,255,.55); margin-top: .15rem; font-family: 'DM Sans', sans-serif; }
  .gd-hero-badges { display: flex; gap: .4rem; margin-top: .5rem; flex-wrap: wrap; }
  .gd-badge {
    font-size: .62rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; padding: .2rem .55rem; border-radius: 20px;
    font-family: 'DM Sans', sans-serif;
  }
  .gd-badge-gold { background: rgba(201,168,76,.2); color: #C9A84C; border: 1px solid rgba(201,168,76,.3); }
  .gd-badge-green { background: rgba(34,197,94,.15); color: #4ade80; border: 1px solid rgba(34,197,94,.25); }
  .gd-badge-red { background: rgba(239,68,68,.15); color: #f87171; border: 1px solid rgba(239,68,68,.25); }

  /* Stats row */
  .gd-stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; border-bottom: 1px solid var(--border, #e5e5e5);
    flex-shrink: 0;
  }
  .gd-stat-cell {
    padding: .7rem 1rem; text-align: center;
    border-right: 1px solid var(--border, #e5e5e5);
    background: var(--surface2, #f8f7f5);
  }
  .gd-stat-cell:last-child { border-right: none; }
  .gd-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 700; color: var(--gold-dark, #9a7a2e); line-height: 1; }
  .gd-stat-lbl { font-size: .6rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted, #888); margin-top: .2rem; font-family: 'DM Sans', sans-serif; font-weight: 500; }

  /* Tabs */
  .gd-tabs { 
    display: flex; 
    border-bottom: 1px solid var(--border, #e5e5e5); 
    background: var(--surface, #fff); 
    overflow-x: auto; 
    flex-shrink: 0;
    scrollbar-width: thin;
  }
  .gd-tab {
    padding: .6rem 1rem; font-size: .72rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: .07em;
    color: var(--text-muted, #888); cursor: pointer;
    border-bottom: 2px solid transparent; white-space: nowrap;
    transition: all .18s; display: flex; align-items: center; gap: .35rem;
    font-family: 'DM Sans', sans-serif;
    background: none; border-top: none; border-left: none; border-right: none;
  }
  .gd-tab:hover { color: var(--gold-dark, #9a7a2e); background: rgba(201,168,76,.04); }
  .gd-tab.active { color: var(--gold-dark, #9a7a2e); border-bottom-color: var(--gold-dark, #9a7a2e); background: rgba(201,168,76,.06); }
  .gd-tab-count {
    background: var(--gold-dark, #9a7a2e); color: #fff;
    font-size: .58rem; padding: .08rem .35rem; border-radius: 10px; font-weight: 700;
  }
  .active .gd-tab-count { background: var(--gold-dark, #9a7a2e); }

  /* Tab body */
  .gd-tab-body { 
    padding: 1.25rem 1.5rem; 
    overflow-y: auto; 
    flex: 1;
    min-height: 0;
  }
  .gd-tab-body::-webkit-scrollbar { width: 5px; }
  .gd-tab-body::-webkit-scrollbar-track { background: var(--surface2, #f8f7f5); border-radius: 4px; }
  .gd-tab-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,.4); border-radius: 4px; }
  .gd-tab-body::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,.6); }

  /* Info grid */
  .gd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
  .gd-info-field {
    background: var(--surface2, #f8f7f5);
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 10px; padding: .7rem 1rem;
  }
  .gd-info-label { font-size: .6rem; text-transform: uppercase; letter-spacing: .09em; color: var(--text-muted, #888); font-weight: 700; margin-bottom: .25rem; display: flex; align-items: center; gap: .35rem; font-family: 'DM Sans', sans-serif; }
  .gd-info-value { font-size: .85rem; color: var(--text, #1a1a1a); font-weight: 500; font-family: 'DM Sans', sans-serif; word-break: break-word; }
  .gd-info-value.empty { color: var(--text-muted, #aaa); font-style: italic; font-weight: 400; }

  /* Section headers */
  .gd-section-hd {
    font-size: .62rem; text-transform: uppercase; letter-spacing: .1em;
    color: var(--text-muted, #888); font-weight: 700;
    margin: 1rem 0 .5rem; padding-bottom: .4rem;
    border-bottom: 1px solid var(--border, #e5e5e5);
    display: flex; align-items: center; gap: .4rem;
    font-family: 'DM Sans', sans-serif;
  }
  .gd-section-hd:first-of-type { margin-top: 0; }

  /* Timeline cards */
  .gd-card {
    background: var(--surface2, #f8f7f5);
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 10px; padding: .8rem 1rem;
    margin-bottom: .6rem; transition: border-color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .gd-card:hover { border-color: rgba(201,168,76,.3); }
  .gd-card:last-child { margin-bottom: 0; }
  .gd-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .6rem; }
  .gd-card-title { font-size: .85rem; font-weight: 600; color: var(--text, #1a1a1a); }
  .gd-card-sub { font-size: .73rem; color: var(--text-muted, #888); margin-top: .15rem; }
  .gd-card-meta { display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; }
  .gd-meta-chip {
    font-size: .66rem; padding: .15rem .5rem; border-radius: 6px;
    background: rgba(201,168,76,.08); color: var(--gold-dark, #9a7a2e);
    border: 1px solid rgba(201,168,76,.15); font-weight: 500;
  }

  /* Status pills */
  .gd-status { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; padding: .2rem .55rem; border-radius: 20px; white-space: nowrap; }
  .gd-status-confirmed { background: rgba(34,197,94,.1); color: #16a34a; border: 1px solid rgba(34,197,94,.2); }
  .gd-status-pending { background: rgba(234,179,8,.1); color: #ca8a04; border: 1px solid rgba(234,179,8,.2); }
  .gd-status-cancelled { background: rgba(239,68,68,.1); color: #dc2626; border: 1px solid rgba(239,68,68,.2); }
  .gd-status-completed { background: rgba(99,102,241,.1); color: #6366f1; border: 1px solid rgba(99,102,241,.2); }
  .gd-status-checkedin { background: rgba(6,182,212,.1); color: #0891b2; border: 1px solid rgba(6,182,212,.2); }
  .gd-status-paid { background: rgba(34,197,94,.1); color: #16a34a; border: 1px solid rgba(34,197,94,.2); }
  .gd-status-refunded { background: rgba(168,85,247,.1); color: #9333ea; border: 1px solid rgba(168,85,247,.2); }
  .gd-status-open { background: rgba(234,179,8,.1); color: #ca8a04; border: 1px solid rgba(234,179,8,.2); }
  .gd-status-resolved { background: rgba(34,197,94,.1); color: #16a34a; border: 1px solid rgba(34,197,94,.2); }
  .gd-status-inprogress { background: rgba(6,182,212,.1); color: #0891b2; border: 1px solid rgba(6,182,212,.2); }

  /* Rating stars */
  .gd-stars { display: flex; gap: .1rem; }
  .gd-star { color: #C9A84C; font-size: .7rem; }
  .gd-star.empty { color: #d1d5db; }

  /* Empty state */
  .gd-empty { text-align: center; padding: 2rem 1rem; color: var(--text-muted, #888); }
  .gd-empty-ico { font-size: 1.8rem; margin-bottom: .6rem; opacity: .5; }
  .gd-empty-txt { font-size: .8rem; font-family: 'DM Sans', sans-serif; }

  /* Amount */
  .gd-amount { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: var(--gold-dark, #9a7a2e); }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .gd-modal .modal-dialog { margin: 0.5rem; max-width: calc(100% - 1rem); }
    .gd-hero { padding: 1rem; flex-wrap: wrap; }
    .gd-hero-badges { width: 100%; }
    .gd-info-grid { grid-template-columns: 1fr; }
    .gd-tab-body { padding: 1rem; }
    .gd-stats-row { grid-template-columns: repeat(2, 1fr); }
    .gd-stat-cell { border-bottom: 1px solid var(--border, #e5e5e5); }
    .gd-stat-cell:nth-child(2) { border-right: none; }
    .gd-stat-cell:nth-child(3), .gd-stat-cell:nth-child(4) { border-bottom: none; }
  }
`;

/* ─── Helpers ──────────────────────────────────────────────── */
const fmt = (v) => v || <span className="gd-info-value empty">Not provided</span>;

const bookingStatusClass = (s = '') => {
  const m = {
    CONFIRMED: 'confirmed', PENDING: 'pending', PENDING_DEPOSIT: 'pending',
    CANCELLED: 'cancelled', COMPLETED: 'completed',
    CHECKED_IN: 'checkedin', CHECKED_OUT: 'completed',
  };
  return `gd-status gd-status-${m[s] || 'pending'}`;
};

const paymentStatusClass = (s = '') => {
  const m = { PAID: 'paid', REFUNDED: 'refunded', PENDING: 'pending', VERIFIED: 'paid', FAILED: 'cancelled' };
  return `gd-status gd-status-${m[s] || 'pending'}`;
};

const serviceStatusClass = (s = '') => {
  const m = { PENDING: 'pending', IN_PROGRESS: 'inprogress', COMPLETED: 'completed', CANCELLED: 'cancelled' };
  return `gd-status gd-status-${m[s] || 'pending'}`;
};

const Stars = ({ rating = 0 }) => (
  <div className="gd-stars">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={`gd-star${i > rating ? ' empty' : ''}`}>★</span>
    ))}
  </div>
);

/* ─── Tab panels ───────────────────────────────────────────── */
const TabOverview = ({ detail }) => {
  const p = detail.profile || {};
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');

  return (
    <div>
      <div className="gd-section-hd"><User size={12}/> Personal Information</div>
      <div className="gd-info-grid">
        {[
          { label: 'Full Name', icon: <User size={10}/>, value: fullName || '—' },
          { label: 'Username', icon: <Hash size={10}/>, value: detail.username },
          { label: 'Email Address', icon: <Mail size={10}/>, value: detail.email },
          { label: 'Contact Number', icon: <Phone size={10}/>, value: p.contactNumber || '—' },
          { label: 'Nationality', icon: <Globe size={10}/>, value: p.nationality || '—' },
          { label: 'Account Status', icon: <CheckCircle size={10}/>, value: detail.isActive ? 'Active' : 'Inactive' },
          { label: 'Role', icon: <User size={10}/>, value: detail.role },
          { label: 'Member Since', icon: <Calendar size={10}/>, value: fmtDate(detail.createdAt) },
        ].map(({ label, icon, value }) => (
          <div key={label} className="gd-info-field">
            <div className="gd-info-label">{icon} {label}</div>
            <div className={`gd-info-value${value === '—' ? ' empty' : ''}`}>{value}</div>
          </div>
        ))}
      </div>

      {detail.profile?.address && (
        <>
          <div className="gd-section-hd"><MapPin size={12}/> Address</div>
          <div className="gd-info-field" style={{ gridColumn: 'span 2' }}>
            <div className="gd-info-label"><MapPin size={10}/> Home Address</div>
            <div className="gd-info-value">{detail.profile.address}</div>
          </div>
        </>
      )}
    </div>
  );
};

const TabBookings = ({ bookings = [] }) => {
  if (!bookings.length) return (
    <div className="gd-empty">
      <div className="gd-empty-ico">🛏️</div>
      <div className="gd-empty-txt">No booking history found</div>
    </div>
  );
  return (
    <div>
      {bookings.map((b) => (
        <div key={b.id} className="gd-card">
          <div className="gd-card-top">
            <div>
              <div className="gd-card-title">
                <BedDouble size={13} style={{ marginRight: 5, opacity: .6 }}/>
                {b.roomNumber ? `Room ${b.roomNumber}` : b.roomType || 'Room Booking'}
              </div>
              <div className="gd-card-sub">Ref: {b.bookingReference || b.reference || `#${b.id}`}</div>
            </div>
            <span className={bookingStatusClass(b.status)}>{(b.status || '').replace(/_/g,' ')}</span>
          </div>
          <div className="gd-card-meta">
            {b.checkInDate && <span className="gd-meta-chip">Check-in: {fmtDate(b.checkInDate)}</span>}
            {b.checkOutDate && <span className="gd-meta-chip">Check-out: {fmtDate(b.checkOutDate)}</span>}
            {b.totalAmount != null && <span className="gd-meta-chip"><span className="gd-amount">₱{parseFloat(b.totalAmount).toLocaleString()}</span></span>}
            {b.nights && <span className="gd-meta-chip">{b.nights} night{b.nights>1?'s':''}</span>}
          </div>
          {b.createdAt && <div style={{ fontSize:'.66rem', color:'var(--text-muted)', marginTop:'.4rem' }}>Booked on {fmtDT(b.createdAt)}</div>}
        </div>
      ))}
    </div>
  );
};

const TabPayments = ({ payments = [] }) => {
  if (!payments.length) return (
    <div className="gd-empty">
      <div className="gd-empty-ico">💳</div>
      <div className="gd-empty-txt">No payment records found</div>
    </div>
  );
  return (
    <div>
      {payments.map((p) => (
        <div key={p.id} className="gd-card">
          <div className="gd-card-top">
            <div>
              <div className="gd-card-title">
                <CreditCard size={13} style={{ marginRight: 5, opacity: .6 }}/>
                {p.type || 'Payment'} — <span className="gd-amount">₱{parseFloat(p.amount||0).toLocaleString()}</span>
              </div>
              <div className="gd-card-sub">{p.description || p.paymongoLinkId || `Payment #${p.id}`}</div>
            </div>
            <span className={paymentStatusClass(p.status)}>{p.status}</span>
          </div>
          <div className="gd-card-meta">
            {p.type && <span className="gd-meta-chip">{p.type}</span>}
            {p.method && <span className="gd-meta-chip">{p.method}</span>}
            {p.bookingReference && <span className="gd-meta-chip">Ref: {p.bookingReference}</span>}
          </div>
          {(p.paidAt || p.createdAt) && (
            <div style={{ fontSize:'.66rem', color:'var(--text-muted)', marginTop:'.4rem' }}>
              <Clock size={10} style={{ marginRight:3, verticalAlign:'middle' }}/>
              {fmtDT(p.paidAt || p.createdAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TabServiceRequests = ({ serviceRequests = [] }) => {
  if (!serviceRequests.length) return (
    <div className="gd-empty">
      <div className="gd-empty-ico">🔧</div>
      <div className="gd-empty-txt">No service requests found</div>
    </div>
  );

  const priorityColor = { LOW: '#6b7280', MEDIUM: '#ca8a04', HIGH: '#ea580c', URGENT: '#dc2626' };

  return (
    <div>
      {serviceRequests.map((r) => (
        <div key={r.id} className="gd-card">
          <div className="gd-card-top">
            <div>
              <div className="gd-card-title">
                <Wrench size={13} style={{ marginRight: 5, opacity: .6 }}/>
                {r.serviceType}
              </div>
              <div className="gd-card-sub">Room {r.roomNumber}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.25rem' }}>
              <span className={serviceStatusClass(r.status)}>{(r.status||'').replace(/_/g,' ')}</span>
              {r.priority && (
                <span style={{ fontSize:'.62rem', fontWeight:700, color: priorityColor[r.priority] || '#888' }}>
                  ● {r.priority}
                </span>
              )}
            </div>
          </div>
          {r.description && (
            <p style={{ fontSize:'.76rem', color:'var(--text-sub)', margin:'.45rem 0 .3rem', lineHeight:1.5 }}>
              {r.description}
            </p>
          )}
          <div className="gd-card-meta">
            {r.assignedTo && <span className="gd-meta-chip">👤 {r.assignedTo}</span>}
            {parseFloat(r.serviceCharge) > 0 && (
              <span className="gd-meta-chip">
                Charge: <span className="gd-amount">₱{parseFloat(r.serviceCharge).toLocaleString()}</span>
                {r.isPaid
                  ? <span style={{ color:'#16a34a', marginLeft:4 }}>✓ Paid</span>
                  : <span style={{ color:'#dc2626', marginLeft:4 }}>Unpaid</span>}
              </span>
            )}
            {r.completedAt && <span className="gd-meta-chip">Done: {fmtDate(r.completedAt)}</span>}
          </div>
          {r.createdAt && (
            <div style={{ fontSize:'.66rem', color:'var(--text-muted)', marginTop:'.4rem' }}>
              <Clock size={10} style={{ marginRight:3, verticalAlign:'middle' }}/>
              {fmtDT(r.createdAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TabFeedback = ({ feedback = [] }) => {
  if (!feedback.length) return (
    <div className="gd-empty">
      <div className="gd-empty-ico">💬</div>
      <div className="gd-empty-txt">No feedback submitted yet</div>
    </div>
  );
  return (
    <div>
      {feedback.map((f) => (
        <div key={f.id} className="gd-card">
          <div className="gd-card-top">
            <div>
              <div className="gd-card-title" style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <MessageSquare size={13} style={{ opacity:.6 }}/>
                Booking {f.bookingReference || `#${f.id}`}
                {f.roomNumber && <span style={{ fontSize:'.7rem', color:'var(--text-muted)', fontWeight:400 }}>· Room {f.roomNumber}</span>}
              </div>
              <div style={{ display:'flex', gap:'1rem', marginTop:'.3rem', flexWrap:'wrap' }}>
                {[
                  { label:'Overall',     val: f.overallRating },
                  { label:'Cleanliness', val: f.cleanlinessRating },
                  { label:'Service',     val: f.serviceRating },
                  { label:'Comfort',     val: f.comfortRating },
                  { label:'Value',       val: f.valueRating },
                ].filter(r => r.val != null).map(({ label, val }) => (
                  <div key={label} style={{ display:'flex', flexDirection:'column', gap:'.1rem' }}>
                    <span style={{ fontSize:'.58rem', textTransform:'uppercase', letterSpacing:'.07em', color:'var(--text-muted)', fontWeight:700 }}>{label}</span>
                    <Stars rating={val}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.25rem' }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:700, color:'var(--gold-dark)', lineHeight:1 }}>
                {f.averageRating}
              </span>
              <span style={{ fontSize:'.58rem', color:'var(--text-muted)' }}>avg</span>
              <span className={`gd-status ${f.isPublished ? 'gd-status-confirmed' : 'gd-status-pending'}`}>
                {f.isPublished ? 'Published' : 'Hidden'}
              </span>
            </div>
          </div>

          {f.comment && (
            <p style={{ fontSize:'.78rem', color:'var(--text-sub)', margin:'.55rem 0 .25rem', lineHeight:1.6, fontStyle:'italic', borderLeft:'2px solid rgba(201,168,76,.3)', paddingLeft:'.7rem' }}>
              "{f.comment}"
            </p>
          )}
          {(f.likes || f.improvements) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem', marginTop:'.45rem' }}>
              {f.likes && (
                <div style={{ fontSize:'.73rem', color:'var(--text-muted)', background:'rgba(34,197,94,.05)', borderRadius:6, padding:'.35rem .55rem', border:'1px solid rgba(34,197,94,.1)' }}>
                  <span style={{ fontWeight:700, color:'#16a34a' }}>👍 Liked: </span>{f.likes}
                </div>
              )}
              {f.improvements && (
                <div style={{ fontSize:'.73rem', color:'var(--text-muted)', background:'rgba(234,179,8,.05)', borderRadius:6, padding:'.35rem .55rem', border:'1px solid rgba(234,179,8,.1)' }}>
                  <span style={{ fontWeight:700, color:'#ca8a04' }}>💡 Improve: </span>{f.improvements}
                </div>
              )}
            </div>
          )}

          {f.isResponded && f.response && (
            <div style={{ marginTop:'.55rem', background:'rgba(201,168,76,.06)', borderRadius:8, padding:'.5rem .7rem', border:'1px solid rgba(201,168,76,.15)' }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--gold-dark)', marginBottom:'.2rem' }}>
                ✦ Staff Response
              </div>
              <p style={{ fontSize:'.76rem', color:'var(--text-sub)', margin:0, lineHeight:1.5 }}>{f.response}</p>
            </div>
          )}

          {f.createdAt && (
            <div style={{ fontSize:'.66rem', color:'var(--text-muted)', marginTop:'.45rem' }}>
              <Clock size={10} style={{ marginRight:3, verticalAlign:'middle' }}/>
              {fmtDT(f.createdAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Guest Detail Modal ────────────────────────────────────── */
function GuestDetailModal({ show, onHide, detail, detailLoading, onToggle }) {
  const [tab, setTab] = useState('overview');

  useEffect(() => { if (show) setTab('overview'); }, [show]);

  const bookings       = detail?.bookings       || [];
  const payments       = detail?.payments       || [];
  const serviceRequests= detail?.serviceRequests|| [];
  const feedback       = detail?.feedback       || [];

  const tabs = [
    { id: 'overview', label: 'Profile',   Icon: User,          count: null },
    { id: 'bookings', label: 'Bookings',  Icon: BedDouble,     count: bookings.length },
    { id: 'payments', label: 'Payments',  Icon: CreditCard,    count: payments.length },
    { id: 'services', label: 'Requests',  Icon: Wrench,        count: serviceRequests.length },
    { id: 'feedback', label: 'Feedback',  Icon: MessageSquare, count: feedback.length },
  ];

  const p = detail?.profile || {};
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || detail?.username || '?';

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="gd-modal ap-modal">
      <Modal.Header closeButton>
        <Modal.Title>Guest Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {detailLoading ? (
          <div style={{ textAlign:'center', padding:'3rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'.75rem' }}>
            <Spinner/>
            <span style={{ color:'var(--text-muted)', fontSize:'.78rem' }}>Loading guest details…</span>
          </div>
        ) : !detail ? null : (
          <>
            {/* Hero */}
            <div className="gd-hero">
              <div className="gd-avatar-lg">{fullName.slice(0,1).toUpperCase()}</div>
              <div className="gd-hero-info">
                <div className="gd-hero-name">{fullName}</div>
                <div className="gd-hero-email">{detail.email}</div>
                <div className="gd-hero-badges">
                  <span className="gd-badge gd-badge-gold">{detail.role || 'GUEST'}</span>
                  <span className={`gd-badge ${detail.isActive ? 'gd-badge-green' : 'gd-badge-red'}`}>
                    {detail.isActive ? '● Active' : '● Inactive'}
                  </span>
                  <span className="gd-badge gd-badge-gold">Joined {fmtDate(detail.createdAt)}</span>
                </div>
              </div>
              <button
                className={detail.isActive ? 'ap-btn-red' : 'ap-btn-green'}
                style={{ fontSize:'.73rem', flexShrink:0, whiteSpace:'nowrap' }}
                onClick={() => onToggle(detail)}
              >
                {detail.isActive ? <><UserX size={13}/>Disable</> : <><UserCheck size={13}/>Enable</>}
              </button>
            </div>

            {/* Stats row */}
            <div className="gd-stats-row">
              {[
                { num: bookings.length,        label: 'Bookings' },
                { num: payments.length,        label: 'Payments' },
                { num: serviceRequests.length, label: 'Requests' },
                { num: feedback.length,        label: 'Reviews' },
              ].map(({ num, label }) => (
                <div key={label} className="gd-stat-cell">
                  <div className="gd-stat-num">{num}</div>
                  <div className="gd-stat-lbl">{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="gd-tabs">
              {tabs.map(({ id, label, Icon, count }) => (
                <button key={id} className={`gd-tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>
                  <Icon size={12}/>{label}
                  {count > 0 && <span className="gd-tab-count">{count}</span>}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="gd-tab-body">
              {tab === 'overview'  && <TabOverview detail={detail}/>}
              {tab === 'bookings'  && <TabBookings bookings={bookings}/>}
              {tab === 'payments'  && <TabPayments payments={payments}/>}
              {tab === 'services'  && <TabServiceRequests serviceRequests={serviceRequests}/>}
              {tab === 'feedback'  && <TabFeedback feedback={feedback}/>}
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

/* ─── Main component ────────────────────────────────────────── */
export function AdminGuests({ token }) {
  const [guests,       setGuests]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [detail,       setDetail]       = useState(null);
  const [showDetail,   setShowDetail]   = useState(false);
  const [detailLoading,setDetailLoading]= useState(false);
  const { toast, show } = useToast();

  const load = useCallback(async (q = '') => {
    setLoading(true);
    const data = await adminGetGuests(token, q).catch(() => []);
    setGuests(Array.isArray(data) ? data : []);
    setPage(1);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true); setShowDetail(true); setDetail(null);
    const d = await adminGetGuest(token, id).catch(() => null);
    setDetail(d);
    setDetailLoading(false);
  };

  const toggle = async (g) => {
    try {
      const r = await adminToggleGuest(token, g.id);
      show(r.message);
      setGuests(prev => prev.map(x => x.id === g.id ? { ...x, isActive: r.isActive } : x));
      if (detail?.id === g.id) setDetail(d => ({ ...d, isActive: r.isActive }));
    } catch (e) { show(e.message, 'error'); }
  };

  const visible = guests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active  = guests.filter(g => g.isActive).length;

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{GUEST_CSS}</style>
      <Toast toast={toast}/>

      {/* Header */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title">Guests</h1>
          <p className="ap-sub">Manage and view registered guest accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ap-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 600 }}>
        {[
          { Icon: Users,         label: 'Total Guests', value: guests.length,            color: 'blue'  },
          { Icon: CheckCircle2,  label: 'Active',       value: active,                   color: 'green' },
          { Icon: XCircle,       label: 'Inactive',     value: guests.length - active,   color: 'red'   },
        ].map((s, i) => (
          <div key={i} className={`ap-stat ${s.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="ap-stat-icon" style={{ background: 'rgba(255,255,255,.15)', borderRadius: 9 }}>
              <s.Icon size={16}/>
            </div>
            <div className="ap-stat-lbl">{s.label}</div>
            <div className="ap-stat-val">{loading ? <Skel h={24} w={30}/> : s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="ap-panel">
        <div className="ap-panel-hd">
          <div>
            <div className="ap-panel-title">All Guests</div>
            <div className="ap-panel-sub">{!loading && `${guests.length} accounts`}</div>
          </div>
          <div className="ap-toolbar" style={{ margin: 0 }}>
            <div className="ap-search-wrap">
              <span className="ap-search-ico"><Search size={13}/></span>
              <input
                className="ap-search"
                placeholder="Search email or username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load(search)}
              />
            </div>
            <button className="ap-btn-primary" onClick={() => load(search)} style={{ padding: '.58rem .9rem' }}>
              <Search size={14}/>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem' }}>
            <Spinner/><span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>Loading guests…</span>
          </div>
        ) : guests.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-ico">👥</div>
            <div className="ap-empty-title">No guests found</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="ap-tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Guest</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((g, i) => (
                    <tr key={g.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#9a7a2e,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '.88rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {g.username?.slice(0, 1).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.84rem' }}>{g.username}</div>
                            {g.profile && (
                              <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                                {[g.profile.firstName, g.profile.lastName].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{g.email}</td>
                      <td><span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gold-dark)' }}>{g.role}</span></td>
                      <td><Pill status={g.isActive ? 'active' : 'inactive'} label={g.isActive ? 'Active' : 'Inactive'}/></td>
                      <td style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{fmtDate(g.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.38rem' }}>
                          <button className="ap-btn-ghost" style={{ fontSize: '.72rem', padding: '.28rem .65rem', display:'flex', alignItems:'center', gap:'.3rem' }} onClick={() => openDetail(g.id)}>
                            <ArrowUpRight size={12}/>View
                          </button>
                          <button className={g.isActive ? 'ap-btn-red' : 'ap-btn-green'} style={{ fontSize: '.72rem', padding: '.28rem .65rem' }} onClick={() => toggle(g)}>
                            {g.isActive ? <><UserX size={13}/>Disable</> : <><UserCheck size={13}/>Enable</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={guests.length} size={PAGE_SIZE} setPage={setPage}/>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <GuestDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        detail={detail}
        detailLoading={detailLoading}
        onToggle={toggle}
      />
    </div>
  );
}