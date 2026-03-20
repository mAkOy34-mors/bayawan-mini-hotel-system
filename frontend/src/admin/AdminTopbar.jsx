// AdminTopbar.jsx
import {
  LayoutDashboard, BedDouble, Hotel, Users, CreditCard,
  Star, MessageCircle, Settings, Menu, ShieldCheck,
} from 'lucide-react';

const css = `
  .atb{height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 1.4rem;gap:.85rem;position:sticky;top:0;z-index:100;font-family:'DM Sans',sans-serif}
  .atb-menu{width:34px;height:34px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;flex-shrink:0;color:#4a5568}
  .atb-menu:hover{border-color:#C9A84C;background:rgba(201,168,76,0.06);color:#9a7a2e}
  .atb-title{font-family:'Cormorant Garamond',serif;font-size:1.18rem;font-weight:600;color:#1a1f2e;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:.5rem}
  .atb-right{display:flex;align-items:center;gap:.65rem;margin-left:auto}
  .atb-badge{display:inline-flex;align-items:center;gap:.28rem;padding:.2rem .6rem;border-radius:99px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);font-size:.62rem;font-weight:700;color:#9a7a2e;text-transform:uppercase;letter-spacing:.08em}
  .atb-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:.88rem;font-weight:600;color:#fff;cursor:pointer;flex-shrink:0}
`;

const PAGE_CONFIG = {
  dashboard:       { label:'Dashboard',       Icon: LayoutDashboard },
  bookings:        { label:'Bookings',         Icon: BedDouble },
  'change-requests':{ label:'Change Requests', Icon: BedDouble },
  rooms:           { label:'Rooms',            Icon: Hotel },
  guests:          { label:'Guests',           Icon: Users },
  payments:        { label:'Payments',         Icon: CreditCard },
  rewards:         { label:'Rewards',          Icon: Star },
  support:         { label:'Support',          Icon: MessageCircle },
  settings:        { label:'Settings',         Icon: Settings },
};

export function AdminTopbar({ page, user, onMenuClick }) {
  const ini = (u) => (u?.username||u?.email||'A').slice(0,2).toUpperCase();
  const cfg = PAGE_CONFIG[page] || { label:'Admin Panel', Icon: LayoutDashboard };
  return (
    <div className="atb">
      <style>{css}</style>
      <button className="atb-menu d-flex d-md-none" onClick={onMenuClick}><Menu size={18}/></button>
      <div className="atb-title">
        <cfg.Icon size={17} style={{ color:'var(--gold-dark)', flexShrink:0 }}/>
        {cfg.label}
      </div>
      <div className="atb-right">
        <div className="atb-badge d-none d-sm-inline-flex"><ShieldCheck size={10}/>Admin</div>
        <div className="atb-av">{ini(user)}</div>
      </div>
    </div>
  );
}