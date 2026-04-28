// components/NotificationsPanel.jsx
// Slide-in panel that renders all guest notifications with read/unread state.

import { useEffect, useRef } from 'react';
import {
  Bell, CheckCircle2, XCircle, RefreshCw, ClipboardCheck,
  Wrench, MessageSquare, CreditCard, AlertTriangle, X, Check,
} from 'lucide-react';
import { useNotifications, NOTIF_META } from '../context/NotificationContext';

/* ── Tiny relative-time helper ─────────────────────────────────────────── */
function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Icon per notification type ────────────────────────────────────────── */
function NotifIcon({ type, colour }) {
  const size = 16;
  const icons = {
    booking_confirmed:       <CheckCircle2 size={size} />,
    booking_cancelled:       <XCircle size={size} />,
    booking_change_approved: <ClipboardCheck size={size} />,
    booking_change_rejected: <XCircle size={size} />,
    service_completed:       <Check size={size} />,
    service_update:          <Wrench size={size} />,
    complaint_update:        <MessageSquare size={size} />,
    payment_received:        <CreditCard size={size} />,
    special_request_update:  <Bell size={size} />,
    emergency_response:      <AlertTriangle size={size} />,
  };
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${colour}18`, color: colour,
    }}>
      {icons[type] || <Bell size={size} />}
    </div>
  );
}

/* ── CSS ────────────────────────────────────────────────────────────────── */
const css = `
  @keyframes npSlideIn {
    from { opacity:0; transform:translateX(18px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes npFadeIn { from{opacity:0} to{opacity:1} }

  .np-overlay {
    position:fixed; inset:0; z-index:1200;
    background:rgba(0,0,0,0.18);
    animation:npFadeIn .18s ease both;
  }
  .np-panel {
    position:fixed; top:0; right:0; bottom:0; width:360px; max-width:100vw;
    background:#fff; box-shadow:-4px 0 32px rgba(0,0,0,0.12);
    display:flex; flex-direction:column; z-index:1201;
    animation:npSlideIn .22s cubic-bezier(.22,1,.36,1) both;
    font-family:'DM Sans',sans-serif;
  }
  @media(max-width:420px){ .np-panel { width:100vw; } }

  .np-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:1rem 1.25rem; border-bottom:1px solid #e2e8f0; flex-shrink:0;
    background:#fff;
  }
  .np-head-left { display:flex; align-items:center; gap:.6rem; }
  .np-head-title {
    font-family:'Cormorant Garamond',serif; font-size:1.15rem;
    font-weight:600; color:#1a1f2e; margin:0;
  }
  .np-badge {
    background:linear-gradient(135deg,#dc3545,#f87171);
    color:#fff; font-size:.65rem; font-weight:700; border-radius:99px;
    padding:.08rem .42rem; min-width:18px; text-align:center;
  }
  .np-head-actions { display:flex; align-items:center; gap:.5rem; }
  .np-mark-all {
    font-size:.72rem; font-weight:600; color:#9a7a2e; background:none;
    border:none; cursor:pointer; padding:.28rem .6rem; border-radius:6px;
    transition:background .15s; font-family:'DM Sans',sans-serif;
  }
  .np-mark-all:hover { background:rgba(201,168,76,0.1); }
  .np-close {
    width:30px; height:30px; border-radius:8px; border:1px solid #e2e8f0;
    background:#fff; cursor:pointer; display:flex; align-items:center;
    justify-content:center; color:#8a96a8; transition:all .15s;
  }
  .np-close:hover { background:#f4f6f8; color:#1a1f2e; }

  .np-list {
    flex:1; overflow-y:auto; padding:.5rem 0;
    scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0;
  }
  .np-list::-webkit-scrollbar { width:4px; }
  .np-list::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.3); border-radius:99px; }

  .np-item {
    display:flex; align-items:flex-start; gap:.85rem;
    padding:.85rem 1.25rem; cursor:pointer;
    transition:background .15s; border-bottom:1px solid #f1f5f9;
    position:relative;
  }
  .np-item:hover { background:#f8f9fb; }
  .np-item.unread { background:rgba(201,168,76,0.04); }
  .np-item.unread::before {
    content:''; position:absolute; left:0; top:0; bottom:0;
    width:3px; background:linear-gradient(to bottom,#9a7a2e,#C9A84C);
    border-radius:0 2px 2px 0;
  }
  .np-item-body { flex:1; min-width:0; }
  .np-item-title {
    font-size:.82rem; font-weight:600; color:#1a1f2e; margin:0 0 .18rem;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .np-item.unread .np-item-title { color:#1a1f2e; }
  .np-item:not(.unread) .np-item-title { color:#4a5568; font-weight:500; }
  .np-item-msg {
    font-size:.76rem; color:#64748b; line-height:1.45;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .np-item-time { font-size:.68rem; color:#a0aec0; margin-top:.28rem; }
  .np-dot {
    width:7px; height:7px; border-radius:50%; background:#C9A84C;
    flex-shrink:0; margin-top:6px;
  }

  .np-empty {
    flex:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:3rem 1.5rem; color:#a0aec0;
    text-align:center;
  }
  .np-empty-icon { margin-bottom:.75rem; opacity:.35; }
  .np-empty-text { font-size:.84rem; line-height:1.55; }

  .np-footer {
    padding:.75rem 1.25rem; border-top:1px solid #e2e8f0;
    display:flex; align-items:center; justify-content:space-between;
    flex-shrink:0;
  }
  .np-footer-sub { font-size:.7rem; color:#a0aec0; }
  .np-refresh {
    display:flex; align-items:center; gap:.35rem; font-size:.72rem;
    font-weight:600; color:#9a7a2e; background:none; border:none;
    cursor:pointer; padding:.28rem .6rem; border-radius:6px;
    transition:background .15s; font-family:'DM Sans',sans-serif;
  }
  .np-refresh:hover { background:rgba(201,168,76,0.1); }
`;

/* ── Component ──────────────────────────────────────────────────────────── */
export function NotificationsPanel({ onClose }) {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <style>{css}</style>
      {/* Overlay — click outside to close */}
      <div className="np-overlay" onClick={onClose} />

      <div className="np-panel" ref={panelRef} role="dialog" aria-label="Notifications">
        {/* Header */}
        <div className="np-head">
          <div className="np-head-left">
            <Bell size={18} color="#C9A84C" />
            <h2 className="np-head-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="np-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
          <div className="np-head-actions">
            {unreadCount > 0 && (
              <button className="np-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
            <button className="np-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="np-empty">
            <div className="np-empty-icon"><Bell size={44} /></div>
            <div className="np-empty-text">
              {loading ? 'Loading notifications…' : 'You\'re all caught up!\nNo new notifications.'}
            </div>
          </div>
        ) : (
          <div className="np-list">
            {notifications.map(n => {
              const meta = NOTIF_META[n.type] || { colour: '#C9A84C' };
              return (
                <div
                  key={n.id}
                  className={`np-item${n.read ? '' : ' unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <NotifIcon type={n.type} colour={meta.colour} />
                  <div className="np-item-body">
                    <div className="np-item-title">{n.title}</div>
                    <div className="np-item-msg">{n.message}</div>
                    <div className="np-item-time">{relTime(n.time)}</div>
                  </div>
                  {!n.read && <div className="np-dot" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="np-footer">
          <span className="np-footer-sub">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
          <button className="np-refresh" onClick={refresh} disabled={loading}>
            <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}