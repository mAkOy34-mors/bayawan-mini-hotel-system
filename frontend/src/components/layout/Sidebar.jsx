// Sidebar.jsx – Light card UI with Lucide icons
import { Offcanvas } from 'react-bootstrap';
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

  .sb-offcanvas .offcanvas-body { padding: 0; overflow: hidden; }
  .sb-offcanvas.offcanvas { background: #ffffff !important; }
  .sb-offcanvas .offcanvas-header { padding: 1rem 1.2rem; border-bottom: 1px solid #e2e8f0; }
`;

const NAV_MAIN = [
  { key: 'dashboard',   label: 'Dashboard',    Icon: LayoutDashboard },
  { key: 'bookings',    label: 'Book a Room',  Icon: BedDouble       },
  { key: 'mybookings',  label: 'My Bookings',  Icon: ClipboardList   },
  { key: 'rewards',     label: 'Rewards',      Icon: Star            },
  { key: 'payments',    label: 'Payments',     Icon: CreditCard      },
];
const NAV_ACCOUNT = [
  { key: 'profile',  label: 'My Profile', Icon: User          },
  { key: 'settings', label: 'Settings',   Icon: Settings      },
  { key: 'support',  label: 'Support',    Icon: MessageCircle },
];

function initials(user) {
  const n = user?.fullName || user?.username || user?.email || '';
  const p = n.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : n.slice(0,2).toUpperCase() || 'G';
}
function uname(user) {
  return user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';
}

function SidebarContent({ page, setPage, user, onLogout }) {
  return (
    <>
      <style>{css}</style>
      <div className="sb-logo">
        <div className="sb-logo-row">
          <div className="sb-logo-mark">
            <Hotel size={16} />
          </div>
          <div>
            <div className="sb-logo-name">Cebu Grand Hotel</div>
            <div className="sb-logo-sub">Guest Portal</div>
          </div>
        </div>
      </div>

      <div className="sb-user">
        <div className="sb-av">{initials(user)}</div>
        <div>
          <div className="sb-uname">{uname(user)}</div>
          <div className="sb-urole">Guest</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-sec">Navigation</div>
        {NAV_MAIN.map(({ key, label, Icon }) => (
          <button key={key} className={`sb-btn${page === key ? ' active' : ''}`} onClick={() => setPage(key)}>
            <span className="sb-icon"><Icon size={15} /></span>
            {label}
          </button>
        ))}

        <div className="sb-sec" style={{ marginTop: '.65rem' }}>Account</div>
        {NAV_ACCOUNT.map(({ key, label, Icon }) => (
          <button key={key} className={`sb-btn${page === key ? ' active' : ''}`} onClick={() => setPage(key)}>
            <span className="sb-icon"><Icon size={15} /></span>
            {label}
          </button>
        ))}

        <button className="sb-out" onClick={onLogout}>
          <span className="sb-out-icon"><LogOut size={15} /></span>
          Sign Out
        </button>
      </nav>

      <div className="sb-foot">© 2026 Cebu Grand Hotel</div>
    </>
  );
}

export function Sidebar({ page, setPage, user, onLogout, open, onClose }) {
  const nav = (key) => { setPage(key); onClose?.(); };
  return (
    <>
      <aside className="sb-wrap d-none d-md-flex flex-column">
        <SidebarContent page={page} setPage={setPage} user={user} onLogout={onLogout} />
      </aside>
      <Offcanvas show={open} onHide={onClose} placement="start" className="sb-offcanvas" style={{ width: 252 }}>
        <Offcanvas.Header closeButton>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.05rem', fontWeight:600, color:'#1a1f2e', display:'flex', alignItems:'center', gap:'.45rem' }}>
            <div style={{ width:24, height:24, borderRadius:7, background:'linear-gradient(135deg,#9a7a2e,#C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <Hotel size={13} />
            </div>
            Cebu Grand Hotel
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarContent page={page} setPage={nav} user={user} onLogout={onLogout} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}