// RegisterPage.jsx — Light theme matching admin/guest portal style
import { useState, useRef, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { registerUser, verifyOtp, resendOtp } from '../services/api';
import { calcPasswordStrength } from '../utils/format';
import { useOtpTimer } from '../hooks/useOtpTimer';
import jsPDF from 'jspdf';
import {
  Eye, EyeOff, Hotel, Star, BedDouble, Users, Headphones,
  Mail, AlertTriangle, CheckCircle2, Download, ArrowRight,
  RefreshCw, Shield,
} from 'lucide-react';

/* ─── Terms Data ─────────────────────────────────────────────────────────── */
const TERMS_SECTIONS = [
  { heading:'1. User Responsibilities', body:"By registering and using Cebu Grand Hotel's guest portal, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to engage in any unlawful, fraudulent, or unauthorized use of the platform." },
  { heading:'2. Data Usage & Privacy', body:'We collect personal data including name, email, contact details, and booking history to facilitate reservations and improve your experience. Your data is processed in accordance with the Philippine Data Privacy Act of 2012 (RA 10173) and international GDPR standards. We do not sell your personal information to third parties.' },
  { heading:'3. Booking & Payment Policies', body:'All room bookings are subject to availability and confirmation. A 50% deposit is required at the time of booking to secure your reservation. Final payment is due upon check-in. Room rates are quoted in Philippine Peso (₱) and are inclusive of applicable taxes unless stated otherwise.' },
  { heading:'4. Cancellation & Refund Policy', body:'Cancellations made 72 hours or more before the check-in date are eligible for a full refund of the deposit. Cancellations made within 48–72 hours will incur a 50% cancellation fee. Cancellations made less than 48 hours before check-in are non-refundable. No-shows will be charged the full reservation amount.' },
  { heading:'5. Security & Account Protection', body:'Your account is protected by industry-standard encryption (AES-256). We implement two-factor authentication (2FA) and monitor for suspicious login activity. You are responsible for immediately notifying us of any unauthorized use of your account. We will never request your password via email or phone.' },
  { heading:'6. Limitation of Liability', body:'Cebu Grand Hotel shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this platform. Our total liability to you for any claim shall not exceed the amount paid for the specific service giving rise to the claim. Force majeure events exemption applies.' },
];

/* ─── CSS ──────────────────────────────────────────────────────────────────*/
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:#C9A84C; --gold-dark:#9a7a2e; --gold-bg:rgba(201,168,76,0.1);
    --bg:#f4f6f8; --surface:#fff; --surface2:#f8f9fb;
    --text:#1a1f2e; --text-sub:#4a5568; --text-muted:#8a96a8; --border:#e2e8f0;
    --green:#2d9b6f; --green-bg:rgba(45,155,111,0.1);
    --red:#dc3545; --red-bg:rgba(220,53,69,0.1);
    --blue:#3b82f6; --blue-bg:rgba(59,130,246,0.1);
  }

  .rp-root { min-height:100vh; display:flex; font-family:'DM Sans',sans-serif; color:var(--text); background:var(--bg); -webkit-font-smoothing:antialiased; }
  .rp-root * { box-sizing:border-box; }

  /* ── Left Panel ── */
  .rp-left {
    width:420px; min-width:420px; display:none; flex-direction:column;
    background:#fff; border-right:1px solid var(--border);
    padding:3rem 2.5rem; position:relative; overflow:hidden;
  }
  @media(min-width:1024px){ .rp-left { display:flex } }
  .rp-left-grid {
    position:absolute; inset:0; pointer-events:none; opacity:.025;
    background-image:linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .rp-left-accent {
    position:absolute; bottom:-120px; left:-80px; width:360px; height:360px;
    border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%);
    pointer-events:none;
  }

  .rp-brand { display:flex; align-items:center; gap:.65rem; margin-bottom:3rem; position:relative; z-index:2; }
  .rp-brand-mark { width:38px; height:38px; border-radius:11px; background:linear-gradient(135deg,#9a7a2e,#C9A84C); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 4px 14px rgba(201,168,76,0.3); flex-shrink:0; }
  .rp-brand-name { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--text); line-height:1.2; }
  .rp-brand-sub  { font-size:.62rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.1em; }

  .rp-left-body { flex:1; display:flex; flex-direction:column; justify-content:center; position:relative; z-index:2; }
  .rp-left-title { font-family:'Cormorant Garamond',serif; font-size:2.6rem; font-weight:300; color:var(--text); line-height:1.2; margin-bottom:.75rem; }
  .rp-left-title span { color:var(--gold-dark); }
  .rp-left-sub { font-size:.85rem; color:var(--text-muted); line-height:1.65; margin-bottom:2.25rem; }

  .rp-features { display:flex; flex-direction:column; gap:.85rem; }
  .rp-feature { display:flex; align-items:center; gap:.8rem; }
  .rp-feature-ico { width:36px; height:36px; border-radius:10px; background:var(--gold-bg); border:1px solid rgba(201,168,76,0.2); display:flex; align-items:center; justify-content:center; color:var(--gold-dark); flex-shrink:0; }
  .rp-feature-text { font-size:.83rem; color:var(--text-sub); }
  .rp-feature-title { font-weight:600; color:var(--text); font-size:.85rem; }

  .rp-left-footer { position:relative; z-index:2; margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid var(--border); font-size:.68rem; color:var(--text-muted); letter-spacing:.08em; text-transform:uppercase; }

  /* ── Right Panel ── */
  .rp-right { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem 1.5rem; overflow-y:auto; }
  .rp-card { width:100%; max-width:440px; animation:rp-fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  @keyframes rp-fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  .rp-card-head { text-align:center; margin-bottom:1.75rem; }
  .rp-card-icon { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#9a7a2e,#C9A84C); display:flex; align-items:center; justify-content:center; color:#fff; margin:0 auto .85rem; box-shadow:0 6px 20px rgba(201,168,76,0.28); }
  .rp-card-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:var(--text); margin-bottom:.2rem; }
  .rp-card-sub   { font-size:.82rem; color:var(--text-muted); }

  /* ── Steps ── */
  .rp-steps { display:flex; align-items:center; margin-bottom:1.75rem; }
  .rp-step  { display:flex; align-items:center; gap:.4rem; }
  .rp-step-dot {
    width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:.7rem; font-weight:600; flex-shrink:0; border:1.5px solid var(--border);
    color:var(--text-muted); background:#fff; transition:all .3s;
  }
  .rp-step-dot.active { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; border-color:var(--gold); box-shadow:0 2px 10px rgba(201,168,76,0.3); }
  .rp-step-dot.done   { background:var(--gold-bg); color:var(--gold-dark); border-color:rgba(201,168,76,0.4); }
  .rp-step-label { font-size:.68rem; color:var(--text-muted); letter-spacing:.04em; white-space:nowrap; }
  .rp-step-label.active { color:var(--gold-dark); font-weight:600; }
  .rp-step-label.done   { color:var(--text-sub); }
  .rp-step-line { flex:1; height:1px; background:var(--border); margin:0 .45rem; min-width:14px; }

  /* ── Alert ── */
  .rp-alert { display:flex; align-items:flex-start; gap:.6rem; padding:.75rem 1rem; border-radius:9px; font-size:.82rem; margin-bottom:1.1rem; line-height:1.55; }
  .rp-alert.error   { background:var(--red-bg); border:1px solid rgba(220,53,69,0.22); color:var(--red); }
  .rp-alert.success { background:var(--green-bg); border:1px solid rgba(45,155,111,0.22); color:var(--green); }

  /* ── Fields ── */
  .rp-field { margin-bottom:1rem; }
  .rp-label { display:block; font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); font-weight:700; margin-bottom:.4rem; }
  .rp-input-wrap { position:relative; }
  .rp-input {
    width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text);
    border-radius:9px; padding:.7rem 1rem; font-size:.875rem; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
  }
  .rp-input::placeholder { color:var(--text-muted); }
  .rp-input:focus { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
  .rp-input.has-icon  { padding-right:2.75rem; }
  .rp-input.error { border-color:rgba(220,53,69,0.5); }
  .rp-input.valid { border-color:rgba(45,155,111,0.5); }
  .rp-input-btn { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; padding:0; transition:color .18s; }
  .rp-input-btn:hover { color:var(--gold-dark); }

  /* ── Strength bars ── */
  .rp-strength { display:flex; gap:5px; margin-top:.55rem; }
  .rp-strength-bar { flex:1; height:3px; border-radius:99px; background:var(--border); transition:background .3s; }
  .rp-field-note { font-size:.73rem; margin-top:.38rem; }
  .rp-field-note.warn { color:var(--red); }
  .rp-field-note.ok   { color:var(--green); }

  /* ── Buttons ── */
  .rp-btn { width:100%; padding:.78rem 1rem; border:none; border-radius:10px; font-size:.875rem; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .22s; display:flex; align-items:center; justify-content:center; gap:.45rem; }
  .rp-btn-primary { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; box-shadow:0 3px 12px rgba(201,168,76,0.28); }
  .rp-btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); transform:translateY(-1px); box-shadow:0 5px 18px rgba(201,168,76,0.32); }
  .rp-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .rp-btn-ghost { background:#fff; border:1.5px solid var(--border); color:var(--text-sub); }
  .rp-btn-ghost:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-bg); }

  @keyframes rp-spin { to { transform:rotate(360deg) } }
  .rp-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:rp-spin .7s linear infinite; flex-shrink:0; }

  .rp-divider { display:flex; align-items:center; gap:.65rem; margin:1.15rem 0; font-size:.72rem; color:var(--text-muted); letter-spacing:.05em; text-transform:uppercase; }
  .rp-divider::before,.rp-divider::after { content:''; flex:1; height:1px; background:var(--border); }

  .rp-signin { text-align:center; font-size:.82rem; color:var(--text-muted); margin-top:1.35rem; }
  .rp-signin button { background:none; border:none; color:var(--gold-dark); font-weight:600; cursor:pointer; font-size:inherit; font-family:inherit; transition:color .18s; padding:0; }
  .rp-signin button:hover { color:var(--gold); text-decoration:underline; }

  /* ── Terms Modal ── */
  .rp-terms-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.12); }
  .rp-terms-modal .modal-header  { background:var(--surface2); border-bottom:1px solid var(--border); padding:1.2rem 1.5rem; }
  .rp-terms-modal .modal-body    { background:#fff; padding:1.5rem; overflow-y:auto; max-height:50vh; scrollbar-width:thin; scrollbar-color:rgba(201,168,76,0.35) #f0f0f0; }
  .rp-terms-modal .modal-body::-webkit-scrollbar { width:5px; }
  .rp-terms-modal .modal-body::-webkit-scrollbar-thumb { background:rgba(201,168,76,0.4); border-radius:99px; }
  .rp-terms-modal .modal-footer  { background:var(--surface2); border-top:1px solid var(--border); padding:1rem 1.5rem; flex-direction:column; gap:.75rem; align-items:stretch; }

  .rp-terms-progress { height:3px; background:var(--border); border-radius:99px; overflow:hidden; margin-top:.6rem; }
  .rp-terms-fill     { height:100%; background:linear-gradient(to right,#9a7a2e,#C9A84C); transition:width .2s; }

  .rp-terms-section { margin-bottom:1.75rem; }
  .rp-terms-sec-hd  { display:flex; align-items:center; gap:.6rem; margin-bottom:.6rem; }
  .rp-terms-sec-num { width:26px; height:26px; border-radius:7px; background:var(--gold-bg); border:1px solid rgba(201,168,76,0.2); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; color:var(--gold-dark); flex-shrink:0; }
  .rp-terms-sec-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; color:var(--text); font-weight:600; }
  .rp-terms-sec-body  { font-size:.82rem; color:var(--text-sub); line-height:1.82; padding-left:calc(26px + .6rem); }
  .rp-terms-footer-note { font-size:.76rem; color:var(--text-sub); padding:.85rem 1rem; background:var(--gold-bg); border-radius:9px; border:1px solid rgba(201,168,76,0.2); line-height:1.65; }

  .rp-check-row   { display:flex; align-items:flex-start; gap:.6rem; }
  .rp-check-box   { width:19px; height:19px; border-radius:6px; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; cursor:pointer; transition:all .18s; background:#fff; }
  .rp-check-box.on  { border-color:var(--gold); background:var(--gold-bg); }
  .rp-check-box.off { cursor:not-allowed; opacity:.45; }
  .rp-check-label   { font-size:.82rem; color:var(--text-sub); line-height:1.5; cursor:pointer; }
  .rp-check-label.off { cursor:not-allowed; opacity:.5; }
  .rp-scroll-hint { font-size:.73rem; color:var(--text-muted); text-align:center; }
  .rp-dl-btn { background:none; border:1px solid rgba(201,168,76,0.35); color:var(--gold-dark); border-radius:7px; padding:.28rem .75rem; font-size:.72rem; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .18s; }
  .rp-dl-btn:hover { background:var(--gold-bg); border-color:var(--gold); }

  /* ── OTP Modal ── */
  .rp-otp-modal .modal-content { background:#fff; border:1px solid var(--border); border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,.12); }
  .rp-otp-modal .modal-body    { background:#fff; padding:2.5rem 2rem 2rem; }

  .rp-otp-icon { width:62px; height:62px; border-radius:50%; background:var(--gold-bg); border:1px solid rgba(201,168,76,0.25); display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem; color:var(--gold-dark); }
  .rp-otp-inputs { display:flex; justify-content:center; gap:.5rem; margin:1.65rem 0 1.2rem; }
  .rp-otp-box { width:48px; height:58px; text-align:center; font-size:1.45rem; font-weight:700; border:1.5px solid var(--border); border-radius:10px; outline:none; background:var(--surface2); color:var(--text); font-family:'DM Sans',sans-serif; transition:all .2s; }
  .rp-otp-box:focus  { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
  .rp-otp-box.filled { border-color:rgba(201,168,76,0.55); background:var(--gold-bg); }

  .rp-otp-resend { background:none; border:none; color:var(--gold-dark); font-size:.83rem; cursor:pointer; font-family:'DM Sans',sans-serif; padding:0; font-weight:600; transition:color .18s; }
  .rp-otp-resend:hover { color:var(--gold); text-decoration:underline; }
  .rp-otp-timer  { font-size:.83rem; color:var(--text-muted); }
`;

/* ─── PDF ─────────────────────────────────────────────────────────────────*/
function downloadTermsPDF() {
  const doc = new jsPDF();
  let y = 12;
  doc.setFontSize(17);
  doc.text('Terms & Conditions — Cebu Grand Hotel', 105, y, { align:'center' });
  y += 13;
  TERMS_SECTIONS.forEach(s => {
    if (y > 265) { doc.addPage(); y = 12; }
    doc.setFontSize(12); doc.text(s.heading, 10, y); y += 7;
    doc.setFontSize(10);
    doc.splitTextToSize(s.body, 180).forEach(line => { doc.text(line, 10, y); y += 5; });
    y += 5;
  });
  doc.save('CGH_Terms_Conditions.pdf');
}

/* ─── Terms Modal ────────────────────────────────────────────────────────*/
function TermsModal({ show, onAccept, onDecline }) {
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled,  setScrolled]  = useState(false);
  const [agree1,    setAgree1]    = useState(false);
  const [agree2,    setAgree2]    = useState(false);

  const handleScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const pct = scrollTop / (scrollHeight - clientHeight);
    setScrollPct(Math.round(pct * 100));
    if (pct > 0.85) setScrolled(true);
  };

  return (
    <Modal show={show} onHide={onDecline} size="lg" centered className="rp-terms-modal">
      <Modal.Header closeButton>
        <div style={{ width:'100%' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.3rem' }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', color:'var(--text)', fontWeight:600 }}>
              Terms &amp; Conditions
            </span>
            <button className="rp-dl-btn" onClick={downloadTermsPDF}>
              <Download size={12} style={{ display:'inline', marginRight:'.3rem' }}/>PDF
            </button>
          </div>
          <p style={{ fontSize:'.73rem', color:'var(--text-muted)', marginBottom:'.6rem' }}>
            Please scroll through all sections before accepting
          </p>
          <div className="rp-terms-progress">
            <div className="rp-terms-fill" style={{ width:`${scrollPct}%` }}/>
          </div>
          <p style={{ fontSize:'.7rem', color:'var(--gold-dark)', marginTop:'.3rem', fontWeight:600 }}>{scrollPct}% read</p>
        </div>
      </Modal.Header>

      <Modal.Body onScroll={handleScroll}>
        {TERMS_SECTIONS.map((s, i) => (
          <div key={i} className="rp-terms-section">
            <div className="rp-terms-sec-hd">
              <div className="rp-terms-sec-num">{i+1}</div>
              <div className="rp-terms-sec-title">{s.heading.replace(/^\d+\.\s/,'')}</div>
            </div>
            <p className="rp-terms-sec-body">{s.body}</p>
          </div>
        ))}
        <div className="rp-terms-footer-note">
          These Terms &amp; Conditions were last updated on <strong style={{ color:'var(--gold-dark)' }}>February 25, 2026</strong>. By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
        </div>
      </Modal.Body>

      <Modal.Footer>
        {!scrolled && <p className="rp-scroll-hint">↓ Scroll to the bottom to unlock the checkboxes</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
          {[
            [agree1, setAgree1, 'I have read and agree to the Terms & Conditions'],
            [agree2, setAgree2, 'I agree to the Privacy Policy and Data Usage terms'],
          ].map(([val, set, label], i) => (
            <div key={i} className="rp-check-row">
              <div className={`rp-check-box ${val?'on':''} ${!scrolled?'off':''}`} onClick={() => scrolled && set(!val)}>
                {val && <CheckCircle2 size={13} color="var(--gold-dark)"/>}
              </div>
              <span className={`rp-check-label ${!scrolled?'off':''}`} onClick={() => scrolled && set(!val)}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'.55rem' }}>
          <button className="rp-btn rp-btn-ghost" style={{ width:'auto', padding:'.58rem 1.25rem' }} onClick={onDecline}>Decline</button>
          <button className="rp-btn rp-btn-primary" style={{ width:'auto', padding:'.58rem 1.5rem' }} disabled={!agree1||!agree2} onClick={onAccept}>
            <CheckCircle2 size={15}/>Accept &amp; Continue
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/* ─── Steps ──────────────────────────────────────────────────────────────*/
function Steps({ current }) {
  const steps = [{ label:'Details', id:1 }, { label:'Terms', id:2 }, { label:'Verify', id:3 }];
  return (
    <div className="rp-steps">
      {steps.map((s, i) => {
        const st = current > s.id ? 'done' : current === s.id ? 'active' : 'pending';
        return (
          <div key={s.id} className="rp-step" style={{ flex: i < steps.length-1 ? 1 : 'none' }}>
            <div className={`rp-step-dot ${st}`}>{st==='done' ? <CheckCircle2 size={13}/> : s.id}</div>
            <span className={`rp-step-label ${st}`}>{s.label}</span>
            {i < steps.length-1 && <div className="rp-step-line"/>}
          </div>
        );
      })}
    </div>
  );
}

/* ─── RegisterPage ───────────────────────────────────────────────────────*/
export function RegisterPage({ onGoLogin }) {
  const [form, setForm]           = useState({ username:'', email:'', password:'', confirmPassword:'' });
  const [showPw, setShowPw]       = useState(false);
  const [strength, setStrength]   = useState({ level:0, color:'#eee', text:'' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [termsOpen, setTermsOpen] = useState(false);
  const [otpOpen, setOtpOpen]     = useState(false);
  const [otp, setOtp]             = useState(['','','','','','']);
  const [otpError, setOtpError]   = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [step, setStep]           = useState(1);
  const otpRefs = useRef([]);
  const { timer, start:startTimer, isRunning } = useOtpTimer(60);

  const handlePasswordChange = val => {
    setForm(f => ({ ...f, password:val }));
    setStrength(calcPasswordStrength(val));
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setStep(2); setTermsOpen(true);
  };

  const handleTermsAccepted = async () => {
    setTermsOpen(false); setLoading(true); setStep(3);
    try {
      await registerUser({ username:form.username, email:form.email, password:form.password });
      setOtpOpen(true); startTimer();
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        setOtpOpen(true); startTimer();
      } else { setError(err.message); setStep(1); }
    } finally { setLoading(false); }
  };

  const handleOtpChange = useCallback((i, val) => {
    const v = val.replace(/\D/,'').slice(0,1);
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) otpRefs.current[i+1]?.focus();
    if (next.every(d => d)) setTimeout(() => submitOtp(next.join('')), 300);
  }, [otp]);

  const handleOtpKey = useCallback((i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i-1] = ''; setOtp(next);
      otpRefs.current[i-1]?.focus();
    }
  }, [otp]);

  const submitOtp = async code => {
    setOtpLoading(true); setOtpError('');
    try {
      await verifyOtp(form.email, code);
      sessionStorage.setItem('regSuccess','true');
      onGoLogin();
    } catch {
      setOtpError('Invalid or expired code. Please try again.');
      setOtp(['','','','','','']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    try { await resendOtp(form.email); } catch { /* silent */ }
    setOtp(['','','','','','']); startTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const pwMatch    = form.confirmPassword && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="rp-root">
      <style>{css}</style>

      {/* ── Left Panel ── */}
      <div className="rp-left">
        <div className="rp-left-grid"/>
        <div className="rp-left-accent"/>

        <div className="rp-brand">
          <div className="rp-brand-mark"><Hotel size={18}/></div>
          <div>
            <div className="rp-brand-name">Cebu Grand Hotel</div>
            <div className="rp-brand-sub">Guest Portal</div>
          </div>
        </div>

        <div className="rp-left-body">
          <h2 className="rp-left-title">
            Your <span>Grand</span><br/>Stay Begins<br/>Here
          </h2>
          <p className="rp-left-sub">
            Create your account to unlock exclusive rates, manage your bookings, and enjoy a seamless stay experience.
          </p>
          <div className="rp-features">
            {[
              { Icon:BedDouble,   title:'Instant Booking',      text:'Real-time room availability' },
              { Icon:Star,        title:'Exclusive Rates',       text:'Member-only prices & rewards' },
              { Icon:Shield,      title:'Secure & Private',      text:'Your data is fully protected' },
              { Icon:Headphones,  title:'24/7 Concierge',        text:'Always here when you need us' },
            ].map((f, i) => (
              <div key={i} className="rp-feature">
                <div className="rp-feature-ico"><f.Icon size={16}/></div>
                <div>
                  <div className="rp-feature-title">{f.title}</div>
                  <div className="rp-feature-text">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-left-footer">© 2026 Cebu Grand Hotel · Est. 1987</div>
      </div>

      {/* ── Right Panel ── */}
      <div className="rp-right">
        <div className="rp-card">

          <div className="rp-card-head">
            <div className="rp-card-icon"><Hotel size={22}/></div>
            <h2 className="rp-card-title">Create Account</h2>
            <p className="rp-card-sub">Begin your luxury stay experience</p>
          </div>

          <Steps current={step}/>

          {error && (
            <div className="rp-alert error">
              <AlertTriangle size={15} style={{ flexShrink:0, marginTop:1 }}/>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="rp-field">
              <label className="rp-label">Username</label>
              <div className="rp-input-wrap">
                <input className="rp-input" type="text" required autoComplete="username"
                  value={form.username} placeholder="e.g. johndoe"
                  onChange={e => setForm({ ...form, username:e.target.value })}/>
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Email Address</label>
              <div className="rp-input-wrap">
                <input className="rp-input" type="email" required autoComplete="email"
                  value={form.email} placeholder="you@example.com"
                  onChange={e => setForm({ ...form, email:e.target.value })}/>
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Password</label>
              <div className="rp-input-wrap">
                <input className={`rp-input has-icon`} type={showPw?'text':'password'} required autoComplete="new-password"
                  value={form.password} placeholder="Min. 8 characters"
                  onChange={e => handlePasswordChange(e.target.value)}/>
                <button type="button" className="rp-input-btn" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="rp-strength">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rp-strength-bar" style={{ background: i<=(strength.level||0) ? strength.color : undefined }}/>
                    ))}
                  </div>
                  <p className="rp-field-note" style={{ color:strength.color }}>{strength.text}</p>
                </>
              )}
            </div>

            <div className="rp-field">
              <label className="rp-label">Confirm Password</label>
              <div className="rp-input-wrap">
                <input className={`rp-input ${pwMismatch?'error':pwMatch?'valid':''}`}
                  type="password" required autoComplete="new-password"
                  value={form.confirmPassword} placeholder="Repeat your password"
                  onChange={e => setForm({ ...form, confirmPassword:e.target.value })}/>
              </div>
              {pwMismatch && <p className="rp-field-note warn">✗ Passwords do not match</p>}
              {pwMatch    && <p className="rp-field-note ok">✓ Passwords match</p>}
            </div>

            <button type="submit" className="rp-btn rp-btn-primary" disabled={loading||!!pwMismatch} style={{ marginTop:'.65rem' }}>
              {loading
                ? <><div className="rp-spinner"/>Creating account…</>
                : <>Continue to Terms <ArrowRight size={15}/></>}
            </button>
          </form>

          <div className="rp-divider">or</div>

          <p className="rp-signin">
            Already have an account? <button onClick={onGoLogin}>Sign in</button>
          </p>
        </div>
      </div>

      {/* ── Terms Modal ── */}
      <TermsModal show={termsOpen} onAccept={handleTermsAccepted} onDecline={() => { setTermsOpen(false); setStep(1); }}/>

      {/* ── OTP Modal ── */}
      <Modal show={otpOpen} onHide={() => setOtpOpen(false)} centered className="rp-otp-modal">
        <Modal.Body>
          <div style={{ textAlign:'center' }}>
            <div className="rp-otp-icon"><Mail size={26}/></div>
            <h5 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.65rem', color:'var(--text)', fontWeight:600, marginBottom:'.35rem' }}>
              Verify Your Email
            </h5>
            <p style={{ fontSize:'.83rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'.25rem' }}>
              We sent a 6-digit code to
            </p>
            <p style={{ fontSize:'.87rem', color:'var(--text)', fontWeight:700, marginBottom:0 }}>{form.email}</p>

            {otpError && (
              <div className="rp-alert error" style={{ textAlign:'left', marginTop:'1rem', marginBottom:0 }}>
                <AlertTriangle size={14} style={{ flexShrink:0 }}/><span>{otpError}</span>
              </div>
            )}

            <div className="rp-otp-inputs">
              {otp.map((v, i) => (
                <input key={i} ref={el => (otpRefs.current[i]=el)}
                  className={`rp-otp-box ${v?'filled':''}`}
                  type="text" inputMode="numeric" maxLength={1} value={v}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}/>
              ))}
            </div>

            <div style={{ marginBottom:'1.5rem' }}>
              {isRunning
                ? <p className="rp-otp-timer">Resend available in <strong style={{ color:'var(--gold-dark)' }}>{timer}s</strong></p>
                : <button className="rp-otp-resend" onClick={handleResend}><RefreshCw size={13} style={{ display:'inline', marginRight:'.3rem' }}/>Resend Code</button>
              }
            </div>

            <button className="rp-btn rp-btn-primary" disabled={otpLoading||otp.join('').length<6} onClick={() => submitOtp(otp.join(''))}>
              {otpLoading
                ? <><div className="rp-spinner"/>Verifying…</>
                : <><CheckCircle2 size={15}/>Verify &amp; Complete Registration</>}
            </button>

            <p style={{ fontSize:'.74rem', color:'var(--text-muted)', marginTop:'1rem', lineHeight:1.65 }}>
              Didn't receive the email? Check your spam folder or use the resend option above.
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}