// ReceptionistQRCheckIn.jsx — Enhanced with Payment Gate
// - Blocks check-in if balance is unpaid
// - Shows payment modal with Cash or Online (PayMongo) options
// - Polls PayMongo payment status until confirmed
// - No react-bootstrap dependency (native modals)

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  QrCode, ScanLine, CheckCircle2, AlertTriangle, LogIn,
  RefreshCw, Camera, XCircle, ArrowRight, Sparkles,
  CreditCard, Banknote, X, Clock, Loader2, ExternalLink,
  ShieldCheck, Receipt, DollarSign,
} from 'lucide-react';
import { API_BASE as BASE } from '../constants/config';

/* ── auth headers ─────────────────────────────────────────────────────────── */
const h  = (t) => ({ Authorization: `Bearer ${t}`, 'ngrok-skip-browser-warning': 'true' });
const hj = (t) => ({ ...h(t), 'Content-Type': 'application/json' });

/* ── extra CSS ────────────────────────────────────────────────────────────── */
const EXTRA_CSS = `
  /* ── Scanner ── */
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
  #qr-reader { width: 100% !important; border: none !important; }
  #qr-reader video { border-radius: 16px; width: 100% !important; object-fit: cover !important; }
  .qr-scanner-frame {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 250px; height: 250px;
    border: 2px solid rgba(201,168,76,0.8);
    border-radius: 24px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 10;
  }
  .qr-scan-line {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 3px;
    background: linear-gradient(90deg, transparent, #C9A84C, #60a5fa, #C9A84C, transparent);
    animation: scanMove 2s linear infinite;
    border-radius: 3px; pointer-events: none;
  }
  @keyframes scanMove {
    0%   { top: 0%; }
    50%  { top: calc(100% - 3px); }
    100% { top: 0%; }
  }

  /* ── Result card ── */
  .qr-result-card {
    background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(201,168,76,0.02));
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    transition: all 0.2s;
  }
  .qr-result-card.valid   { border-left: 4px solid #10b981; background: linear-gradient(135deg, rgba(16,185,129,0.04), rgba(59,130,246,0.02)); }
  .qr-result-card.invalid { border-left: 4px solid #ef4444; background: linear-gradient(135deg, rgba(239,68,68,0.04), transparent); }
  .qr-result-card.pending { border-left: 4px solid #f59e0b; background: linear-gradient(135deg, rgba(245,158,11,0.06), transparent); }

  /* ── Stats ── */
  .qr-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .qr-stat-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 0.65rem 0.85rem; text-align: center; }

  /* ── Overlay / modal ── */
  .pm-overlay {
    position: fixed; inset: 0;
    background: rgba(10,12,20,0.78);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    display: flex; align-items: center; justify-content: center;
    z-index: 4000; padding: 20px;
    animation: pmFadeIn .22s ease both;
  }
  @keyframes pmFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .pm-modal {
    background: #fff;
    border-radius: 20px;
    width: 100%; max-width: 540px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 32px 80px rgba(0,0,0,0.28);
    overflow: hidden;
    animation: pmSlideUp .28s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes pmSlideUp {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .pm-modal-hd {
    background: linear-gradient(135deg, #1a1f2e, #2d3748);
    padding: 1.4rem 1.5rem 1.2rem;
    display: flex; align-items: flex-start; justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
  }
  .pm-modal-close {
    background: rgba(255,255,255,0.08); border: none; border-radius: 8px;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.6); transition: all .18s; flex-shrink: 0;
  }
  .pm-modal-close:hover { background: rgba(255,255,255,0.14); color: #fff; }
  .pm-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.3) #e2e8f0;
  }
  .pm-modal-body::-webkit-scrollbar {
    width: 5px;
  }
  .pm-modal-body::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 10px;
  }
  .pm-modal-body::-webkit-scrollbar-thumb {
    background: rgba(201,168,76,0.5);
    border-radius: 10px;
  }

  /* ── Payment method cards ── */
  .pm-method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1rem; }
  .pm-method-card {
    border: 2px solid var(--border);
    border-radius: 14px;
    padding: 1.1rem 1rem;
    cursor: pointer;
    transition: all .22s;
    text-align: center;
    background: var(--surface2);
    position: relative;
    overflow: hidden;
  }
  .pm-method-card::before {
    content: '';
    position: absolute; inset: 0;
    opacity: 0; transition: opacity .22s;
  }
  .pm-method-card.cash::before   { background: linear-gradient(135deg, rgba(16,185,129,0.06), transparent); }
  .pm-method-card.online::before { background: linear-gradient(135deg, rgba(59,130,246,0.06), transparent); }
  .pm-method-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }
  .pm-method-card.cash:hover   { border-color: #10b981; }
  .pm-method-card.online:hover { border-color: #3b82f6; }
  .pm-method-card.selected.cash   { border-color: #10b981; background: rgba(16,185,129,0.06); }
  .pm-method-card.selected.online { border-color: #3b82f6; background: rgba(59,130,246,0.06); }
  .pm-method-card.disabled { opacity: .45; cursor: not-allowed; pointer-events: none; }

  /* ── Amount breakdown ── */
  .pm-amount-row { display: flex; justify-content: space-between; align-items: center; padding: .5rem 0; border-bottom: 1px solid var(--border); font-size: .84rem; }
  .pm-amount-row:last-child { border-bottom: none; }
  .pm-amount-total { font-size: 1.1rem; font-weight: 700; color: var(--gold-dark); }

  /* ── PayMongo iframe container ── */
  .pm-iframe-wrap {
    position: fixed; inset: 0;
    background: rgba(10,12,20,0.85);
    backdrop-filter: blur(8px);
    z-index: 5000;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 20px;
    animation: pmFadeIn .22s ease both;
  }
  .pm-iframe-card {
    background: #fff;
    border-radius: 20px;
    width: 100%; max-width: 700px;
    height: 90vh;
    max-height: 780px;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.4);
  }
  .pm-iframe-topbar {
    background: linear-gradient(135deg, #1a1f2e, #2d3748);
    padding: .85rem 1.2rem;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .pm-iframe { border: none; flex: 1; width: 100%; }

  /* ── Poll status bar ── */
  .pm-poll-bar {
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.22);
    border-radius: 10px;
    padding: .65rem 1rem;
    display: flex; align-items: center; gap: .6rem;
    font-size: .8rem; color: #92400e;
    margin-top: .75rem;
  }
  @keyframes pmSpin { to { transform: rotate(360deg); } }
  .pm-spin { animation: pmSpin .8s linear infinite; }

  /* ── Summary card ── */
  .pm-booking-summary {
    background: linear-gradient(135deg, rgba(201,168,76,0.06), rgba(59,130,246,0.03));
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    margin-bottom: 1.1rem;
  }
  .pm-summary-row { display: flex; justify-content: space-between; font-size: .82rem; padding: .28rem 0; }
  .pm-summary-label { color: var(--text-muted); }
  .pm-summary-value { font-weight: 600; color: var(--text); }

  /* ── Success modal ── */
  .pm-success-overlay {
    position: fixed; inset: 0;
    background: rgba(10,12,20,0.75);
    backdrop-filter: blur(7px);
    z-index: 6000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: pmFadeIn .22s ease both;
  }
  .pm-success-card {
    background: #fff;
    border-radius: 22px;
    max-width: 420px; width: 100%;
    padding: 2.5rem 2rem 2rem;
    text-align: center;
    box-shadow: 0 32px 80px rgba(0,0,0,0.24);
  }
  .pm-success-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #34d399);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
    box-shadow: 0 8px 28px rgba(16,185,129,0.35);
  }

  /* ── Balance badge ── */
  .pm-balance-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
    color: #c0392b; border-radius: 20px;
    padding: .3rem .75rem; font-size: .75rem; font-weight: 600;
  }
  .pm-paid-badge {
    display: inline-flex; align-items: center; gap: .4rem;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
    color: #059669; border-radius: 20px;
    padding: .3rem .75rem; font-size: .75rem; font-weight: 600;
  }
`;

