// RegisterPage.jsx – Enhanced UI v2 (Google/Facebook + scrollbar + text visibility)
import { useState, useRef, useCallback } from 'react';
import { Modal } from 'react-bootstrap';
import { Icons } from '../components/ui/Icons';
import { registerUser, verifyOtp, resendOtp } from '../services/api';
import { calcPasswordStrength } from '../utils/format';
import { useOtpTimer } from '../hooks/useOtpTimer';
import jsPDF from 'jspdf';

/* ─── SVG Icons for Social Providers ────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M18 9.056C18 4.053 13.97 0 9 0S0 4.053 0 9.056c0 4.522 3.291 8.267 7.594 8.944v-6.327H5.309V9.056h2.285V7.063c0-2.27 1.343-3.523 3.4-3.523.984 0 2.014.177 2.014.177v2.228h-1.135c-1.118 0-1.467.698-1.467 1.414v1.697h2.496l-.399 2.617h-2.097V18C14.709 17.323 18 13.578 18 9.056z" fill="#1877F2"/>
  </svg>
);

/* ─── Terms Data ─────────────────────────────────────────────────────────── */
const TERMS_SECTIONS = [
  {
    heading: '1. User Responsibilities',
    body: "By registering and using Cebu Grand Hotel's guest portal, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to engage in any unlawful, fraudulent, or unauthorized use of the platform.",
  },
  {
    heading: '2. Data Usage & Privacy',
    body: 'We collect personal data including name, email, contact details, and booking history to facilitate reservations and improve your experience. Your data is processed in accordance with the Philippine Data Privacy Act of 2012 (RA 10173) and international GDPR standards. We do not sell your personal information to third parties.',
  },
  {
    heading: '3. Booking & Payment Policies',
    body: 'All room bookings are subject to availability and confirmation. A 50% deposit is required at the time of booking to secure your reservation. Final payment is due upon check-in. Room rates are quoted in Philippine Peso (\u20B1) and are inclusive of applicable taxes unless stated otherwise.',
  },
  {
    heading: '4. Cancellation & Refund Policy',
    body: 'Cancellations made 72 hours or more before the check-in date are eligible for a full refund of the deposit. Cancellations made within 48\u201372 hours will incur a 50% cancellation fee. Cancellations made less than 48 hours before check-in are non-refundable. No-shows will be charged the full reservation amount.',
  },
  {
    heading: '5. Security & Account Protection',
    body: 'Your account is protected by industry-standard encryption (AES-256). We implement two-factor authentication (2FA) and monitor for suspicious login activity. You are responsible for immediately notifying us of any unauthorized use of your account. We will never request your password via email or phone.',
  },
  {
    heading: '6. Limitation of Liability',
    body: 'Cebu Grand Hotel shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this platform. Our total liability to you for any claim shall not exceed the amount paid for the specific service giving rise to the claim. Force majeure events exemption applies.',
  },
];

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:        #C9A84C;
    --gold-bright: #dfc06e;
    --gold-dim:    rgba(201,168,76,0.65);
    --gold-faint:  rgba(201,168,76,0.12);
    --bg:          #070b13;
    --surface:     #0d1422;
    --surface2:    #131d2e;
    --text:        #f0ece3;
    --text-sub:    rgba(240,236,227,0.78);
    --text-muted:  rgba(240,236,227,0.5);
    --border:      rgba(201,168,76,0.18);
    --border-soft: rgba(255,255,255,0.09);
    --red:         #e05252;
    --green:       #52c98a;
  }

  /* ══ Custom Scrollbars (global) ══ */
  * { scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.4) rgba(255,255,255,0.04); }
  *::-webkit-scrollbar { width: 6px; height: 6px; }
  *::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 99px; margin: 4px 0; }
  *::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, rgba(201,168,76,0.65), rgba(201,168,76,0.25));
    border-radius: 99px;
  }
  *::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #C9A84C, rgba(201,168,76,0.55)); }
  *::-webkit-scrollbar-corner { background: transparent; }

  .cgh-root * { box-sizing: border-box; }

  /* ══ Animations ══ */
  @keyframes fadeUp    { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes shimmer   { 0%,100% { opacity:.3 } 50% { opacity:.75 } }
  @keyframes pulseRing { 0% { box-shadow:0 0 0 0 rgba(201,168,76,.45) } 70% { box-shadow:0 0 0 10px rgba(201,168,76,0) } 100% { box-shadow:0 0 0 0 rgba(201,168,76,0) } }
  @keyframes spin      { to { transform:rotate(360deg) } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }

  /* ══ Root Layout ══ */
  .cgh-root {
    min-height: 100vh; display: flex;
    background: var(--bg); font-family: 'DM Sans', sans-serif;
    color: var(--text); -webkit-font-smoothing: antialiased;
  }

  /* ══════════════════════════════════
     LEFT PANEL
  ══════════════════════════════════ */
  .cgh-left {
    flex: 1; display: none; flex-direction: column; align-items: center;
    justify-content: center; padding: 3.5rem; position: relative; overflow: hidden;
    border-right: 1px solid var(--border);
    background:
      radial-gradient(ellipse at 28% 55%, rgba(201,168,76,0.11) 0%, transparent 58%),
      radial-gradient(ellipse at 78% 15%, rgba(201,168,76,0.06) 0%, transparent 45%),
      var(--bg);
  }
  @media(min-width:1024px){ .cgh-left { display:flex } }

  .cgh-left-grid {
    position: absolute; inset: 0; pointer-events: none; opacity: .025;
    background-image:
      linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .cgh-left-vline {
    position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.22) 25%, rgba(201,168,76,0.22) 75%, transparent);
  }
  .cgh-left-content { position: relative; z-index: 2; text-align: center; }

  .cgh-crest {
    width: 96px; height: 96px; border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.35);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 2.75rem;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    box-shadow: 0 0 50px rgba(201,168,76,0.13), 0 0 0 10px rgba(201,168,76,0.04);
    animation: shimmer 3.5s ease-in-out infinite;
  }

  .cgh-left-title {
    font-family: 'Cormorant Garamond', serif; font-size: 3.1rem; font-weight: 300;
    color: var(--text); line-height: 1.18; letter-spacing: .015em; margin-bottom: 1.6rem;
  }
  .cgh-left-title em { color: var(--gold); font-style: normal; }

  .cgh-divider { width: 52px; height: 1px; background: var(--gold-dim); margin: 0 auto 1.85rem; opacity: .35; }

  .cgh-feature-list { list-style: none; padding: 0; margin: 0; display: inline-flex; flex-direction: column; gap: 1.05rem; text-align: left; }
  .cgh-feature-list li { display: flex; align-items: center; gap: .75rem; font-size: .83rem; color: var(--text-sub); letter-spacing: .025em; }
  .cgh-feature-icon {
    width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0; display: flex;
    align-items: center; justify-content: center; font-size: .88rem;
    background: var(--gold-faint); border: 1px solid var(--border);
  }
  .cgh-tagline { margin-top: 2.75rem; font-size: .68rem; letter-spacing: .18em; text-transform: uppercase; color: rgba(201,168,76,0.42); }

  /* ══════════════════════════════════
     RIGHT PANEL
  ══════════════════════════════════ */
  .cgh-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 2.5rem 1.5rem; overflow-y: auto;
  }
  .cgh-card { width: 100%; max-width: 432px; animation: fadeUp .6s cubic-bezier(.22,1,.36,1) both; }

  .cgh-logo {
    font-family: 'Cormorant Garamond', serif; font-size: 1.45rem; font-weight: 600;
    color: var(--gold); letter-spacing: .12em; text-align: center; margin-bottom: 2.25rem;
  }
  .cgh-logo-sub { opacity: .5; font-size: .88rem; font-weight: 400; margin-left: .3rem; letter-spacing: .06em; }

  .cgh-heading     { font-family: 'Cormorant Garamond', serif; font-size: 2.15rem; font-weight: 300; color: var(--text); margin-bottom: .3rem; line-height: 1.2; }
  .cgh-subheading  { font-size: .83rem; color: var(--text-muted); margin-bottom: 1.6rem; }

  /* ══ Step Indicator ══ */
  .cgh-steps { display: flex; align-items: center; margin-bottom: 1.75rem; }
  .cgh-step  { display: flex; align-items: center; gap: .45rem; }
  .cgh-step-dot {
    width: 27px; height: 27px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: .7rem; font-weight: 600; flex-shrink: 0;
    border: 1.5px solid var(--border); transition: all .35s ease; color: var(--text-muted);
  }
  .cgh-step-dot.active  { background: var(--gold); color: #070b13; border-color: var(--gold); animation: pulseRing 2s ease infinite; }
  .cgh-step-dot.done    { background: rgba(201,168,76,0.15); color: var(--gold); border-color: rgba(201,168,76,0.45); }
  .cgh-step-label { font-size: .68rem; letter-spacing: .05em; color: var(--text-muted); white-space: nowrap; }
  .cgh-step-label.active { color: var(--gold); font-weight: 500; }
  .cgh-step-label.done   { color: var(--text-sub); }
  .cgh-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 .5rem; min-width: 16px; }

  /* ══ Social Auth ══ */
  .cgh-social-row { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-bottom: .6rem; }
  .cgh-social-btn {
    display: flex; align-items: center; justify-content: center; gap: .55rem;
    padding: .72rem .8rem; border-radius: 11px; border: 1px solid var(--border-soft);
    background: rgba(255,255,255,0.04); cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: .83rem; font-weight: 500; color: var(--text-sub);
    transition: all .22s ease; position: relative; overflow: hidden;
  }
  .cgh-social-btn:hover { color: var(--text); transform: translateY(-2px); }
  .cgh-social-btn.google:hover   { border-color: rgba(66,133,244,0.45); box-shadow: 0 6px 20px rgba(66,133,244,0.14), 0 0 0 1px rgba(66,133,244,0.15); }
  .cgh-social-btn.facebook:hover { border-color: rgba(24,119,242,0.45); box-shadow: 0 6px 20px rgba(24,119,242,0.14), 0 0 0 1px rgba(24,119,242,0.15); }
  .cgh-social-btn:active { transform: translateY(0); }

  .cgh-social-note { font-size: .72rem; color: var(--text-muted); text-align: center; margin-bottom: .25rem; line-height: 1.55; }

  /* ══ Divider ══ */
  .cgh-or { display: flex; align-items: center; gap: .75rem; margin: 1.25rem 0; font-size: .72rem; color: var(--text-muted); letter-spacing: .06em; text-transform: uppercase; }
  .cgh-or::before, .cgh-or::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }

  /* ══ Fields ══ */
  .cgh-field { margin-bottom: 1.15rem; }
  .cgh-label { display: block; font-size: .7rem; letter-spacing: .09em; text-transform: uppercase; color: var(--gold-dim); font-weight: 500; margin-bottom: .5rem; }

  .cgh-input-wrap { position: relative; }
  .cgh-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
    color: var(--text); border-radius: 10px; padding: .74rem 1rem; font-size: .875rem;
    font-family: 'DM Sans', sans-serif; font-weight: 400;
    transition: border-color .2s, background .2s, box-shadow .2s; outline: none;
    -webkit-font-smoothing: antialiased;
  }
  .cgh-input::placeholder { color: rgba(240,236,227,0.24); }
  .cgh-input:focus { border-color: rgba(201,168,76,0.6); background: rgba(201,168,76,0.04); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .cgh-input.has-icon { padding-right: 3rem; }
  .cgh-input.error { border-color: rgba(224,82,82,0.6); box-shadow: 0 0 0 3px rgba(224,82,82,0.08); }
  .cgh-input.valid { border-color: rgba(82,201,138,0.5); }

  .cgh-input-icon { position: absolute; right: .9rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(201,168,76,0.5); display: flex; align-items: center; padding: 0; transition: color .2s; }
  .cgh-input-icon:hover { color: var(--gold); }

  /* ══ Strength ══ */
  .cgh-strength-bars { display: flex; gap: 5px; margin-top: .6rem; }
  .cgh-strength-bar  { flex: 1; height: 3px; border-radius: 99px; transition: background .35s; background: rgba(255,255,255,0.07); }

  /* ══ Field Notes ══ */
  .cgh-field-note      { font-size: .73rem; margin-top: .4rem; font-weight: 400; }
  .cgh-field-note.warn { color: #f08080; }
  .cgh-field-note.ok   { color: #52c98a; }
  .cgh-field-note.info { color: var(--text-muted); }

  /* ══ Alert ══ */
  .cgh-alert { border-radius: 10px; padding: .78rem 1rem; margin-bottom: 1.2rem; font-size: .82rem; display: flex; align-items: flex-start; gap: .65rem; animation: slideDown .25s ease; line-height: 1.55; }
  .cgh-alert.error   { background: rgba(224,82,82,0.09); border: 1px solid rgba(224,82,82,0.28); color: #f08080; }
  .cgh-alert.success { background: rgba(82,201,138,0.09); border: 1px solid rgba(82,201,138,0.28); color: #52c98a; }

  /* ══ Buttons ══ */
  .cgh-btn {
    width: 100%; padding: .84rem 1rem; border: none; border-radius: 11px; font-size: .875rem;
    font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: .025em; cursor: pointer;
    transition: all .25s cubic-bezier(.22,1,.36,1); display: flex; align-items: center;
    justify-content: center; gap: .5rem; -webkit-font-smoothing: antialiased;
  }
  .cgh-btn-primary { background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: #070b13; }
  .cgh-btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #b09038, #dfc06e); box-shadow: 0 6px 28px rgba(201,168,76,0.32); transform: translateY(-1px); }
  .cgh-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .cgh-btn-primary:disabled { opacity: .48; cursor: not-allowed; }

  .cgh-btn-ghost { background: transparent; border: 1px solid rgba(240,236,227,0.15); color: var(--text-muted); font-size: .83rem; }
  .cgh-btn-ghost:hover { background: rgba(255,255,255,0.04); color: var(--text); }

  .cgh-spinner { width: 16px; height: 16px; border: 2px solid rgba(7,11,19,.3); border-top-color: #070b13; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }

  .cgh-signin { text-align: center; font-size: .81rem; color: var(--text-muted); margin-top: 1.5rem; }
  .cgh-signin button { background: none; border: none; color: var(--gold); font-weight: 500; cursor: pointer; padding: 0; font-size: inherit; font-family: inherit; transition: color .2s; }
  .cgh-signin button:hover { color: var(--gold-bright); text-decoration: underline; }

  /* ══════════════════════════════════
     TERMS MODAL
  ══════════════════════════════════ */
  .terms-modal .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.65); }
  .terms-modal .modal-header  { background: var(--surface); border-bottom: 1px solid var(--border); padding: 1.4rem 1.6rem; }
  .terms-modal .modal-body    { background: var(--surface); padding: 1.6rem; overflow-y: auto; max-height: 50vh;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.45) rgba(255,255,255,0.04);
  }
  .terms-modal .modal-body::-webkit-scrollbar       { width: 5px; }
  .terms-modal .modal-body::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 99px; margin: 6px 0; }
  .terms-modal .modal-body::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, rgba(201,168,76,.7), rgba(201,168,76,.25)); border-radius: 99px; }
  .terms-modal .modal-footer  { background: var(--surface); border-top: 1px solid var(--border); padding: 1.1rem 1.6rem; flex-direction: column; gap: .85rem; align-items: stretch; }
  .terms-modal .btn-close     { filter: invert(1) brightness(.65); }

  .terms-progress      { height: 3px; border-radius: 99px; background: rgba(255,255,255,0.07); overflow: hidden; margin-top: .7rem; }
  .terms-progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(to right, #9a7a2e, #C9A84C); transition: width .25s ease; }

  .terms-section       { margin-bottom: 1.9rem; }
  .terms-section-head  { display: flex; align-items: center; gap: .65rem; margin-bottom: .65rem; }
  .terms-section-num   { width: 26px; height: 26px; border-radius: 8px; background: var(--gold-faint); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; color: var(--gold); flex-shrink: 0; }
  .terms-section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.08rem; color: var(--gold-bright); font-weight: 600; line-height: 1.3; }
  .terms-section-body  { font-size: .83rem; color: var(--text-sub); line-height: 1.88; padding-left: calc(26px + .65rem); }

  .terms-footer-note { font-size: .76rem; color: var(--text-sub); padding: .9rem 1rem; background: var(--gold-faint); border-radius: 10px; border: 1px solid var(--border); line-height: 1.65; }
  .terms-footer-note strong { color: var(--gold-bright); font-weight: 600; }

  .cgh-checkbox-row { display: flex; align-items: flex-start; gap: .65rem; }
  .cgh-custom-check { width: 19px; height: 19px; border-radius: 6px; border: 1.5px solid rgba(201,168,76,0.38); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: all .2s; background: transparent; cursor: pointer; }
  .cgh-custom-check.checked  { border-color: var(--gold); background: rgba(201,168,76,0.2); }
  .cgh-custom-check.disabled { cursor: not-allowed; opacity: .4; }
  .cgh-check-label           { font-size: .83rem; color: var(--text-sub); line-height: 1.5; cursor: pointer; }
  .cgh-check-label.disabled  { cursor: not-allowed; opacity: .5; }

  .terms-scroll-hint { font-size: .73rem; color: rgba(201,168,76,0.65); text-align: center; }
  .terms-dl-btn { background: none; border: 1px solid rgba(201,168,76,0.38); color: var(--gold); border-radius: 8px; padding: .3rem .8rem; font-size: .73rem; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; white-space: nowrap; }
  .terms-dl-btn:hover { background: var(--gold); color: #070b13; }

  /* ══════════════════════════════════
     OTP MODAL
  ══════════════════════════════════ */
  .otp-modal .modal-content { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 32px 80px rgba(0,0,0,0.65); }
  .otp-modal .modal-body    { background: var(--surface); padding: 2.75rem 2rem 2.25rem; }

  .otp-envelope { width: 66px; height: 66px; border-radius: 50%; background: rgba(201,168,76,0.1); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 1.35rem; animation: shimmer 2.5s ease-in-out infinite; }

  .otp-inputs { display: flex; justify-content: center; gap: .5rem; margin: 1.75rem 0 1.35rem; }
  .otp-box { width: 49px; height: 59px; text-align: center; font-size: 1.5rem; font-weight: 700; border: 1.5px solid rgba(201,168,76,0.25); border-radius: 11px; outline: none; background: rgba(255,255,255,0.035); color: var(--text); font-family: 'DM Sans', sans-serif; transition: all .2s; caret-color: var(--gold); }
  .otp-box:focus  { border-color: var(--gold); background: rgba(201,168,76,0.07); box-shadow: 0 0 0 3px rgba(201,168,76,0.13); }
  .otp-box.filled { border-color: rgba(201,168,76,0.65); background: rgba(201,168,76,0.09); }

  .otp-resend { background: none; border: none; color: var(--gold); font-size: .83rem; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; transition: color .2s; }
  .otp-resend:hover { color: var(--gold-bright); text-decoration: underline; }
  .otp-timer  { font-size: .83rem; color: var(--text-muted); }
`;

/* ─── PDF Util ───────────────────────────────────────────────────────────── */
function downloadTermsPDF() {
  const doc = new jsPDF();
  let y = 12;
  doc.setFontSize(17);
  doc.text('Terms & Conditions \u2014 Cebu Grand Hotel', 105, y, { align: 'center' });
  y += 13;
  TERMS_SECTIONS.forEach((s) => {
    if (y > 265) { doc.addPage(); y = 12; }
    doc.setFontSize(12); doc.text(s.heading, 10, y); y += 7;
    doc.setFontSize(10);
    doc.splitTextToSize(s.body, 180).forEach(line => { doc.text(line, 10, y); y += 5; });
    y += 5;
  });
  doc.save('CGH_Terms_Conditions.pdf');
}

/* ─── TermsModal ─────────────────────────────────────────────────────────── */
function TermsModal({ show, onAccept, onDecline }) {
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled,  setScrolled]  = useState(false);
  const [agree1,    setAgree1]    = useState(false);
  const [agree2,    setAgree2]    = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const pct = scrollTop / (scrollHeight - clientHeight);
    setScrollPct(Math.round(pct * 100));
    if (pct > 0.85) setScrolled(true);
  };

  return (
    <Modal show={show} onHide={onDecline} size="lg" centered className="terms-modal">
      <Modal.Header closeButton closeVariant="white">
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.35rem' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.28rem', color: 'var(--text)', fontWeight: 400 }}>
              Terms &amp; Conditions
            </span>
            <button className="terms-dl-btn" onClick={downloadTermsPDF}>📄 Download PDF</button>
          </div>
          <p style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginBottom: '.7rem', lineHeight: 1.55 }}>
            Please scroll through all sections before accepting
          </p>
          <div className="terms-progress">
            <div className="terms-progress-fill" style={{ width: `${scrollPct}%` }} />
          </div>
          <p style={{ fontSize: '.7rem', color: 'rgba(201,168,76,0.55)', marginTop: '.35rem' }}>
            {scrollPct}% read
          </p>
        </div>
      </Modal.Header>

      <Modal.Body onScroll={handleScroll}>
        {TERMS_SECTIONS.map((s, i) => (
          <div key={i} className="terms-section">
            <div className="terms-section-head">
              <div className="terms-section-num">{i + 1}</div>
              <div className="terms-section-title">{s.heading.replace(/^\d+\.\s/, '')}</div>
            </div>
            <p className="terms-section-body">{s.body}</p>
          </div>
        ))}
        <div className="terms-footer-note">
          These Terms &amp; Conditions were last updated on{' '}
          <strong>February 25, 2026</strong>. By using our services, you acknowledge
          that you have read, understood, and agree to be bound by these terms.
        </div>
      </Modal.Body>

      <Modal.Footer>
        {!scrolled && (
          <p className="terms-scroll-hint">↓ Scroll to the bottom to unlock the checkboxes</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.72rem' }}>
          {[
            [agree1, setAgree1, 'I have read and agree to the Terms & Conditions'],
            [agree2, setAgree2, 'I agree to the Privacy Policy and Data Usage terms'],
          ].map(([val, set, label], i) => (
            <div key={i} className="cgh-checkbox-row">
              <div
                className={`cgh-custom-check ${val ? 'checked' : ''} ${!scrolled ? 'disabled' : ''}`}
                onClick={() => scrolled && set(!val)}
              >
                {val && <span style={{ color: 'var(--gold)', fontSize: '.72rem', fontWeight: 800, lineHeight: 1 }}>✓</span>}
              </div>
              <span className={`cgh-check-label ${!scrolled ? 'disabled' : ''}`} onClick={() => scrolled && set(!val)}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.6rem', paddingTop: '.15rem' }}>
          <button className="cgh-btn cgh-btn-ghost" style={{ width: 'auto', padding: '.6rem 1.35rem' }} onClick={onDecline}>
            Decline
          </button>
          <button
            className="cgh-btn cgh-btn-primary"
            style={{ width: 'auto', padding: '.6rem 1.6rem' }}
            disabled={!agree1 || !agree2}
            onClick={onAccept}
          >
            Accept &amp; Continue
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/* ─── Steps Component ────────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = [{ label: 'Details', id: 1 }, { label: 'Terms', id: 2 }, { label: 'Verify', id: 3 }];
  return (
    <div className="cgh-steps">
      {steps.map((s, i) => {
        const status = current > s.id ? 'done' : current === s.id ? 'active' : 'pending';
        return (
          <div key={s.id} className="cgh-step" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div className={`cgh-step-dot ${status}`}>{status === 'done' ? '✓' : s.id}</div>
            <span className={`cgh-step-label ${status}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="cgh-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── RegisterPage ────────────────────────────────────────────────────────── */
export function RegisterPage({ onGoLogin }) {
  const [form, setForm]           = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]       = useState(false);
  const [strength, setStrength]   = useState({ level: 0, color: '#eee', text: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [termsOpen, setTermsOpen] = useState(false);
  const [otpOpen, setOtpOpen]     = useState(false);
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]   = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [step, setStep]           = useState(1);
  const otpRefs = useRef([]);
  const { timer, start: startTimer, isRunning } = useOtpTimer(60);

  const handlePasswordChange = (val) => {
    setForm(f => ({ ...f, password: val }));
    setStrength(calcPasswordStrength(val));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setStep(2); setTermsOpen(true);
  };

  const handleTermsAccepted = async () => {
    setTermsOpen(false); setLoading(true); setStep(3);
    try {
      await registerUser({ username: form.username, email: form.email, password: form.password });
      setOtpOpen(true); startTimer();
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        setOtpOpen(true); startTimer();
      } else {
        setError(err.message); setStep(1);
      }
    } finally { setLoading(false); }
  };

  const handleSocialSignup = (provider) => {
    // Connect to your OAuth redirect here
    console.log(`Sign up with ${provider}`);
  };

  const handleOtpChange = useCallback((i, val) => {
    const v = val.replace(/\D/, '').slice(0, 1);
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(d => d)) setTimeout(() => submitOtp(next.join('')), 300);
  }, [otp]);

  const handleOtpKey = useCallback((i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''; setOtp(next);
      otpRefs.current[i - 1]?.focus();
    }
  }, [otp]);

  const submitOtp = async (code) => {
    setOtpLoading(true); setOtpError('');
    try {
      await verifyOtp(form.email, code);
      sessionStorage.setItem('regSuccess', 'true');
      onGoLogin();
    } catch {
      setOtpError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    try { await resendOtp(form.email); } catch { /* silent */ }
    setOtp(['', '', '', '', '', '']); startTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const pwMatch    = form.confirmPassword && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="cgh-root">
      <style>{css}</style>

      {/* ══ Left Decorative Panel ══ */}
      <div className="cgh-left">
        <div className="cgh-left-grid" />
        <div className="cgh-left-vline" />
        <div className="cgh-left-content">
          <div className="cgh-crest">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M19 4L22.5 14H33L24.5 20.5L27.5 31L19 24.5L10.5 31L13.5 20.5L5 14H15.5Z"
                stroke="#C9A84C" strokeWidth="1.3" fill="rgba(201,168,76,0.1)" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="cgh-left-title">
            Discover<br /><em>Grand</em><br />Living
          </div>
          <div className="cgh-divider" />
          <ul className="cgh-feature-list">
            {[
              ['🏨', 'Instant booking confirmation'],
              ['💎', 'Exclusive member-only rates'],
              ['⬆️', 'Priority room upgrades'],
              ['🤝', '24/7 concierge access'],
            ].map(([icon, text]) => (
              <li key={text}>
                <div className="cgh-feature-icon">{icon}</div>
                {text}
              </li>
            ))}
          </ul>
          <p className="cgh-tagline">Cebu Grand Hotel · Est. 1987</p>
        </div>
      </div>

      {/* ══ Right Form Panel ══ */}
      <div className="cgh-right">
        <div className="cgh-card">

          {/* Logo */}
          <div className="cgh-logo">
            ✦ CGH<span className="cgh-logo-sub">GUEST PORTAL</span>
          </div>

          {/* Heading */}
          <h2 className="cgh-heading">Create Account</h2>
          <p className="cgh-subheading">Begin your luxury stay experience</p>

          {/* Steps */}
          <Steps current={step} />

          {/* Error */}
          {error && (
            <div className="cgh-alert error">
              <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1.55 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Social Sign-Up ── */}
          <div className="cgh-social-row">
            <button type="button" className="cgh-social-btn google" onClick={() => handleSocialSignup('google')}>
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button type="button" className="cgh-social-btn facebook" onClick={() => handleSocialSignup('facebook')}>
              <FacebookIcon />
              <span>Facebook</span>
            </button>
          </div>
          <p className="cgh-social-note">Quick sign-up using your existing account — no password needed.</p>

          {/* ── Divider ── */}
          <div className="cgh-or">or register with email</div>

          {/* ── Form ── */}
          <form onSubmit={handleRegister}>

            <div className="cgh-field">
              <label className="cgh-label">Username</label>
              <div className="cgh-input-wrap">
                <input className="cgh-input" type="text" required autoComplete="username"
                  value={form.username} placeholder="e.g. johndoe"
                  onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>

            <div className="cgh-field">
              <label className="cgh-label">Email Address</label>
              <div className="cgh-input-wrap">
                <input className="cgh-input" type="email" required autoComplete="email"
                  value={form.email} placeholder="you@example.com"
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="cgh-field">
              <label className="cgh-label">Password</label>
              <div className="cgh-input-wrap">
                <input
                  className="cgh-input has-icon" autoComplete="new-password"
                  type={showPw ? 'text' : 'password'} required
                  value={form.password} placeholder="Min. 8 characters"
                  onChange={e => handlePasswordChange(e.target.value)}
                />
                <button type="button" className="cgh-input-icon" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <Icons.EyeOff size={17} /> : <Icons.Eye size={17} />}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="cgh-strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="cgh-strength-bar"
                        style={{ background: i <= (strength.level || 0) ? strength.color : undefined }} />
                    ))}
                  </div>
                  <p className="cgh-field-note" style={{ color: strength.color }}>{strength.text}</p>
                </>
              )}
            </div>

            <div className="cgh-field">
              <label className="cgh-label">Confirm Password</label>
              <div className="cgh-input-wrap">
                <input
                  className={`cgh-input ${pwMismatch ? 'error' : pwMatch ? 'valid' : ''}`}
                  type="password" required autoComplete="new-password"
                  value={form.confirmPassword} placeholder="Repeat your password"
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
              {pwMismatch && <p className="cgh-field-note warn">✗ Passwords do not match</p>}
              {pwMatch    && <p className="cgh-field-note ok">✓ Passwords match</p>}
            </div>

            <button type="submit" className="cgh-btn cgh-btn-primary" disabled={loading || !!pwMismatch}
              style={{ marginTop: '.65rem' }}>
              {loading
                ? <><div className="cgh-spinner" />Creating account…</>
                : 'Continue to Terms & Conditions →'}
            </button>
          </form>

          <p className="cgh-signin">
            Already have an account?{' '}
            <button onClick={onGoLogin}>Sign in</button>
          </p>
        </div>
      </div>

      {/* ══ Terms Modal ══ */}
      <TermsModal
        show={termsOpen}
        onAccept={handleTermsAccepted}
        onDecline={() => { setTermsOpen(false); setStep(1); }}
      />

      {/* ══ OTP Modal ══ */}
      <Modal show={otpOpen} onHide={() => setOtpOpen(false)} centered className="otp-modal">
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <div className="otp-envelope">📧</div>

            <h5 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.65rem', color: 'var(--text)', fontWeight: 300, marginBottom: '.4rem', lineHeight: 1.25 }}>
              Verify Your Email
            </h5>
            <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', marginBottom: '.3rem', lineHeight: 1.6 }}>
              We sent a 6-digit code to
            </p>
            <p style={{ fontSize: '.87rem', color: 'var(--text)', fontWeight: 600, marginBottom: 0 }}>
              {form.email}
            </p>

            {otpError && (
              <div className="cgh-alert error" style={{ textAlign: 'left', marginTop: '1rem', marginBottom: 0 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠</span>
                <span>{otpError}</span>
              </div>
            )}

            <div className="otp-inputs">
              {otp.map((v, i) => (
                <input key={i} ref={el => (otpRefs.current[i] = el)}
                  className={`otp-box ${v ? 'filled' : ''}`}
                  type="text" inputMode="numeric" maxLength={1} value={v}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)} />
              ))}
            </div>

            <div style={{ marginBottom: '1.6rem' }}>
              {isRunning
                ? <p className="otp-timer">Resend available in <strong style={{ color: 'var(--gold)' }}>{timer}s</strong></p>
                : <button className="otp-resend" onClick={handleResend}>↺ Resend Code</button>
              }
            </div>

            <button className="cgh-btn cgh-btn-primary"
              disabled={otpLoading || otp.join('').length < 6}
              onClick={() => submitOtp(otp.join(''))}>
              {otpLoading
                ? <><div className="cgh-spinner" />Verifying…</>
                : 'Verify & Complete Registration'}
            </button>

            <p style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.65 }}>
              Didn't receive the email? Check your spam folder or use the resend option above.
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}