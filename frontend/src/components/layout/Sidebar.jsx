// Sidebar.jsx – Light card UI with Lucide icons and translations
import { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { useLang } from '../../context/LangContext';

import {
  LayoutDashboard,
  BedDouble,
  Star,
  CreditCard,
  User,
  Settings,
  MessageCircle,
  LogOut,
  Hotel,
  ClipboardList,
  AlertTriangle,
  Flag,
  Sparkles,
  Heart,
  Map,
  Car,
  UtensilsCrossed,
  Scissors,
  ChevronDown,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .sb-wrap {
    width: 252px; min-width: 252px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    height: 100vh; display: flex; flex-direction: column;
    flex-shrink: 0; font-family: 'DM Sans', sans-serif;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.3) #f4f6f8;
    position: sticky; top: 0;
  }
  .sb-wrap::-webkit-scrollbar { width: 4px; }
  .sb-wrap::-webkit-scrollbar-track { background: #f4f6f8; }
  .sb-wrap::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 99px; }

  .sb-offcanvas .offcanvas-body {
    padding: 0;
    overflow-y: auto !important;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.3) #f4f6f8;
  }
  .sb-offcanvas .offcanvas-body::-webkit-scrollbar { width: 4px; }
  .sb-offcanvas .offcanvas-body::-webkit-scrollbar-track { background: #f4f6f8; }
  .sb-offcanvas .offcanvas-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 99px; }

  .sb-logo { padding: 1.3rem 1.2rem 1rem; border-bottom: 1px solid #e2e8f0; }
  .sb-logo-row { display: flex; align-items: center; gap: .55rem; }
  .sb-logo-mark {
    width: 30px; height: 30px; border-radius: 9px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(201,168,76,0.3);
  }
  .sb-logo-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem; font-weight: 600; color: #1a1f2e; line-height: 1.2;
  }
  .sb-logo-sub { font-size: .6rem; color: #8a96a8; text-transform: uppercase; letter-spacing: .12em; }

  .sb-user {
    display: flex; align-items: center; gap: .72rem;
    padding: .82rem 1.2rem; border-bottom: 1px solid #e2e8f0; background: #f8f9fb;
  }
  .sb-av {
    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: .95rem; font-weight: 600; color: #fff;
    overflow: hidden;
  }
  .sb-av-img {
    width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 10px;
  }
  .sb-uname { font-size: .84rem; font-weight: 600; color: #1a1f2e; line-height: 1.3; }
  .sb-urole { font-size: .66rem; color: #8a96a8; text-transform: uppercase; letter-spacing: .08em; margin-top: .05rem; }

  .sb-nav { flex: 1; padding: .75rem .65rem; }
  .sb-sec {
    font-size: .61rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .13em; color: #cbd5e1; padding: .55rem .65rem .3rem;
  }
  .sb-btn {
    width: 100%; display: flex; align-items: center; gap: .65rem;
    padding: .54rem .75rem; border-radius: 9px;
    border: 1px solid transparent; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: .84rem; font-weight: 500;
    color: #4a5568; cursor: pointer; transition: all .16s;
    text-align: left; margin-bottom: .05rem; position: relative;
  }
  .sb-btn:hover { background: #f4f6f8; color: #1a1f2e; border-color: #e2e8f0; }
  .sb-btn.active {
    background: rgba(201,168,76,0.1); color: #9a7a2e; font-weight: 600;
    border-color: rgba(201,168,76,0.25);
  }
  .sb-btn.active::before {
    content: ''; position: absolute; left: -1px; top: 22%; bottom: 22%;
    width: 3px; border-radius: 0 3px 3px 0;
    background: linear-gradient(to bottom, #9a7a2e, #C9A84C);
  }
  .sb-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: #f1f5f9; border: 1px solid transparent;
    transition: background .16s; color: #64748b;
  }
  .sb-btn.active .sb-icon {
    background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.2); color: #9a7a2e;
  }
  .sb-btn:hover:not(.active) .sb-icon { background: #e2e8f0; color: #1a1f2e; }

  .sb-submenu {
    margin-left: 2.5rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }
  .sb-submenu-btn {
    width: 100%; display: flex; align-items: center; gap: .65rem;
    padding: .4rem .75rem; border-radius: 8px;
    border: 1px solid transparent; background: transparent;
    font-family: 'DM Sans', sans-serif; font-size: .78rem; font-weight: 500;
    color: #4a5568; cursor: pointer; transition: all .16s;
    text-align: left; margin-bottom: .05rem;
  }
  .sb-submenu-btn:hover { background: #f4f6f8; color: #1a1f2e; }
  .sb-submenu-btn.active {
    background: rgba(201,168,76,0.08); color: #9a7a2e; font-weight: 600;
  }
  .sb-submenu-icon {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: #f1f5f9; color: #64748b;
  }
  .sb-submenu-btn.active .sb-submenu-icon {
    background: rgba(201,168,76,0.12); color: #9a7a2e;
  }
  .sb-expand-icon {
    margin-left: auto;
    transition: transform 0.2s;
    color: #8a96a8;
  }
  .sb-expand-icon.open {
    transform: rotate(180deg);
  }

  /* ============================================================
     SPECIALTY BUTTONS - Normal state (transparent, no colors)
     Only show colors when active
  ============================================================ */
  .sb-btn-services,
  .sb-btn-partner,
  .sb-btn-complaint,
  .sb-btn-emergency {
    width: 100%; display: flex; align-items: center; gap: .65rem;
    padding: .54rem .75rem; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: .84rem; font-weight: 500;
    cursor: pointer; transition: all .16s;
    text-align: left; margin-bottom: .05rem;
    border: 1px solid transparent;
    background: transparent;
    color: #4a5568;
  }

  /* Hover state for all specialty buttons */
  .sb-btn-services:hover:not(.active),
  .sb-btn-partner:hover:not(.active),
  .sb-btn-complaint:hover:not(.active),
  .sb-btn-emergency:hover:not(.active) {
    background: #f4f6f8;
    color: #1a1f2e;
    border-color: #e2e8f0;
  }

  /* Icon container for specialty buttons - normal state */
  .sb-btn-services .sb-icon,
  .sb-btn-partner .sb-icon,
  .sb-btn-complaint .sb-icon,
  .sb-btn-emergency .sb-icon {
    background: #f1f5f9;
    color: #64748b;
  }

  /* Icon container hover state */
  .sb-btn-services:hover:not(.active) .sb-icon,
  .sb-btn-partner:hover:not(.active) .sb-icon,
  .sb-btn-complaint:hover:not(.active) .sb-icon,
  .sb-btn-emergency:hover:not(.active) .sb-icon {
    background: #e2e8f0;
    color: #1a1f2e;
  }

  /* ACTIVE STATES - Colored backgrounds only when active */
  .sb-btn-services.active {
    background: rgba(16,185,129,0.12);
    border-color: rgba(16,185,129,0.3);
    color: #10b981;
    font-weight: 600;
  }
  .sb-btn-services.active .sb-icon {
    background: rgba(16,185,129,0.15);
    border-color: rgba(16,185,129,0.2);
    color: #10b981;
  }

  .sb-btn-partner.active {
    background: rgba(201,168,76,0.12);
    border-color: rgba(201,168,76,0.3);
    color: #9a7a2e;
    font-weight: 600;
  }
  .sb-btn-partner.active .sb-icon {
    background: rgba(201,168,76,0.15);
    border-color: rgba(201,168,76,0.2);
    color: #9a7a2e;
  }

  .sb-btn-complaint.active {
    background: rgba(139,92,246,0.12);
    border-color: rgba(139,92,246,0.3);
    color: #8b5cf6;
    font-weight: 600;
  }
  .sb-btn-complaint.active .sb-icon {
    background: rgba(139,92,246,0.15);
    border-color: rgba(139,92,246,0.2);
    color: #8b5cf6;
  }

  .sb-btn-emergency.active {
    background: rgba(220,38,38,0.12);
    border-color: rgba(220,38,38,0.3);
    color: #dc2626;
    font-weight: 600;
  }
  .sb-btn-emergency.active .sb-icon {
    background: rgba(220,38,38,0.15);
    border-color: rgba(220,38,38,0.2);
    color: #dc2626;
  }

  .sb-out {
    width: 100%; display: flex; align-items: center; gap: .65rem;
    padding: .54rem .75rem; border-radius: 9px; margin-top: .4rem;
    border: 1px solid rgba(220,53,69,0.18); background: rgba(220,53,69,0.06);
    color: #dc3545; font-family: 'DM Sans', sans-serif; font-size: .84rem;
    font-weight: 600; cursor: pointer; transition: all .18s; text-align: left;
  }
  .sb-out:hover { background: rgba(220,53,69,0.12); border-color: rgba(220,53,69,0.32); }
  .sb-out-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(220,53,69,0.08); color: #dc3545;
  }

  .sb-foot {
    padding: .7rem 1.2rem; border-top: 1px solid #e2e8f0; background: #f8f9fb;
    font-size: .64rem; color: #cbd5e1; text-align: center; letter-spacing: .05em;
  }

  .sb-offcanvas.offcanvas { background: #ffffff !important; }
  .sb-offcanvas .offcanvas-header { padding: 1rem 1.2rem; border-bottom: 1px solid #e2e8f0; }
`;

function initials(user) {
  const n = user?.fullName || user?.username || user?.email || '';
  const p = n.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase() || 'G';
}

function uname(user) {
  return user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';
}

function Avatar({ user, size = 36, radius = 10, fontSize = '.95rem', className = 'sb-av' }) {
  const profilePic = user?.profilePicture || null;
  return (
    <div
      className={className}
      style={{ width: size, height: size, borderRadius: radius, fontSize }}
    >
      {profilePic
        ? <img src={profilePic} alt="Profile" className="sb-av-img" style={{ borderRadius: radius }}/>
        : initials(user)
      }
    </div>
  );
}

function SidebarContent({ page, setPage, user, onLogout, onClose }) {
  const { t } = useLang();
  const [partnerOpen, setPartnerOpen] = useState(false);

  const NAV_MAIN = [
    { key: 'dashboard', label: t.dashboard || 'Dashboard', Icon: LayoutDashboard },
    { key: 'bookings',  label: t.bookings || 'Bookings',  Icon: BedDouble },
    { key: 'mybookings',label: t.mybookings || 'My Bookings', Icon: ClipboardList },
    { key: 'rewards',   label: t.rewards || 'Rewards',   Icon: Star },
    { key: 'payments',  label: t.payments || 'Payments',  Icon: CreditCard },
  ];

  const NAV_ACCOUNT = [
    { key: 'profile',  label: t.profile || 'Profile',  Icon: User },
    { key: 'settings', label: t.settings || 'Settings', Icon: Settings },
    { key: 'support',  label: t.support || 'Support',  Icon: MessageCircle },
  ];

  const PARTNER_SUBMENU = [
    { key: 'partner-services-spa',       label: t.partnerServicesSpa       || 'Spa & Wellness',   Icon: Heart },
    { key: 'partner-services-tours',     label: t.partnerServicesTours     || 'Tours & Guides',   Icon: Map },
    { key: 'partner-services-transport', label: t.partnerServicesTransport || 'Transportation',   Icon: Car },
    { key: 'partner-services-dining',    label: t.partnerServicesDining    || 'Dining',           Icon: UtensilsCrossed },
    { key: 'partner-services-salon',     label: t.partnerServicesSalon     || 'Salon',            Icon: Scissors },
  ];

  // Define exact page matches
  const currentPage = page || 'dashboard';
  const isServicesActive = currentPage === 'services';
  const isComplaintsActive = currentPage === 'complaints';
  const isEmergencyActive = currentPage === 'emergency';
  const isPartnerActive = currentPage?.startsWith('partner-services');

  const handleNavigation = (key) => {
    setPage(key);
    if (onClose) onClose();
  };

  return (
    <>
      <style>{css}</style>
      <div className="sb-logo">
        <div className="sb-logo-row">
          <div className="sb-logo-mark">
            <Hotel size={16} />
          </div>
          <div>
            <div className="sb-logo-name">Cebu Mini Hotel</div>
            <div className="sb-logo-sub">Guest Portal</div>
          </div>
        </div>
      </div>

      <div className="sb-user">
        <Avatar user={user} size={36} radius={10} fontSize=".95rem" />
        <div>
          <div className="sb-uname">{uname(user)}</div>
          <div className="sb-urole">{t.guestRole || 'Guest'}</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-sec">{t.navSection || 'Navigation'}</div>
        {NAV_MAIN.map(({ key, label, Icon }) => (
          <button 
            key={key} 
            className={`sb-btn ${currentPage === key ? 'active' : ''}`} 
            onClick={() => handleNavigation(key)}
          >
            <span className="sb-icon"><Icon size={15} /></span>
            {label}
          </button>
        ))}

        {/* Services Button */}
        <button
          className={`sb-btn-services ${isServicesActive ? 'active' : ''}`}
          onClick={() => handleNavigation('services')}
        >
          <span className="sb-icon"><Sparkles size={15} /></span>
          {t.services || 'Guest Services'}
        </button>

        {/* Partner Services with Submenu */}
        <div>
          <button
            className={`sb-btn-partner ${isPartnerActive ? 'active' : ''}`}
            onClick={() => setPartnerOpen(!partnerOpen)}
          >
            <span className="sb-icon"><Sparkles size={15} /></span>
            {t.partnerServices || 'Partner Services'}
            <span className={`sb-expand-icon ${partnerOpen ? 'open' : ''}`}>
              <ChevronDown size={14} />
            </span>
          </button>
          
          {partnerOpen && (
            <div className="sb-submenu">
              {PARTNER_SUBMENU.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`sb-submenu-btn ${currentPage === key ? 'active' : ''}`}
                  onClick={() => handleNavigation(key)}
                >
                  <span className="sb-submenu-icon"><Icon size={12} /></span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Complaints Button */}
        <button
          className={`sb-btn-complaint ${isComplaintsActive ? 'active' : ''}`}
          onClick={() => handleNavigation('complaints')}
        >
          <span className="sb-icon"><Flag size={15} /></span>
          {t.complaints || 'Guest Complaints'}
        </button>

        {/* Emergency Button */}
        <button
          className={`sb-btn-emergency ${isEmergencyActive ? 'active' : ''}`}
          onClick={() => handleNavigation('emergency')}
        >
          <span className="sb-icon"><AlertTriangle size={15} /></span>
          {t.emergency || 'Emergency'}
        </button>

        <div className="sb-sec" style={{ marginTop: '.65rem' }}>{t.accountSection || 'Account'}</div>
        {NAV_ACCOUNT.map(({ key, label, Icon }) => (
          <button 
            key={key} 
            className={`sb-btn ${currentPage === key ? 'active' : ''}`} 
            onClick={() => handleNavigation(key)}
          >
            <span className="sb-icon"><Icon size={15} /></span>
            {label}
          </button>
        ))}

        <button className="sb-out" onClick={onLogout}>
          <span className="sb-out-icon"><LogOut size={15} /></span>
          {t.signout || 'Sign Out'}
        </button>
      </nav>

      <div className="sb-foot">© 2026 Cebu Mini Hotel</div>
    </>
  );
}

export function Sidebar({ page, setPage, user, onLogout, open, onClose }) {
  const nav = (key) => { setPage(key); onClose?.(); };
  
  return (
    <>
      <aside className="sb-wrap d-none d-md-flex flex-column">
        <SidebarContent 
          page={page} 
          setPage={setPage} 
          user={user} 
          onLogout={onLogout} 
          onClose={onClose}
        />
      </aside>

      <Offcanvas show={open} onHide={onClose} placement="start" className="sb-offcanvas" style={{ width: 252 }}>
        <Offcanvas.Header closeButton>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 600, color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#9a7a2e,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Hotel size={13} />
            </div>
            Guest Panel
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ padding: 0, overflowY: 'auto' }}>
          <SidebarContent 
            page={page} 
            setPage={nav} 
            user={user} 
            onLogout={onLogout} 
            onClose={onClose}
          />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}