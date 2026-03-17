// ReceptionistApp.jsx — Cebu Grand Hotel Receptionist Panel
// Usage in App.jsx:
//   if (user?.role === 'RECEPTIONIST') return <ReceptionistApp user={user} token={token} onLogout={logout} />;

import { useState, useEffect } from 'react';
import { Offcanvas } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  LayoutDashboard, CalendarCheck, CalendarX, BedDouble,
  Users, LogIn, LogOut, Search, Menu, X, ChevronRight,
  RefreshCw, Bell, UserCircle, Hotel, CreditCard, PlusCircle,
} from 'lucide-react';

import { ReceptionistDashboard }   from './ReceptionistDashboard';
import { ReceptionistArrivals }    from './ReceptionistArrivals';
import { ReceptionistDepartures }  from './ReceptionistDepartures';
import { ReceptionistBookings }    from './ReceptionistBookings';
import { ReceptionistWalkIn }      from './ReceptionistWalkIn';
import { ReceptionistRoomBoard }   from './ReceptionistRoomBoard';
import { ReceptionistGuests }      from './ReceptionistGuests';
import { ReceptionistPayments }    from './ReceptionistPayments';

const BASE = '/api/v1';

const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box}
  .rc-shell{display:flex;height:100vh;overflow:hidden;font-family:'DM Sans',sans-serif;background:#f4f6f8}
  .rc-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
  .rc-content{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.3) #f0f0f0}
  .rc-content::-webkit-scrollbar{width:5px}
  .rc-content::-webkit-scrollbar-track{background:#f0f0f0}
  .rc-content::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:99px}

  /* Sidebar */
  .rc-sb{width:240px;min-width:240px;background:#fff;border-right:1px solid #e2e8f0;height:100vh;display:flex;flex-direction:column;flex-shrink:0;font-family:'DM Sans',sans-serif;overflow-y:auto;scrollbar-width:thin;position:sticky;top:0}
  .rc-sb-logo{padding:1.2rem 1.1rem .9rem;border-bottom:1px solid #e2e8f0}
  .rc-sb-logo-row{display:flex;align-items:center;gap:.5rem}
  .rc-sb-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
  .rc-sb-name{font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;color:#1a1f2e;line-height:1.2}
  .rc-sb-role{display:inline-flex;align-items:center;gap:.3rem;margin-top:.4rem;padding:.18rem .55rem;border-radius:99px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);font-size:.6rem;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:.08em}
  .rc-sb-user{display:flex;align-items:center;gap:.65rem;padding:.75rem 1.1rem;border-bottom:1px solid #e2e8f0;background:#f8f9fb}
  .rc-sb-av{width:34px;height:34px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#3b82f6,#60a5fa);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:.9rem;font-weight:600;color:#fff}
  .rc-sb-uname{font-size:.82rem;font-weight:600;color:#1a1f2e;line-height:1.3}
  .rc-sb-urole{font-size:.62rem;color:#3b82f6;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
  .rc-sb-nav{flex:1;padding:.65rem .55rem}
  .rc-sb-sec{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:#cbd5e1;padding:.5rem .65rem .25rem}
  .rc-sb-btn{width:100%;display:flex;align-items:center;gap:.6rem;padding:.5rem .7rem;border-radius:9px;border:1px solid transparent;background:transparent;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;color:#4a5568;cursor:pointer;transition:all .16s;text-align:left;margin-bottom:.04rem;position:relative}
  .rc-sb-btn:hover{background:#f4f6f8;color:#1a1f2e;border-color:#e2e8f0}
  .rc-sb-btn.on{background:rgba(59,130,246,0.08);color:#2563eb;font-weight:600;border-color:rgba(59,130,246,0.2)}
  .rc-sb-btn.on::before{content:'';position:absolute;left:-1px;top:22%;bottom:22%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(to bottom,#2563eb,#60a5fa)}
  .rc-sb-ico{width:27px;height:27px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f1f5f9;transition:background .16s}
  .rc-sb-btn.on .rc-sb-ico{background:rgba(59,130,246,0.12)}
  .rc-sb-btn:hover:not(.on) .rc-sb-ico{background:#e2e8f0}
  .rc-sb-out{width:100%;display:flex;align-items:center;gap:.6rem;padding:.5rem .7rem;border-radius:9px;margin-top:.4rem;border:1px solid rgba(220,53,69,0.18);background:rgba(220,53,69,0.06);color:#dc3545;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .18s;text-align:left}
  .rc-sb-out:hover{background:rgba(220,53,69,0.12);border-color:rgba(220,53,69,0.32)}
  .rc-sb-out-ico{width:27px;height:27px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(220,53,69,0.08)}
  .rc-sb-foot{padding:.65rem 1.1rem;border-top:1px solid #e2e8f0;background:#f8f9fb;font-size:.62rem;color:#cbd5e1;text-align:center}

  /* Topbar */
  .rc-topbar{height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;flex-shrink:0;gap:1rem}
  .rc-topbar-left{display:flex;align-items:center;gap:.75rem}
  .rc-topbar-title{font-family:'Cormorant Garamond',serif;font-size:1.12rem;font-weight:600;color:#1a1f2e}
  .rc-topbar-right{display:flex;align-items:center;gap:.75rem}
  .rc-topbar-time{font-size:.75rem;color:#8a96a8;font-variant-numeric:tabular-nums;background:#f8f9fb;border:1px solid #e2e8f0;border-radius:7px;padding:.3rem .7rem}
  .rc-menu-btn{background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5568;padding:.4rem;border-radius:7px;transition:background .15s}
  .rc-menu-btn:hover{background:#f4f6f8}

  /* Login */
  .rc-login-root{min-height:100vh;background:#f4f6f8;display:flex;align-items:center;justify-content:center;padding:1.5rem;background-image:repeating-linear-gradient(45deg,rgba(59,130,246,0.02) 0,rgba(59,130,246,0.02) 1px,transparent 0,transparent 50%);background-size:20px 20px}
  .rc-login-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;width:100%;max-width:390px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.1)}
  .rc-login-card::before{content:'';display:block;height:3px;background:linear-gradient(to right,#2563eb,#60a5fa)}
  .rc-login-head{padding:2rem 2rem 1.5rem;text-align:center}
  .rc-login-mark{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#60a5fa);display:flex;align-items:center;justify-content:center;margin:0 auto .75rem;box-shadow:0 4px 14px rgba(59,130,246,0.3)}
  .rc-login-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:#1a1f2e;margin-bottom:.2rem}
  .rc-login-sub{font-size:.78rem;color:#8a96a8}
  .rc-login-body{padding:0 2rem 2rem}
  .rc-login-lbl{font-size:.67rem;text-transform:uppercase;letter-spacing:.08em;color:#8a96a8;font-weight:700;display:block;margin-bottom:.38rem}
  .rc-login-inp{width:100%;background:#f8f9fb;border:1px solid #e2e8f0;border-radius:8px;padding:.68rem .9rem;font-size:.875rem;font-family:'DM Sans',sans-serif;color:#1a1f2e;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:.9rem}
  .rc-login-inp:focus{border-color:#60a5fa;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,0.12)}
  .rc-login-btn{width:100%;padding:.72rem;border:none;border-radius:9px;background:linear-gradient(135deg,#2563eb,#60a5fa);color:#fff;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 3px 10px rgba(59,130,246,0.28);display:flex;align-items:center;justify-content:center;gap:.5rem}
  .rc-login-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 5px 16px rgba(59,130,246,0.32)}
  .rc-login-btn:disabled{opacity:.55;cursor:not-allowed}
  .rc-login-err{font-size:.78rem;color:#dc3545;background:rgba(220,53,69,0.08);border:1px solid rgba(220,53,69,0.2);border-radius:7px;padding:.55rem .85rem;margin-bottom:.85rem;text-align:center}
  @keyframes spin{to{transform:rotate(360deg)}}
  .rc-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}

  /* Offcanvas */
  .rc-oc .offcanvas-body{padding:0;overflow:hidden}
  .rc-oc.offcanvas{background:#fff!important}
  .rc-oc .offcanvas-header{padding:1rem 1.1rem;border-bottom:1px solid #e2e8f0}
`;

const NAV = [
  { key:'dashboard',   label:'Dashboard',      Icon: LayoutDashboard, section:'Overview' },
  { key:'arrivals',    label:'Arrivals',        Icon: LogIn,           section:"Today's Front Desk" },
  { key:'departures',  label:'Departures',      Icon: LogOut },
  { key:'bookings',    label:'All Bookings',    Icon: CalendarCheck,   section:'Bookings' },
  { key:'walkin',      label:'Walk-in Booking', Icon: PlusCircle },
  { key:'guests',      label:'Guest Profiles',  Icon: Users,           section:'Guests & Rooms' },
  { key:'roomboard',   label:'Room Board',      Icon: BedDouble },
  { key:'payments',    label:'Payments',        Icon: CreditCard,      section:'Payments' },
];

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  arrivals:   "Today's Arrivals",
  departures: "Today's Departures",
  bookings:   'All Bookings',
  walkin:     'Walk-in Booking',
  guests:     'Guest Profiles',
  roomboard:  'Room Status Board',
  payments:   'Payment Records',
};

function ini(u) { const n = u?.username || u?.email || 'R'; return n.slice(0,2).toUpperCase(); }
function uname(u) { return u?.username || u?.email?.split('@')[0] || 'Receptionist'; }

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="rc-topbar-time">{time.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', second:'2-digit' })} · {time.toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric' })}</span>;
}

function SidebarInner({ page, setPage, user, onLogout }) {
  return <>
    <div className="rc-sb-logo">
      <div className="rc-sb-logo-row">
        <div className="rc-sb-mark"><Hotel size={16}/></div>
        <div>
          <div className="rc-sb-name">Cebu Grand Hotel</div>
          <div style={{ fontSize:'.6rem', color:'#8a96a8', textTransform:'uppercase', letterSpacing:'.1em' }}>Reception Desk</div>
        </div>
      </div>
      <div className="rc-sb-role"><UserCircle size={10}/>Receptionist</div>
    </div>
    <div className="rc-sb-user">
      <div className="rc-sb-av">{ini(user)}</div>
      <div><div className="rc-sb-uname">{uname(user)}</div><div className="rc-sb-urole">Receptionist</div></div>
    </div>
    <nav className="rc-sb-nav">
      {NAV.map(({ key, label, Icon, section }) => (
        <div key={key}>
          {section && <div className="rc-sb-sec" style={key!=='dashboard'?{marginTop:'.55rem'}:{}}>{section}</div>}
          <button className={`rc-sb-btn${page===key?' on':''}`} onClick={() => setPage(key)}>
            <span className="rc-sb-ico"><Icon size={14}/></span>
            {label}
          </button>
        </div>
      ))}
      <button className="rc-sb-out" onClick={onLogout}>
        <span className="rc-sb-out-ico"><LogOut size={14}/></span>Sign Out
      </button>
    </nav>
    <div className="rc-sb-foot">© 2026 Cebu Grand Hotel</div>
  </>;
}

// ── Login ──────────────────────────────────────────────────────
function ReceptionistLogin({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.detail || 'Login failed');
      const role = data.user?.role?.toUpperCase();
      if (role !== 'RECEPTIONIST' && role !== 'ADMIN') {
        throw new Error('Access denied. Receptionist account required.');
      }
      onLogin(data.user, data.access || data.token);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="rc-login-root">
      <div className="rc-login-card">
        <div className="rc-login-head">
          <div className="rc-login-mark"><Hotel size={20} color="#fff"/></div>
          <div className="rc-login-title">Reception Desk</div>
          <div className="rc-login-sub">Cebu Grand Hotel · Staff Access</div>
        </div>
        <div className="rc-login-body">
          {error && <div className="rc-login-err">⚠️ {error}</div>}
          <label className="rc-login-lbl">Email</label>
          <input className="rc-login-inp" type="email" placeholder="receptionist@hotel.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} autoFocus/>
          <label className="rc-login-lbl">Password</label>
          <input className="rc-login-inp" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && submit()}/>
          <button className="rc-login-btn" disabled={loading} onClick={submit}>
            {loading ? <><div className="rc-spin"/>Signing in…</> : '→ Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shell ──────────────────────────────────────────────────────
function ReceptionistShell({ user, token, onLogout }) {
  const [page,     setPage]     = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (k) => { setPage(k); setMenuOpen(false); };

  const PAGE_MAP = {
    dashboard:  <ReceptionistDashboard  token={token} setPage={setPage} />,
    arrivals:   <ReceptionistArrivals   token={token} />,
    departures: <ReceptionistDepartures token={token} />,
    bookings:   <ReceptionistBookings   token={token} />,
    walkin:     <ReceptionistWalkIn     token={token} setPage={setPage} />,
    guests:     <ReceptionistGuests     token={token} />,
    roomboard:  <ReceptionistRoomBoard  token={token} />,
    payments:   <ReceptionistPayments   token={token} />,
  };

  return (
    <div className="rc-shell">
      {/* Desktop sidebar */}
      <aside className="rc-sb d-none d-md-flex flex-column">
        <SidebarInner page={page} setPage={nav} user={user} onLogout={onLogout}/>
      </aside>

      {/* Mobile offcanvas */}
      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} placement="start" className="rc-oc" style={{ width:240 }}>
        <Offcanvas.Header closeButton>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem', fontWeight:600, color:'#1a1f2e', display:'flex', alignItems:'center', gap:'.45rem' }}>
            <div style={{ width:22, height:22, borderRadius:7, background:'linear-gradient(135deg,#2563eb,#60a5fa)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Hotel size={12} color="#fff"/>
            </div>
            Reception Desk
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarInner page={page} setPage={nav} user={user} onLogout={onLogout}/>
        </Offcanvas.Body>
      </Offcanvas>

      <div className="rc-main">
        {/* Topbar */}
        <div className="rc-topbar">
          <div className="rc-topbar-left">
            <button className="rc-menu-btn d-md-none" onClick={() => setMenuOpen(true)}><Menu size={20}/></button>
            <div className="rc-topbar-title">{PAGE_TITLES[page] || page}</div>
          </div>
          <div className="rc-topbar-right">
            <Clock/>
          </div>
        </div>
        <div className="rc-content">
          {PAGE_MAP[page] || PAGE_MAP.dashboard}
        </div>
      </div>
    </div>
  );
}

// ── Public export ──────────────────────────────────────────────
export function ReceptionistApp({ user: propUser, token: propToken, onLogout: propLogout }) {
  const [user,  setUser]  = useState(propUser  || null);
  const [token, setToken] = useState(propToken || null);

  useEffect(() => { if (propUser)  setUser(propUser);  }, [propUser]);
  useEffect(() => { if (propToken) setToken(propToken); }, [propToken]);

  useEffect(() => {
    if (!propUser) {
      const u = sessionStorage.getItem('rc_user');
      const t = sessionStorage.getItem('rc_token');
      if (u && t) { setUser(JSON.parse(u)); setToken(t); }
    }
  }, []);

  const handleLogin = (u, t) => {
    setUser(u); setToken(t);
    sessionStorage.setItem('rc_user',  JSON.stringify(u));
    sessionStorage.setItem('rc_token', t);
  };

  const handleLogout = () => {
    setUser(null); setToken(null);
    sessionStorage.removeItem('rc_user');
    sessionStorage.removeItem('rc_token');
    propLogout?.();
  };

  return (
    <>
      <style>{LAYOUT_CSS}</style>
      {(!user || !token)
        ? <ReceptionistLogin onLogin={handleLogin}/>
        : <ReceptionistShell user={user} token={token} onLogout={handleLogout}/>
      }
    </>
  );
}

export default ReceptionistApp;