/* ══════════════════════════════════════════════════════════════════════
   PAYMENT MODAL
   Shown when booking has an unpaid balance.
   Offers: Cash (receptionist records it) | Online (PayMongo iframe)
══════════════════════════════════════════════════════════════════════ */
function PaymentModal({ booking, token, onPaid, onCancel }) {
  const [method, setMethod]         = useState(null);   // 'cash' | 'online'
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState(null); // PayMongo URL
  const [paymentId, setPaymentId]   = useState(null);
  const [polling, setPolling]       = useState(false);
  const [pollMsg, setPollMsg]       = useState('');
  const pollRef = useRef(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Stop polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const balanceOwed = parseFloat(booking.remainingAmount ?? booking.remaining_amount ?? 0);
  const totalAmount = parseFloat(booking.totalAmount ?? booking.total_amount ?? 0);
  const depositPaid = parseFloat(booking.depositAmount ?? booking.deposit_amount ?? 0);

  /* ── Record cash payment ── */
  const handleCashPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/receptionist/payments/cash/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({
          booking_id:  booking.id,
          amount:      balanceOwed,
          description: `Balance payment — ${booking.reference}`,
          type:        'BALANCE',
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.id)) {
        onPaid('cash');
      } else {
        setError(data.message || data.error || 'Failed to record cash payment.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Create PayMongo checkout session ── */
  const handleOnlinePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/payments/create-link/`, {
        method: 'POST',
        headers: hj(token),
        body: JSON.stringify({
          booking_id:  booking.id,
          amount:      balanceOwed,
          description: `Balance — ${booking.reference} (${booking.roomType} #${booking.roomNumber})`,
          remarks:     `Guest: ${booking.guestName}`,
          type:        'BALANCE',
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        setPaymentId(data.paymentId);
        startPolling(data.paymentId);
      } else {
        setError(data.message || 'Could not create payment link.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Poll backend for payment confirmation ── */
  const startPolling = (pid) => {
    setPolling(true);
    setPollMsg('Waiting for payment confirmation…');
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/payments/status/${pid}/`, { headers: h(token) });
        const data = await res.json();
        if (data.status === 'PAID') {
          clearInterval(pollRef.current);
          setPolling(false);
          setCheckoutUrl(null);
          onPaid('online');
        }
      } catch { /* keep polling */ }
    }, 3000); // poll every 3s
  };

  /* ── Close PayMongo iframe (cancel online) ── */
  const cancelOnline = () => {
    clearInterval(pollRef.current);
    setPolling(false);
    setCheckoutUrl(null);
    setPaymentId(null);
    setMethod(null);
  };

  /* ── PayMongo iframe view ── */
  if (checkoutUrl) {
    return (
      <div className="pm-iframe-wrap">
        <div className="pm-iframe-card">
          <div className="pm-iframe-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <CreditCard size={17} color="#C9A84C" />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '.9rem' }}>
                Secure Online Payment
              </span>
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.45)', marginLeft: '.25rem' }}>
                ₱{balanceOwed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button className="pm-modal-close" onClick={cancelOnline} title="Cancel payment">
              <X size={17} />
            </button>
          </div>

          <iframe
            className="pm-iframe"
            src={checkoutUrl}
            title="PayMongo Checkout"
            allow="payment"
          />

          {polling && (
            <div className="pm-poll-bar" style={{ margin: '.5rem 1rem', borderRadius: 8 }}>
              <Loader2 size={14} className="pm-spin" />
              <span>{pollMsg}</span>
              <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#92400e', opacity: .7 }}>
                Do not close this window
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Method selection modal ── */
  return (
    <div className="pm-overlay" onClick={onCancel}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-modal-hd">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.2rem' }}>
              <Receipt size={17} color="#C9A84C" />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                Payment Required
              </span>
            </div>
            <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Guest must settle the balance before checking in
            </p>
          </div>
          <button className="pm-modal-close" onClick={onCancel}>
            <X size={17} />
          </button>
        </div>

        {/* Body with scroll */}
        <div className="pm-modal-body">
          {/* Booking summary */}
          <div className="pm-booking-summary">
            <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.6rem' }}>
              Booking Summary
            </div>
            <div className="pm-summary-row">
              <span className="pm-summary-label">Reference</span>
              <span className="pm-summary-value">{booking.reference}</span>
            </div>
            <div className="pm-summary-row">
              <span className="pm-summary-label">Guest</span>
              <span className="pm-summary-value">{booking.guestName}</span>
            </div>
            <div className="pm-summary-row">
              <span className="pm-summary-label">Room</span>
              <span className="pm-summary-value">{booking.roomType} #{booking.roomNumber}</span>
            </div>
            <div className="pm-summary-row">
              <span className="pm-summary-label">Check-out</span>
              <span className="pm-summary-value">{fmtDate(booking.checkOutDate)}</span>
            </div>
          </div>

          {/* Amount breakdown */}
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '.85rem 1rem', marginBottom: '1.1rem' }}>
            <div className="pm-amount-row">
              <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>Total Amount</span>
              <span>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pm-amount-row">
              <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>Deposit Paid</span>
              <span style={{ color: '#10b981' }}>− ₱{depositPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pm-amount-row" style={{ borderTop: '2px solid var(--border)', marginTop: '.25rem', paddingTop: '.65rem' }}>
              <span style={{ fontWeight: 700 }}>Balance Due</span>
              <span className="pm-amount-total">
                ₱{balanceOwed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.22)', borderRadius: 10, padding: '.65rem .9rem', color: '#c0392b', fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Method selection label */}
          <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.65rem' }}>
            Select Payment Method
          </div>

          {/* Method cards */}
          <div className="pm-method-grid">
            {/* Cash */}
            <div
              className={`pm-method-card cash ${method === 'cash' ? 'selected' : ''}`}
              onClick={() => setMethod('cash')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .65rem', color: '#10b981' }}>
                <Banknote size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>Cash</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Receptionist collects payment</div>
              {method === 'cash' && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={12} color="#fff" />
                </div>
              )}
            </div>

            {/* Online */}
            <div
              className={`pm-method-card online ${method === 'online' ? 'selected' : ''}`}
              onClick={() => setMethod('online')}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .65rem', color: '#3b82f6' }}>
                <CreditCard size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.2rem' }}>Online</div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Card, GCash, GrabPay, QR PH</div>
              {method === 'online' && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={12} color="#fff" />
                </div>
              )}
            </div>
          </div>

          {/* Cash instructions */}
          {method === 'cash' && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 10, padding: '.75rem .9rem', fontSize: '.8rem', color: '#065f46', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}>
              <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              Collect <strong>₱{balanceOwed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> from the guest, then click <em>Confirm Cash Payment</em> to record and proceed with check-in.
            </div>
          )}

          {/* Online instructions */}
          {method === 'online' && (
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '.75rem .9rem', fontSize: '.8rem', color: '#1e40af', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}>
              <ExternalLink size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              A secure PayMongo checkout will open. Guest can pay via <strong>Card, GCash, GrabPay, or QR PH</strong>. Check-in will proceed automatically once payment is confirmed.
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '.65rem' }}>
            <button
              onClick={onCancel}
              style={{ flex: 1, padding: '.75rem', border: '1.5px solid var(--border)', background: '#fff', borderRadius: 11, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', color: 'var(--text-sub)', transition: 'all .18s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sub)'; }}
            >
              Cancel
            </button>
            <button
              onClick={method === 'cash' ? handleCashPayment : handleOnlinePayment}
              disabled={!method || loading}
              style={{
                flex: 2, padding: '.75rem',
                background: !method ? 'var(--border)' : method === 'cash'
                  ? 'linear-gradient(135deg,#059669,#10b981)'
                  : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                border: 'none', borderRadius: 11,
                cursor: !method || loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '.88rem', color: !method ? 'var(--text-muted)' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem',
                transition: 'all .22s', fontFamily: 'inherit',
                boxShadow: method && !loading ? '0 4px 16px rgba(0,0,0,0.18)' : 'none',
                opacity: loading ? .65 : 1,
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="pm-spin" /> Processing…</>
              ) : method === 'cash' ? (
                <><Banknote size={15} /> Confirm Cash Payment</>
              ) : method === 'online' ? (
                <><CreditCard size={15} /> Open Payment Portal</>
              ) : (
                'Select a Method'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SUCCESS MODAL
══════════════════════════════════════════════════════════════════════ */
function SuccessModal({ booking, paymentMethod, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = setTimeout(onClose, 5000);
    return () => { document.body.style.overflow = ''; clearTimeout(t); };
  }, []);

  return (
    <div className="pm-success-overlay">
      <div className="pm-success-card">
        <div className="pm-success-icon">
          <CheckCircle2 size={34} color="#fff" />
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 600, color: '#065f46', marginBottom: '.3rem' }}>
          Check-in Complete!
        </h3>
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Guest has been successfully checked in
          {paymentMethod === 'cash' ? ' · Cash payment recorded' : ' · Online payment confirmed'}
        </p>
        {booking && (
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '.85rem 1rem', textAlign: 'left', marginBottom: '1.25rem' }}>
            {[
              ['Reference',  booking.reference],
              ['Guest',      booking.guestName],
              ['Room',       `${booking.roomType} #${booking.roomNumber}`],
              ['Check-out',  fmtDate(booking.checkOutDate)],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', padding: '.25rem 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '.75rem', background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', borderRadius: 11, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
        >
          Done
        </button>
        <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.75rem' }}>
          Auto-closing in 5 seconds…
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export function ReceptionistQRCheckIn({ token, setPage }) {
  const [lastResult,     setLastResult]     = useState(null);
  const [processing,     setProcessing]     = useState(false);
  const [manualToken,    setManualToken]    = useState('');
  const [manualMode,     setManualMode]     = useState(false);
  const [recentScans,    setRecentScans]    = useState([]);
  const [stats,          setStats]          = useState({ todayCheckIns: 0, pendingArrivals: 0 });
  const [scannerError,   setScannerError]   = useState(null);
  const [isScanning,     setIsScanning]     = useState(false);

  // Payment gate state
  const [pendingBooking, setPendingBooking] = useState(null); // booking awaiting payment
  const [showPayment,    setShowPayment]    = useState(false);

  // Success modal
  const [successData,    setSuccessData]    = useState(null); // { booking, paymentMethod }

  const { toast, show } = useToast();
  const scannerRef  = useRef(null);
  const containerId = 'qr-reader';

  /* ── Stats ── */
  const loadStats = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res   = await fetch(`${BASE}/receptionist/arrivals/?date=${today}`, { headers: h(token) });
      const data  = await res.json().catch(() => ({ arrivals: [] }));
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

  /* ── Scanner lifecycle ── */
  const startScanner = async () => {
    if (isScanning) return;
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    setScannerError(null);
    try {
      const qr = new Html5Qrcode(containerId);
      scannerRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { if (!processing) handleScanResult(decoded); },
        () => {}
      );
      setIsScanning(true);
    } catch {
      setScannerError('Camera access failed. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!manualMode) {
      const t = setTimeout(startScanner, 500);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [manualMode]);

  /* ══════════════════════════════════════════════════════════════════
     CORE: Handle QR scan / manual entry
     - Always calls verify-qr-checkin first
     - If backend says payment_required → show payment modal
     - If backend says success → show success
  ══════════════════════════════════════════════════════════════════ */
  const handleScanResult = useCallback(async (qrData) => {
    if (processing) return;
    setProcessing(true);
    await stopScanner();

    try {
      const res  = await fetch(`${BASE}/receptionist/verify-qr-checkin/`, {
        method:  'POST',
        headers: hj(token),
        body:    JSON.stringify({ qr_data: qrData }),
      });
      const data = await res.json();

      /* ── Payment required ─────────────────────────────────────── */
      if (res.status === 402 || data.payment_required) {
        const booking = data.booking;
        setPendingBooking(booking);
        setShowPayment(true);

        setLastResult({
          valid:     false,
          pending:   true,
          booking,
          error:     `Balance of ₱${parseFloat(booking.remainingAmount ?? booking.remaining_amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} must be paid before check-in.`,
          scannedAt: new Date().toISOString(),
        });

        const newRecent = [{
          reference: booking.reference,
          valid:     false,
          pending:   true,
          scannedAt: new Date().toISOString(),
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
        }, ...recentScans.slice(0, 4)];
        setRecentScans(newRecent);
        localStorage.setItem('qr_recent_scans', JSON.stringify(newRecent));
        show('Payment required before check-in', 'warning');
        return;
      }

      /* ── Check-in success ─────────────────────────────────────── */
      if (res.ok && data.success) {
        const booking = data.booking;
        setSuccessData({ booking, paymentMethod: null });

        setLastResult({
          valid:     true,
          booking,
          error:     null,
          scannedAt: new Date().toISOString(),
        });

        const newRecent = [{
          reference: booking.reference,
          valid:     true,
          scannedAt: new Date().toISOString(),
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
        }, ...recentScans.slice(0, 4)];
        setRecentScans(newRecent);
        localStorage.setItem('qr_recent_scans', JSON.stringify(newRecent));

        const todayList = JSON.parse(localStorage.getItem('qr_checkins_today') || '[]');
        todayList.push({ bookingId: booking.id, time: new Date().toISOString() });
        localStorage.setItem('qr_checkins_today', JSON.stringify(todayList));
        loadStats();
      } else {
        /* ── Other error ────────────────────────────────────────── */
        setLastResult({
          valid:     false,
          booking:   data.booking || null,
          error:     data.error || 'Check-in failed.',
          scannedAt: new Date().toISOString(),
        });
        show(data.error || 'Check-in failed', 'error');

        const newRecent = [{
          reference: data.booking?.reference || qrData.slice(0, 12),
          valid:     false,
          scannedAt: new Date().toISOString(),
          guestName: data.booking?.guestName || 'Unknown',
          roomNumber: data.booking?.roomNumber || '—',
        }, ...recentScans.slice(0, 4)];
        setRecentScans(newRecent);
        localStorage.setItem('qr_recent_scans', JSON.stringify(newRecent));
      }
    } catch {
      setLastResult({
        valid:     false,
        booking:   null,
        error:     'Network error. Please try again.',
        scannedAt: new Date().toISOString(),
      });
      show('Failed to connect to server', 'error');
    } finally {
      setProcessing(false);
      if (!manualMode) setTimeout(startScanner, 2000);
    }
  }, [processing, token, recentScans, manualMode]);

  /* ══════════════════════════════════════════════════════════════════
     PAYMENT PAID → proceed with check-in
  ══════════════════════════════════════════════════════════════════ */
  const handlePaymentPaid = useCallback(async (method) => {
    setShowPayment(false);
    if (!pendingBooking) return;

    try {
      // Now call check-in endpoint; payment is recorded so it should pass
      const res  = await fetch(`${BASE}/receptionist/bookings/${pendingBooking.id}/checkin/`, {
        method:  'POST',
        headers: hj(token),
        body:    JSON.stringify({ force: true }), // skip payment check server-side
      });
      const data = await res.json();

      if (res.ok && (data.success || data.status)) {
        const booking = data.booking || pendingBooking;
        setSuccessData({ booking, paymentMethod: method });

        setLastResult({
          valid:     true,
          booking,
          error:     null,
          scannedAt: new Date().toISOString(),
        });

        const newRecent = [{
          reference: booking.reference,
          valid:     true,
          scannedAt: new Date().toISOString(),
          guestName: booking.guestName,
          roomNumber: booking.roomNumber,
        }, ...recentScans.slice(0, 4)];
        setRecentScans(newRecent);
        localStorage.setItem('qr_recent_scans', JSON.stringify(newRecent));

        const todayList = JSON.parse(localStorage.getItem('qr_checkins_today') || '[]');
        todayList.push({ bookingId: booking.id, time: new Date().toISOString() });
        localStorage.setItem('qr_checkins_today', JSON.stringify(todayList));
        loadStats();
      } else {
        show(data.error || 'Check-in failed after payment.', 'error');
      }
    } catch {
      show('Network error during check-in.', 'error');
    } finally {
      setPendingBooking(null);
    }
  }, [pendingBooking, token, recentScans]);

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPendingBooking(null);
    if (!manualMode) setTimeout(startScanner, 500);
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

  /* ── Render ── */
  return (
    <div className="ap-root">
      <style>{SHARED_CSS}{EXTRA_CSS}</style>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <QrCode size={22} color="var(--gold-dark)" /> QR Code Check-in
          </h1>
          <p className="ap-sub">Scan guest's QR code to instantly check them in</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="ap-btn-ghost" onClick={resetScanner}><RefreshCw size={14} /> Reset</button>
          <button className="ap-btn-ghost" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? <Camera size={14} /> : <ScanLine size={14} />}
            {manualMode ? 'Switch to Camera' : 'Manual Entry'}
          </button>
          <button className="ap-btn-primary" onClick={() => setPage('arrivals')}>
            <LogIn size={14} /> View Arrivals
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>

        {/* Scanner / manual entry panel */}
        <div className="ap-panel" style={{ marginBottom: 0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title">
              <Camera size={15} /> {manualMode ? 'Manual Entry' : 'QR Scanner'}
            </div>
          </div>
          <div className="ap-panel-body">
            {manualMode ? (
              <div className="ap-field">
                <label className="ap-label">Enter Booking Reference or QR Token</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <input
                    className="ap-input"
                    placeholder="e.g. BMH-XXXXXXXX"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  />
                  <button className="ap-btn-primary" onClick={handleManualSubmit} disabled={processing}>
                    {processing ? <div className="ap-spin-sm" /> : <ArrowRight size={14} />} Check In
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="qr-scanner-container">
                  <div id={containerId} style={{ width: '100%', minHeight: 400 }}>
                    {scannerError && (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <AlertTriangle size={32} color="#ef4444" />
                        <p style={{ color: '#ef4444', marginTop: '.5rem' }}>{scannerError}</p>
                        <button className="ap-btn-primary" onClick={resetScanner} style={{ marginTop: '1rem' }}>Retry</button>
                      </div>
                    )}
                  </div>
                  {!scannerError && !isScanning && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: '.5rem' }}>
                      <Spinner /><span style={{ color: '#fff' }}>Starting camera…</span>
                    </div>
                  )}
                  {!scannerError && isScanning && (
                    <><div className="qr-scanner-frame" /><div className="qr-scan-line" /></>
                  )}
                </div>
                <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>
                  Position QR code within the frame
                </div>
              </div>
            )}

            {/* Result card */}
            {lastResult && (
              <div
                className={`qr-result-card ${lastResult.valid ? 'valid' : lastResult.pending ? 'pending' : 'invalid'}`}
                style={{ marginTop: '1rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                  {lastResult.valid
                    ? <CheckCircle2 size={22} color="#10b981" />
                    : lastResult.pending
                    ? <Clock size={22} color="#f59e0b" />
                    : <XCircle size={22} color="#ef4444" />
                  }
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {lastResult.valid
                        ? 'Check-in Successful!'
                        : lastResult.pending
                        ? 'Payment Required'
                        : 'Check-in Failed'
                      }
                    </div>
                    {lastResult.pending && (
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Balance must be settled first</div>
                    )}
                  </div>
                  {lastResult.pending && (
                    <button
                      className="ap-btn-primary"
                      style={{ marginLeft: 'auto', fontSize: '.75rem', padding: '.4rem .85rem' }}
                      onClick={() => { setPendingBooking(lastResult.booking); setShowPayment(true); }}
                    >
                      <DollarSign size={13} /> Collect Payment
                    </button>
                  )}
                </div>

                {lastResult.booking && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.78rem' }}>
                    <div>Reference: <strong>{lastResult.booking.reference}</strong></div>
                    <div>Guest: {lastResult.booking.guestName}</div>
                    <div>Room: {lastResult.booking.roomType} #{lastResult.booking.roomNumber}</div>
                    <div>Check-out: {fmtDate(lastResult.booking.checkOutDate)}</div>
                    {lastResult.pending && (
                      <div style={{ gridColumn: '1/-1', marginTop: '.25rem' }}>
                        <span className="pm-balance-badge">
                          <AlertTriangle size={11} />
                          Balance: ₱{parseFloat(lastResult.booking.remainingAmount ?? lastResult.booking.remaining_amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {lastResult.valid && (
                      <div style={{ gridColumn: '1/-1', marginTop: '.25rem' }}>
                        <span className="pm-paid-badge">
                          <CheckCircle2 size={11} /> Fully Paid
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {lastResult.error && !lastResult.pending && (
                  <div style={{ marginTop: '.65rem', padding: '.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: '.75rem', color: '#ef4444' }}>
                    ⚠️ {lastResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent scans panel */}
        <div className="ap-panel" style={{ marginBottom: 0 }}>
          <div className="ap-panel-hd">
            <div className="ap-panel-title"><ScanLine size={14} /> Recent Scans</div>
            <button
              className="ap-btn-ghost"
              style={{ fontSize: '.65rem' }}
              onClick={() => { setRecentScans([]); localStorage.setItem('qr_recent_scans', '[]'); }}
            >
              Clear
            </button>
          </div>
          <div className="ap-panel-body">
            {recentScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <QrCode size={28} style={{ opacity: 0.25 }} /><div>No recent scans</div>
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div
                  key={idx}
                  style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem', background: 'var(--surface2)', borderRadius: 10, marginBottom: '.5rem' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: scan.valid
                      ? 'rgba(16,185,129,0.1)'
                      : scan.pending
                      ? 'rgba(245,158,11,0.1)'
                      : 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {scan.valid
                      ? <CheckCircle2 size={14} color="#10b981" />
                      : scan.pending
                      ? <Clock size={14} color="#f59e0b" />
                      : <XCircle size={14} color="#ef4444" />
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.78rem' }}>{scan.reference}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{scan.guestName}</div>
                  </div>
                </div>
              ))
            )}

            {/* How it works */}
            <div style={{ marginTop: '1rem', padding: '.65rem', background: 'rgba(59,130,246,0.04)', borderRadius: 10, fontSize: '.7rem', color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <Sparkles size={12} /> How it works
              </div>
              <div style={{ marginBottom: '.2rem' }}>1. Guest shows QR code from booking confirmation</div>
              <div style={{ marginBottom: '.2rem' }}>2. System verifies booking &amp; payment status</div>
              <div style={{ marginBottom: '.2rem' }}>3. If balance is owed, collect payment first</div>
              <div style={{ marginBottom: '.2rem' }}>4. Guest is checked in &amp; room marked occupied</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Payment modal ══ */}
      {showPayment && pendingBooking && (
        <PaymentModal
          booking={pendingBooking}
          token={token}
          onPaid={handlePaymentPaid}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* ══ Success modal ══ */}
      {successData && (
        <SuccessModal
          booking={successData.booking}
          paymentMethod={successData.paymentMethod}
          onClose={() => {
            setSuccessData(null);
            if (!manualMode) setTimeout(startScanner, 500);
          }}
        />
      )}
    </div>
  );
}

export default ReceptionistQRCheckIn;