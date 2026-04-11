// ReceptionistQRCheckIn.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  QrCode, ScanLine, CheckCircle2, AlertTriangle, LogIn,
  RefreshCw, Camera, XCircle, ArrowRight, Sparkles,
} from 'lucide-react';

import { API_BASE as BASE } from '../constants/config';

const h = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

const EXTRA_CSS = `
  .qr-scanner-container {
    position: relative;
    background: #0f172a;
    border-radius: 20px;
    overflow: hidden;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #qr-reader {
    width: 100% !important;
    border: none !important;
  }
  #qr-reader video {
    border-radius: 16px;
    width: 100% !important;
    object-fit: cover !important;
  }
  .qr-scanner-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 250px;
    height: 250px;
    border: 2px solid rgba(201,168,76,0.8);
    border-radius: 24px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 10;
  }
  .qr-scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #C9A84C, #60a5fa, #C9A84C, transparent);
    animation: scanMove 2s linear infinite;
    border-radius: 3px;
    pointer-events: none;
  }
  @keyframes scanMove {
    0% { top: 0%; }
    50% { top: calc(100% - 3px); }
    100% { top: 0%; }
  }
  .qr-result-card {
    background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(201,168,76,0.02));
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    transition: all 0.2s;
  }
  .qr-result-card.valid {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.02));
  }
  .qr-result-card.invalid {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, rgba(239,68,68,0.04), transparent);
  }
  .qr-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .qr-stat-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    text-align: center;
  }
`;

