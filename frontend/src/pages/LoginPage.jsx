// LoginPage.jsx — Bayawan Mini Hotel (Modal with description panel)
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

  /* ── Modal shell ── */
  .lp-modal {
    width: 100%;
    max-width: 860px;
    max-height: 90vh;
    display: flex;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    animation: lp-slideup .32s cubic-bezier(.22,1,.36,1) both;
    position: relative;
  }
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

  /* ══ Left decorative panel ══ */
  .lp-left {
    width: 340px;
    min-width: 340px;
    display: flex;
    flex-direction: column;
    background: #1a1505;
    padding: 2.4rem 2.2rem;
    position: relative;
    overflow: hidden;
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
    margin-bottom: 2.8rem;
    position: relative;
    z-index: 2;
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
    margin-bottom: 2rem;
  }

  .lp-features { display: flex; flex-direction: column; gap: .8rem; }
  .lp-feature  { display: flex; align-items: center; gap: .8rem; }
  .lp-feature-ico {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    flex-shrink: 0;
  }
  .lp-feature-title { font-weight: 600; color: rgba(255,255,255,0.88); font-size: .81rem; }
  .lp-feature-text  { font-size: .73rem; color: rgba(255,255,255,0.38); margin-top: 1px; }

  .lp-left-footer {
    position: relative;
    z-index: 2;
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    font-size: .62rem;
    color: rgba(255,255,255,0.22);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  /* ══ Right form panel ══ */
  .lp-right {
    flex: 1;
    background: var(--surface);
    overflow-y: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

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
  }

  .lp-form-inner {
    width: 100%;
    padding: 2.2rem 2rem 2rem;
  }

  /* Card header */
  .lp-head { text-align: center; margin-bottom: 1.4rem; padding-top: .25rem; }
  .lp-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto .8rem;
    box-shadow: 0 5px 20px rgba(201,168,76,0.3);
  }
  .lp-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 .2rem;
    line-height: 1.15;
  }
  .lp-card-sub { font-size: .8rem; color: var(--text-muted); }

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

  /* ── Responsive: hide left panel on small screens ── */
  @media (max-width: 640px) {
    .lp-left { display: none; }
    .lp-modal { max-width: 420px; }
  }
`;

/* ─── Component ───────────────────────────────────────────────────────────── */
export function LoginPage({ onLogin, onClose, onGoRegister }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Check for post-registration success flag
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

  // Close when clicking backdrop
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
            <div className="lp-features">
              {[
                { Icon: BedDouble, title: 'Manage Bookings', text: 'View and update your reservations' },
                { Icon: Star,      title: 'Loyalty Rewards', text: 'Earn points with every stay' },
                { Icon: Shield,    title: 'Secure Account',  text: 'Bank-grade data protection' },
              ].map((f, i) => (
                <div key={i} className="lp-feature">
                  <div className="lp-feature-ico"><f.Icon size={14} /></div>
                  <div>
                    <div className="lp-feature-title">{f.title}</div>
                    <div className="lp-feature-text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-left-footer">© 2026 Bayawan Mini Hotel · Negros Oriental</div>
        </div>

        {/* ══ Right form panel ══ */}
        <div className="lp-right">
          <div className="lp-form-inner">

            <div className="lp-head">
              <div className="lp-icon"><LogIn size={21} /></div>
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

            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div className="lp-field">
                <label className="lp-label">
                  <Mail size={10} /> Email Address
                </label>
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

              {/* Password */}
              <div className="lp-field">
                <label className="lp-label">
                  <Lock size={10} /> Password
                </label>
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

              {/* Remember me */}
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

            <div className="lp-divider">or</div>

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