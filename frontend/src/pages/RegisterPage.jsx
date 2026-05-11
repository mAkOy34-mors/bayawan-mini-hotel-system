// RegisterPage.jsx — Cebu Mini Hotel (Enhanced Professional Design)
import { useState, useRef, useCallback, useEffect } from 'react';
import { registerUser, verifyOtp, resendOtp } from '../services/api';
import { calcPasswordStrength } from '../utils/format';
import {
  Eye, EyeOff, Hotel,
  Mail, AlertTriangle, CheckCircle2, ArrowRight, Lock, User, X,
  RefreshCw, Download, BookOpen, ShieldCheck,
} from 'lucide-react';

/* ─── Terms Data ───────────────────────────────────────────────────────────── */
const TERMS_SECTIONS = [
  {
    heading: '1. User Responsibilities',
    body: "By registering and using Cebu Mini Hotel's guest portal, you agree to provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to engage in any unlawful, fraudulent, or unauthorized use of the platform.",
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
  body: 'All cancellations are eligible for a 50% refund of the total reservation amount. If the guest cancels within 24 hours of booking, the cancellation is automatically processed without the need for approval. Cancellations made after 24 hours will require approval before the refund is issued.',
},
  {
    heading: '5. Security & Account Protection',
    body: 'Your account is protected by industry-standard encryption (AES-256). We implement two-factor authentication (2FA) and monitor for suspicious login activity. You are responsible for immediately notifying us of any unauthorized use of your account.',
  },
  {
    heading: '6. Limitation of Liability',
    body: "Cebu Mini Hotel shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of this platform. Our total liability to you for any claim shall not exceed the amount paid for the specific service giving rise to the claim.",
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
    --shadow-lg: 0 24px 70px rgba(26,15,5,0.22);
  }

  /* Overlay */
  .rp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
    animation: rp-fadein .22s ease both;
  }
  @keyframes rp-fadein { from { opacity: 0; } to { opacity: 1; } }

  /* Modal */
  .rp-modal {
    width: 100%;
    max-width: 880px;
    max-height: 92vh;
    display: flex;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
    position: relative;
    animation: rp-slideup .32s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes rp-slideup {
    from { opacity: 0; transform: translateY(22px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Close Button */
  .rp-close {
    position: absolute;
    top: 16px; right: 16px;
    width: 36px; height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: white;
    transition: all .2s; z-index: 20; padding: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .rp-close:hover { background: #000; transform: scale(1.05); }

  /* Left Panel */
  .rp-left {
    width: 340px; min-width: 340px;
    background: linear-gradient(135deg, #1a1505 0%, #0f0c03 100%);
    padding: 2.4rem 2.2rem;
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; color: white;
  }
  .rp-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .rp-glow-1 {
    position: absolute; bottom: -100px; left: -60px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .rp-glow-2 {
    position: absolute; top: -80px; right: -80px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .rp-brand, .rp-left-body { position: relative; z-index: 2; }
  .rp-brand {
    display: flex; align-items: center; gap: 0.7rem;
    margin-bottom: 3rem; flex-shrink: 0;
  }
  .rp-brand-mark {
    width: 40px; height: 40px; border-radius: 11px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(201,168,76,0.35);
  }
  .rp-brand-name { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600; color: #fff; }
  .rp-brand-sub { font-size: 0.6rem; color: rgba(201,168,76,0.7); text-transform: uppercase; letter-spacing: 0.14em; }

  .rp-left-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .rp-eyebrow { font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 1rem; }
  .rp-rule { width: 42px; height: 2px; background: linear-gradient(to right, #9a7a2e, #C9A84C); margin-bottom: 1.5rem; }
  .rp-left-title { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 300; line-height: 1.15; margin-bottom: 1rem; }
  .rp-left-title em { font-style: italic; color: var(--gold-light); }
  .rp-left-sub { font-size: 0.84rem; color: rgba(255,255,255,0.55); line-height: 1.75; }

  .rp-left-footer {
    flex-shrink: 0; position: relative; z-index: 2;
    margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    font-size: 0.65rem; color: rgba(255,255,255,0.35);
    text-transform: uppercase; letter-spacing: 0.1em;
  }

  /* Right Panel */
  .rp-right {
    flex: 1; background: var(--surface);
    overflow-y: auto; padding: 2.2rem 2rem;
  }
  .rp-right::-webkit-scrollbar { width: 6px; }
  .rp-right::-webkit-scrollbar-track { background: var(--border); }
  .rp-right::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px; }

  .rp-form-inner { width: 100%; max-width: 420px; margin: 0 auto; }

  .rp-head { text-align: center; margin-bottom: 1.5rem; }
  .rp-icon {
    width: 54px; height: 54px; border-radius: 14px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    margin: 0 auto 1rem;
    display: flex; align-items: center; justify-content: center;
    color: white; box-shadow: 0 6px 22px rgba(201,168,76,0.32);
  }
  .rp-card-title { font-family: 'Cormorant Garamond', serif; font-size: 2.1rem; font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
  .rp-card-sub { color: var(--text-muted); font-size: 0.85rem; }

  /* Steps */
  .rp-steps { display: flex; align-items: center; margin-bottom: 1.75rem; }
  .rp-step { display: flex; align-items: center; gap: 0.4rem; }
  .rp-step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700;
    border: 1.5px solid var(--border); color: var(--text-muted); background: #fff;
    transition: all 0.3s;
  }
  .rp-step-dot.active { background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: #fff; border-color: var(--gold); }
  .rp-step-dot.done { background: var(--gold-bg); color: var(--gold-dark); border-color: rgba(201,168,76,0.4); }
  .rp-step-label { font-size: 0.68rem; color: var(--text-muted); }
  .rp-step-label.active { color: var(--gold-dark); font-weight: 600; }
  .rp-step-line { flex: 1; height: 1px; background: var(--border); margin: 0 0.45rem; }

  /* Alerts */
  .rp-alert {
    display: flex; align-items: center; gap: 0.55rem;
    padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.82rem; margin-bottom: 1rem;
  }
  .rp-alert.error { background: var(--red-bg); border: 1px solid var(--red-border); color: var(--red); }

  /* Fields */
  .rp-field { margin-bottom: 1rem; }
  .rp-label { display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700; margin-bottom: 0.45rem; }
  .rp-input-wrap { position: relative; }
  .rp-input-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .rp-input {
    width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1.5px solid var(--border); border-radius: 11px;
    background: var(--surface2); font-size: 0.9rem; font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .rp-input:focus { border-color: var(--gold); background: white; outline: none; box-shadow: 0 0 0 3px var(--gold-ring); }
  .rp-input.has-right { padding-right: 2.8rem; }
  .rp-input.err { border-color: rgba(192,57,43,0.45); }
  .rp-input.ok  { border-color: rgba(45,155,111,0.45); }
  .rp-input-btn { position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; }
  .rp-input-btn:hover { color: var(--gold-dark); }

  .rp-strength { display: flex; gap: 5px; margin-top: 0.5rem; }
  .rp-strength-bar { flex: 1; height: 3px; border-radius: 99px; background: var(--border); transition: background 0.3s; }
  .rp-field-note { font-size: 0.73rem; margin-top: 0.38rem; }
  .rp-field-note.warn { color: var(--red); }
  .rp-field-note.ok   { color: var(--green); }

  /* Buttons */
  .rp-btn-primary {
    width: 100%; padding: 0.85rem; border: none; border-radius: 12px;
    font-weight: 600; font-size: 0.92rem; cursor: pointer;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: white;
    transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .rp-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.4); }
  .rp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .rp-google-btn {
    width: 100%; padding: 0.75rem; border: 1.5px solid #e0e0e0; border-radius: 12px;
    font-weight: 500; font-size: 0.875rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    background: #ffffff; color: #333; transition: all 0.22s; margin-bottom: 0.5rem;
  }
  .rp-google-btn:hover:not(:disabled) { border-color: #C9A84C; background: #faf8f4; box-shadow: 0 3px 12px rgba(0,0,0,0.09); transform: translateY(-1px); }
  .rp-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .rp-google-icon { width: 20px; height: 20px; flex-shrink: 0; }

  .rp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rp-spin 0.7s linear infinite; }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  .rp-divider { display: flex; align-items: center; gap: 0.6rem; margin: 1.2rem 0; color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; }
  .rp-divider::before, .rp-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .rp-login-link { text-align: center; margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted); }
  .rp-login-link button { background: none; border: none; color: var(--gold-dark); font-weight: 600; cursor: pointer; font-family: inherit; }
  .rp-login-link button:hover { text-decoration: underline; }

  /* ── Terms Modal specific styles ── */
  .tm-shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 640px;
    max-height: 88vh;
    border-radius: 20px;
    overflow: hidden;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    animation: rp-slideup .3s cubic-bezier(.22,1,.36,1) both;
    font-family: 'DM Sans', sans-serif;
  }

  /* Progress bar strip at the very top */
  .tm-progress-bar {
    height: 4px;
    background: var(--border);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }
  .tm-progress-fill {
    height: 100%;
    background: linear-gradient(to right, #9a7a2e, #C9A84C);
    transition: width 0.15s ease;
    border-radius: 0 4px 4px 0;
  }

  .tm-header {
    padding: 1.25rem 1.5rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
    flex-shrink: 0;
  }
  .tm-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
  .tm-title-row { display: flex; align-items: center; gap: 0.6rem; }
  .tm-title-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex; align-items: center; justify-content: center; color: #fff;
    flex-shrink: 0;
  }
  .tm-title { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--text); }
  .tm-subtitle { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
  .tm-close-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; display: flex; align-items: center; }
  .tm-close-btn:hover { color: var(--text); }

  /* Read status badge */
  .tm-read-badge {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.7rem; padding: 0.22rem 0.65rem; border-radius: 99px;
    font-weight: 600; transition: all 0.3s;
  }
  .tm-read-badge.unread { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
  .tm-read-badge.done   { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }

  .tm-header-actions { display: flex; align-items: center; justify-content: space-between; }
  .tm-download-btn {
    background: none; border: 1px solid var(--gold); border-radius: 7px;
    padding: 0.22rem 0.75rem; font-size: 0.72rem;
    display: inline-flex; align-items: center; gap: 0.3rem;
    cursor: pointer; color: var(--gold-dark); transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .tm-download-btn:hover { background: var(--gold-bg); }

  /* Scroll body */
  .tm-body {
    flex: 1; overflow-y: auto; padding: 1.5rem;
    scrollbar-width: thin; scrollbar-color: rgba(201,168,76,0.5) rgba(201,168,76,0.1);
  }
  .tm-body::-webkit-scrollbar { width: 5px; }
  .tm-body::-webkit-scrollbar-track { background: rgba(201,168,76,0.08); border-radius: 10px; margin: 8px 0; }
  .tm-body::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.45); border-radius: 10px; }
  .tm-body::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.7); }

  .tm-section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
  .tm-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .tm-section-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 6px;
    background: var(--gold-bg); color: var(--gold-dark);
    font-size: 0.65rem; font-weight: 800; margin-right: 0.5rem;
    flex-shrink: 0;
  }
  .tm-section-heading { font-size: 0.88rem; font-weight: 700; color: var(--text); margin-bottom: 0.6rem; display: flex; align-items: center; }
  .tm-section-body { font-size: 0.82rem; color: var(--text-sub); line-height: 1.7; padding-left: 1.7rem; }

  /* Scroll nudge banner — shown while not fully read */
  .tm-nudge {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.5rem 1rem; font-size: 0.75rem;
    background: #fffbf0; border-top: 1px solid rgba(201,168,76,0.2);
    color: var(--gold-dark); flex-shrink: 0;
    animation: tm-pulse 2s ease-in-out infinite;
  }
  @keyframes tm-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .tm-nudge-arrow { font-size: 1rem; }

  /* Footer */
  .tm-footer { padding: 1.2rem 1.5rem; border-top: 1px solid var(--border); background: var(--surface2); flex-shrink: 0; }

  .tm-checkboxes { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
  .tm-checkbox-row {
    display: flex; align-items: flex-start; gap: 0.65rem;
    padding: 0.65rem 0.9rem; border-radius: 10px; border: 1.5px solid var(--border);
    background: #fff; cursor: not-allowed; transition: all 0.25s;
    opacity: 0.5;
  }
  .tm-checkbox-row.unlocked { cursor: pointer; opacity: 1; }
  .tm-checkbox-row.unlocked:hover { border-color: rgba(201,168,76,0.4); background: var(--gold-bg); }
  .tm-checkbox-row.checked { border-color: rgba(45,155,111,0.4); background: var(--green-bg); opacity: 1; }
  .tm-checkbox-row input[type="checkbox"] { margin-top: 2px; accent-color: var(--gold-dark); width: 15px; height: 15px; flex-shrink: 0; cursor: inherit; }
  .tm-checkbox-label { font-size: 0.81rem; color: var(--text-sub); line-height: 1.4; user-select: none; }
  .tm-checkbox-label strong { color: var(--text); }

  .tm-action-row { display: flex; justify-content: flex-end; gap: 0.6rem; }
  .tm-decline-btn {
    padding: 0.6rem 1.2rem; border: 1px solid var(--border);
    border-radius: 10px; background: white; cursor: pointer;
    font-size: 0.85rem; color: var(--text-sub); transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .tm-decline-btn:hover { border-color: var(--red); color: var(--red); }
  .tm-accept-btn {
    padding: 0.6rem 1.5rem; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C); color: white;
    cursor: pointer; font-size: 0.85rem; font-weight: 600;
    display: flex; align-items: center; gap: 0.4rem;
    transition: all 0.22s; font-family: 'DM Sans', sans-serif;
  }
  .tm-accept-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 18px rgba(201,168,76,0.38); }
  .tm-accept-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  /* OTP Modal */
  .otp-shell {
    background: var(--surface); border-radius: 20px; overflow: hidden;
    width: 100%; max-width: 440px;
    box-shadow: var(--shadow-lg);
    animation: rp-slideup .3s cubic-bezier(.22,1,.36,1) both;
    font-family: 'DM Sans', sans-serif;
  }
  .otp-body { padding: 2.5rem 2rem; text-align: center; }
  .otp-icon {
    width: 66px; height: 66px; border-radius: 50%;
    background: var(--gold-bg); display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem; color: var(--gold-dark);
  }
  .otp-inputs { display: flex; justify-content: center; gap: 0.5rem; margin: 1.5rem 0 1rem; }
  .otp-input {
    width: 50px; height: 60px; text-align: center;
    font-size: 1.3rem; font-weight: 600; border-radius: 12px;
    border: 1.5px solid var(--border); background: var(--surface2);
    outline: none; transition: all 0.18s; font-family: 'DM Sans', sans-serif;
  }
  .otp-input.filled { border-color: var(--gold); background: var(--gold-bg); }
  .otp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-ring); }

  /* Responsive */
  @media (max-width: 640px) {
    .rp-left { display: none; }
    .rp-modal { max-width: 460px; }
    .rp-right { padding: 1.5rem; }
    .tm-shell { max-width: 98vw; }
  }
`;

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg className="rp-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function downloadTermsTxt() {
  const content = TERMS_SECTIONS
    .map(s => `${s.heading}\n${'─'.repeat(s.heading.length)}\n${s.body}`)
    .join('\n\n');
  const blob = new Blob(
    [`Cebu Mini Hotel — Terms & Conditions\n${'═'.repeat(44)}\n\n${content}`],
    { type: 'text/plain' }
  );
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'CMH_Terms_Conditions.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Terms Modal ───────────────────────────────────────────────────────────── */
function TermsModal({ show, onAccept, onDecline }) {
  const [scrollPct, setScrollPct] = useState(0);
  const [fullyRead, setFullyRead] = useState(false);
  const [agree1,    setAgree1]    = useState(false);
  const [agree2,    setAgree2]    = useState(false);
  const bodyRef = useRef(null);

  // Reset every time the modal opens
  useEffect(() => {
    if (show) {
      setScrollPct(0);
      setFullyRead(false);
      setAgree1(false);
      setAgree2(false);
      // Scroll body back to top
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
  }, [show]);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrollable = scrollHeight - clientHeight;
    if (scrollable <= 0) {
      setScrollPct(100);
      setFullyRead(true);
      return;
    }
    const pct = Math.min(100, Math.round((scrollTop / scrollable) * 100));
    setScrollPct(pct);
    // Mark fully read once they hit 98% — accounts for sub-pixel rounding
    if (pct >= 98) setFullyRead(true);
  };

  const canAccept = fullyRead && agree1 && agree2;

  if (!show) return null;

  return (
    <div className="rp-overlay" onClick={onDecline}>
      <div className="tm-shell" onClick={e => e.stopPropagation()}>

        {/* ── Top progress bar ── */}
        <div className="tm-progress-bar">
          <div className="tm-progress-fill" style={{ width: `${scrollPct}%` }} />
        </div>

        {/* ── Header ── */}
        <div className="tm-header">
          <div className="tm-header-top">
            <div className="tm-title-row">
              <div className="tm-title-icon"><BookOpen size={16} /></div>
              <div>
                <div className="tm-title">Terms &amp; Conditions</div>
                <div className="tm-subtitle">Cebu Mini Hotel · Guest Portal</div>
              </div>
            </div>
            <button className="tm-close-btn" onClick={onDecline} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="tm-header-actions">
            {/* Read status badge */}
            <span className={`tm-read-badge ${fullyRead ? 'done' : 'unread'}`}>
              {fullyRead
                ? <><ShieldCheck size={11} /> Fully read</>
                : <>{scrollPct}% read — scroll to unlock</>
              }
            </span>
            <button className="tm-download-btn" onClick={downloadTermsTxt}>
              <Download size={12} /> Download
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="tm-body" ref={bodyRef} onScroll={handleScroll}>
          {TERMS_SECTIONS.map((s, i) => (
            <div key={i} className="tm-section">
              <div className="tm-section-heading">
                <span className="tm-section-num">{i + 1}</span>
                {s.heading.replace(/^\d+\.\s*/, '')}
              </div>
              <p className="tm-section-body">{s.body}</p>
            </div>
          ))}
        </div>

        {/* ── Scroll nudge — disappears once fully read ── */}
        {!fullyRead && (
          <div className="tm-nudge">
            <span className="tm-nudge-arrow">↓</span>
            Please scroll to read all terms before accepting
            <span className="tm-nudge-arrow">↓</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="tm-footer">
          <div className="tm-checkboxes">
            <label
              className={`tm-checkbox-row ${fullyRead ? 'unlocked' : ''} ${agree1 ? 'checked' : ''}`}
              title={!fullyRead ? 'Please read all terms first' : ''}
            >
              <input
                type="checkbox"
                checked={agree1}
                disabled={!fullyRead}
                onChange={() => fullyRead && setAgree1(v => !v)}
              />
              <span className="tm-checkbox-label">
                I have read and agree to the <strong>Terms &amp; Conditions</strong>
              </span>
            </label>
            <label
              className={`tm-checkbox-row ${fullyRead ? 'unlocked' : ''} ${agree2 ? 'checked' : ''}`}
              title={!fullyRead ? 'Please read all terms first' : ''}
            >
              <input
                type="checkbox"
                checked={agree2}
                disabled={!fullyRead}
                onChange={() => fullyRead && setAgree2(v => !v)}
              />
              <span className="tm-checkbox-label">
                I have read and agree to the <strong>Privacy Policy</strong> and data processing terms
              </span>
            </label>
          </div>

          <div className="tm-action-row">
            <button className="tm-decline-btn" onClick={onDecline}>Decline</button>
            <button
              className="tm-accept-btn"
              disabled={!canAccept}
              onClick={onAccept}
              title={!canAccept ? 'Read all terms and check both boxes to continue' : ''}
            >
              <ShieldCheck size={15} />
              Accept &amp; Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── OTP Modal ─────────────────────────────────────────────────────────────── */
function OtpModal({ show, email, onClose, onVerified }) {
  const [otp,        setOtp]        = useState(['', '', '', '', '', '']);
  const [otpError,   setOtpError]   = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer,      setTimer]      = useState(60);
  const [canResend,  setCanResend]  = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (show && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [show, timer, canResend]);

  useEffect(() => {
    if (show) {
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setTimer(60);
      setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [show]);

  const handleOtpChange = useCallback((i, val) => {
    const v    = val.replace(/\D/, '').slice(0, 1);
    const next = [...otp];
    next[i]    = v;
    setOtp(next);
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
      await verifyOtp(email, code);
      onVerified();
    } catch {
      setOtpError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setOtpLoading(false); }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
      setTimer(60); setCanResend(false); setOtpError('');
    } catch { setOtpError('Failed to resend code. Please try again.'); }
  };

  if (!show) return null;

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="otp-shell" onClick={e => e.stopPropagation()}>
        <div className="otp-body">
          <div className="otp-icon"><Mail size={26} /></div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.7rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Verify Your Email
          </h3>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>We sent a 6-digit code to</p>
          <p style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>{email}</p>

          {otpError && (
            <div className="rp-alert error">
              <AlertTriangle size={14} /><span>{otpError}</span>
            </div>
          )}

          <div className="otp-inputs">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                className={`otp-input ${v ? 'filled' : ''}`}
                type="text" inputMode="numeric" maxLength={1} value={v}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKey(i, e)}
              />
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            {!canResend
              ? <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  Resend code in <strong style={{ color: 'var(--gold-dark)' }}>{timer}s</strong>
                </p>
              : <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit' }}>
                  <RefreshCw size={13} /> Resend Code
                </button>
            }
          </div>

          <button
            className="rp-btn-primary"
            disabled={otpLoading || otp.join('').length < 6}
            onClick={() => submitOtp(otp.join(''))}
          >
            {otpLoading
              ? <><div className="rp-spinner" /> Verifying...</>
              : <><CheckCircle2 size={15} /> Verify &amp; Complete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Steps ─────────────────────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = [{ label: 'Details', id: 1 }, { label: 'Terms', id: 2 }, { label: 'Verify', id: 3 }];
  return (
    <div className="rp-steps">
      {steps.map((s, i) => {
        const status = current > s.id ? 'done' : current === s.id ? 'active' : 'pending';
        return (
          <div key={s.id} className="rp-step" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div className={`rp-step-dot ${status}`}>
              {status === 'done' ? <CheckCircle2 size={12} /> : s.id}
            </div>
            <span className={`rp-step-label ${status}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="rp-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main RegisterPage ─────────────────────────────────────────────────────── */
export function RegisterPage({ onGoLogin, onClose }) {
  const [form,          setForm]          = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw,        setShowPw]        = useState(false);
  const [strength,      setStrength]      = useState({ level: 0, color: '#eee', text: '' });
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [termsOpen,     setTermsOpen]     = useState(false);
  const [otpOpen,       setOtpOpen]       = useState(false);
  const [step,          setStep]          = useState(1);

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
      await registerUser({ username: form.username || form.email.split('@')[0], email: form.email, password: form.password });
      setOtpOpen(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally { setLoading(false); }
  };

  const handleVerified = () => {
    setOtpOpen(false);
    sessionStorage.setItem('regSuccess', 'true');
    onGoLogin?.();
  };

  const handleGoogleRegister = () => {
    setGoogleLoading(true);
    window.location.href = 'http://localhost:8000/api/v1/auth/google/';
  };

  const pwMatch    = form.confirmPassword && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <div className="rp-overlay" onClick={onClose}>
      <style>{css}</style>

      <div className="rp-modal" onClick={e => e.stopPropagation()}>
        <button className="rp-close" onClick={onClose} aria-label="Close"><X size={16} /></button>

        {/* Left Panel */}
        <div className="rp-left">
          <div className="rp-grid" /><div className="rp-glow-1" /><div className="rp-glow-2" />
          <div className="rp-brand">
            <div className="rp-brand-mark"><Hotel size={18} /></div>
            <div>
              <div className="rp-brand-name">Cebu Mini Hotel</div>
              <div className="rp-brand-sub">Guest Portal</div>
            </div>
          </div>
          <div className="rp-left-body">
            <p className="rp-eyebrow">✦ Create Your Account</p>
            <div className="rp-rule" />
            <h2 className="rp-left-title">Your <em>Grand</em><br />Stay Begins<br />Here</h2>
            <p className="rp-left-sub">Create your free account to unlock exclusive rates, manage your bookings, and enjoy a seamless stay in Cebu.</p>
          </div>
          <div className="rp-left-footer">© 2026 Cebu Mini Hotel · Cebu City</div>
        </div>

        {/* Right Panel */}
        <div className="rp-right">
          <div className="rp-form-inner">
            <div className="rp-head">
              <div className="rp-icon"><Hotel size={22} /></div>
              <h2 className="rp-card-title">Create Account</h2>
              <p className="rp-card-sub">Begin your luxury stay experience</p>
            </div>

            <Steps current={step} />

            {error && (
              <div className="rp-alert error"><AlertTriangle size={15} /><span>{error}</span></div>
            )}

            <button className="rp-google-btn" onClick={handleGoogleRegister} disabled={googleLoading}>
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="rp-divider">or register with email</div>

            <form onSubmit={handleRegister}>
              <div className="rp-field">
                <label className="rp-label"><User size={10} /> Username</label>
                <div className="rp-input-wrap">
                  <User size={15} className="rp-input-icon" />
                  <input className="rp-input" type="text" required value={form.username} placeholder="e.g. johndoe" onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label"><Mail size={10} /> Email Address</label>
                <div className="rp-input-wrap">
                  <Mail size={15} className="rp-input-icon" />
                  <input className="rp-input" type="email" required value={form.email} placeholder="you@example.com" onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label"><Lock size={10} /> Password</label>
                <div className="rp-input-wrap">
                  <Lock size={15} className="rp-input-icon" />
                  <input className="rp-input has-right" type={showPw ? 'text' : 'password'} required value={form.password} placeholder="Min. 8 characters" onChange={e => handlePasswordChange(e.target.value)} />
                  <button type="button" className="rp-input-btn" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                <div className="rp-strength">
                  {[1,2,3,4].map(i => <div key={i} className="rp-strength-bar" style={{ background: i <= strength.level ? strength.color : undefined }} />)}
                </div>
                <p className="rp-field-note" style={{ color: strength.color }}>{strength.text}</p>
              </div>

              <div className="rp-field">
                <label className="rp-label"><Lock size={10} /> Confirm Password</label>
                <div className="rp-input-wrap">
                  <Lock size={15} className="rp-input-icon" />
                  <input className={`rp-input ${pwMismatch ? 'err' : pwMatch ? 'ok' : ''}`} type="password" required value={form.confirmPassword} placeholder="Repeat your password" onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
                </div>
                {pwMismatch && <p className="rp-field-note warn">✗ Passwords do not match</p>}
                {pwMatch    && <p className="rp-field-note ok">✓ Passwords match</p>}
              </div>

              <button type="submit" className="rp-btn-primary" disabled={loading || pwMismatch}>
                {loading ? <><div className="rp-spinner" /> Creating account...</> : <>Continue <ArrowRight size={15} /></>}
              </button>
            </form>

            <p className="rp-login-link">Already have an account? <button onClick={onGoLogin}>Sign in</button></p>
          </div>
        </div>
      </div>

      <TermsModal
        show={termsOpen}
        onAccept={handleTermsAccepted}
        onDecline={() => { setTermsOpen(false); setStep(1); }}
      />
      <OtpModal
        show={otpOpen}
        email={form.email}
        onClose={() => setOtpOpen(false)}
        onVerified={handleVerified}
      />
    </div>
  );
}