export function ReceptionistQRCheckIn({ token, setPage }) {
  const [lastResult, setLastResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({ todayCheckIns: 0, pendingArrivals: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const { toast, show } = useToast();
  const scannerRef = useRef(null);
  const containerId = 'qr-reader';

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const res = await fetch(`${BASE}/receptionist/arrivals/?date=${today}`, { headers: h(token) });
      const data = await res.json().catch(() => ({ arrivals: [] }));
      const arrivals = data.arrivals || [];
      const todayCheckIns = JSON.parse(localStorage.getItem('qr_checkins_today') || '[]').length;
      setStats({ todayCheckIns, pendingArrivals: arrivals.length });
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadStats();
    const recent = JSON.parse(localStorage.getItem('qr_recent_scans') || '[]').slice(0, 5);
    setRecentScans(recent);
  }, [token]);

  const startScanner = async () => {
    if (isScanning) return;
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    setScannerError(null);
    
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { if (!processing) handleScanResult(decodedText); },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      setScannerError('Camera access failed. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!manualMode) {
      const timer = setTimeout(startScanner, 500);
      return () => { clearTimeout(timer); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [manualMode]);

  const handleScanResult = async (qrData) => {
    if (processing) return;
    setProcessing(true);
    await stopScanner();
    
    try {
      const response = await fetch(`${BASE}/receptionist/verify-qr-checkin/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({ qr_data: qrData })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccessBooking(data.booking);
        setShowSuccess(true);
        show(data.message, 'success');
        
        setLastResult({
          valid: true,
          booking: data.booking,
          error: null,
          scannedAt: new Date().toISOString()
        });
        
        const newRecent = [{
          reference: data.booking.reference,
          valid: true,
          scannedAt: new Date().toISOString(),
          guestName: data.booking.guestName,
          roomNumber: data.booking.roomNumber
        }, ...recentScans.slice(0, 4)];
        setRecentScans(newRecent);
        localStorage.setItem('qr_recent_scans', JSON.stringify(newRecent));
        
        const todayCheckIns = JSON.parse(localStorage.getItem('qr_checkins_today') || '[]');
        todayCheckIns.push({ bookingId: data.booking.id, time: new Date().toISOString() });
        localStorage.setItem('qr_checkins_today', JSON.stringify(todayCheckIns));
        loadStats();
        
        setTimeout(() => { setShowSuccess(false); setSuccessBooking(null); }, 3000);
      } else {
        setLastResult({
          valid: false,
          booking: data.booking || null,
          error: data.error || 'Check-in failed',
          scannedAt: new Date().toISOString()
        });
        show(data.error || 'Check-in failed', 'error');
      }
    } catch (err) {
      setLastResult({
        valid: false,
        booking: null,
        error: 'Network error. Please try again.',
        scannedAt: new Date().toISOString()
      });
      show('Failed to connect to server', 'error');
    } finally {
      setProcessing(false);
      if (!manualMode) setTimeout(startScanner, 2000);
    }
  };
  
  const handleManualSubmit = async () => {
    if (!manualToken.trim()) return;
    await handleScanResult(manualToken.trim());
    setManualToken('');
  };
  
  const resetScanner = () => {
    setLastResult(null);
    setManualMode(false);
    setScannerError(null);
    stopScanner();
    setTimeout(startScanner, 500);
  };
  
  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast}/>
      
      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <QrCode size={22} color="var(--gold-dark)"/> QR Code Check-in
          </h1>
          <p className="ap-sub">Scan guest's QR code to instantly check them in</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="ap-btn-ghost" onClick={resetScanner}><RefreshCw size={14}/> Reset</button>
          <button className="ap-btn-ghost" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? <Camera size={14}/> : <ScanLine size={14}/>}
            {manualMode ? 'Switch to Camera' : 'Manual Entry'}
          </button>
          <button className="ap-btn-primary" onClick={() => setPage('arrivals')}>
            <LogIn size={14}/> View Arrivals
          </button>
        </div>
      </div>
      
      <div className="qr-stats-grid">
        <div className="qr-stat-card">
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Today's Check-ins</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green)' }}>{stats.todayCheckIns}</div>
        </div>
        <div className="qr-stat-card">
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pending Arrivals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--orange)' }}>{stats.pendingArrivals}</div>
        </div>
        <div className="qr-stat-card">
          <div style={{ fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Recent Scans</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold-dark)' }}>{recentScans.length}</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <div className="ap-panel" style={{ marginBottom: 0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title"><Camera size={15}/> {manualMode ? 'Manual Entry' : 'QR Scanner'}</div>
          </div>
          <div className="ap-panel-body">
            {manualMode ? (
              <div>
                <div className="ap-field">
                  <label className="ap-label">Enter Booking Reference</label>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <input className="ap-input" placeholder="e.g. CGH-XXXXXXXX"
                      value={manualToken} onChange={e => setManualToken(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}/>
                    <button className="ap-btn-primary" onClick={handleManualSubmit} disabled={processing}>
                      {processing ? <div className="ap-spin-sm"/> : <ArrowRight size={14}/>} Check In
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="qr-scanner-container">
                  <div id={containerId} style={{ width: '100%', minHeight: 400 }}>
                    {scannerError && (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <AlertTriangle size={32} color="#ef4444"/>
                        <p style={{ color: '#ef4444', marginTop: '.5rem' }}>{scannerError}</p>
                        <button className="ap-btn-primary" onClick={resetScanner} style={{ marginTop: '1rem' }}>Retry</button>
                      </div>
                    )}
                  </div>
                  {!scannerError && !isScanning && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: '.5rem' }}>
                      <Spinner/><span style={{ color: '#fff' }}>Starting camera...</span>
                    </div>
                  )}
                  {!scannerError && isScanning && (<><div className="qr-scanner-frame"/><div className="qr-scan-line"/></>)}
                </div>
                <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>
                  Position QR code within the frame
                </div>
              </div>
            )}
            
            {lastResult && (
              <div className={`qr-result-card ${lastResult.valid ? 'valid' : 'invalid'}`} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                  {lastResult.valid ? <CheckCircle2 size={22} color="#10b981"/> : <XCircle size={22} color="#ef4444"/>}
                  <div><div style={{ fontWeight: 700 }}>{lastResult.valid ? 'Check-in Successful!' : 'Check-in Failed'}</div></div>
                </div>
                {lastResult.booking && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.78rem' }}>
                    <div>Reference: <strong>{lastResult.booking.reference}</strong></div>
                    <div>Guest: {lastResult.booking.guestName}</div>
                    <div>Room: {lastResult.booking.roomType} #{lastResult.booking.roomNumber}</div>
                    <div>Check-out: {fmtDate(lastResult.booking.checkOutDate)}</div>
                  </div>
                )}
                {lastResult.error && (
                  <div style={{ marginTop: '.65rem', padding: '.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: '.75rem', color: '#ef4444' }}>
                    ⚠️ {lastResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="ap-panel" style={{ marginBottom: 0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title"><ScanLine size={14}/> Recent Scans</div>
            <button className="ap-btn-ghost" style={{ fontSize: '.65rem' }}
              onClick={() => { setRecentScans([]); localStorage.setItem('qr_recent_scans', '[]'); }}>Clear</button>
          </div>
          <div className="ap-panel-body">
            {recentScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <QrCode size={28} style={{ opacity: 0.25 }}/><div>No recent scans</div>
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem', background: 'var(--surface2)', borderRadius: 10, marginBottom: '.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: scan.valid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {scan.valid ? <CheckCircle2 size={14} color="#10b981"/> : <XCircle size={14} color="#ef4444"/>}
                  </div>
                  <div><div style={{ fontWeight: 600, fontSize: '.78rem' }}>{scan.reference}</div><div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{scan.guestName}</div></div>
                </div>
              ))
            )}
            <div style={{ marginTop: '1rem', padding: '.65rem', background: 'rgba(59,130,246,0.04)', borderRadius: 10, fontSize: '.7rem', color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, marginBottom: '.25rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <Sparkles size={12}/> How it works
              </div>
              <div>1. Guest shows QR code from booking confirmation</div>
              <div>2. Position QR code within the frame</div>
              <div>3. System automatically checks guest in</div>
              <div>4. Room status updates to occupied</div>
            </div>
          </div>
        </div>
      </div>
      
      <Modal show={showSuccess} onHide={() => setShowSuccess(false)} centered className="ap-modal">
        <Modal.Body style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle2 size={32} color="#fff"/>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--green)' }}>Check-in Complete!</div>
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Guest has been checked in successfully</div>
          {successBooking && (
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '.75rem', textAlign: 'left' }}>
              <div>Room: {successBooking.roomType} #{successBooking.roomNumber}</div>
              <div>Guest: {successBooking.guestName}</div>
              <div>Check-out: {fmtDate(successBooking.checkOutDate)}</div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ReceptionistQRCheckIn;