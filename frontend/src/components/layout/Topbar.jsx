// Topbar.jsx – With notification bell + slide-in panel
import { useState } from 'react';
import { LANGUAGES } from '../../constants/config';
import { useLang } from '../../context/LangContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationsPanel } from '../NotificationsPanel';
import { Bell } from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .tb-wrap {
    height: 56px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem;
    flex-shrink: 0; font-family: 'DM Sans', sans-serif;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 0 #e2e8f0;
  }

  .tb-left { display: flex; align-items: center; gap: .85rem; }

  .tb-menu {
    display: none; width: 34px; height: 34px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff;
    align-items: center; justify-content: center;
    cursor: pointer; color: #8a96a8; font-size: 1rem;
    transition: all .15s; flex-shrink: 0;
  }
  .tb-menu:hover { background: #f4f6f8; color: #1a1f2e; }
  @media(max-width: 768px) { .tb-menu { display: flex; } }

  .tb-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 600; color: #1a1f2e;
    letter-spacing: .02em;
  }
  @media(max-width: 768px) { .tb-title { display: none; } }

  .tb-right { display: flex; align-items: center; gap: .7rem; }

  .tb-lang {
    appearance: none;
    background: #f4f6f8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238a96a8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right .65rem center;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #4a5568;
    padding: .36rem .55rem .36rem .7rem;
    padding-right: 2rem;
    font-size: .79rem;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    outline: none;
    transition: border-color .15s;
  }
  .tb-lang:focus { border-color: #C9A84C; background-color: #fff; }

  /* ── Bell button ── */
  .tb-bell {
    position: relative;
    width: 34px; height: 34px; border-radius: 9px;
    border: 1px solid #e2e8f0; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #8a96a8;
    transition: all .15s; flex-shrink: 0;
  }
  .tb-bell:hover { background: #f4f6f8; color: #1a1f2e; border-color: #c9d4e0; }
  .tb-bell.has-notif { color: #C9A84C; border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.06); }
  .tb-bell.has-notif:hover { background: rgba(201,168,76,0.12); }

  /* Red badge on the bell */
  .tb-bell-badge {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 17px; height: 17px;
    background: linear-gradient(135deg, #dc3545, #f87171);
    color: #fff; font-size: .6rem; font-weight: 700;
    border-radius: 99px; display: flex; align-items: center; justify-content: center;
    padding: 0 3px;
    border: 2px solid #fff;
    pointer-events: none;
    animation: tbBadgePop .28s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes tbBadgePop {
    from { transform: scale(0); }
    to   { transform: scale(1); }
  }

  /* Bell ring animation when new notifications arrive */
  .tb-bell.has-notif svg {
    animation: tbRing 1.2s cubic-bezier(.36,.07,.19,.97) both;
    transform-origin: top center;
  }
  @keyframes tbRing {
    0%,100% { transform: rotate(0); }
    15%      { transform: rotate(10deg); }
    30%      { transform: rotate(-10deg); }
    45%      { transform: rotate(8deg); }
    60%      { transform: rotate(-6deg); }
    75%      { transform: rotate(4deg); }
    90%      { transform: rotate(-2deg); }
  }

  /* Avatar in topbar */
  .tb-av {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: .85rem; font-weight: 600; color: #fff;
    cursor: default; user-select: none;
    box-shadow: 0 1px 6px rgba(201,168,76,0.25);
    overflow: hidden; flex-shrink: 0;
  }
  .tb-av-img {
    width: 100%; height: 100%; object-fit: cover;
    display: block; border-radius: 9px;
  }
`;

const FULL_LANGUAGE_LIST = [
  { code: 'en',  flag: '🇺🇸', label: 'English' },
  { code: 'es',  flag: '🇪🇸', label: 'Español' },
  { code: 'fr',  flag: '🇫🇷', label: 'Français' },
  { code: 'de',  flag: '🇩🇪', label: 'Deutsch' },
  { code: 'ja',  flag: '🇯🇵', label: '日本語' },
  { code: 'zh',  flag: '🇨🇳', label: '中文' },
  { code: 'ko',  flag: '🇰🇷', label: '한국어' },
  { code: 'fil', flag: '🇵🇭', label: 'Filipino' },
  { code: 'ceb', flag: '🇵🇭', label: 'Cebuano' },
];

function initials(user) {
  const n = user?.fullName || user?.username || user?.email || '';
  const p = n.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase() || 'G';
}

export function Topbar({ title, user, onMenuClick }) {
  const { lang, setLang }    = useLang();
  const { unreadCount }      = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);

  const profilePic = user?.profilePicture || null;
  const hasNotif   = unreadCount > 0;

  return (
    <>
      <style>{css}</style>

      <header className="tb-wrap">
        <div className="tb-left">
          <button className="tb-menu" onClick={onMenuClick} aria-label="Open menu">☰</button>
          <span className="tb-title">{title}</span>
        </div>

        <div className="tb-right">
          <select className="tb-lang" value={lang} onChange={e => setLang(e.target.value)}>
            {FULL_LANGUAGE_LIST.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>

          {/* ── Notification bell ── */}
          <button
            className={`tb-bell${hasNotif ? ' has-notif' : ''}`}
            onClick={() => setPanelOpen(o => !o)}
            aria-label={`Notifications${hasNotif ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={16} />
            {hasNotif && (
              <span className="tb-bell-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="tb-av">
            {profilePic
              ? <img src={profilePic} alt="Profile" className="tb-av-img" />
              : initials(user)
            }
          </div>
        </div>
      </header>

      {/* Slide-in notification panel */}
      {panelOpen && <NotificationsPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}