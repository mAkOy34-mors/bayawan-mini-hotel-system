// components/ReceptionistNotificationDropdown.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  Bell, AlertTriangle, CalendarCheck, X, ArrowRightLeft, 
  Wrench, Hammer, MessageSquare, BedDouble, ClipboardList,
  CheckCircle, RefreshCw, ChevronRight, Loader2
} from 'lucide-react';
import { useReceptionistNotifications, NOTIF_TYPES } from '../context/ReceptionistNotificationContext';

export function ReceptionistNotificationDropdown({ onNavigate, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    hasCritical, 
    loading,
    lastChecked,
    markRead,
    markAllRead,
    refresh 
  } = useReceptionistNotifications();

  // Track if there are new notifications since last view
  useEffect(() => {
    if (isOpen) {
      setHasNew(false);
    } else if (unreadCount > 0) {
      setHasNew(true);
    }
  }, [unreadCount, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markRead(notification.id);
    setIsOpen(false);
    if (onNavigate && notification.link) {
      onNavigate(notification.link);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTypeMeta = (type) => {
    return NOTIF_TYPES[type] || NOTIF_TYPES.pending_task;
  };

  const getPriorityClass = (priority) => {
    if (priority <= 2) return 'critical';
    if (priority <= 5) return 'high';
    return 'normal';
  };

  return (
    <div className={`receptionist-notif-dropdown ${className}`} ref={dropdownRef}>
      <button
        className={`notif-bell ${hasCritical ? 'critical' : ''} ${hasNew ? 'has-new' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        {hasCritical && <span className="notif-pulse" />}
      </button>

      {isOpen && (
        <div className="notif-dropdown-menu">
          <div className="notif-header">
            <div>
              <strong>Notifications</strong>
              {lastChecked && (
                <span className="notif-timestamp">
                  Updated {formatTimeAgo(lastChecked)} ago
                </span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={markAllRead} title="Mark all read">
                  <CheckCircle size={14} />
                </button>
              )}
              <button className="notif-refresh" onClick={refresh} title="Refresh" disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-loading">
                <Loader2 size={24} className="spin" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} strokeWidth={1} />
                <div>All caught up!</div>
                <span>No pending notifications</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const meta = getTypeMeta(notification.type);
                const Icon = meta.Icon;
                const priorityClass = getPriorityClass(notification.priority);
                
                return (
                  <button
                    key={notification.id}
                    className={`notif-item ${!notification.read ? 'unread' : ''} ${priorityClass}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notif-icon" style={{ background: meta.bg, color: meta.colour }}>
                      <Icon size={14} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">
                        <span className="notif-label" style={{ color: meta.colour }}>
                          {meta.label}
                        </span>
                        <span className="notif-time">{notification.timeAgo}</span>
                      </div>
                      <div className="notif-message">{notification.title}</div>
                      {notification.guestName && (
                        <div className="notif-detail">
                          👤 {notification.guestName}
                          {notification.roomNumber && ` • Room ${notification.roomNumber}`}
                        </div>
                      )}
                      {!notification.read && <span className="notif-unread-dot" />}
                    </div>
                    <ChevronRight size={14} className="notif-arrow" />
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notif-footer">
              <button className="notif-view-all" onClick={() => handleNotificationClick({ link: 'dashboard', id: 'view-all' })}>
                View Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .receptionist-notif-dropdown {
          position: relative;
        }
        
        .notif-bell {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 8px;
          color: #4a5568;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notif-bell:hover {
          background: #f4f6f8;
          color: #1a1f2e;
        }
        
        .notif-bell.critical {
          animation: bellShake 0.5s ease-in-out infinite;
        }
        
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        
        .notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #dc2626;
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 0.15rem 0.35rem;
          border-radius: 99px;
          min-width: 18px;
          text-align: center;
        }
        
        .notif-pulse {
          position: absolute;
          top: -1px;
          right: -1px;
          width: 8px;
          height: 8px;
          background: #dc2626;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        .notif-bell.has-new .notif-badge {
          animation: badgePop 0.3s ease-out;
        }
        
        @keyframes badgePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        
        .notif-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-width: calc(100vw - 20px);
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: 1px solid #e2e8f0;
          z-index: 1000;
          overflow: hidden;
          animation: dropdownSlide 0.2s ease-out;
        }
        
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          background: #f8f9fb;
        }
        
        .notif-header strong {
          font-size: 0.85rem;
          color: #1a1f2e;
        }
        
        .notif-timestamp {
          font-size: 0.6rem;
          color: #8a96a8;
          margin-left: 0.5rem;
        }
        
        .notif-header-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .notif-mark-all, .notif-refresh {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 6px;
          color: #8a96a8;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notif-mark-all:hover, .notif-refresh:hover {
          background: #e2e8f0;
          color: #1a1f2e;
        }
        
        .notif-list {
          max-height: 450px;
          overflow-y: auto;
        }
        
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }
        
        .notif-item:hover {
          background: #f8f9fb;
        }
        
        .notif-item.unread {
          background: rgba(59, 130, 246, 0.02);
        }
        
        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #3b82f6;
        }
        
        .notif-item.critical.unread::before {
          background: #dc2626;
        }
        
        .notif-item.high.unread::before {
          background: #f59e0b;
        }
        
        .notif-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .notif-content {
          flex: 1;
          min-width: 0;
        }
        
        .notif-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        .notif-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .notif-time {
          font-size: 0.6rem;
          color: #8a96a8;
        }
        
        .notif-message {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a1f2e;
          margin-bottom: 0.2rem;
        }
        
        .notif-detail {
          font-size: 0.65rem;
          color: #8a96a8;
        }
        
        .notif-unread-dot {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
        }
        
        .notif-arrow {
          opacity: 0.3;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        
        .notif-item:hover .notif-arrow {
          opacity: 0.7;
        }
        
        .notif-loading, .notif-empty {
          text-align: center;
          padding: 2rem 1rem;
          color: #8a96a8;
        }
        
        .notif-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .notif-empty > div {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1f2e;
          margin-top: 0.5rem;
        }
        
        .notif-empty span {
          font-size: 0.7rem;
        }
        
        .notif-footer {
          padding: 0.5rem 1rem;
          border-top: 1px solid #e2e8f0;
          background: #f8f9fb;
        }
        
        .notif-view-all {
          width: 100%;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .notif-view-all:hover {
          background: white;
          border-color: #C9A84C;
          color: #9a7a2e;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}