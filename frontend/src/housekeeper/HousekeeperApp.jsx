// housekeeper/HousekeeperApp.jsx
import { useState, useEffect } from 'react';
import { EmergencyProvider } from '../context/EmergencyContext';
import { HousekeeperSidebar } from './HousekeeperSidebar';
import { HousekeeperTopbar } from './HousekeeperTopbar';
import { HousekeeperDashboard } from './HousekeeperDashboard';
import { HousekeeperRooms } from './HousekeeperRooms';
import { HousekeeperRoomDetail } from './HousekeeperRoomDetail';
import { HousekeeperTasks } from './HousekeeperTasks';
import { HousekeeperReport } from './HousekeeperReport';
import { HousekeeperProfile } from './HousekeeperProfile';
import { HousekeeperSupplyRequests } from './HousekeeperSupplyRequests';
import { HousekeeperRoomIssues } from './HousekeeperRoomIssues';
import { API_BASE } from '../constants/config';

const LAYOUT_CSS = `
  .hk-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    background: #f4f6f8;
  }
  
  .hk-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .hk-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  /* Login Styles */
  .hk-login-root {
    min-height: 100vh;
    background: #f4f6f8;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  
  .hk-login-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }
  
  .hk-login-card::before {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(to right, #10b981, #34d399);
  }
  
  .hk-login-head {
    padding: 2rem 2rem 1.5rem;
    text-align: center;
  }
  
  .hk-login-mark {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981, #34d399);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto .75rem;
  }
  
  .hk-login-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 600;
    color: #1a1f2e;
    margin-bottom: .2rem;
  }
  
  .hk-login-sub {
    font-size: .78rem;
    color: #8a96a8;
  }
  
  .hk-login-body {
    padding: 0 2rem 2rem;
  }
  
  .hk-login-label {
    font-size: .67rem;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #8a96a8;
    font-weight: 700;
    display: block;
    margin-bottom: .38rem;
  }
  
  .hk-login-input {
    width: 100%;
    background: #f8f9fb;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: .68rem .9rem;
    font-size: .875rem;
    margin-bottom: .9rem;
    outline: none;
  }
  
  .hk-login-input:focus {
    border-color: #10b981;
    background: #fff;
  }
  
  .hk-login-btn {
    width: 100%;
    padding: .72rem;
    border: none;
    border-radius: 9px;
    background: linear-gradient(135deg, #10b981, #34d399);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
  }
  
  .hk-login-err {
    font-size: .78rem;
    color: #dc3545;
    background: rgba(220, 53, 69, 0.08);
    border: 1px solid rgba(220, 53, 69, 0.2);
    border-radius: 7px;
    padding: .55rem .85rem;
    margin-bottom: .85rem;
    text-align: center;
  }
`;

const PAGE_TITLES = {
  dashboard: 'Housekeeping Dashboard',
  rooms: 'Room Status',
  'room-detail': 'Room Details',
  tasks: 'My Tasks',
  report: 'My Report',
  profile: 'My Profile',
  'supply-requests': 'Supply Requests',
  'room-issues': 'Room Issues',
};

function HousekeeperLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email || !password) {
      setError('Enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      onLogin(data.user, data.access || data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hk-login-root">
      <div className="hk-login-card">
        <div className="hk-login-head">
          <div className="hk-login-mark">🧹</div>
          <div className="hk-login-title">Housekeeping Portal</div>
          <div className="hk-login-sub">Bayawan Mini Hotel</div>
        </div>
        <div className="hk-login-body">
          {error && <div className="hk-login-err">⚠️ {error}</div>}
          <label className="hk-login-label">Email</label>
          <input className="hk-login-input" type="email" placeholder="housekeeper@hotel.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <label className="hk-login-label">Password</label>
          <input className="hk-login-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="hk-login-btn" disabled={loading} onClick={submit}>
            {loading ? 'Signing in...' : '→ Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HousekeeperShell({ user, token, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const renderPage = () => {
    const props = { user, token, setPage, selectedRoom, setSelectedRoom };
    switch (page) {
      case 'dashboard':
        return <HousekeeperDashboard {...props} />;
      case 'rooms':
        return <HousekeeperRooms {...props} />;
      case 'room-detail':
        return <HousekeeperRoomDetail {...props} />;
      case 'tasks':
        return <HousekeeperTasks {...props} />;
      case 'supply-requests':
        return <HousekeeperSupplyRequests {...props} />;
      case 'room-issues':
        return <HousekeeperRoomIssues {...props} />;
      case 'report':
        return <HousekeeperReport {...props} />;
      case 'profile':
        return <HousekeeperProfile {...props} />;
      default:
        return <HousekeeperDashboard {...props} />;
    }
  };

  return (
    <div className="hk-shell">
      <HousekeeperSidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="hk-main">
        <HousekeeperTopbar
          title={PAGE_TITLES[page] || page}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="hk-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export function HousekeeperApp({ user: propUser, token: propToken, onLogout: propLogout }) {
  const [user, setUser] = useState(propUser || null);
  const [token, setToken] = useState(propToken || null);

  useEffect(() => {
    if (propUser) setUser(propUser);
    if (propToken) setToken(propToken);
  }, [propUser, propToken]);

  const handleLogin = (u, t) => {
    setUser(u);
    setToken(t);
    sessionStorage.setItem('hk_user', JSON.stringify(u));
    sessionStorage.setItem('hk_token', t);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('hk_user');
    sessionStorage.removeItem('hk_token');
    propLogout?.();
  };

  useEffect(() => {
    if (!propUser) {
      const u = sessionStorage.getItem('hk_user');
      const t = sessionStorage.getItem('hk_token');
      if (u && t) {
        setUser(JSON.parse(u));
        setToken(t);
      }
    }
  }, []);

  return (
    <>
      <style>{LAYOUT_CSS}</style>
      {(!user || !token) ? (
        <HousekeeperLogin onLogin={handleLogin} />
      ) : (
        <EmergencyProvider token={token}>
          <HousekeeperShell user={user} token={token} onLogout={handleLogout} />
        </EmergencyProvider>
      )}
    </>
  );
}