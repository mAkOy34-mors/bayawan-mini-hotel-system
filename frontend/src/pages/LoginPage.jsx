// LoginPage.jsx — Bayawan Mini Hotel (Modal with description panel + Google)
import { useState, useEffect } from 'react';
import { loginUser } from '../services/api';
import {
  Eye, EyeOff, Hotel, BedDouble, Star, Shield,
  AlertTriangle, CheckCircle2, ArrowRight, LogIn, Lock, Mail, X,
} from 'lucide-react';

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-dark: #9a7a2e;
    --gold-light: #e8c96a;
    --gold-bg: rgba(201,168,76,0.10);
    --gold-ring: rgba(201,168,76,0.18);
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

  /* ── Overlay ── */
  .lp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: lp-fadein .22s ease both;
  }
  @keyframes lp-fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Modal shell ──
     FIX: removed overflow:hidden so the icon box-shadow isn't clipped.
     Each panel manages its own overflow instead.
  */
  .lp-modal {
    width: 100%;
    max-width: 860px;
    max-height: 90vh;
    display: flex;
    border-radius: 22px;
    overflow: visible;          /* ← was hidden; caused icon clip */
    box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    animation: lp-slideup .32s cubic-bezier(.22,1,.36,1) both;
    position: relative;
  }
  /* Re-clip the corners on each direct child so the modal still looks rounded */
  .lp-left  { border-radius: 22px 0 0 22px; overflow: hidden; }
  .lp-right { border-radius: 0 22px 22px 0; overflow: hidden; }

  .lp-modal * { box-sizing: border-box; }
  @keyframes lp-slideup {
    from { opacity: 0; transform: translateY(22px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Close button */
  .lp-close {
    position: absolute;
    top: 13px;
    right: 13px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.7);
    transition: all .18s;
    z-index: 10;
    padding: 0;
  }
  .lp-close:hover {
    background: rgba(255,255,255,0.18);
    color: #fff;
  }

  /* ══ Left decorative panel ══
     FIX: use a proper column layout so footer always stays at the bottom.
     Removed overflow-y:auto — content fits without scroll now that
     lp-features is removed.
  */
  .lp-left {
    width: 340px;
    min-width: 340px;
    display: flex;
    flex-direction: column;
    background: #1a1505;
    padding: 2.4rem 2.2rem;
    position: relative;
  }

  /* Gold grid lines */
  .lp-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Radial glows */
  .lp-glow-1 {
    position: absolute;
    bottom: -100px;
    left: -60px;
    width: 360px;
    height: 360px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-glow-2 {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Decorative rule */
  .lp-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 1.6rem;
    position: relative;
    z-index: 2;
  }
  .lp-rule::before, .lp-rule::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(201,168,76,0.4));
  }
  .lp-rule::after {
    background: linear-gradient(to left, transparent, rgba(201,168,76,0.4));
  }
  .lp-rule-gem {
    width: 6px;
    height: 6px;
    background: var(--gold);
    transform: rotate(45deg);
    flex-shrink: 0;
  }

  .lp-brand {
    display: flex;
    align-items: center;
    gap: .65rem;
    margin-bottom: 2rem;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
  }
  .lp-brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,0.35);
    flex-shrink: 0;
  }
  .lp-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.08rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }
  .lp-brand-sub {
    font-size: .58rem;
    color: rgba(201,168,76,0.7);
    text-transform: uppercase;
    letter-spacing: .14em;
  }

  /* FIX: flex:1 + flex-direction column so it fills remaining space
     and pushes the footer down naturally */
  .lp-left-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .lp-eyebrow {
    font-size: .62rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 600;
    margin-bottom: .8rem;
  }
  .lp-left-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.6rem;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    margin-bottom: .75rem;
  }
  .lp-left-title em {
    font-style: italic;
    color: var(--gold-light);
  }
  .lp-left-sub {
    font-size: .8rem;
    color: rgba(255,255,255,0.45);
    line-height: 1.75;
  }

  /* FIX: footer is now a flex-shrink:0 sibling of lp-left-body,
     not a child — so it always sits at the bottom of lp-left */
  .lp-left-footer {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    font-size: .62rem;
    color: rgba(255,255,255,0.35);
    letter-spacing: .1em;
    text-transform: uppercase;
    text-align: center;
  }

  /* ══ Right form panel ══ */
  .lp-right {
    flex: 1;
    background: var(--surface);
    overflow-y: auto;
    display: flex;
    align-items: flex-start;      /* ← was center; allows scrolling from top */
    justify-content: center;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.5) rgba(201,168,76,0.1);
  }
  .lp-right::-webkit-scrollbar { width: 5px; }
  .lp-right::-webkit-scrollbar-track {
    background: rgba(201,168,76,0.1);
    border-radius: 10px;
    margin: 10px 0;
  }
  .lp-right::-webkit-scrollbar-thumb {
    background: rgba(201,168,76,0.5);
    border-radius: 10px;
  }
  .lp-right::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.8); }

  /* Top gold accent bar */
  .lp-right::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, #9a7a2e, #C9A84C, #9a7a2e);
    z-index: 1;
    flex-shrink: 0;
  }

  .lp-form-inner {
    width: 100%;
    padding: 2.2rem 2rem 2rem;
  }

  /* Card header
     FIX: padding-top gives the icon room to breathe above the bar */
  .lp-head {
    text-align: center;
    margin-bottom: 1.8rem;
    padding-top: 1rem;        /* ← space so icon isn't cut by the gold bar */
  }
  .lp-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 1rem;
    box-shadow: 0 5px 20px rgba(201,168,76,0.3);
    flex-shrink: 0;
    position: relative;   /* ← ensures it layers above the ::before bar */
    z-index: 2;
  }
  .lp-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.25rem;
    line-height: 1.2;
  }
  .lp-card-sub {
    font-size: .85rem;
    color: var(--text-muted);
    margin-bottom: 0;
  }

  /* Alerts */
  .lp-alert {
    display: flex;
    align-items: center;
    gap: .55rem;
    padding: .65rem .9rem;
    border-radius: 10px;
    font-size: .8rem;
    margin-bottom: 1rem;
    animation: lp-fadein .25s ease both;
  }
  .lp-alert.success { background: var(--green-bg); border: 1px solid var(--green-border); color: var(--green); }
  .lp-alert.error   { background: var(--red-bg);   border: 1px solid var(--red-border);   color: var(--red);   }

  /* Fields */
  .lp-field { margin-bottom: .85rem; }
  .lp-label {
    display: flex;
    align-items: center;
    gap: .32rem;
    font-size: .63rem;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-muted);
    font-weight: 700;
    margin-bottom: .4rem;
  }
  .lp-input-wrap { position: relative; }
  .lp-input-icon {
    position: absolute;
    left: .88rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }
  .lp-input {
    width: 100%;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    color: var(--text);
    border-radius: 11px;
    padding: .7rem .9rem .7rem 2.4rem;
    font-size: .865rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .lp-input::placeholder { color: rgba(138,150,168,0.55); }
  .lp-input:focus {
    border-color: var(--gold);
    background: #fff;
    box-shadow: 0 0 0 3px var(--gold-ring);
  }
  .lp-input.has-right { padding-right: 2.6rem; }
  .lp-input-btn {
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
  .lp-input-btn:hover { color: var(--gold-dark); }

  /* Remember row */
  .lp-row { display: flex; align-items: center; margin-bottom: 1.15rem; }
  .lp-remember { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
  .lp-check {
    width: 17px;
    height: 17px;
    border-radius: 5px;
    border: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .18s;
    background: #fff;
  }
  .lp-check.on { border-color: var(--gold); background: var(--gold-bg); }
  .lp-remember-label { font-size: .81rem; color: var(--text-sub); user-select: none; }

  /* Submit button */
  .lp-btn {
    width: 100%;
    padding: .78rem 1rem;
    border: none;
    border-radius: 12px;
    font-size: .89rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all .25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .48rem;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,0.32);
  }
  .lp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.4);
    background: linear-gradient(135deg, #b09038, #dfc06e);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Google Button */
  .lp-google-btn {
    width: 100%;
    padding: .75rem 1rem;
    border: 1.5px solid #e0e0e0;
    border-radius: 12px;
    font-size: .89rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: all .25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .6rem;
    background: #ffffff;
    color: #1a1f2e;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    margin-bottom: 1rem;
  }
  .lp-google-btn:hover:not(:disabled) {
    border-color: #C9A84C;
    background: #faf8f4;
    transform: translateY(-2px);
    box-shadow: 0 3px 12px rgba(0,0,0,0.12);
  }
  .lp-google-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-google-btn:disabled { opacity: .5; cursor: not-allowed; }
  .lp-google-icon { width: 20px; height: 20px; flex-shrink: 0; }

  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 15px;
    height: 15px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin .7s linear infinite;
    flex-shrink: 0;
  }

  /* Divider */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: .6rem;
    margin: 1rem 0;
    font-size: .68rem;
    color: var(--text-muted);
    letter-spacing: .07em;
    text-transform: uppercase;
  }
  .lp-divider::before, .lp-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .lp-register {
    text-align: center;
    font-size: .8rem;
    color: var(--text-muted);
    margin-top: 1rem;
  }
  .lp-register button {
    background: none;
    border: none;
    color: var(--gold-dark);
    font-weight: 600;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
    padding: 0;
    transition: color .18s;
  }
  .lp-register button:hover { color: var(--gold); text-decoration: underline; }

  /* Forgot password */
  .lp-forgot { text-align: right; margin-bottom: 0.5rem; }
  .lp-forgot button {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: .72rem;
    cursor: pointer;
    transition: color .18s;
    font-family: inherit;
  }
  .lp-forgot button:hover { color: var(--gold-dark); text-decoration: underline; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .lp-left { display: none; }
    .lp-modal { max-width: 420px; }
    .lp-right { border-radius: 22px; }
  }
