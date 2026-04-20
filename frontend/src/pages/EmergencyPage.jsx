// EmergencyPage.jsx – Emergency alert system for guests
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { API_BASE } from '../constants/config';
import { Alert } from '../components/ui/Alert';
import { useAlert } from '../hooks/useAlert';
import {
  AlertTriangle, Bell, Hotel, Phone, Heart, Shield, 
  Flame, Ambulance, Lock, CheckCircle2, Send,
  X, Clock, User, ChevronRight, HelpCircle,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --emergency:    #dc2626;
    --emergency-bg: rgba(220,38,38,0.1);
    --gold:         #C9A84C;
    --gold-dark:    #9a7a2e;
    --gold-bg:      rgba(201,168,76,0.1);
    --bg:           #f4f6f8;
    --surface:      #ffffff;
    --surface2:     #f8f9fb;
    --text:         #1a1f2e;
    --text-sub:     #4a5568;
    --text-muted:   #8a96a8;
    --border:       #e2e8f0;
    --green:        #2d9b6f;
    --green-bg:     rgba(45,155,111,0.1);
    --red:          #dc3545;
    --red-bg:       rgba(220,53,69,0.1);
    --blue:         #3b82f6;
    --blue-bg:      rgba(59,130,246,0.1);
    --orange:       #f59e0b;
    --orange-bg:    rgba(245,158,11,0.1);
  }

  * { box-sizing:border-box; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.3) #f0f0f0; }
  *::-webkit-scrollbar { width:5px; }
  *::-webkit-scrollbar-track { background:#f0f0f0; border-radius:99px; }
  *::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes glow      { 0%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 70%{box-shadow:0 0 0 10px rgba(220,38,38,0)} 100%{box-shadow:0 0 0 0 rgba(220,38,38,0)} }

  .emergency-root {
    min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif;
    color:var(--text); -webkit-font-smoothing:antialiased; padding:2rem 2.25rem;
  }
  @media(max-width:768px){ .emergency-root { padding:1.25rem 1rem; } }

  /* ── Header ── */
  .emergency-hd { margin-bottom:1.6rem; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
  .emergency-title { font-family:'Cormorant Garamond',serif; font-size:1.9rem; font-weight:600; color:var(--text); margin:0 0 .18rem; display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  .emergency-sub   { font-size:.82rem; color:var(--text-muted); }

  /* ── Emergency Banner ── */
  .emergency-banner {
    background:linear-gradient(135deg,#dc2626,#ef4444);
    border-radius:14px; padding:1.25rem 1.5rem; margin-bottom:1.5rem;
    animation:fadeUp .4s both, pulse 2s ease-in-out infinite;
    color:#fff; display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:1rem;
  }
  .emergency-banner-left { display:flex; align-items:center; gap:1rem; }
  .emergency-banner-icon {
    width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.2);
    display:flex; align-items:center; justify-content:center;
  }
  .emergency-banner-text h3 { font-size:1.1rem; font-weight:700; margin:0 0 .2rem; }
  .emergency-banner-text p { font-size:.78rem; opacity:0.9; margin:0; }
  .emergency-banner-btn {
    padding:.65rem 1.5rem; border:none; border-radius:10px;
    font-size:.85rem; font-weight:700; cursor:pointer;
    background:#fff; color:#dc2626; transition:all .22s;
    display:flex; align-items:center; gap:.5rem;
  }
  .emergency-banner-btn:hover { transform:scale(1.02); box-shadow:0 4px 12px rgba(0,0,0,0.15); }

  /* ── Stats Cards ── */
  .emergency-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
  @media(max-width:900px){ .emergency-stats { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:480px){ .emergency-stats { grid-template-columns:1fr 1fr; } }

  .emergency-stat {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    padding:1rem 1.15rem; position:relative; overflow:hidden;
    box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
    transition:transform .2s,box-shadow .2s;
  }
  .emergency-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.09); }
  .emergency-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .emergency-stat.red::before    { background:linear-gradient(to right,#dc2626,#f87171); }
  .emergency-stat.blue::before   { background:linear-gradient(to right,#2563eb,#60a5fa); }
  .emergency-stat.green::before  { background:linear-gradient(to right,#059669,#34d399); }
  .emergency-stat.gold::before   { background:linear-gradient(to right,#9a7a2e,#C9A84C); }

  .emergency-stat-icon {
    width:34px; height:34px; border-radius:9px; margin-bottom:.55rem;
    display:flex; align-items:center; justify-content:center;
  }
  .emergency-stat.red   .emergency-stat-icon { background:rgba(220,38,38,0.12); color:#dc2626; }
  .emergency-stat.blue  .emergency-stat-icon { background:rgba(59,130,246,0.12); color:#3b82f6; }
  .emergency-stat.green .emergency-stat-icon { background:rgba(45,155,111,0.12); color:#2d9b6f; }
  .emergency-stat.gold  .emergency-stat-icon { background:rgba(201,168,76,0.12); color:#9a7a2e; }

  .emergency-stat-label { font-size:.67rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:.3rem; }
  .emergency-stat-val   { font-family:'Cormorant Garamond',serif; font-size:1.85rem; font-weight:600; color:var(--text); line-height:1; }

  /* ── Main Grid ── */
  .emergency-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
  @media(max-width:900px){ .emergency-grid { grid-template-columns:1fr; } }

  /* ── Panel ── */
  .emergency-panel {
    background:var(--surface); border:1px solid var(--border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
  }
  .emergency-panel-hd {
    display:flex; align-items:center; justify-content:space-between;
    padding:.95rem 1.25rem; border-bottom:1px solid var(--border); background:var(--surface2);
  }
  .emergency-panel-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:var(--text); display:flex; align-items:center; gap:.5rem; }
  .emergency-panel-body  { padding:1.25rem; }

  /* ── Emergency Types Grid ── */
  .emergency-types { display:grid; grid-template-columns:repeat(2,1fr); gap:.85rem; margin-bottom:1.25rem; }
  @media(max-width:480px){ .emergency-types { grid-template-columns:1fr; } }

  .emergency-type-card {
    border:2px solid var(--border); border-radius:12px; padding:1rem;
    cursor:pointer; transition:all .18s; background:#fff;
    display:flex; align-items:center; gap:.85rem;
  }
  .emergency-type-card:hover { border-color:rgba(220,38,38,0.3); background:rgba(220,38,38,0.03); transform:translateY(-2px); }
  .emergency-type-card.selected { border-color:#dc2626; background:rgba(220,38,38,0.08); }
  .emergency-type-icon {
    width:48px; height:48px; border-radius:12px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    background:#f1f5f9; color:var(--text-muted);
  }
  .emergency-type-card.selected .emergency-type-icon { background:rgba(220,38,38,0.12); color:#dc2626; }
  .emergency-type-name { font-weight:700; font-size:.9rem; color:var(--text); margin-bottom:.12rem; }
  .emergency-type-desc { font-size:.7rem; color:var(--text-muted); }

  /* ── Alert Button ── */
  .emergency-alert-btn {
    width:100%; padding:1.25rem; border:none; border-radius:12px;
    font-size:1.1rem; font-weight:800; cursor:pointer;
    background:linear-gradient(135deg,#dc2626,#ef4444); color:#fff;
    transition:all .22s; display:flex; align-items:center;
    justify-content:center; gap:.75rem; margin-bottom:1rem;
    animation:glow 2s infinite;
  }
  .emergency-alert-btn:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 8px 25px rgba(220,38,38,0.4); }
  .emergency-alert-btn:disabled { opacity:.6; cursor:not-allowed; }

  /* ─── Quick Contacts ─── */
  .emergency-contacts { display:flex; flex-direction:column; gap:.5rem; }
  .emergency-contact {
    display:flex; align-items:center; gap:.75rem; padding:.7rem .9rem;
    border-radius:10px; background:var(--surface2); border:1px solid var(--border);
    transition:all .18s; cursor:pointer;
  }
  .emergency-contact:hover { border-color:var(--gold); background:var(--gold-bg); }
  .emergency-contact-icon {
    width:36px; height:36px; border-radius:9px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    background:#fff; color:var(--text-muted);
  }
  .emergency-contact-name { font-weight:700; font-size:.84rem; color:var(--text); }
  .emergency-contact-number { font-size:.72rem; color:var(--text-muted); font-family:monospace; }

  /* ── Recent Alerts ── */
  .emergency-alert-item {
    display:flex; align-items:center; gap:.85rem;
    padding:.85rem 0; border-bottom:1px solid #f8f9fb;
  }
  .emergency-alert-item:last-child { border-bottom:none; }
  .emergency-alert-badge {
    width:40px; height:40px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:rgba(220,38,38,0.1); color:#dc2626;
  }
  .emergency-alert-info { flex:1; }
  .emergency-alert-type { font-weight:700; font-size:.84rem; color:var(--text); margin-bottom:.2rem; }
  .emergency-alert-meta { font-size:.7rem; color:var(--text-muted); display:flex; gap:.6rem; align-items:center; }
  .emergency-alert-time { display:flex; align-items:center; gap:.25rem; }
  .emergency-status-pill {
    padding:.12rem .5rem; border-radius:99px; font-size:.6rem; font-weight:700;
    background:var(--orange-bg); color:var(--orange);
  }
  .emergency-status-pill.resolved { background:var(--green-bg); color:var(--green); }

  /* ── Empty State ── */
  .emergency-empty { text-align:center; padding:2rem; color:var(--text-muted); }
  .emergency-empty-icon { display:flex; justify-content:center; margin-bottom:.75rem; opacity:.3; }

  /* ── Confirmation Modal ── */
  .emergency-modal .modal-content { border-radius:18px; border:1px solid rgba(220,38,38,0.3); overflow:hidden; }
  .emergency-modal .modal-header { background:linear-gradient(135deg,#dc2626,#ef4444); color:#fff; border-bottom:none; padding:1.25rem 1.5rem; }
  .emergency-modal .modal-header .btn-close { filter:brightness(0) invert(1); }
  .emergency-modal .modal-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; display:flex; align-items:center; gap:.5rem; }
  .emergency-modal .modal-body { padding:1.5rem; }
  .emergency-modal .modal-footer { border-top:1px solid var(--border); padding:1rem 1.5rem; }

  .emergency-confirm-details { background:var(--surface2); border-radius:10px; padding:1rem; margin:1rem 0; }
  .emergency-confirm-row { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid var(--border); }
  .emergency-confirm-row:last-child { border-bottom:none; }
  .emergency-confirm-label { font-size:.72rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
  .emergency-confirm-value { font-size:.85rem; color:var(--text); font-weight:600; }

  .emergency-warning {
    background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.2);
    border-radius:10px; padding:.85rem 1rem; margin-bottom:1rem;
    display:flex; align-items:center; gap:.6rem; font-size:.78rem; color:#dc2626; line-height:1.55;
  }

  /* ── Spinner ── */
  .emergency-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
`;

const EMERGENCY_TYPES = [
  { id: 'medical', name: 'Medical Emergency', icon: '❤️', color: '#dc2626', desc: 'Urgent medical assistance needed' },
  { id: 'fire', name: 'Fire', icon: '🔥', color: '#f97316', desc: 'Fire or smoke detected' },
  { id: 'security', name: 'Security Issue', icon: '🛡️', color: '#3b82f6', desc: 'Safety or security concern' },
  { id: 'other', name: 'Other', icon: '⚠️', color: '#f59e0b', desc: 'General emergency assistance' },
];

export function EmergencyPage({ user, token, roomNumber }) {
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [displayRoom, setDisplayRoom] = useState('Loading...');
  const { alert, showAlert } = useAlert();

  const guestName = user?.fullName || user?.username || user?.email?.split('@')[0] || 'Guest';

  // Load recent alerts
  const loadRecentAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/emergency/my-alerts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setRecentAlerts(data.alerts || []);
        
        // Update room from most recent alert
        if (data.alerts && data.alerts.length > 0 && data.alerts[0].roomNumber) {
          const roomFromApi = data.alerts[0].roomNumber;
          if (roomFromApi && roomFromApi !== 'Unknown' && roomFromApi !== 'Not assigned') {
            setDisplayRoom(roomFromApi);
            console.log('Room set from API:', roomFromApi);
          }
        } else if (roomNumber && roomNumber !== 'Not assigned') {
          setDisplayRoom(roomNumber);
        } else if (user?.roomNumber && user?.roomNumber !== 'Not assigned') {
          setDisplayRoom(user.roomNumber);
        } else {
          setDisplayRoom('Not assigned');
        }
        
        setStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0,
          resolved: data.stats?.resolved || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  // Send emergency alert
  const sendEmergencyAlert = async () => {
    setLoading(true);
    try {
      const requestBody = {
        emergencyType: selectedType?.id,
        emergencyTypeName: selectedType?.name,
        roomNumber: displayRoom,
        guestName: guestName,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Sending alert:', requestBody);
      
      const response = await fetch(`${API_BASE}/emergency/alert/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Alert response:', data);
        
        // Update room from response
        if (data.room_number && data.room_number !== 'Unknown') {
          setDisplayRoom(data.room_number);
        }
        
        setShowConfirm(false);
        setSelectedType(null);
        showAlert('Emergency alert sent! Staff has been notified.', 'success');
        loadRecentAlerts();
      } else {
        const error = await response.json();
        showAlert(error.message || 'Failed to send alert', 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Quick contacts
  const contacts = [
    { name: 'Front Desk', number: '+63 32 888 8888', icon: '📞' },
    { name: 'Security', number: '+63 32 888 8899', icon: '🛡️' },
    { name: 'Medical Officer', number: '+63 32 888 8877', icon: '❤️' },
    { name: 'Housekeeping', number: '+63 32 888 8866', icon: '🏨' },
  ];

  // Load alerts on mount
  useEffect(() => {
    if (token) {
      loadRecentAlerts();
    }
  }, [token]);

  return (
    <div className="emergency-root">
      <style>{css}</style>
      <Alert alert={alert} />

      {/* Header */}
      <div className="emergency-hd">
        <div className="emergency-title">
          <span style={{ fontSize: '2rem' }}>🚨</span>
          Emergency Assistance
        </div>
        <div className="emergency-sub">For immediate help, use the emergency button below</div>
      </div>

      {/* Emergency Banner */}
      <div className="emergency-banner">
        <div className="emergency-banner-left">
          <div className="emergency-banner-icon">
            <Bell size={24} />
          </div>
          <div className="emergency-banner-text">
            <h3>Emergency Alert System</h3>
            <p>Staff will be notified immediately. Use only for genuine emergencies.</p>
          </div>
        </div>
        <button className="emergency-banner-btn" onClick={() => window.location.href = 'tel:+63328888888'}>
          <Phone size={16} /> Call Front Desk
        </button>
      </div>

      {/* Stats */}
      <div className="emergency-stats">
        {[
          { label: 'My Alerts', value: stats.total, icon: '🚨', color: 'red' },
          { label: 'Active', value: stats.active, icon: '🔔', color: 'blue' },
          { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'green' },
          { label: 'Room', value: displayRoom, icon: '🏨', color: 'gold' },
        ].map((s, i) => (
          <div key={i} className={`emergency-stat ${s.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="emergency-stat-icon"><span style={{ fontSize: '1.2rem' }}>{s.icon}</span></div>
            <div className="emergency-stat-label">{s.label}</div>
            <div className="emergency-stat-val">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="emergency-grid">
        {/* Left Column - Send Alert */}
        <div className="emergency-panel" style={{ animationDelay: '.05s' }}>
          <div className="emergency-panel-hd">
            <div className="emergency-panel-title">
              <span style={{ color: '#dc2626' }}>🚨</span>
              Send Emergency Alert
            </div>
          </div>
          <div className="emergency-panel-body">
            <div className="emergency-types">
              {EMERGENCY_TYPES.map((type) => {
                return (
                  <div
                    key={type.id}
                    className={`emergency-type-card ${selectedType?.id === type.id ? 'selected' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="emergency-type-icon">
                      <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                    </div>
                    <div>
                      <div className="emergency-type-name">{type.name}</div>
                      <div className="emergency-type-desc">{type.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="emergency-alert-btn"
              disabled={!selectedType}
              onClick={() => setShowConfirm(true)}
            >
              <span>🚨</span>
              SEND EMERGENCY ALERT
              <ChevronRight size={16} />
            </button>

            <div className="emergency-warning">
              <span>⚠️</span>
              <span>Only use this button for real emergencies. False alarms may result in penalties.</span>
            </div>
          </div>
        </div>

        {/* Right Column - Contacts & Recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Contacts */}
          <div className="emergency-panel" style={{ animationDelay: '.08s' }}>
            <div className="emergency-panel-hd">
              <div className="emergency-panel-title">
                <Phone size={18} />
                Quick Contacts
              </div>
            </div>
            <div className="emergency-panel-body">
              <div className="emergency-contacts">
                {contacts.map((contact, i) => {
                  return (
                    <div
                      key={i}
                      className="emergency-contact"
                      onClick={() => window.location.href = `tel:${contact.number.replace(/\D/g, '')}`}
                    >
                      <div className="emergency-contact-icon">
                        <span style={{ fontSize: '1.1rem' }}>{contact.icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="emergency-contact-name">{contact.name}</div>
                        <div className="emergency-contact-number">{contact.number}</div>
                      </div>
                      <Phone size={14} color="var(--text-muted)" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="emergency-panel" style={{ animationDelay: '.11s' }}>
            <div className="emergency-panel-hd">
              <div className="emergency-panel-title">
                <Bell size={18} />
                Recent Alerts
              </div>
            </div>
            <div className="emergency-panel-body">
              {recentAlerts.length === 0 ? (
                <div className="emergency-empty">
                  <div className="emergency-empty-icon">
                    <Bell size={44} strokeWidth={1} />
                  </div>
                  <div style={{ fontSize: '.82rem' }}>No recent alerts</div>
                </div>
              ) : (
                recentAlerts.slice(0, 5).map((alert, i) => (
                  <div key={i} className="emergency-alert-item">
                    <div className="emergency-alert-badge">
                      <span>🚨</span>
                    </div>
                    <div className="emergency-alert-info">
                      <div className="emergency-alert-type">{alert.emergencyTypeName}</div>
                      <div className="emergency-alert-meta">
                        <span className="emergency-alert-time">
                          <Clock size={10} /> {formatTime(alert.createdAt)}
                        </span>
                        <span className={`emergency-status-pill ${alert.status === 'RESOLVED' ? 'resolved' : ''}`}>
                          {alert.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered className="emergency-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <span>🚨</span> Confirm Emergency Alert
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="emergency-warning" style={{ marginBottom: '1rem' }}>
            <span>⚠️</span>
            <strong>This will immediately notify hotel staff.</strong>
          </div>

          <div className="emergency-confirm-details">
            <div className="emergency-confirm-row">
              <span className="emergency-confirm-label">Guest Name</span>
              <span className="emergency-confirm-value">{guestName}</span>
            </div>
            <div className="emergency-confirm-row">
              <span className="emergency-confirm-label">Room Number</span>
              <span className="emergency-confirm-value">{displayRoom}</span>
            </div>
            <div className="emergency-confirm-row">
              <span className="emergency-confirm-label">Emergency Type</span>
              <span className="emergency-confirm-value" style={{ color: selectedType?.color }}>
                {selectedType?.name}
              </span>
            </div>
            <div className="emergency-confirm-row">
              <span className="emergency-confirm-label">Time</span>
              <span className="emergency-confirm-value">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Staff will be dispatched to your room immediately. Stay calm and await assistance.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button className="emergency-banner-btn" style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0' }} onClick={() => setShowConfirm(false)}>
            Cancel
          </button>
          <button className="emergency-alert-btn" style={{ margin: 0, padding: '.65rem 1.5rem', width: 'auto' }} onClick={sendEmergencyAlert} disabled={loading}>
            {loading ? <><div className="emergency-spinner" /> Sending...</> : <>Confirm & Send Alert</>}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}