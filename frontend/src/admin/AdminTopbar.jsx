// AdminTopbar.jsx – matches guest Topbar style exactly
const css = `
  .atb{height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 1.4rem;gap:.85rem;position:sticky;top:0;z-index:100;font-family:'DM Sans',sans-serif}
  .atb-menu{width:34px;height:34px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:.9rem;transition:all .18s;flex-shrink:0}
  .atb-menu:hover{border-color:#C9A84C;background:rgba(201,168,76,0.06)}
  .atb-title{font-family:'Cormorant Garamond',serif;font-size:1.18rem;font-weight:600;color:#1a1f2e;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .atb-right{display:flex;align-items:center;gap:.65rem;margin-left:auto}
  .atb-badge{display:inline-flex;align-items:center;gap:.28rem;padding:.2rem .6rem;border-radius:99px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);font-size:.62rem;font-weight:700;color:#9a7a2e;text-transform:uppercase;letter-spacing:.08em}
  .atb-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#9a7a2e,#C9A84C);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:.88rem;font-weight:600;color:#fff;cursor:pointer;flex-shrink:0}
`;

const PAGE_TITLES = {
  dashboard: '📊 Dashboard',
  bookings:  '🛏️ Bookings',
  rooms:     '🏨 Rooms',
  guests:    '👥 Guests',
  payments:  '💳 Payments',
  rewards:   '⭐ Rewards',
  support:   '💬 Support',
  settings:  '⚙️ Settings',
};

export function AdminTopbar({ page, user, onMenuClick }) {
  const ini = (u) => {
    const n = u?.username || u?.email || 'A';
    return n.slice(0, 2).toUpperCase();
  };
  return (
    <div className="atb">
      <style>{css}</style>
      <button className="atb-menu d-flex d-md-none" onClick={onMenuClick}>☰</button>
      <div className="atb-title">{PAGE_TITLES[page] || 'Admin Panel'}</div>
      <div className="atb-right">
        <div className="atb-badge d-none d-sm-inline-flex">⚙ Admin</div>
        <div className="atb-av">{ini(user)}</div>
      </div>
    </div>
  );
}
