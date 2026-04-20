// AdminSidebar.jsx
import { Offcanvas } from 'react-bootstrap';
import {
  LayoutDashboard, BedDouble, Hotel, Users, CreditCard,
  Star, MessageCircle, Settings, LogOut, RefreshCw, ShieldCheck,
  AlertTriangle, FileText  // ← Added AlertTriangle and FileText
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  .asb{width:252px;min-width:252px;background:#fff;border-right:1px solid #e2e8f0;height:100vh;display:flex;flex-direction:column;flex-shrink:0;font-family:'DM Sans',sans-serif;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,0.3) #f4f6f8;position:sticky;top:0}
  .asb::-webkit-scrollbar{width:4px}.asb::-webkit-scrollbar-track{background:#f4f6f8}.asb::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:99px}
  .asb-logo{padding:1.3rem 1.2rem 1rem;border-bottom:1px solid #e2e8f0}
  .asb-logo-row{display:flex;align-items:center;gap:.55rem}
  .asb-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(201,168,76,0.3)}
  .asb-name{font-family:'Cormorant Garamond',serif;font-size:1.08rem;font-weight:600;color:#1a1f2e;line-height:1.2}
  .asb-sub{font-size:.6rem;color:#8a96a8;text-transform:uppercase;letter-spacing:.12em}
  .asb-badge{display:inline-flex;align-items:center;gap:.3rem;margin-top:.45rem;padding:.2rem .6rem;border-radius:99px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);font-size:.61rem;font-weight:700;color:#9a7a2e;text-transform:uppercase;letter-spacing:.08em}
  .asb-user{display:flex;align-items:center;gap:.72rem;padding:.82rem 1.2rem;border-bottom:1px solid #e2e8f0;background:#f8f9fb}
  .asb-av{width:36px;height:36px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:.95rem;font-weight:600;color:#fff}
  .asb-uname{font-size:.84rem;font-weight:600;color:#1a1f2e;line-height:1.3}
  .asb-urole{font-size:.64rem;color:#9a7a2e;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-top:.05rem}
  .asb-nav{flex:1;padding:.75rem .65rem}
  .asb-sec{font-size:.61rem;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:#cbd5e1;padding:.55rem .65rem .3rem}
  .asb-btn{width:100%;display:flex;align-items:center;gap:.65rem;padding:.54rem .75rem;border-radius:9px;border:1px solid transparent;background:transparent;font-family:'DM Sans',sans-serif;font-size:.84rem;font-weight:500;color:#4a5568;cursor:pointer;transition:all .16s;text-align:left;margin-bottom:.05rem;position:relative}
  .asb-btn:hover{background:#f4f6f8;color:#1a1f2e;border-color:#e2e8f0}
  .asb-btn.on{background:rgba(201,168,76,0.1);color:#9a7a2e;font-weight:600;border-color:rgba(201,168,76,0.25)}
  .asb-btn.on::before{content:'';position:absolute;left:-1px;top:22%;bottom:22%;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(to bottom,#9a7a2e,#C9A84C)}
  .asb-ico{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border:1px solid transparent;transition:background .16s}
  .asb-btn.on .asb-ico{background:rgba(201,168,76,0.15);border-color:rgba(201,168,76,0.2);color:#9a7a2e}
  .asb-btn:hover:not(.on) .asb-ico{background:#e2e8f0}
  .asb-badge-count{margin-left:auto;min-width:18px;height:18px;border-radius:99px;background:rgba(220,53,69,0.12);color:#dc3545;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 .35rem}
  .asb-out{width:100%;display:flex;align-items:center;gap:.65rem;padding:.54rem .75rem;border-radius:9px;margin-top:.4rem;border:1px solid rgba(220,53,69,0.18);background:rgba(220,53,69,0.06);color:#dc3545;font-family:'DM Sans',sans-serif;font-size:.84rem;font-weight:600;cursor:pointer;transition:all .18s;text-align:left}
  .asb-out:hover{background:rgba(220,53,69,0.12);border-color:rgba(220,53,69,0.32)}
  .asb-out-ico{width:28px;height:28px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(220,53,69,0.08)}
  .asb-foot{padding:.7rem 1.2rem;border-top:1px solid #e2e8f0;background:#f8f9fb;font-size:.64rem;color:#cbd5e1;text-align:center;letter-spacing:.05em}
  .asb-oc .offcanvas-body{padding:0;overflow:hidden}
  .asb-oc.offcanvas{background:#fff!important}
  .asb-oc .offcanvas-header{padding:1rem 1.2rem;border-bottom:1px solid #e2e8f0}
`;

// ✅ Updated NAV with Emergency section
const NAV = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, section: 'Management' },
  { key: 'users', label: 'Users', Icon: Users },
  { key: 'bookings', label: 'Bookings', Icon: BedDouble },
  { key: 'change-requests', label: 'Change Requests', Icon: RefreshCw, badge: 'pendingChanges' },
  { key: 'rooms', label: 'Rooms', Icon: Hotel },
  { key: 'guests', label: 'Guests', Icon: Users },
  { key: 'payments', label: 'Payments', Icon: CreditCard },
  { key: 'feedback', label: 'Guest Feedback', Icon: MessageCircle, section: 'Operations', badge: 'pendingFeedback' },
  { key: 'rewards', label: 'Rewards', Icon: Star },
  { key: 'support', label: 'Support', Icon: MessageCircle, badge: 'pendingTickets' },
  // ✅ Emergency Section - Added
  { key: 'emergency', label: '🚨 Live Alerts', Icon: AlertTriangle, section: 'Emergency' },
  { key: 'emergency-log', label: '📋 Emergency Log', Icon: FileText },
  { key: 'settings', label: 'Settings', Icon: Settings },
];

function ini(u) { 
  const n = u?.username || u?.email || 'A'; 
  return n.slice(0, 2).toUpperCase(); 
}

function uname(u) { 
  return u?.username || u?.email?.split('@')[0] || 'Admin'; 
}

function Inner({ page, setPage, user, onLogout, counts }) {
  return (
    <>
      <style>{css}</style>
      <div className="asb-logo">
        <div className="asb-logo-row">
          <div className="asb-mark"><Hotel size={15}/></div>
          <div>
            <div className="asb-name">Bayawan Mini Hotel</div>
            <div className="asb-sub">Admin Panel</div>
          </div>
        </div>
        <div className="asb-badge"><ShieldCheck size={10}/>Administrator</div>
      </div>
      <div className="asb-user">
        <div className="asb-av">{ini(user)}</div>
        <div>
          <div className="asb-uname">{uname(user)}</div>
          <div className="asb-urole">Admin</div>
        </div>
      </div>
      <nav className="asb-nav">
        {NAV.map(({ key, label, Icon, section, badge }) => (
          <div key={key}>
            {section && <div className="asb-sec" style={key !== 'dashboard' ? { marginTop: '.65rem' } : {}}>{section}</div>}
            <button className={`asb-btn${page === key ? ' on' : ''}`} onClick={() => setPage(key)}>
              <span className="asb-ico"><Icon size={14}/></span>
              {label}
              {badge && counts?.[badge] > 0 && <span className="asb-badge-count">{counts[badge]}</span>}
            </button>
          </div>
        ))}
        <button className="asb-out" onClick={onLogout}>
          <span className="asb-out-ico"><LogOut size={14}/></span>Sign Out
        </button>
      </nav>
      <div className="asb-foot">© 2026 Bayawan Mini Hotel</div>
    </>
  );
}

export function AdminSidebar({ page, setPage, user, onLogout, open, onClose, counts }) {
  const nav = (k) => { 
    setPage(k); 
    onClose?.(); 
  };
  
  return (
    <>
      <aside className="asb d-none d-md-flex flex-column">
        <Inner page={page} setPage={setPage} user={user} onLogout={onLogout} counts={counts}/>
      </aside>
      <Offcanvas show={open} onHide={onClose} placement="start" className="asb-oc" style={{ width: 252 }}>
        <Offcanvas.Header closeButton>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 600, color: '#1a1f2e', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#9a7a2e,#C9A84C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hotel size={12} color="#fff"/>
            </div>
            Admin Panel
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Inner page={page} setPage={nav} user={user} onLogout={onLogout} counts={counts}/>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}