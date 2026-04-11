// staff/StaffEmergency.jsx
import { useEmergency } from '../context/EmergencyContext';
import { Phone, CheckCircle2, AlertTriangle } from 'lucide-react';

export function StaffEmergency() {
  const { activeEmergencies, soundOn, enableSound, disableSound } = useEmergency();

  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'medical': return '❤️';
      case 'fire': return '🔥';
      case 'security': return '🛡️';
      default: return '🚨';
    }
  };

  const getEmergencyColor = (type) => {
    switch (type) {
      case 'medical': return '#dc2626';
      case 'fire': return '#f97316';
      case 'security': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Emergency Response</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Respond to active emergencies</p>
      </div>

      {/* Sound Control */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {soundOn ? <span>🔊</span> : <span>🔇</span>}
          <span style={{ fontWeight: 600 }}>{soundOn ? 'Sound is ON' : 'Sound is OFF'}</span>
        </div>
        {soundOn ? (
          <button onClick={disableSound} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Mute Sound</button>
        ) : (
          <button onClick={enableSound} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Enable Sound</button>
        )}
      </div>

      {/* Active Emergencies */}
      {activeEmergencies.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
          <CheckCircle2 size={48} strokeWidth={1} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div>No active emergencies</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>You're all caught up!</div>
        </div>
      ) : (
        activeEmergencies.map(emergency => (
          <div key={emergency.id} style={{ background: '#fff', border: `2px solid ${getEmergencyColor(emergency.emergencyType)}`, borderRadius: 14, marginBottom: '1rem', overflow: 'hidden', animation: 'pulse 1s infinite' }}>
            <div style={{ background: `linear-gradient(135deg, ${getEmergencyColor(emergency.emergencyType)}, ${getEmergencyColor(emergency.emergencyType)}cc)`, padding: '0.75rem 1rem', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} />
                <span style={{ fontWeight: 700 }}>EMERGENCY - {emergency.emergencyTypeName}</span>
              </div>
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{emergency.guestName}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getEmergencyColor(emergency.emergencyType), marginBottom: '0.5rem' }}>Room {emergency.roomNumber}</div>
              <div style={{ fontSize: '0.8rem', color: '#8a96a8', marginBottom: '0.75rem' }}>Received at {new Date(emergency.createdAt).toLocaleTimeString()}</div>
              <button onClick={() => window.location.href = `tel:${emergency.guestPhone || '+63328888888'}`} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={14} /> Call Room
              </button>
            </div>
          </div>
        ))
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}