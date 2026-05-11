// src/context/EmergencyContext.jsx - Fixed version with proper realtime updates

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { API_BASE } from '../constants/config';
import {
  Phone, CheckCircle2, Volume2, VolumeX, AlertTriangle,
  Heart, Flame, Shield, Bell, X, PhoneCall, Headphones,
  Activity, Zap, Music, CircleAlert, Loader2, ClipboardCheck, Wrench
} from 'lucide-react';

const EmergencyContext = createContext();

let audioContext = null;
let soundEnabled = false;
let currentOscillator = null;
let currentGain = null;
let soundInterval = null;

// ─── Audio helpers ────────────────────────────────────────────────────────────

const initAudioContext = () => {
  if (!audioContext && window.AudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

const stopEmergencySound = () => {
  if (soundInterval) { clearInterval(soundInterval); soundInterval = null; }
  if (currentOscillator) {
    try { currentOscillator.stop(); } catch (e) {}
    currentOscillator = null;
  }
  currentGain = null;
};

const playEmergencySoundLoop = async () => {
  if (!soundEnabled) return;
  try {
    const context = initAudioContext();
    if (!context) return;
    if (context.state === 'suspended') await context.resume();

    stopEmergencySound();

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.3;
    oscillator.start();
    currentOscillator = oscillator;
    currentGain = gainNode;

    let isHigh = true;
    soundInterval = setInterval(() => {
      if (!soundEnabled) { clearInterval(soundInterval); soundInterval = null; return; }
      if (currentOscillator) {
        try { currentOscillator.frequency.value = isHigh ? 880 : 660; isHigh = !isHigh; } catch (e) {}
      }
    }, 400);
  } catch (e) {
    console.log('Audio error:', e);
  }
};

const showBrowserNotification = (alert) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('EMERGENCY ALERT!', {
      body: `${alert.guestName} in Room ${alert.roomNumber} - ${alert.emergencyTypeName}`,
      icon: '/emergency-icon.png',
      tag: `emergency-${alert.id}`,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 200],
    });
    notification.onclick = () => { window.focus(); notification.close(); };
    setTimeout(() => notification.close(), 30000);
  }
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    color: '#dc2626',
    actionLabel: 'Accept',
    actionIcon: <ClipboardCheck size={18} />,
    actionColor: '#f59e0b',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: '#f59e0b',
    actionLabel: 'Mark In Progress',
    actionIcon: <Wrench size={18} />,
    actionColor: '#3b82f6',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#3b82f6',
    actionLabel: 'Resolve',
    actionIcon: <CheckCircle2 size={18} />,
    actionColor: '#2d9b6f',
  },
  RESOLVED: {
    label: 'Resolved',
    color: '#6b7280',
    actionLabel: null,
    actionIcon: null,
    actionColor: null,
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function EmergencyProvider({ children, token }) {
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const modalClosedByUserRef = useRef(false);

  // ── FIX: Keep refs in sync so WebSocket handlers always read fresh state ──
  // This prevents stale closure bugs where ws.onmessage captures old values.
  const currentEmergencyRef = useRef(null);
  const showEmergencyModalRef = useRef(false);
  const activeEmergenciesRef = useRef([]);

  useEffect(() => { currentEmergencyRef.current = currentEmergency; }, [currentEmergency]);
  useEffect(() => { showEmergencyModalRef.current = showEmergencyModal; }, [showEmergencyModal]);
  useEffect(() => { activeEmergenciesRef.current = activeEmergencies; }, [activeEmergencies]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // ── Load active emergencies ──────────────────────────────────────────────
  const loadActiveEmergencies = useCallback(async () => {
    if (!token) { setIsReady(true); return; }
    try {
      const response = await fetch(`${API_BASE}/emergency/all/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Include ACTIVE, ACCEPTED, and IN_PROGRESS — not just ACTIVE
        const emergencies = (data.activeEmergencies || []).map(e => ({
          id: e.id,
          emergencyType: e.emergencyType,
          emergencyTypeName: e.emergencyTypeName,
          guestName: e.guestName,
          roomNumber: e.roomNumber || 'Not assigned',
          guestPhone: e.guestPhone,
          createdAt: e.createdAt,
          status: e.status || 'ACTIVE',
        }));
        setActiveEmergencies(emergencies);

        if (emergencies.length > 0 && !showEmergencyModalRef.current && !modalClosedByUserRef.current) {
          setCurrentEmergency(emergencies[0]);
          setShowEmergencyModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to load emergencies:', err);
    } finally {
      setIsReady(true);
    }
  }, [token]); // ← removed showEmergencyModal from deps; use ref instead

  // ── WebSocket ────────────────────────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/emergency/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // ── New emergency ──────────────────────────────────────────────────
        if (data.type === 'NEW_EMERGENCY') {
          const newEmergency = {
            id: data.id,
            emergencyType: data.emergencyType,
            emergencyTypeName: data.emergencyTypeName,
            guestName: data.guestName,
            roomNumber: data.roomNumber,
            guestPhone: data.guestPhone,
            createdAt: data.createdAt,
            status: 'ACTIVE',
          };

          setActiveEmergencies(prev => [newEmergency, ...prev]);

          // Use ref so we read fresh modal state — not a stale closure value
          if (!showEmergencyModalRef.current && !modalClosedByUserRef.current) {
            setCurrentEmergency(newEmergency);
            setShowEmergencyModal(true);
          }

          showBrowserNotification(newEmergency);

        // ── Status updated (broadcast from any client or REST endpoint) ───
        // FIX: accept both casing variants so REST + WS paths both work
        } else if (
          data.type === 'EMERGENCY_STATUS_UPDATED' ||
          data.type === 'emergency_status_updated' ||
          data.type === 'EMERGENCY_BROADCAST'
        ) {
          // Normalise: REST sends emergency_id, WS broadcast also uses emergency_id
          const emergencyId = data.emergency_id ?? data.emergencyId;
          const newStatus   = data.status;

          console.log(`Emergency ${emergencyId} status updated to ${newStatus}`);

          setActiveEmergencies(prev => {
            const updated = prev.map(e =>
              e.id === emergencyId ? { ...e, status: newStatus } : e
            );
            // Remove from active list only when truly resolved
            if (newStatus === 'RESOLVED') {
              return updated.filter(e => e.id !== emergencyId);
            }
            return updated;
          });

          // Use ref to read current emergency without stale closure
          const current = currentEmergencyRef.current;
          if (current?.id === emergencyId) {
            if (newStatus === 'RESOLVED') {
              console.log('Current emergency resolved — closing modal on this page');
              setShowEmergencyModal(false);
              setCurrentEmergency(null);
              stopEmergencySound();
              modalClosedByUserRef.current = false;
            } else {
              // Real-time status pipeline update visible to everyone
              setCurrentEmergency(prev => prev ? { ...prev, status: newStatus } : prev);
            }
          }

        // ── Explicit resolved event (sent by legacy emergency_resolved handler) ──
        // FIX: normalise emergency_id vs emergencyId field name
        } else if (data.type === 'EMERGENCY_RESOLVED') {
          const emergencyId = data.emergency_id ?? data.emergencyId;
          console.log(`Emergency ${emergencyId} resolved`);

          setActiveEmergencies(prev => prev.filter(e => e.id !== emergencyId));

          const current = currentEmergencyRef.current;
          if (current?.id === emergencyId) {
            setShowEmergencyModal(false);
            setCurrentEmergency(null);
            stopEmergencySound();
            modalClosedByUserRef.current = false;
          }

        // ── Active emergencies snapshot on connect ─────────────────────────
        } else if (data.type === 'ACTIVE_EMERGENCIES') {
          const emergencies = (data.emergencies || []).map(e => ({
            id: e.id,
            emergencyType: e.emergencyType,
            emergencyTypeName: e.emergencyTypeName,
            guestName: e.guestName,
            roomNumber: e.roomNumber || 'Not assigned',
            guestPhone: e.guestPhone || '',
            createdAt: e.createdAt,
            status: e.status || 'ACTIVE',
          }));
          setActiveEmergencies(emergencies);

          if (emergencies.length > 0 && !showEmergencyModalRef.current && !modalClosedByUserRef.current) {
            setCurrentEmergency(emergencies[0]);
            setShowEmergencyModal(true);
          }
        }

      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 5000);
    };
  }, [token]); // ← removed showEmergencyModal from deps; use ref instead

  // ── Advance status ────────────────────────────────────────────────────────
  const advanceEmergencyStatus = async (emergencyId) => {
    setAdvancing(true);
    try {
      const response = await fetch(`${API_BASE}/emergency/${emergencyId}/advance/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newStatus = data.status || data.new_status;

        console.log(`Successfully advanced emergency ${emergencyId} to ${newStatus}`);

        // Optimistic local update — WebSocket broadcast will sync all other pages
        if (newStatus === 'RESOLVED') {
          setActiveEmergencies(prev => prev.filter(e => e.id !== emergencyId));
          setShowEmergencyModal(false);
          setCurrentEmergency(null);
          stopEmergencySound();
          modalClosedByUserRef.current = false;
        } else {
          setActiveEmergencies(prev =>
            prev.map(e => e.id === emergencyId ? { ...e, status: newStatus } : e)
          );
          setCurrentEmergency(prev =>
            prev?.id === emergencyId ? { ...prev, status: newStatus } : prev
          );
        }
      } else {
        const err = await response.json();
        console.error('Failed to advance status:', err);
        alert(err.error || 'Failed to update emergency status');
      }
    } catch (err) {
      console.error('Failed to advance emergency status:', err);
      alert('Network error. Please try again.');
    } finally {
      setAdvancing(false);
    }
  };

  // ── Sound helpers ─────────────────────────────────────────────────────────
  const enableSound = async () => {
    try {
      const context = initAudioContext();
      if (context) {
        if (context.state === 'suspended') await context.resume();
        soundEnabled = true;
        setSoundOn(true);
        playEmergencySoundLoop();
        setTimeout(() => {
          if (!showEmergencyModalRef.current) stopEmergencySound();
        }, 2000);
      }
    } catch (e) { console.error('Failed to enable sound:', e); }
  };

  const disableSound = () => {
    soundEnabled = false;
    setSoundOn(false);
    stopEmergencySound();
  };

  const closeModal = () => {
    modalClosedByUserRef.current = true;
    setShowEmergencyModal(false);
    stopEmergencySound();
    // Allow the flag to reset after a short delay so new emergencies can still show
    setTimeout(() => {
      modalClosedByUserRef.current = false;
    }, 500);
  };

  // ── Show next emergency when current is resolved ──────────────────────────
  useEffect(() => {
    if (!showEmergencyModal && activeEmergencies.length > 0 && !modalClosedByUserRef.current) {
      console.log('Showing next emergency in queue');
      setCurrentEmergency(activeEmergencies[0]);
      setShowEmergencyModal(true);
    }
  }, [showEmergencyModal, activeEmergencies]);

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      loadActiveEmergencies();
      connectWebSocket();
    } else {
      setIsReady(true);
    }
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      stopEmergencySound();
    };
  }, [token, loadActiveEmergencies, connectWebSocket]);

  // ── Icon / colour helpers ─────────────────────────────────────────────────
  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'medical': return <Heart size={20} />;
      case 'fire': return <Flame size={20} />;
      case 'security': return <Shield size={20} />;
      default: return <AlertTriangle size={20} />;
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

  const contextValue = {
    activeEmergencies,
    soundOn,
    enableSound,
    disableSound,
    wsConnected,
    isReady,
  };

  const statusCfg = currentEmergency ? STATUS_CONFIG[currentEmergency.status] || STATUS_CONFIG.ACTIVE : null;

  return (
    <EmergencyContext.Provider value={contextValue}>
      {children}

      <Modal show={showEmergencyModal} onHide={closeModal} centered className="emergency-global-modal">
        <style>{`
          .emergency-global-modal .modal-content {
            border-radius: 18px;
            border: 3px solid #dc2626;
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.5);
            animation: emergencyPulse 1s ease-in-out infinite;
          }
          @keyframes emergencyPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
            50% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
          }
          .emergency-global-modal .modal-header {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            border-bottom: none;
            padding: 1.25rem 1.5rem;
          }
          .emergency-global-modal .modal-header .btn-close { filter: brightness(0) invert(1); }
          .emergency-global-modal .modal-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.4rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .emergency-global-modal .modal-body { padding: 1.5rem; text-align: center; }

          .emergency-details-card {
            background: #fff5f5;
            border-radius: 12px;
            padding: 1.25rem;
            margin: 1rem 0;
            border: 1px solid #fee2e2;
          }
          .emergency-guest-name { font-size: 1.2rem; font-weight: 700; color: #1a1f2e; margin-bottom: 0.5rem; }
          .emergency-room-number { font-size: 1.8rem; font-weight: 800; color: #dc2626; margin-bottom: 0.5rem; }
          .emergency-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.25rem 1rem;
            border-radius: 99px;
            font-size: 0.8rem;
            font-weight: 700;
            margin-top: 0.5rem;
          }

          .status-pipeline {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.25rem;
            margin: 0.75rem 0 0.25rem;
            flex-wrap: wrap;
          }
          .pipeline-step {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 99px;
            transition: all 0.3s;
          }
          .pipeline-step.done { background: #dcfce7; color: #16a34a; }
          .pipeline-step.current { background: #fee2e2; color: #dc2626; font-weight: 800; }
          .pipeline-step.future { background: #f3f4f6; color: #9ca3af; }
          .pipeline-arrow { color: #d1d5db; font-size: 0.7rem; }

          .emergency-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .emergency-call-btn {
            background: #3b82f6;
            border: none;
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            color: white;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }
          .emergency-call-btn:hover { background: #2563eb; transform: translateY(-2px); }

          .emergency-advance-btn {
            border: none;
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            color: white;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
            opacity: 1;
          }
          .emergency-advance-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
          .emergency-advance-btn:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.1); }

          .sound-control {
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid #fee2e2;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .sound-toggle-btn {
            background: none;
            border: 1px solid #dc2626;
            border-radius: 99px;
            padding: 0.4rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
          }
          .sound-toggle-btn:hover { background: #fee2e2; }
          .sound-status-text.active { color: #4ade80; }
          .sound-status-text.inactive { color: #dc2626; }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        <Modal.Header closeButton>
          <Modal.Title>
            <AlertTriangle size={28} style={{ color: 'white' }} />
            EMERGENCY ALERT!
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {currentEmergency && statusCfg && (
            <>
              <div className="emergency-details-card">
                <div className="emergency-guest-name">{currentEmergency.guestName}</div>
                <div className="emergency-room-number">Room {currentEmergency.roomNumber}</div>
                <div
                  className="emergency-type-badge"
                  style={{
                    background: `${getEmergencyColor(currentEmergency.emergencyType)}20`,
                    color: getEmergencyColor(currentEmergency.emergencyType),
                    border: `1px solid ${getEmergencyColor(currentEmergency.emergencyType)}40`,
                  }}
                >
                  {getEmergencyIcon(currentEmergency.emergencyType)} {currentEmergency.emergencyTypeName}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#8a96a8' }}>
                  Received at {new Date(currentEmergency.createdAt).toLocaleTimeString()}
                </div>

                <div className="status-pipeline">
                  {['ACTIVE', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'].map((step, idx, arr) => {
                    const steps = ['ACTIVE', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED'];
                    const currentIdx = steps.indexOf(currentEmergency.status);
                    const stepIdx = steps.indexOf(step);
                    const cls =
                      stepIdx < currentIdx ? 'done' :
                      stepIdx === currentIdx ? 'current' : 'future';
                    return (
                      <React.Fragment key={step}>
                        <span className={`pipeline-step ${cls}`}>
                          {cls === 'done' && '✓ '}
                          {STATUS_CONFIG[step].label}
                        </span>
                        {idx < arr.length - 1 && <span className="pipeline-arrow">›</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="emergency-actions">
                <button
                  className="emergency-call-btn"
                  onClick={() => window.location.href = `tel:${currentEmergency.guestPhone || '+63328888888'}`}
                >
                  <Phone size={18} /> Call Room
                </button>

                {statusCfg.actionLabel && (
                  <button
                    className="emergency-advance-btn"
                    style={{ background: statusCfg.actionColor }}
                    disabled={advancing}
                    onClick={() => advanceEmergencyStatus(currentEmergency.id)}
                  >
                    {advancing
                      ? <><Loader2 size={18} className="spin" /> Processing…</>
                      : <>{statusCfg.actionIcon} {statusCfg.actionLabel}</>
                    }
                  </button>
                )}
              </div>

              <div className="sound-control">
                {soundOn ? (
                  <>
                    <Volume2 size={16} style={{ color: '#4ade80' }} />
                    <span className="sound-status-text active">Sound Active</span>
                    <button className="sound-toggle-btn" onClick={disableSound}>
                      <VolumeX size={14} /> Mute
                    </button>
                  </>
                ) : (
                  <>
                    <VolumeX size={16} style={{ color: '#dc2626' }} />
                    <span className="sound-status-text inactive">Sound Off</span>
                    <button className="sound-toggle-btn" onClick={enableSound}>
                      <Volume2 size={14} /> Enable Sound
                    </button>
                  </>
                )}
              </div>

              {!soundOn && (
                <p style={{ fontSize: '0.7rem', color: '#8a96a8', marginTop: '0.75rem', textAlign: 'center' }}>
                  <CircleAlert size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                  Click "Enable Sound" to hear emergency alerts (browser requires user interaction)
                </p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </EmergencyContext.Provider>
  );
}

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    console.warn('useEmergency must be used within an EmergencyProvider');
    return {
      activeEmergencies: [],
      soundOn: false,
      enableSound: () => {},
      disableSound: () => {},
      wsConnected: false,
      isReady: true,
    };
  }
  return context;
};