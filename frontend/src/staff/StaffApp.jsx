// staff/StaffApp.jsx
import { useState, useEffect } from 'react';
import { EmergencyProvider } from '../context/EmergencyContext';
import { StaffSidebar } from './StaffSidebar';
import { StaffTopbar } from './StaffTopbar';
import { StaffDashboard } from './StaffDashboard';
import { StaffTasks } from './StaffTasks';
import { StaffTaskDetail } from './StaffTaskDetail';
import { StaffEmergency } from './StaffEmergency';
import { StaffProfile } from './StaffProfile';
import { API_BASE } from '../constants/config';

const LAYOUT_CSS = `
  .staff-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    background: #f4f6f8;
  }
  
  .staff-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .staff-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .staff-login-root {
    min-height: 100vh;
    background: #f4f6f8;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  
  .staff-login-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }
  
  .staff-login-card::before {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(to right, #9a7a2e, #C9A84C);
  }
  
  .staff-login-head {
    padding: 2rem 2rem 1.5rem;
    text-align: center;
  }
  
  .staff-login-mark {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto .75rem;
  }
  
  .staff-login-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 600;
    color: #1a1f2e;
    margin-bottom: .2rem;
  }
  
  .staff-login-sub {
    font-size: .78rem;
    color: #8a96a8;
  }
  
  .staff-login-body {
    padding: 0 2rem 2rem;
  }
  
  .staff-login-label {
    font-size: .67rem;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #8a96a8;
    font-weight: 700;
    display: block;
    margin-bottom: .38rem;
  }
  
  .staff-login-input {
    width: 100%;
    background: #f8f9fb;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: .68rem .9rem;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: .9rem;
    outline: none;
  }
  
  .staff-login-input:focus {
    border-color: #C9A84C;
    background: #fff;
  }
  
  .staff-login-btn {
    width: 100%;
    padding: .72rem;
    border: none;
    border-radius: 9px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
  }
  
  .staff-login-err {
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
  dashboard: 'Staff Dashboard',
  tasks: 'My Tasks',
  emergency: 'Emergency Response',
  profile: 'My Profile',
};

function StaffLogin({ onLogin }) {
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
      if (data.user?.role !== 'STAFF') {
        throw new Error('Access denied. Staff account required.');
      }
      onLogin(data.user, data.access || data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-root">
      <div className="staff-login-card">
        <div className="staff-login-head">
          <div className="staff-login-mark">🔧</div>
          <div className="staff-login-title">Staff Portal</div>
          <div className="staff-login-sub">Bayawan Mini Hotel</div>
        </div>
        <div className="staff-login-body">
          {error && <div className="staff-login-err">⚠️ {error}</div>}
          <label className="staff-login-label">Email</label>
          <input className="staff-login-input" type="email" placeholder="staff@hotel.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <label className="staff-login-label">Password</label>
          <input className="staff-login-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="staff-login-btn" disabled={loading} onClick={submit}>
            {loading ? 'Signing in...' : '→ Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffShell({ user, token, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <StaffDashboard user={user} token={token} />;
      case 'tasks':
        return <StaffTasks user={user} token={token} />;
      case 'emergency':
        return <StaffEmergency user={user} token={token} />;
      case 'profile':
        return <StaffProfile user={user} token={token} />;
      default:
        return <StaffDashboard user={user} token={token} />;
    }
  };

  return (
    <div className="staff-shell">
      <StaffSidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="staff-main">
        <StaffTopbar
          title={PAGE_TITLES[page] || page}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="staff-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export function StaffApp({ user: propUser, token: propToken, onLogout: propLogout }) {
  const [user, setUser] = useState(propUser || null);
  const [token, setToken] = useState(propToken || null);

  useEffect(() => {
    if (propUser) setUser(propUser);
    if (propToken) setToken(propToken);
  }, [propUser, propToken]);

  const handleLogin = (u, t) => {
    setUser(u);
    setToken(t);
    sessionStorage.setItem('staff_user', JSON.stringify(u));
    sessionStorage.setItem('staff_token', t);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('staff_user');
    sessionStorage.removeItem('staff_token');
    propLogout?.();
  };

  useEffect(() => {
    if (!propUser) {
      const u = sessionStorage.getItem('staff_user');
      const t = sessionStorage.getItem('staff_token');
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
        <StaffLogin onLogin={handleLogin} />
      ) : (
        <EmergencyProvider token={token}>
          <StaffShell user={user} token={token} onLogout={handleLogout} />
        </EmergencyProvider>
      )}
    </>
  );
}