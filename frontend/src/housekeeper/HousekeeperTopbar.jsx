// housekeeper/HousekeeperTopbar.jsx
import { Menu } from 'lucide-react';

export function HousekeeperTopbar({ title, onMenuClick }) {
  return (
    <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="d-md-none" onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderRadius: 7 }}>
          <Menu size={20} />
        </button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.12rem', fontWeight: 600, color: '#1a1f2e' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#8a96a8', background: '#f8f9fb', border: '1px solid #e2e8f0', borderRadius: 7, padding: '0.3rem 0.7rem' }}>
        {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}