// src/context/EmergencyContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { API_BASE } from '../constants/config';
import { Phone, CheckCircle2, Volume2, VolumeX } from 'lucide-react';

const EmergencyContext = createContext();

let audioContext = null;
let soundEnabled = false;
let currentOscillator = null;
let currentGain = null;
let soundInterval = null;

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext && window.AudioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Stop any playing sound
const stopEmergencySound = () => {
  if (soundInterval) {
    clearInterval(soundInterval);
    soundInterval = null;
  }
  if (currentOscillator) {
    try {
      currentOscillator.stop();
    } catch (e) {}
    currentOscillator = null;
  }
  if (currentGain) {
    currentGain = null;
  }
};

// Play emergency sound loop
const playEmergencySoundLoop = async () => {
  if (!soundEnabled) return;
  
  try {
    const context = initAudioContext();
    if (!context) return;
    
    // Resume context if suspended (browsers suspend by default)
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    // Stop any existing sound
    stopEmergencySound();
    
    // Create oscillator and gain
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
    
    // Create alternating frequency pattern for urgency
    let isHigh = true;
    soundInterval = setInterval(() => {
      if (!soundEnabled) {
        clearInterval(soundInterval);
        soundInterval = null;
        return;
      }
      
      if (currentOscillator) {
        try {
          currentOscillator.frequency.value = isHigh ? 880 : 660;
          isHigh = !isHigh;
        } catch (e) {}
      }
    }, 400);
    
  } catch (e) {
    console.log('Audio error:', e);
  }
};

const showBrowserNotification = (alert) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('🚨 EMERGENCY ALERT! 🚨', {
      body: `${alert.guestName} in Room ${alert.roomNumber} - ${alert.emergencyTypeName}`,
      icon: '/emergency-icon.png',
      tag: `emergency-${alert.id}`,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200, 100, 200],
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    setTimeout(() => notification.close(), 30000);
  }
};