`;

/* Google Icon */
const GoogleIcon = () => (
  <svg className="lp-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── Component ───────────────────────────────────────────────────────────── */
export function LoginPage({ onLogin, onClose, onGoRegister }) {
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [remember,      setRemember]      = useState(false);
  const [showPw,        setShowPw]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (sessionStorage.getItem('regSuccess') === 'true') {
      setSuccess('Account verified! You can now sign in.');
      sessionStorage.removeItem('regSuccess');
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data    = await loginUser(email, password);
      const apiUser = data.user || data;
      const role    = (data.role || apiUser.role || 'USER').toUpperCase();
      const validRoles = [
        'ADMIN', 'RECEPTIONIST', 'USER', 'STAFF', 'HOUSEKEEPER',
        'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT',
      ];
      if (!validRoles.includes(role))
        throw new Error('Unknown account role. Please contact support.');

      onLogin?.(
        data.token || data.accessToken,
        { id: apiUser.id, username: apiUser.username, email: apiUser.email || email, role },
        remember,
        role,
      );
      onClose?.();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');
    window.location.href = 'https://cebu-mini-hotel-system.onrender.com/api/v1/auth/google/';
  };

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="lp-overlay" onClick={handleBackdropClick}>
      <style>{css}</style>

      <div className="lp-modal" role="dialog" aria-modal="true" aria-label="Sign in">

        {/* Close button */}
        <button className="lp-close" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>

        {/* ══ Left decorative panel ══ */}
        <div className="lp-left">
          <div className="lp-grid" />
          <div className="lp-glow-1" />
          <div className="lp-glow-2" />

          <div className="lp-brand">
            <div className="lp-brand-mark"><Hotel size={18} /></div>
            <div>
              <div className="lp-brand-name">Bayawan Mini Hotel</div>
              <div className="lp-brand-sub">Guest Portal</div>
            </div>
          </div>

          {/* lp-left-body fills remaining space, footer stays pinned below it */}
          <div className="lp-left-body">
            <p className="lp-eyebrow">✦ Welcome Back</p>
            <div className="lp-rule"><div className="lp-rule-gem" /></div>
            <h2 className="lp-left-title">
              Return to<br />
              <em>Grand</em><br />
              Living
            </h2>
            <p className="lp-left-sub">
              Sign in to manage your bookings, track rewards, and enjoy a seamless luxury experience in Bayawan City.
            </p>
          </div>

          {/* Footer is now a direct child of lp-left, not inside lp-left-body */}
          <div className="lp-left-footer">© 2026 Bayawan Mini Hotel · Negros Oriental</div>
        </div>

        {/* ══ Right form panel ══ */}
        <div className="lp-right">
          <div className="lp-form-inner">

            <div className="lp-head">
              <div className="lp-icon"><LogIn size={22} /></div>
              <h2 className="lp-card-title">Welcome Back</h2>
              <p className="lp-card-sub">Sign in to your account to continue</p>
            </div>

            {success && (
              <div className="lp-alert success">
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="lp-alert error">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="lp-google-btn"
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="lp-divider">or sign in with email</div>

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label"><Mail size={10} /> Email Address</label>
                <div className="lp-input-wrap">
                  <Mail size={14} className="lp-input-icon" />
                  <input
                    className="lp-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label"><Lock size={10} /> Password</label>
                <div className="lp-input-wrap">
                  <Lock size={14} className="lp-input-icon" />
                  <input
                    className="lp-input has-right"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lp-input-btn"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="lp-forgot">
                <button type="button" onClick={() => alert('Password reset link will be sent to your email.')}>
                  Forgot password?
                </button>
              </div>

              <div className="lp-row">
                <div className="lp-remember" onClick={() => setRemember(v => !v)}>
                  <div className={`lp-check ${remember ? 'on' : ''}`}>
                    {remember && <CheckCircle2 size={11} color="var(--gold-dark)" />}
                  </div>
                  <span className="lp-remember-label">Remember me</span>
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading
                  ? <><div className="lp-spinner" /> Signing in…</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            <p className="lp-register">
              No account yet?{' '}
              <button onClick={onGoRegister}>Create one free</button>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}