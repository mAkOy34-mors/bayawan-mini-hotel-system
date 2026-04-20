// src/receptionist/ReceptionistQRCheckOut.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  QrCode, ScanLine, CheckCircle2, AlertTriangle, LogOut,
  RefreshCw, Camera, XCircle, ArrowRight, Sparkles,
  CreditCard, Banknote, Smartphone, Wallet, DollarSign,
  Receipt, ClipboardList, Wrench, Coffee, Tv, Shirt, Package,
  Calendar, Clock
} from 'lucide-react';

import { API_BASE } from '../constants/config';

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
  #qr-reader-checkout {
    width: 100% !important;
    border: none !important;
  }
  #qr-reader-checkout video {
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
    border: 2px solid rgba(245,158,11,0.8);
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
    background: linear-gradient(90deg, transparent, #f59e0b, #60a5fa, #f59e0b, transparent);
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
    background: linear-gradient(135deg, rgba(245,158,11,0.04), rgba(201,168,76,0.02));
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    transition: all 0.2s;
  }
  .qr-result-card.valid {
    border-left: 4px solid #10b981;
  }
  .qr-result-card.invalid {
    border-left: 4px solid #ef4444;
  }
  .charges-list {
    max-height: 300px;
    overflow-y: auto;
  }
  .charge-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .charge-item:last-child {
    border-bottom: none;
  }
  .payment-methods {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .payment-method-btn {
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .payment-method-btn.active {
    border-color: #f59e0b;
    background: rgba(245,158,11,0.05);
    color: #f59e0b;
  }
  .payment-method-btn:hover {
    border-color: #f59e0b;
    transform: translateY(-2px);
  }
  .date-warning {
    padding: 0.75rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .date-warning.early {
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.25);
    color: #f59e0b;
  }
  .date-warning.late {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    color: #ef4444;
  }
`;

export function ReceptionistQRCheckOut({ token, setPage }) {
  const [lastResult, setLastResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showCharges, setShowCharges] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [forceCheckout, setForceCheckout] = useState(false);
  
  const { toast, show } = useToast();
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-checkout';

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
      const response = await fetch(`${API_BASE}/receptionist/verify-qr-checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_data: qrData })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBookingData(data.booking);
        setCharges(data.charges || []);
        setSummary(data.summary);
        setPaymentAmount(data.summary?.total_due || 0);
        setShowCharges(true);
        setLastResult({
          valid: true,
          booking: data.booking,
          error: null,
          scannedAt: new Date().toISOString()
        });
        show(`Booking found: ${data.booking.reference}`, 'success');
      } else {
        setLastResult({
          valid: false,
          booking: data.booking || null,
          error: data.error || 'Check-out verification failed',
          scannedAt: new Date().toISOString()
        });
        show(data.error || 'Check-out verification failed', 'error');
        setTimeout(() => {
          if (!manualMode) startScanner();
        }, 2000);
      }
    } catch (err) {
      console.error('Error:', err);
      setLastResult({
        valid: false,
        booking: null,
        error: 'Network error. Please try again.',
        scannedAt: new Date().toISOString()
      });
      show('Failed to connect to server', 'error');
      setTimeout(() => {
        if (!manualMode) startScanner();
      }, 2000);
    } finally {
      setProcessing(false);
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
    setShowCharges(false);
    setBookingData(null);
    setCharges([]);
    setSummary(null);
    setForceCheckout(false);
    stopScanner();
    setTimeout(startScanner, 500);
  };
  
  const processCheckout = async () => {
    setProcessingCheckout(true);
    try {
      const response = await fetch(`${API_BASE}/receptionist/process-qr-checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingData?.id,
          payment_collected: paymentAmount,
          payment_method: paymentMethod,
          force_checkout: forceCheckout
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCheckoutSuccess(true);
        show(data.message, 'success');
        setTimeout(() => {
          setCheckoutSuccess(false);
          setShowCharges(false);
          setBookingData(null);
          resetScanner();
        }, 3000);
      } else {
        if (data.can_force) {
          // Show force checkout option
          if (window.confirm(`${data.error}\n\nDo you want to force early check-out?`)) {
            setForceCheckout(true);
            // Retry with force checkout
            const forceResponse = await fetch(`${API_BASE}/receptionist/process-qr-checkout/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                booking_id: bookingData?.id,
                payment_collected: paymentAmount,
                payment_method: paymentMethod,
                force_checkout: true
              })
            });
            const forceData = await forceResponse.json();
            if (forceResponse.ok && forceData.success) {
              setCheckoutSuccess(true);
              show(forceData.message, 'success');
              setTimeout(() => {
                setCheckoutSuccess(false);
                setShowCharges(false);
                setBookingData(null);
                resetScanner();
              }, 3000);
            } else {
              show(forceData.error || 'Force check-out failed', 'error');
            }
          }
        } else {
          show(data.error || 'Check-out failed', 'error');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      show('Network error. Please try again.', 'error');
    } finally {
      setProcessingCheckout(false);
      setForceCheckout(false);
    }
  };
  
  const getChargeIcon = (type) => {
    switch (type) {
      case 'ROOM_BALANCE': return <DollarSign size={14} />;
      case 'SERVICE_CHARGE': return <Wrench size={14} />;
      case 'MINIBAR': return <Coffee size={14} />;
      default: return <Receipt size={14} />;
    }
  };
  
  const getChargeTypeLabel = (type) => {
    switch (type) {
      case 'ROOM_BALANCE': return 'Room Balance';
      case 'SERVICE_CHARGE': return 'Service Charge';
      case 'MINIBAR': return 'Minibar';
      default: return 'Other';
    }
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <style>{EXTRA_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <LogOut size={22} color="var(--orange)"/> QR Code Check-out
          </h1>
          <p className="ap-sub">Scan guest's QR code to check them out and process payments</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="ap-btn-ghost" onClick={resetScanner}><RefreshCw size={14}/> Reset</button>
          <button className="ap-btn-ghost" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? <Camera size={14}/> : <ScanLine size={14}/>}
            {manualMode ? 'Switch to Camera' : 'Manual Entry'}
          </button>
          <button className="ap-btn-primary" onClick={() => setPage('departures')}>
            <LogOut size={14}/> View Departures
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      {!showCharges && (
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
                      <input 
                        className="ap-input" 
                        placeholder="e.g. CGH-XXXXXXXX"
                        value={manualToken} 
                        onChange={e => setManualToken(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                      />
                      <button className="ap-btn-primary" onClick={handleManualSubmit} disabled={processing}>
                        {processing ? <div className="ap-spin-sm"/> : <><ArrowRight size={14}/> Verify</>}
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
                    {!scannerError && isScanning && (
                      <>
                        <div className="qr-scanner-frame"/>
                        <div className="qr-scan-line"/>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>
                    Position QR code within the frame to check out guest
                  </div>
                </div>
              )}
              
              {lastResult && !showCharges && (
                <div className={`qr-result-card ${lastResult.valid ? 'valid' : 'invalid'}`} style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                    {lastResult.valid ? <CheckCircle2 size={22} color="#10b981"/> : <XCircle size={22} color="#ef4444"/>}
                    <div><div style={{ fontWeight: 700 }}>{lastResult.valid ? 'Booking Found!' : 'Check-out Failed'}</div></div>
                  </div>
                  {lastResult.booking && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.78rem' }}>
                      <div>Reference: <strong>{lastResult.booking.reference}</strong></div>
                      <div>Guest: {lastResult.booking.guestName}</div>
                      <div>Room: {lastResult.booking.roomType} #{lastResult.booking.roomNumber}</div>
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
              <div className="ap-panel-title"><ScanLine size={14}/> Check-out Info</div>
            </div>
            <div className="ap-panel-body">
              <div style={{ padding: '.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <Sparkles size={14}/> How it works
                </div>
                <ul style={{ fontSize: '.72rem', color: 'var(--text-muted)', paddingLeft: '1rem', margin: 0 }}>
                  <li>1. Scan guest's QR code</li>
                  <li>2. System shows all outstanding charges</li>
                  <li>3. Collect payment if needed</li>
                  <li>4. Confirm check-out</li>
                  <li>5. Room marked as DIRTY</li>
                  <li>6. Cleaning task created automatically</li>
                </ul>
              </div>
              <div style={{ marginTop: '1rem', padding: '.65rem', background: 'rgba(245,158,11,0.08)', borderRadius: 10, fontSize: '.7rem', color: '#f59e0b' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '.3rem' }}/>
                After check-out, the room will be marked as DIRTY and a cleaning task will be created for housekeeping.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charges Modal */}
      <Modal show={showCharges} onHide={() => { setShowCharges(false); resetScanner(); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Receipt size={18} color="var(--orange)"/> Check-out Summary
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {bookingData && (
            <>
              {/* Guest Info */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(201,168,76,0.04))',
                borderRadius: 12,
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{bookingData.guestName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bookingData.guestEmail}</div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>Ref: {bookingData.reference}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>#{bookingData.roomNumber} - {bookingData.roomType}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Check-in</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmtDate(bookingData.checkInDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Check-out</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmtDate(bookingData.checkOutDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Nights</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bookingData.numberOfNights}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Guests</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bookingData.numberOfGuests}</div>
                  </div>
                </div>
              </div>

              {/* Date Warnings */}
              {summary?.is_early_checkout && (
                <div className="date-warning early">
                  <Calendar size={16} />
                  <div>
                    <strong>Early Check-out!</strong> Guest is checking out {Math.abs(summary.days_difference)} day(s) before scheduled check-out date ({fmtDate(summary.check_out_date)}).
                  </div>
                </div>
              )}
              {summary?.is_late_checkout && (
                <div className="date-warning late">
                  <Clock size={16} />
                  <div>
                    <strong>Late Check-out!</strong> Guest is checking out {Math.abs(summary.days_difference)} day(s) after scheduled check-out date ({fmtDate(summary.check_out_date)}). Additional charges may apply.
                  </div>
                </div>
              )}

              {/* Charges Section */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Receipt size={14}/> Outstanding Charges
                </div>
                <div className="charges-list">
                  {charges.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--green)' }}>
                      <CheckCircle2 size={24} />
                      <div>No outstanding charges</div>
                    </div>
                  ) : (
                    charges.map((charge, idx) => (
                      <div key={idx} className="charge-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getChargeIcon(charge.type)}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{charge.description}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {getChargeTypeLabel(charge.type)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#dc3545' }}>₱{charge.amount.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div style={{ 
                  background: 'var(--surface2)', 
                  borderRadius: 12, 
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal</span>
                    <span>₱{summary.subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                    <span>Deposit Paid</span>
                    <span>- ₱{summary.deposit_paid.toLocaleString()}</span>
                  </div>
                  {summary.service_charges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#f59e0b' }}>
                      <span>Service Charges</span>
                      <span>+ ₱{summary.service_charges.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '0.5rem', 
                    paddingTop: '0.5rem', 
                    borderTop: '2px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    <span>Total Due</span>
                    <span style={{ color: summary.total_due > 0 ? '#dc3545' : '#10b981' }}>
                      ₱{summary.total_due.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CreditCard size={14}/> Payment Method
                </div>
                <div className="payment-methods">
                  {[
                    { value: 'CASH', label: 'Cash', icon: <Banknote size={20} /> },
                    { value: 'CARD', label: 'Credit Card', icon: <CreditCard size={20} /> },
                    { value: 'GCASH', label: 'GCash', icon: <Smartphone size={20} /> },
                  ].map(method => (
                    <button
                      key={method.value}
                      className={`payment-method-btn ${paymentMethod === method.value ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      {method.icon}
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="ap-field" style={{ marginTop: '0.5rem' }}>
                <label className="ap-label">Amount Collected (₱)</label>
                <input
                  type="number"
                  className="ap-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Warning for outstanding balance */}
              {summary?.total_due > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(220,53,69,0.08)', 
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={14} />
                  Guest has outstanding balance of ₱{summary.total_due.toLocaleString()}. Collect full payment before check-out.
                </div>
              )}

              {/* Force checkout option for early check-out */}
              {summary?.is_early_checkout && !forceCheckout && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(245,158,11,0.08)', 
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span>Early check-out requested</span>
                  </div>
                  <button
                    className="ap-btn-ghost"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setForceCheckout(true)}
                  >
                    Force Check-out
                  </button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowCharges(false); resetScanner(); }}>Cancel</button>
          <button 
            className="ap-btn-primary" 
            onClick={processCheckout}
            disabled={processingCheckout}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
          >
            {processingCheckout ? <><div className="ap-spin-sm"/> Processing...</> : <><LogOut size={14}/> Confirm Check-out</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Checkout Success Modal */}
      <Modal show={checkoutSuccess} onHide={() => setCheckoutSuccess(false)} centered className="ap-modal">
        <Modal.Body style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle2 size={32} color="#fff"/>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--green)' }}>Check-out Complete!</div>
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Guest has been checked out successfully.<br/>
            Room has been marked as DIRTY and a cleaning task has been created.
          </div>
          {bookingData && (
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '.75rem', textAlign: 'left', marginBottom: '1rem' }}>
              <div>Room: #{bookingData.roomNumber} - {bookingData.roomType}</div>
              <div>Guest: {bookingData.guestName}</div>
              <div>Status: <span style={{ color: '#f59e0b' }}>DIRTY - Needs Cleaning</span></div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ReceptionistQRCheckOut;