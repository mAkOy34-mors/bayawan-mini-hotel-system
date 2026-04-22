// RegisterPage.jsx — Enhanced · Bayawan Mini Hotel · No react-bootstrap dependency
import { useState, useRef, useCallback, useEffect } from 'react';
import { registerUser, verifyOtp, resendOtp } from '../services/api';
import { calcPasswordStrength } from '../utils/format';
import { useOtpTimer } from '../hooks/useOtpTimer';
import {
  Eye, EyeOff, Hotel, Star, BedDouble, Users, Headphones,
  Mail, AlertTriangle, CheckCircle2, Download, ArrowRight,
  RefreshCw, Shield, Lock, User, X, FileText,
} from 'lucide-react';

/* ─── Terms data ───────────────────────────────────────────────────────────── */
const TERMS_SECTIONS = [
  {
    heading: '1. User Responsibilities',
    body: "By registering and using Bayawan Mini Hotel's guest portal, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to engage in any unlawful, fraudulent, or unauthorized use of the platform.",
  },
  {
    heading: '2. Data Usage & Privacy',
    body: 'We collect personal data including name, email, contact details, and booking history to facilitate reservations and improve your experience. Your data is processed in accordance with the Philippine Data Privacy Act of 2012 (RA 10173). We do not sell your personal information to third parties.',
  },
  {
    heading: '3. Booking & Payment Policies',
    body: 'All room bookings are subject to availability and confirmation. A 50% deposit is required at the time of booking to secure your reservation. Final payment is due upon check-in. Room rates are quoted in Philippine Peso (₱) and are inclusive of applicable taxes unless stated otherwise.',
  },
  {
    heading: '4. Cancellation & Refund Policy',
    body: 'Cancellations made 72 hours or more before the check-in date are eligible for a full refund of the deposit. Cancellations made within 48–72 hours will incur a 50% cancellation fee. Cancellations made less than 48 hours before check-in are non-refundable. No-shows will be charged the full reservation amount.',
  },
  {
    heading: '5. Security & Account Protection',
    body: 'Your account is protected by industry-standard encryption (AES-256). We implement two-factor authentication (2FA) and monitor for suspicious login activity. You are responsible for immediately notifying us of any unauthorized use of your account. We will never request your password via email or phone.',
  },
  {
    heading: '6. Limitation of Liability',
    body: "Bayawan Mini Hotel shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this platform. Our total liability to you for any claim shall not exceed the amount paid for the specific service giving rise to the claim.",
  },
];

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-dark: #9a7a2e;
    --gold-light: #e8c96a;
    --gold-bg: rgba(201,168,76,0.10);
    --gold-ring: rgba(201,168,76,0.18);
    --bg: #f5f3ef;
    --surface: #ffffff;
    --surface2: #faf8f4;
    --text: #1a1f2e;
    --text-sub: #4a5568;
    --text-muted: #8a96a8;
    --border: #e8e3d9;
    --green: #2d9b6f;
    --green-bg: rgba(45,155,111,0.08);
    --green-border: rgba(45,155,111,0.2);
    --red: #c0392b;
    --red-bg: rgba(192,57,43,0.07);
    --red-border: rgba(192,57,43,0.2);
    --shadow-lg: 0 20px 60px rgba(26,15,5,0.14);
  }

  .rp-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }
  .rp-root * { box-sizing: border-box; }

  /* ── Left dark panel ── */
  .rp-left {
    width: 460px;
    min-width: 460px;
    display: none;
    flex-direction: column;
    background: #10120d;
    padding: 3rem 2.8rem;
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .rp-left { display: flex; } }

  .rp-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.055) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .rp-glow-1 {
    position: absolute;
    bottom: -80px;
    left: -60px;
    width: 380px;
    height: 380px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.11) 0%, transparent 70%);
    pointer-events: none;
  }
  .rp-glow-2 {
    position: absolute;
    top: 20%;
    right: -100px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .rp-brand {
    display: flex;
    align-items: center;
    gap: .7rem;
    margin-bottom: 3.5rem;
    position: relative;
    z-index: 2;
  }
  .rp-brand-mark {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,0.35);
    flex-shrink: 0;
  }
  .rp-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }
  .rp-brand-sub {
    font-size: .6rem;
    color: rgba(201,168,76,0.65);
    text-transform: uppercase;
    letter-spacing: .14em;
  }

  .rp-left-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    z-index: 2;
  }
  .rp-eyebrow {
    font-size: .65rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 600;
    margin-bottom: 1.1rem;
  }
  .rp-left-rule {
    width: 42px;
    height: 2px;
    background: linear-gradient(to right, #9a7a2e, #C9A84C);
    border-radius: 99px;
    margin-bottom: 1.5rem;
  }
  .rp-left-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.9rem;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    margin-bottom: .9rem;
  }
  .rp-left-title em { font-style: italic; color: var(--gold-light); }
  .rp-left-sub {
    font-size: .84rem;
    color: rgba(255,255,255,0.44);
    line-height: 1.75;
    margin-bottom: 2.5rem;
    max-width: 320px;
  }

  .rp-features { display: flex; flex-direction: column; gap: .9rem; }
  .rp-feature  { display: flex; align-items: center; gap: .85rem; }
  .rp-feature-ico {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.17);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    flex-shrink: 0;
  }
  .rp-feature-title { font-weight: 600; color: rgba(255,255,255,0.88); font-size: .84rem; }
  .rp-feature-text  { font-size: .76rem; color: rgba(255,255,255,0.38); margin-top: 1px; }

  .rp-left-footer {
    position: relative;
    z-index: 2;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    font-size: .65rem;
    color: rgba(255,255,255,0.22);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  /* ── Right panel ── */
  .rp-right {
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    overflow-y: auto;
    background: var(--bg);
    background-image: radial-gradient(rgba(201,168,76,0.10) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .rp-card {
    width: 100%;
    max-width: 450px;
    padding: 2rem 0;
    animation: rp-fadeUp .55s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes rp-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rp-card-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.25rem 2rem 2rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
  }
  .rp-card-wrap::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, #9a7a2e, #C9A84C, #9a7a2e);
  }

  .rp-card-head { text-align: center; margin-bottom: 1.5rem; padding-top: .5rem; }
  .rp-card-icon {
    width: 54px;
    height: 54px;
    border-radius: 15px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 1rem;
    box-shadow: 0 6px 22px rgba(201,168,76,0.32);
  }
  .rp-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: .25rem;
    line-height: 1.15;
  }
  .rp-card-sub { font-size: .82rem; color: var(--text-muted); }

  /* ── Steps ── */
  .rp-steps {
    display: flex;
    align-items: center;
    margin-bottom: 1.75rem;
  }
  .rp-step { display: flex; align-items: center; gap: .4rem; }
  .rp-step-dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .7rem;
    font-weight: 700;
    flex-shrink: 0;
    border: 1.5px solid var(--border);
    color: var(--text-muted);
    background: #fff;
    transition: all .3s;
  }
  .rp-step-dot.active {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    border-color: var(--gold);
    box-shadow: 0 2px 10px rgba(201,168,76,0.32);
  }
  .rp-step-dot.done {
    background: var(--gold-bg);
    color: var(--gold-dark);
    border-color: rgba(201,168,76,0.4);
  }
  .rp-step-label { font-size: .68rem; color: var(--text-muted); letter-spacing: .04em; white-space: nowrap; }
  .rp-step-label.active { color: var(--gold-dark); font-weight: 600; }
  .rp-step-label.done   { color: var(--text-sub); }
  .rp-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 .45rem; min-width: 14px; }

  /* ── Alert ── */
  .rp-alert {
    display: flex;
    align-items: flex-start;
    gap: .6rem;
    padding: .75rem 1rem;
    border-radius: 10px;
    font-size: .82rem;
    margin-bottom: 1.1rem;
    line-height: 1.55;
    animation: rp-fadeUp .3s ease both;
  }
  .rp-alert.error   { background: var(--red-bg);   border: 1px solid var(--red-border);   color: var(--red); }
  .rp-alert.success { background: var(--green-bg); border: 1px solid var(--green-border); color: var(--green); }

  /* ── Fields ── */
  .rp-field { margin-bottom: 1.05rem; }
  .rp-label {
    display: flex;
    align-items: center;
    gap: .35rem;
    font-size: .67rem;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-muted);
    font-weight: 700;
    margin-bottom: .45rem;
  }
  .rp-input-wrap { position: relative; }
  .rp-input-icon {
    position: absolute;
    left: .9rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }
  .rp-input {
    width: 100%;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    color: var(--text);
    border-radius: 11px;
    padding: .74rem 1rem .74rem 2.5rem;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .rp-input::placeholder { color: rgba(138,150,168,0.55); }
  .rp-input:focus { border-color: var(--gold); background: #fff; box-shadow: 0 0 0 3px var(--gold-ring); }
  .rp-input.has-right { padding-right: 2.75rem; }
  .rp-input.err  { border-color: rgba(192,57,43,0.45); }
  .rp-input.ok   { border-color: rgba(45,155,111,0.45); }
  .rp-input-btn {
    position: absolute;
    right: .8rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    transition: color .18s;
  }
  .rp-input-btn:hover { color: var(--gold-dark); }

  /* ── Password strength ── */
  .rp-strength { display: flex; gap: 5px; margin-top: .55rem; }
  .rp-strength-bar { flex: 1; height: 3px; border-radius: 99px; background: var(--border); transition: background .3s; }
  .rp-field-note { font-size: .73rem; margin-top: .38rem; }
  .rp-field-note.warn { color: var(--red); }
  .rp-field-note.ok   { color: var(--green); }

  /* ── Buttons ── */
  .rp-btn {
    width: 100%;
    padding: .82rem 1rem;
    border: none;
    border-radius: 12px;
    font-size: .9rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all .25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    letter-spacing: .01em;
  }
  .rp-btn-primary {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,0.32);
  }
  .rp-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.4);
    background: linear-gradient(135deg, #b09038, #dfc06e);
  }
  .rp-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  .rp-btn-ghost {
    background: #fff;
    border: 1.5px solid var(--border);
    color: var(--text-sub);
    padding: .62rem 1.25rem;
    width: auto;
  }
  .rp-btn-ghost:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-bg); }

  @keyframes rp-spin { to { transform: rotate(360deg); } }
  .rp-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: rp-spin .7s linear infinite;
    flex-shrink: 0;
  }

  .rp-divider {
    display: flex;
    align-items: center;
    gap: .65rem;
    margin: 1.2rem 0;
    font-size: .7rem;
    color: var(--text-muted);
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  .rp-divider::before, .rp-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .rp-signin { text-align: center; font-size: .82rem; color: var(--text-muted); margin-top: .25rem; }
  .rp-signin button {
    background: none; border: none; color: var(--gold-dark); font-weight: 600;
    cursor: pointer; font-size: inherit; font-family: inherit; transition: color .18s; padding: 0;
  }
  .rp-signin button:hover { color: var(--gold); text-decoration: underline; }

  /* ── Mobile top brand ── */
  .rp-mobile-brand {
    display: flex;
    align-items: center;
    gap: .6rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 1024px) { .rp-mobile-brand { display: none; } }
  .rp-mobile-brand-mark {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center; color: #fff;
  }
  .rp-mobile-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text);
  }

  /* ══ NATIVE MODAL ══ */
  .rp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,12,8,0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    padding: 20px;
    animation: rp-fadeUp .25s ease both;
  }
  .rp-modal {
    background: #fff;
    border-radius: 20px;
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.22);
    position: relative;
  }
  .rp-modal-header {
    padding: 1.3rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    flex-shrink: 0;
  }
  .rp-modal-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: .35rem;
  }
  .rp-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text);
  }
  .rp-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    transition: color .18s, background .18s;
  }
  .rp-modal-close:hover { color: var(--text); background: var(--border); }
  .rp-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.35) #f0eee8;
  }
  .rp-modal-body::-webkit-scrollbar { width: 5px; }
  .rp-modal-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 99px; }
  .rp-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    background: var(--surface2);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  /* Terms progress */
  .rp-progress { height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; margin-top: .5rem; }
  .rp-progress-fill { height: 100%; background: linear-gradient(to right, #9a7a2e, #C9A84C); transition: width .2s; }
  .rp-progress-label { font-size: .7rem; color: var(--gold-dark); margin-top: .3rem; font-weight: 600; }

  /* Terms sections */
  .rp-terms-sec { margin-bottom: 1.75rem; }
  .rp-terms-sec-hd { display: flex; align-items: center; gap: .6rem; margin-bottom: .6rem; }
  .rp-terms-sec-num {
    width: 26px; height: 26px; border-radius: 7px;
    background: var(--gold-bg); border: 1px solid rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: .7rem; font-weight: 700; color: var(--gold-dark); flex-shrink: 0;
  }
  .rp-terms-sec-title { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; color: var(--text); font-weight: 600; }
  .rp-terms-sec-body  { font-size: .82rem; color: var(--text-sub); line-height: 1.82; padding-left: calc(26px + .6rem); }
  .rp-terms-note {
    font-size: .76rem; color: var(--text-sub);
    padding: .85rem 1rem; background: var(--gold-bg);
    border-radius: 9px; border: 1px solid rgba(201,168,76,0.2); line-height: 1.65;
  }

  /* Checkbox rows */
  .rp-check-row   { display: flex; align-items: flex-start; gap: .6rem; }
  .rp-check-box   {
    width: 19px; height: 19px; border-radius: 6px;
    border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 2px; cursor: pointer;
    transition: all .18s; background: #fff;
  }
  .rp-check-box.on  { border-color: var(--gold); background: var(--gold-bg); }
  .rp-check-box.off { cursor: not-allowed; opacity: .4; }
  .rp-check-label   { font-size: .82rem; color: var(--text-sub); line-height: 1.5; cursor: pointer; user-select: none; }
  .rp-check-label.off { cursor: not-allowed; opacity: .45; }
  .rp-scroll-hint { font-size: .73rem; color: var(--text-muted); text-align: center; }

  .rp-modal-footer-actions { display: flex; justify-content: flex-end; gap: .55rem; }

  .rp-dl-btn {
    background: none; border: 1px solid rgba(201,168,76,0.35);
    color: var(--gold-dark); border-radius: 7px;
    padding: .28rem .75rem; font-size: .72rem;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    display: inline-flex; align-items: center; gap: .3rem;
    transition: all .18s;
  }
  .rp-dl-btn:hover { background: var(--gold-bg); border-color: var(--gold); }

  /* OTP */
  .rp-otp-icon {
    width: 66px; height: 66px; border-radius: 50%;
    background: var(--gold-bg); border: 1px solid rgba(201,168,76,0.25);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem; color: var(--gold-dark);
  }
  .rp-otp-inputs { display: flex; justify-content: center; gap: .5rem; margin: 1.65rem 0 1.2rem; }
  .rp-otp-box {
    width: 50px; height: 60px; text-align: center;
    font-size: 1.5rem; font-weight: 700;
    border: 1.5px solid var(--border); border-radius: 12px;
    outline: none; background: var(--surface2);
    color: var(--text); font-family: 'DM Sans', sans-serif;
    transition: all .2s; caret-color: var(--gold);
  }
  .rp-otp-box:focus  { border-color: var(--gold); background: #fff; box-shadow: 0 0 0 3px var(--gold-ring); }
  .rp-otp-box.filled { border-color: rgba(201,168,76,0.55); background: var(--gold-bg); }

  .rp-otp-resend {
    background: none; border: none; color: var(--gold-dark);
    font-size: .83rem; cursor: pointer; font-family: 'DM Sans', sans-serif;
    padding: 0; font-weight: 600; transition: color .18s;
    display: inline-flex; align-items: center; gap: .3rem;
  }
  .rp-otp-resend:hover { color: var(--gold); text-decoration: underline; }
  .rp-otp-timer { font-size: .83rem; color: var(--text-muted); }
`;

/* ─── Download terms (plain text fallback — no jsPDF dep required) ────────── */
function downloadTermsTxt() {
  const content = TERMS_SECTIONS
    .map(s => `${s.heading}\n${'─'.repeat(s.heading.length)}\n${s.body}`)
    .join('\n\n');
  const blob = new Blob(
    [`Bayawan Mini Hotel — Terms & Conditions\n${'═'.repeat(44)}\n\n${content}`],
    { type: 'text/plain' },
  );
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'BMH_Terms_Conditions.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Terms Modal (native) ────────────────────────────────────────────────── */
function TermsModal({ show, onAccept, onDecline }) {
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled,  setScrolled]  = useState(false);
  const [agree1,    setAgree1]    = useState(false);
  const [agree2,    setAgree2]    = useState(false);

  // Reset when opened
  useEffect(() => {
    if (show) { setScrollPct(0); setScrolled(false); setAgree1(false); setAgree2(false); }
  }, [show]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  const handleScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const pct = scrollTop / (scrollHeight - clientHeight);
    setScrollPct(Math.round(pct * 100));
    if (pct > 0.85) setScrolled(true);
  };

  if (!show) return null;

  return (
    <div className="rp-overlay" onClick={onDecline}>
      <div className="rp-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="rp-modal-header">
          <div className="rp-modal-header-row">
            <span className="rp-modal-title">Terms &amp; Conditions</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <button className="rp-dl-btn" onClick={downloadTermsTxt}>
                <Download size={12} /> Download
              </button>
              <button className="rp-modal-close" onClick={onDecline}>
                <X size={18} />
              </button>
            </div>
          </div>
          <p style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
            Please scroll through all sections before accepting
          </p>
          <div className="rp-progress">
            <div className="rp-progress-fill" style={{ width: `${scrollPct}%` }} />
          </div>
          <p className="rp-progress-label">{scrollPct}% read</p>
        </div>

        {/* Body */}
        <div className="rp-modal-body" onScroll={handleScroll}>
          {TERMS_SECTIONS.map((s, i) => (
            <div key={i} className="rp-terms-sec">
              <div className="rp-terms-sec-hd">
                <div className="rp-terms-sec-num">{i + 1}</div>
                <div className="rp-terms-sec-title">{s.heading.replace(/^\d+\.\s/, '')}</div>
              </div>
              <p className="rp-terms-sec-body">{s.body}</p>
            </div>
          ))}
          <div className="rp-terms-note">
            These Terms &amp; Conditions were last updated on{' '}
            <strong style={{ color: 'var(--gold-dark)' }}>February 25, 2026</strong>. By using our
            services, you acknowledge that you have read, understood, and agree to be bound by these terms.
          </div>
        </div>

        {/* Footer */}
        <div className="rp-modal-footer">
          {!scrolled && <p className="rp-scroll-hint">↓ Scroll to the bottom to unlock the checkboxes</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[
              [agree1, setAgree1, 'I have read and agree to the Terms & Conditions'],
              [agree2, setAgree2, 'I agree to the Privacy Policy and Data Usage terms'],
            ].map(([val, set, label], i) => (
              <div key={i} className="rp-check-row">
                <div
                  className={`rp-check-box ${val ? 'on' : ''} ${!scrolled ? 'off' : ''}`}
                  onClick={() => scrolled && set(v => !v)}
                >
                  {val && <CheckCircle2 size={13} color="var(--gold-dark)" />}
                </div>
                <span
                  className={`rp-check-label ${!scrolled ? 'off' : ''}`}
                  onClick={() => scrolled && set(v => !v)}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="rp-modal-footer-actions">
            <button className="rp-btn rp-btn-ghost" onClick={onDecline}>Decline</button>
            <button
              className="rp-btn rp-btn-primary"
              style={{ width: 'auto', padding: '.62rem 1.5rem' }}
              disabled={!agree1 || !agree2}
              onClick={onAccept}
            >
              <CheckCircle2 size={15} /> Accept &amp; Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── OTP Modal (native) ──────────────────────────────────────────────────── */
function OtpModal({ show, email, onClose, onVerified }) {
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]   = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef([]);
  const { timer, start: startTimer, isRunning } = useOtpTimer(60);

  useEffect(() => {
    if (show) {
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [show]);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

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

  const submitOtp = async code => {
    setOtpLoading(true); setOtpError('');
    try {
      await verifyOtp(email, code);
      onVerified();
    } catch {
      setOtpError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    try { await resendOtp(email); } catch { /* silent */ }
    setOtp(['', '', '', '', '', '']); startTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  if (!show) return null;

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="rp-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="rp-modal-body" style={{ textAlign: 'center', padding: '2.5rem 2rem 2rem' }}>
          <div className="rp-otp-icon"><Mail size={26} /></div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.7rem', fontWeight: 600, color: 'var(--text)', marginBottom: '.35rem' }}>
            Verify Your Email
          </h3>
          <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '.2rem' }}>
            We sent a 6-digit code to
          </p>
          <p style={{ fontSize: '.87rem', color: 'var(--text)', fontWeight: 700, marginBottom: 0 }}>{email}</p>

          {otpError && (
            <div className="rp-alert error" style={{ textAlign: 'left', marginTop: '1rem', marginBottom: 0 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{otpError}</span>
            </div>
          )}

          <div className="rp-otp-inputs">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={el => (otpRefs.current[i] = el)}
                className={`rp-otp-box ${v ? 'filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKey(i, e)}
              />
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {isRunning
              ? <p className="rp-otp-timer">Resend available in <strong style={{ color: 'var(--gold-dark)' }}>{timer}s</strong></p>
              : <button className="rp-otp-resend" onClick={handleResend}>
                  <RefreshCw size={13} /> Resend Code
                </button>
            }
          </div>

          <button
            className="rp-btn rp-btn-primary"
            disabled={otpLoading || otp.join('').length < 6}
            onClick={() => submitOtp(otp.join(''))}
          >
            {otpLoading
              ? <><div className="rp-spinner" /> Verifying…</>
              : <><CheckCircle2 size={15} /> Verify &amp; Complete Registration</>
            }
          </button>

          <p style={{ fontSize: '.74rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.65 }}>
            Didn't receive the email? Check your spam folder or use the resend option above.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Steps indicator ──────────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = [{ label: 'Details', id: 1 }, { label: 'Terms', id: 2 }, { label: 'Verify', id: 3 }];
  return (
    <div className="rp-steps">
      {steps.map((s, i) => {
        const st = current > s.id ? 'done' : current === s.id ? 'active' : 'pending';
        return (
          <div key={s.id} className="rp-step" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div className={`rp-step-dot ${st}`}>
              {st === 'done' ? <CheckCircle2 size={13} /> : s.id}
            </div>
            <span className={`rp-step-label ${st}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="rp-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── RegisterPage ─────────────────────────────────────────────────────────── */
export function RegisterPage({ onGoLogin }) {
  const [form, setForm]             = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]         = useState(false);
  const [strength, setStrength]     = useState({ level: 0, color: '#eee', text: '' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [termsOpen, setTermsOpen]   = useState(false);
  const [otpOpen, setOtpOpen]       = useState(false);
  const [step, setStep]             = useState(1);

  const handlePasswordChange = val => {
    setForm(f => ({ ...f, password: val }));
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
      await registerUser({ username: form.username, email: form.email, password: form.password });
      setOtpOpen(true);
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch')) {
        setOtpOpen(true);
      } else {
        setError(err.message);
        setStep(1);
      }
    } finally { setLoading(false); }
  };

  const handleVerified = () => {
    setOtpOpen(false);
    sessionStorage.setItem('regSuccess', 'true');
    onGoLogin();
  };

  const pwMatch    = form.confirmPassword && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="rp-root">
      <style>{css}</style>

      {/* ══ Left dark panel ══ */}
      <div className="rp-left">
        <div className="rp-grid" />
        <div className="rp-glow-1" />
        <div className="rp-glow-2" />

        <div className="rp-brand">
          <div className="rp-brand-mark"><Hotel size={19} /></div>
          <div>
            <div className="rp-brand-name">Bayawan Mini Hotel</div>
            <div className="rp-brand-sub">Guest Portal</div>
          </div>
        </div>

        <div className="rp-left-body">
          <p className="rp-eyebrow">✦ Create Your Account</p>
          <div className="rp-left-rule" />
          <h2 className="rp-left-title">
            Your <em>Grand</em><br />
            Stay Begins<br />
            Here
          </h2>
          <p className="rp-left-sub">
            Create your free account to unlock exclusive rates, manage your bookings, and enjoy a seamless stay in Bayawan City.
          </p>
          <div className="rp-features">
            {[
              { Icon: BedDouble,  title: 'Instant Booking',   text: 'Real-time room availability' },
              { Icon: Star,       title: 'Exclusive Rates',    text: 'Member-only prices & rewards' },
              { Icon: Shield,     title: 'Secure & Private',   text: 'Your data is fully protected' },
              { Icon: Headphones, title: '24/7 Concierge',     text: 'Always here when you need us' },
            ].map((f, i) => (
              <div key={i} className="rp-feature">
                <div className="rp-feature-ico"><f.Icon size={15} /></div>
                <div>
                  <div className="rp-feature-title">{f.title}</div>
                  <div className="rp-feature-text">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rp-left-footer">© 2026 Bayawan Mini Hotel · Negros Oriental</div>
      </div>

      {/* ══ Right form panel ══ */}
      <div className="rp-right">
        <div className="rp-card">

          {/* Mobile brand */}
          <div className="rp-mobile-brand">
            <div className="rp-mobile-brand-mark"><Hotel size={17} /></div>
            <div className="rp-mobile-brand-name">Bayawan Mini Hotel</div>
          </div>

          <div className="rp-card-wrap">

            <div className="rp-card-head">
              <div className="rp-card-icon"><Hotel size={22} /></div>
              <h2 className="rp-card-title">Create Account</h2>
              <p className="rp-card-sub">Begin your luxury stay experience</p>
            </div>

            <Steps current={step} />

            {error && (
              <div className="rp-alert error">
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Username */}
              <div className="rp-field">
                <label className="rp-label"><User size={10} /> Username</label>
                <div className="rp-input-wrap">
                  <User size={15} className="rp-input-icon" />
                  <input
                    className="rp-input"
                    type="text"
                    required
                    autoComplete="username"
                    value={form.username}
                    placeholder="e.g. johndoe"
                    onChange={e => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rp-field">
                <label className="rp-label"><Mail size={10} /> Email Address</label>
                <div className="rp-input-wrap">
                  <Mail size={15} className="rp-input-icon" />
                  <input
                    className="rp-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    placeholder="you@example.com"
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="rp-field">
                <label className="rp-label"><Lock size={10} /> Password</label>
                <div className="rp-input-wrap">
                  <Lock size={15} className="rp-input-icon" />
                  <input
                    className="rp-input has-right"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    placeholder="Min. 8 characters"
                    onChange={e => handlePasswordChange(e.target.value)}
                  />
                  <button type="button" className="rp-input-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <>
                    <div className="rp-strength">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className="rp-strength-bar"
                          style={{ background: i <= (strength.level || 0) ? strength.color : undefined }}
                        />
                      ))}
                    </div>
                    <p className="rp-field-note" style={{ color: strength.color }}>{strength.text}</p>
                  </>
                )}
              </div>

              {/* Confirm password */}
              <div className="rp-field">
                <label className="rp-label"><Lock size={10} /> Confirm Password</label>
                <div className="rp-input-wrap">
                  <Lock size={15} className="rp-input-icon" />
                  <input
                    className={`rp-input ${pwMismatch ? 'err' : pwMatch ? 'ok' : ''}`}
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    placeholder="Repeat your password"
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
                {pwMismatch && <p className="rp-field-note warn">✗ Passwords do not match</p>}
                {pwMatch    && <p className="rp-field-note ok">✓ Passwords match</p>}
              </div>

              <button
                type="submit"
                className="rp-btn rp-btn-primary"
                disabled={loading || !!pwMismatch}
                style={{ marginTop: '.65rem' }}
              >
                {loading
                  ? <><div className="rp-spinner" /> Creating account…</>
                  : <>Continue to Terms <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <div className="rp-divider">or</div>

            <p className="rp-signin">
              Already have an account?{' '}
              <button onClick={onGoLogin}>Sign in</button>
            </p>
          </div>

        </div>
      </div>

      {/* ══ Terms modal ══ */}
      <TermsModal
        show={termsOpen}
        onAccept={handleTermsAccepted}
        onDecline={() => { setTermsOpen(false); setStep(1); }}
      />

      {/* ══ OTP modal ══ */}
      <OtpModal
        show={otpOpen}
        email={form.email}
        onClose={() => setOtpOpen(false)}
        onVerified={handleVerified}
      />
    </div>
  );
}