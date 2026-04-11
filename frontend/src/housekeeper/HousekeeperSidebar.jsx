// housekeeper/HousekeeperSidebar.jsx
import { Offcanvas } from 'react-bootstrap';
import { LayoutDashboard, Hotel, ClipboardList, BarChart3, User, LogOut, Wrench } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'rooms', label: 'Room Status', Icon: Hotel },
  { key: 'tasks', label: 'My Tasks', Icon: ClipboardList },
  { key: 'report', label: 'My Report', Icon: BarChart3 },
  { key: 'profile', label: 'My Profile', Icon: User },
];

function SidebarContent({ page, setPage, user, onLogout }) {
  return (
    <>
      <div style={{ padding: '1.2rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600 }}>Housekeeping</div>
            <div style={{ fontSize: '0.6rem', color: '#8a96a8' }}>Staff Portal</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8f9fb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Cormorant Garamond', serif", fontSize: '0.9rem', fontWeight: 600 }}>
            {user?.username?.charAt(0).toUpperCase() || 'H'}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user?.username || 'Housekeeper'}</div>
            <div style={{ fontSize: '0.62rem', color: '#10b981', textTransform: 'uppercase' }}>Housekeeping</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0.65rem' }}>
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setPage(key)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 9,
              border: '1px solid transparent',
              background: page === key ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              color: page === key ? '#10b981' : '#4a5568',
              fontWeight: page === key ? 600 : 500,
              cursor: 'pointer',
              marginBottom: '0.1rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.82rem',
            }}
          >
            <span style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
              <Icon size={14} />
            </span>
            {label}
          </button>
        ))}

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 9,
            marginTop: '0.5rem',
            border: '1px solid rgba(220,53,69,0.18)',
            background: 'rgba(220,53,69,0.06)',
            color: '#dc3545',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,53,69,0.08)' }}>
            <LogOut size={14} />
          </span>
          Sign Out
        </button>
      </nav>

      <div style={{ padding: '0.7rem 1rem', borderTop: '1px solid #e2e8f0', background: '#f8f9fb', fontSize: '0.62rem', color: '#cbd5e1', textAlign: 'center' }}>
        © 2026 Bayawan Mini Hotel
      </div>
    </>
  );
}

export function HousekeeperSidebar({ page, setPage, user, onLogout, open, onClose }) {
  const nav = (key) => {
    setPage(key);
    onClose?.();
  };

  return (
    <>
      <aside className="d-none d-md-flex flex-column" style={{ width: 252, minWidth: 252, background: '#fff', borderRight: '1px solid #e2e8f0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SidebarContent page={page} setPage={nav} user={user} onLogout={onLogout} />
      </aside>

      <Offcanvas show={open} onHide={onClose} placement="start" style={{ width: 252 }}>
        <Offcanvas.Header closeButton>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontWeight: 600 }}>Housekeeping Panel</div>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ padding: 0 }}>
          <SidebarContent page={page} setPage={nav} user={user} onLogout={onLogout} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}