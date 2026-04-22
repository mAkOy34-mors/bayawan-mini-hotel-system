// AdminApp.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel root with Emergency Alerts
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { EmergencyProvider } from '../context/EmergencyContext';
import { AdminSidebar }         from './AdminSidebar';
import { AdminTopbar }          from './AdminTopbar';
import { AdminDashboard }       from './AdminDashboard';
import { AdminBookings }        from './AdminBookings';
import { AdminRooms }           from './AdminRooms';
import { AdminGuests }          from './AdminGuests';
import { AdminPayments }        from './AdminPayments';
import { AdminRewards }         from './AdminRewards';
import { AdminSupport }         from './AdminSupport';
import { AdminSettings }        from './AdminSettings';
import { AdminChangeRequests }  from './AdminChangeRequests';
import { AdminUsers }           from './AdminUsers';
import AdminFeedbackManager     from './FeedbackManager';
import AdminCommissionDashboard from './AdminCommissionDashboard';
import AdminPartnerManagement from './AdminPartnerManagement';
import { AdminEmergency } from './AdminEmergency';
import { AdminEmergencyLog } from './AdminEmergencyLog';

import { API_BASE as BASE } from '../constants/config';

const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box}
  .admin-shell{display:flex;height:100vh;overflow:hidden;font-family:'DM Sans',sans-serif;background:#f4f6f8}
  .admin-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .admin-content{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.3) #f0f0f0}
  .admin-content::-webkit-scrollbar{width:5px}
  .admin-content::-webkit-scrollbar-track{background:#f0f0f0}
  .admin-content::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:99px}

  /* ── Standalone Login ── */
  .al-root{min-height:100vh;background:#f4f6f8;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;padding:1.5rem;background-image:repeating-linear-gradient(45deg,rgba(201,168,76,0.03) 0,rgba(201,168,76,0.03) 1px,transparent 0,transparent 50%);background-size:20px 20px}
  .al-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.1)}
  .al-card::before{content:'';display:block;height:3px;background:linear-gradient(to right,#9a7a2e,#C9A84C)}
  .al-head{padding:2rem 2rem 1.5rem;text-align:center}
  .al-mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;font-size:1rem;color:#fff;margin:0 auto .75rem;box-shadow:0 4px 14px rgba(201,168,76,0.3)}
  .al-name{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:600;color:#1a1f2e;margin-bottom:.2rem}
  .al-sub{font-size:.78rem;color:#8a96a8}
  .al-body{padding:0 2rem 2rem}
  .al-label{font-size:.67rem;text-transform:uppercase;letter-spacing:.08em;color:#8a96a8;font-weight:700;display:block;margin-bottom:.38rem}
  .al-input{width:100%;background:#f8f9fb;border:1px solid #e2e8f0;border-radius:8px;padding:.68rem .9rem;font-size:.875rem;font-family:'DM Sans',sans-serif;color:#1a1f2e;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:.9rem}
  .al-input::placeholder{color:#8a96a8}
  .al-input:focus{border-color:#C9A84C;background:#fff;box-shadow:0 0 0 3px rgba(201,168,76,0.12)}
  .al-btn{width:100%;padding:.72rem;border:none;border-radius:9px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);color:#fff;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 3px 10px rgba(201,168,76,0.28);display:flex;align-items:center;justify-content:center;gap:.5rem}
  .al-btn:hover:not(:disabled){background:linear-gradient(135deg,#b09038,#dfc06e);transform:translateY(-1px);box-shadow:0 5px 16px rgba(201,168,76,0.32)}
  .al-btn:disabled{opacity:.55;cursor:not-allowed}
  .al-err{font-size:.78rem;color:#dc3545;background:rgba(220,53,69,0.08);border:1px solid rgba(220,53,69,0.2);border-radius:7px;padding:.55rem .85rem;margin-bottom:.85rem;text-align:center}
  @keyframes spin{to{transform:rotate(360deg)}}
  .al-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
`;

// ── Standalone admin login ──────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || 'Login failed');
      if (data.user?.role !== 'ADMIN' && !data.user?.is_staff) {
        throw new Error('Access denied. Admin account required.');
      }
      onLogin(data.user, data.access || data.token);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="al-root">
      <div className="al-card">
        <div className="al-head">
          <div className="al-mark">✦</div>
          <div className="al-name">Admin Panel</div>
          <div className="al-sub">Cebu Grand Hotel · Restricted Access</div>
        </div>
        <div className="al-body">
          {error && <div className="al-err">⚠️ {error}</div>}
          <label className="al-label">Email</label>
          <input className="al-input" type="email" placeholder="admin@hotel.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          <label className="al-label">Password</label>
          <input className="al-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="al-btn" disabled={loading} onClick={submit}>
            {loading ? <><div className="al-spin" />Signing in…</> : '→ Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shell layout ───────────────────────────────────────────────────────────
function AdminShell({ user, token, onLogout }) {
  const [page,          setPage]         = useState('dashboard');
  const [menuOpen,      setMenuOpen]     = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState(0);

  useEffect(() => {
    // Poll pending change requests count every 60s
    const fetchCounts = async () => {
      try {
        // Fetch pending change requests
        const changeRes = await fetch(`${BASE}/bookings/change-requests/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (changeRes.ok) {
          const data = await changeRes.json();
          setPendingChanges(Array.isArray(data) ? data.filter(r => r.status === 'PENDING').length : 0);
        }
        
        // Fetch pending feedback count
        const feedbackRes = await fetch(`${BASE}/feedback/unresponded/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (feedbackRes.ok) {
          const data = await feedbackRes.json();
          setPendingFeedback(Array.isArray(data) ? data.length : 0);
        }
      } catch { /* silent */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // ✅ Updated PAGE_MAP with Emergency pages
  const PAGE_MAP = {
    dashboard:         <AdminDashboard      token={token} setPage={setPage} />,
    bookings:          <AdminBookings       token={token} />,
    'change-requests': <AdminChangeRequests token={token} />,
    rooms:             <AdminRooms          token={token} />,
    guests:            <AdminGuests         token={token} />,
    payments:          <AdminPayments       token={token} />,
    rewards:           <AdminRewards        token={token} />,
    support:           <AdminSupport        token={token} />,
    settings:          <AdminSettings       token={token} />,
    users:             <AdminUsers          token={token} />,
    feedback:          <AdminFeedbackManager token={token} user={user} />,
     'partner-management': <AdminPartnerManagement token={token} />,
  'commission-dashboard': <AdminCommissionDashboard token={token} />,
    // ✅ Emergency pages
    emergency:         <AdminEmergency      token={token} user={user} />,
    'emergency-log':   <AdminEmergencyLog   token={token} />,
  };

  return (
    <div className="admin-shell">
      <AdminSidebar
        page={page} setPage={setPage}
        user={user}  onLogout={onLogout}
        open={menuOpen} onClose={() => setMenuOpen(false)}
        counts={{ 
          pendingChanges,
          pendingFeedback
        }}
      />
      <div className="admin-main">
        <AdminTopbar page={page} user={user} onMenuClick={() => setMenuOpen(true)} />
        <div className="admin-content">
          {PAGE_MAP[page] || <AdminDashboard token={token} setPage={setPage} />}
        </div>
      </div>
    </div>
  );
}

// ── Public export with EmergencyProvider ──────────────────────────────────────────
export function AdminApp({ user: propUser, token: propToken, onLogout: propLogout }) {
  const [user,    setUser]  = useState(propUser  || null);
  const [token,   setToken] = useState(propToken || null);

  // If props are provided they take precedence and are kept in sync
  useEffect(() => { if (propUser)  setUser(propUser);  }, [propUser]);
  useEffect(() => { if (propToken) setToken(propToken); }, [propToken]);

  // Standalone mode: persist to sessionStorage so page refreshes don't log out
  const handleLogin = (u, t) => {
    setUser(u); setToken(t);
    sessionStorage.setItem('admin_user',  JSON.stringify(u));
    sessionStorage.setItem('admin_token', t);
  };

  const handleLogout = () => {
    setUser(null); setToken(null);
    sessionStorage.removeItem('admin_user');
    sessionStorage.removeItem('admin_token');
    propLogout?.();
  };

  // Restore session on first mount (standalone mode)
  useEffect(() => {
    if (!propUser) {
      const u = sessionStorage.getItem('admin_user');
      const t = sessionStorage.getItem('admin_token');
      if (u && t) { setUser(JSON.parse(u)); setToken(t); }
    }
  }, []);

  // Wrap the entire Admin app with EmergencyProvider
  return (
    <>
      <style>{LAYOUT_CSS}</style>
      {(!user || !token)
        ? <AdminLogin onLogin={handleLogin} />
        : (
          <EmergencyProvider token={token}>
            <AdminShell user={user} token={token} onLogout={handleLogout} />
          </EmergencyProvider>
        )
      }
    </>
  );
}

export default AdminApp;