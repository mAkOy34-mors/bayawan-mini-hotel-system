// receptionist/ReceptionistEmergency.jsx
import { StaffEmergency } from '../staff/StaffEmergency';
import { useEmergency } from '../context/EmergencyContext';
import { AlertTriangle, Bell, FileText, TrendingUp, Phone, Heart, Shield, Flame, Activity, Clock, Loader2 } from 'lucide-react';

export function ReceptionistEmergency({ token, user }) {
  // Safely get emergency context with fallback
  let emergencyContext;
  try {
    emergencyContext = useEmergency();
  } catch (error) {
    console.error('EmergencyContext error:', error);
    emergencyContext = null;
  }
  
  // If context is not available, show loading
  if (!emergencyContext) {
    return (
      <div>
        {/* Emergency Hotline Banner */}
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
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Heart size={14} /> 911 - Medical
            </button>
            <button 
              onClick={() => window.location.href = 'tel:117'} 
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Shield size={14} /> 117 - Police
            </button>
            <button 
              onClick={() => window.location.href = 'tel:160'} 
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Flame size={14} /> 160 - Fire
            </button>
          </div>
        </div>

        {/* Loading State - Show spinner with hotlines */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
          <Loader2 size={48} style={{ marginBottom: '1rem', opacity: 0.5, animation: 'spin 1s linear infinite' }} />
          <h3>Loading Emergency System...</h3>
          <p style={{ color: '#8a96a8' }}>Please wait while we connect to the emergency service.</p>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  const { activeEmergencies, isLoading } = emergencyContext;
  
  // Show loading state if still loading
  if (isLoading) {
    return (
      <div>
        {/* Emergency Hotline Banner */}
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
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Heart size={14} /> 911 - Medical
            </button>
            <button 
              onClick={() => window.location.href = 'tel:117'} 
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Shield size={14} /> 117 - Police
            </button>
            <button 
              onClick={() => window.location.href = 'tel:160'} 
              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Flame size={14} /> 160 - Fire
            </button>
          </div>
        </div>

        {/* Loading State */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
          <Loader2 size={48} style={{ marginBottom: '1rem', opacity: 0.5, animation: 'spin 1s linear infinite' }} />
          <h3>Loading Emergency Data...</h3>
          <p style={{ color: '#8a96a8' }}>Fetching active emergencies from server.</p>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  const activeCount = activeEmergencies?.length || 0;

  return (
    <div>
      {/* Emergency Hotline Banner - Receptionist Specific */}
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
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Heart size={14} /> 911 - Medical
          </button>
          <button 
            onClick={() => window.location.href = 'tel:117'} 
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Shield size={14} /> 117 - Police
          </button>
          <button 
            onClick={() => window.location.href = 'tel:160'} 
            style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Flame size={14} /> 160 - Fire
          </button>
        </div>
      </div>

      {/* Quick Stats for Receptionist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={20} /> {activeCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>Active Emergencies</div>
        </div>
        <div 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => window.location.hash = '#emergency-log'}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <FileText size={20} />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>View History</div>
        </div>
        <div 
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => window.location.hash = '#emergency-analytics'}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <TrendingUp size={20} />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#8a96a8' }}>Analytics</div>
        </div>
      </div>

      {/* Response Time Indicator - Receptionist Specific */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} color="#3b82f6" />
          <span style={{ fontWeight: 600 }}>Average Response Time:</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>2.5 minutes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#f59e0b" />
          <span style={{ fontWeight: 600 }}>Today's Alerts:</span>
          <span style={{ fontWeight: 700 }}>{activeCount}</span>
        </div>
      </div>

      {/* Staff Emergency Component (Live Alerts) */}
      <StaffEmergency token={token} user={user} />
    </div>
  );
}