export function EmergencyProvider({ children, token }) {
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [currentEmergency, setCurrentEmergency] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load active emergencies from API
  const loadActiveEmergencies = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/emergency/all/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const emergencies = (data.activeEmergencies || []).map(e => ({
          id: e.id,
          emergencyType: e.emergencyType,
          emergencyTypeName: e.emergencyTypeName,
          guestName: e.guestName,
          roomNumber: e.roomNumber || 'Not assigned',
          guestPhone: e.guestPhone,
          createdAt: e.createdAt,
          status: 'ACTIVE'
        }));
        setActiveEmergencies(emergencies);
        
        if (emergencies.length > 0 && !showEmergencyModal) {
          setCurrentEmergency(emergencies[0]);
          setShowEmergencyModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to load emergencies:', err);
    }
  }, [token, showEmergencyModal]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const wsUrl = `ws://localhost:8000/ws/emergency/?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for emergencies');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'NEW_EMERGENCY') {
          const newEmergency = {
            id: data.id,
            emergencyType: data.emergencyType,
            emergencyTypeName: data.emergencyTypeName,
            guestName: data.guestName,
            roomNumber: data.roomNumber,
            guestPhone: data.guestPhone,
            createdAt: data.createdAt,
            status: 'ACTIVE'
          };
          
          setActiveEmergencies(prev => [newEmergency, ...prev]);
          setCurrentEmergency(newEmergency);
          setShowEmergencyModal(true);
          
          showBrowserNotification(newEmergency);
        } else if (data.type === 'EMERGENCY_RESOLVED') {
          setActiveEmergencies(prev => prev.filter(e => e.id !== data.emergencyId));
          
          if (activeEmergencies.length <= 1) {
            stopEmergencySound();
            setShowEmergencyModal(false);
          }
        }
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 5000);
    };
  }, [token, activeEmergencies.length]);

  // Enable sound (requires user interaction)
  const enableSound = async () => {
    try {
      const context = initAudioContext();
      if (context) {
        // Resume the audio context (required after user interaction)
        if (context.state === 'suspended') {
          await context.resume();
        }
        soundEnabled = true;
        setSoundOn(true);
        
        // Play test sound to confirm it works
        playEmergencySoundLoop();
        
        // Stop test sound after 2 seconds
        setTimeout(() => {
          if (!showEmergencyModal) {
            stopEmergencySound();
          }
        }, 2000);
      }
    } catch (e) {
      console.error('Failed to enable sound:', e);
    }
  };

  const disableSound = () => {
    soundEnabled = false;
    setSoundOn(false);
    stopEmergencySound();
  };

  const resolveEmergency = async (emergencyId) => {
    try {
      const response = await fetch(`${API_BASE}/emergency/${emergencyId}/resolve/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setActiveEmergencies(prev => prev.filter(e => e.id !== emergencyId));
        setShowEmergencyModal(false);
        stopEmergencySound();
      }
    } catch (err) {
      console.error('Failed to resolve emergency:', err);
    }
  };

  const closeModal = () => {
    setShowEmergencyModal(false);
    stopEmergencySound();
  };

  // Load emergencies and connect WebSocket on mount
  useEffect(() => {
    if (token) {
      loadActiveEmergencies();
      connectWebSocket();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
      stopEmergencySound();
    };
  }, [token, loadActiveEmergencies, connectWebSocket]);

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
    <EmergencyContext.Provider value={{ activeEmergencies, soundOn, enableSound, disableSound, wsConnected }}>
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
          
          .emergency-global-modal .modal-header .btn-close {
            filter: brightness(0) invert(1);
          }
          
          .emergency-global-modal .modal-title {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.4rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .emergency-global-modal .modal-body {
            padding: 1.5rem;
            text-align: center;
          }
          
          .emergency-details-card {
            background: #fff5f5;
            border-radius: 12px;
            padding: 1.25rem;
            margin: 1rem 0;
            border: 1px solid #fee2e2;
          }
          
          .emergency-guest-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1a1f2e;
            margin-bottom: 0.5rem;
          }
          
          .emergency-room-number {
            font-size: 1.8rem;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 0.5rem;
          }
          
          .emergency-type-badge {
            display: inline-block;
            padding: 0.25rem 1rem;
            border-radius: 99px;
            font-size: 0.8rem;
            font-weight: 700;
            margin-top: 0.5rem;
          }
          
          .emergency-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1rem;
          }
          
          .emergency-call-btn {
            background: #3b82f6;
            border: none;
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            color: white;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }
          
          .emergency-call-btn:hover {
            background: #2563eb;
            transform: translateY(-2px);
          }
          
          .emergency-resolve-btn {
            background: #2d9b6f;
            border: none;
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            color: white;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
          }
          
          .emergency-resolve-btn:hover {
            background: #238c63;
            transform: translateY(-2px);
          }
          
          .sound-control {
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid #fee2e2;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
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
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }
          
          .sound-toggle-btn:hover {
            background: #fee2e2;
          }
          
          .sound-enabled {
            background: #4ade80;
            border-color: #4ade80;
            color: white;
          }
          
          .sound-enabled:hover {
            background: #22c55e;
          }
        `}</style>
        
        <Modal.Header closeButton>
          <Modal.Title>
            <span style={{ fontSize: '1.8rem' }}>🚨</span>
            EMERGENCY ALERT!
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {currentEmergency && (
            <>
              <div className="emergency-details-card">
                <div className="emergency-guest-name">{currentEmergency.guestName}</div>
                <div className="emergency-room-number">Room {currentEmergency.roomNumber}</div>
                <div className="emergency-type-badge" style={{ 
                  background: `${getEmergencyColor(currentEmergency.emergencyType)}20`,
                  color: getEmergencyColor(currentEmergency.emergencyType),
                  border: `1px solid ${getEmergencyColor(currentEmergency.emergencyType)}40`
                }}>
                  {getEmergencyIcon(currentEmergency.emergencyType)} {currentEmergency.emergencyTypeName}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#8a96a8' }}>
                  Received at {new Date(currentEmergency.createdAt).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="emergency-actions">
                <button 
                  className="emergency-call-btn"
                  onClick={() => window.location.href = `tel:${currentEmergency.guestPhone || '+63328888888'}`}
                >
                  <Phone size={18} /> Call Room
                </button>
                <button 
                  className="emergency-resolve-btn"
                  onClick={() => resolveEmergency(currentEmergency.id)}
                >
                  <CheckCircle2 size={18} /> Resolve
                </button>
              </div>
              
              <div className="sound-control">
                {soundOn ? (
                  <>
                    <Volume2 size={16} color="#4ade80" />
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>Sound Active</span>
                    <button className="sound-toggle-btn" onClick={disableSound}>
                      <VolumeX size={14} /> Mute
                    </button>
                  </>
                ) : (
                  <>
                    <VolumeX size={16} color="#dc2626" />
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>Sound Off</span>
                    <button className="sound-toggle-btn" onClick={enableSound}>
                      <Volume2 size={14} /> Enable Sound
                    </button>
                  </>
                )}
              </div>
              
              {!soundOn && (
                <p style={{ fontSize: '0.7rem', color: '#8a96a8', marginTop: '0.75rem', textAlign: 'center' }}>
                  ⚠️ Click "Enable Sound" to hear emergency alerts (browser requires user interaction)
                </p>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </EmergencyContext.Provider>
  );
}

export const useEmergency = () => useContext(EmergencyContext);