// LoginPage.jsx — Enhanced · Bayawan Mini Hotel
import { useState, useEffect } from 'react';
import { loginUser } from '../services/api';
import {
  Eye, EyeOff, Hotel, BedDouble, Star, Shield,
  AlertTriangle, CheckCircle2, ArrowRight, LogIn, Lock, Mail,
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
    --shadow-sm: 0 2px 8px rgba(26,15,5,0.07);
    --shadow-md: 0 8px 28px rgba(26,15,5,0.10);
    --shadow-lg: 0 20px 60px rgba(26,15,5,0.13);
  }

  .lp-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    background: var(--bg);
    -webkit-font-smoothing: antialiased;
  }
  .lp-root * { box-sizing: border-box; }

  /* ── Left decorative panel ── */
  .lp-left {
    width: 460px;
    min-width: 460px;
    display: none;
    flex-direction: column;
    background: #1a1505;
    padding: 3rem 2.8rem;
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .lp-left { display: flex; } }

  /* Noise texture overlay */
  .lp-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.6;
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
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-glow-2 {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Decorative horizontal rule */
  .lp-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2.5rem;
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
    gap: .7rem;
    margin-bottom: 3.5rem;
    position: relative;
    z-index: 2;
  }
  .lp-brand-mark {
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
  .lp-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    line-height: 1.2;
  }
  .lp-brand-sub {
    font-size: .6rem;
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
    font-size: .65rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .lp-left-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3rem;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    margin-bottom: .9rem;
  }
  .lp-left-title em {
    font-style: italic;
    color: var(--gold-light);
  }
  .lp-left-sub {
    font-size: .84rem;
    color: rgba(255,255,255,0.48);
    line-height: 1.75;
    margin-bottom: 2.5rem;
    max-width: 320px;
  }

  .lp-features { display: flex; flex-direction: column; gap: .9rem; }
  .lp-feature  { display: flex; align-items: center; gap: .85rem; }
  .lp-feature-ico {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
    flex-shrink: 0;
  }
  .lp-feature-title { font-weight: 600; color: rgba(255,255,255,0.88); font-size: .84rem; }
  .lp-feature-text  { font-size: .76rem; color: rgba(255,255,255,0.4); margin-top: 1px; }

  .lp-left-footer {
    position: relative;
    z-index: 2;
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    font-size: .65rem;
    color: rgba(255,255,255,0.25);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  /* ── Right panel ── */
  .lp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1.5rem;
    overflow-y: auto;
    background: var(--bg);
    background-image: radial-gradient(rgba(201,168,76,0.12) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .lp-card {
    width: 100%;
    max-width: 430px;
    animation: lp-fadeUp .55s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Card wrap with top gold bar */
  .lp-card-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2.25rem 2rem 2rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
  }
  /* Top accent bar */
  .lp-card-wrap::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(to right, #9a7a2e, #C9A84C, #9a7a2e);
  }
  /* Subtle watermark */
  .lp-card-wrap::after {
    content: '';
    position: absolute;
    bottom: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-card-head { text-align: center; margin-bottom: 1.75rem; padding-top: .5rem; }
  .lp-card-icon {
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
  .lp-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: .25rem;
    line-height: 1.15;
  }
  .lp-card-sub { font-size: .82rem; color: var(--text-muted); }

  /* ── Alerts ── */
  .lp-success {
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .75rem 1rem;
    border-radius: 10px;
    font-size: .82rem;
    margin-bottom: 1.1rem;
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    color: var(--green);
    animation: lp-fadeUp .3s ease both;
  }
  .lp-error {
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .75rem 1rem;
    border-radius: 10px;
    font-size: .82rem;
    margin-bottom: 1.1rem;
    background: var(--red-bg);
    border: 1px solid var(--red-border);
    color: var(--red);
    animation: lp-fadeUp .3s ease both;
  }

  /* ── Form fields ── */
  .lp-field { margin-bottom: 1.05rem; }
  .lp-label {
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
  .lp-input-wrap { position: relative; }
  .lp-input-icon {
    position: absolute;
    left: .9rem;
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
    padding: .74rem 1rem .74rem 2.5rem;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .lp-input::placeholder { color: rgba(138,150,168,0.6); }
  .lp-input:focus {
    border-color: var(--gold);
    background: #fff;
    box-shadow: 0 0 0 3px var(--gold-ring);
  }
  .lp-input.has-right { padding-right: 2.75rem; }
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

  /* ── Remember row ── */
  .lp-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.35rem; }
  .lp-remember { display: flex; align-items: center; gap: .55rem; cursor: pointer; }
  .lp-check {
    width: 18px;
    height: 18px;
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
  .lp-remember-label { font-size: .82rem; color: var(--text-sub); user-select: none; }

  /* ── Submit button ── */
  .lp-btn {
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
  .lp-btn-primary {
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    color: #fff;
    box-shadow: 0 4px 16px rgba(201,168,76,0.32);
  }
  .lp-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(201,168,76,0.4);
    background: linear-gradient(135deg, #b09038, #dfc06e);
  }
  .lp-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .lp-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin .7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .lp-divider {
    display: flex;
    align-items: center;
    gap: .65rem;
    margin: 1.2rem 0;
    font-size: .7rem;
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
    font-size: .82rem;
    color: var(--text-muted);
    margin-top: .25rem;
  }
  .lp-register button {
    background: none;
    border: none;
    color: var(--gold-dark);
    font-weight: 600;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
    transition: color .18s;
    padding: 0;
  }
  .lp-register button:hover { color: var(--gold); text-decoration: underline; }

  /* ── Mobile top brand bar ── */
  .lp-mobile-brand {
    display: flex;
    align-items: center;
    gap: .6rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 1024px) { .lp-mobile-brand { display: none; } }
  .lp-mobile-brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #9a7a2e, #C9A84C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  .lp-mobile-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text);
  }
`;

/* ─── Component ───────────────────────────────────────────────────────────── */
export function LoginPage({ onLogin, onGoRegister }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

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
        'ADMIN','RECEPTIONIST','USER','STAFF','HOUSEKEEPER',
        'MAINTENANCE','SECURITY','FRONT_DESK','MANAGEMENT',
      ];
      if (!validRoles.includes(role))
        throw new Error('Unknown account role. Please contact support.');
      
      // Call the onLogin callback
      onLogin(
        data.token || data.accessToken,
        { id: apiUser.id, username: apiUser.username, email: apiUser.email || email, role },
        remember,
        role,
      );
      
      // ✅ REDIRECT TO DASHBOARD AFTER LOGIN
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <style>{css}</style>

      {/* ══ Left decorative panel ══ */}
      <div className="lp-left">
        <div className="lp-grid" />
        <div className="lp-glow-1" />
        <div className="lp-glow-2" />

        <div className="lp-brand">
          <div className="lp-brand-mark"><Hotel size={19} /></div>
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
              { Icon: BedDouble, title: 'Manage Bookings',  text: 'View and update your reservations' },
              { Icon: Star,      title: 'Loyalty Rewards',  text: 'Earn points with every stay' },
              { Icon: Shield,    title: 'Secure Account',   text: 'Bank-grade data protection' },
            ].map((f, i) => (
              <div key={i} className="lp-feature">
                <div className="lp-feature-ico"><f.Icon size={15} /></div>
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
        <div className="lp-card">

          {/* Mobile brand */}
          <div className="lp-mobile-brand">
            <div className="lp-mobile-brand-mark"><Hotel size={17} /></div>
            <div className="lp-mobile-brand-name">Bayawan Mini Hotel</div>
          </div>

          <div className="lp-card-wrap">

            <div className="lp-card-head">
              <div className="lp-card-icon"><LogIn size={22} /></div>
              <h2 className="lp-card-title">Welcome Back</h2>
              <p className="lp-card-sub">Sign in to your account to continue</p>
            </div>

            {success && (
              <div className="lp-success">
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="lp-error">
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
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
                  <Mail size={15} className="lp-input-icon" />
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
                  <Lock size={15} className="lp-input-icon" />
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
                    title={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="lp-row">
                <div className="lp-remember" onClick={() => setRemember(v => !v)}>
                  <div className={`lp-check ${remember ? 'on' : ''}`}>
                    {remember && <CheckCircle2 size={12} color="var(--gold-dark)" />}
                  </div>
                  <span className="lp-remember-label">Remember me</span>
                </div>
              </div>

              <button
                type="submit"
                className="lp-btn lp-btn-primary"
                disabled={loading}
              >
                {loading
                  ? <><div className="lp-spinner" /> Signing in…</>
                  : <>Sign In <ArrowRight size={16} /></>
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