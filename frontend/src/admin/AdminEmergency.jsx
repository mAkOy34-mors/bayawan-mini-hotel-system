// admin/AdminEmergency.jsx
import { StaffEmergency } from '../staff/StaffEmergency';
import { useEmergency } from '../context/EmergencyContext';
import { AlertTriangle, Bell, FileText, TrendingUp, Phone } from 'lucide-react';

export function AdminEmergency({ token, user }) {
  const { activeEmergencies } = useEmergency();

  return (
    <div>
      {/* Emergency Hotline Banner - Admin Specific */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #ef4444)',
        borderRadius: 12,
        padding: '1rem',
        marginBottom: '1rem',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={20} />
          <span><strong>Emergency Hotlines:</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => window.location.href = 'tel:911'} 
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600 }}
          >
            🚑 911 - Medical
          </button>
          <button 
            onClick={() => window.location.href = 'tel:117'} 
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600 }}
          >
            👮 117 - Police
          </button>
          <button 
            onClick={() => window.location.href = 'tel:160'} 
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600 }}
          >
            🔥 160 - Fire
          </button>
        </div>
      </div>

      {/* Quick Stats for Admin */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{activeEmergencies.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>Active Emergencies</div>
        </div>
        <div 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => window.location.hash = '#emergency-log'}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>📋</div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>View History</div>
        </div>
        <div 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => window.location.hash = '#emergency-analytics'}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>📊</div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>Analytics</div>
        </div>
      </div>

      {/* Staff Emergency Component (Live Alerts) */}
      <StaffEmergency token={token} user={user} />
    </div>
  );
}