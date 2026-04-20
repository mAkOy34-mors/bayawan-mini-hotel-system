// LoginPage.jsx — Light theme matching guest portal & admin panel style
import { useState, useEffect } from 'react';
import { loginUser } from '../services/api';
import {
  Eye, EyeOff, Hotel, BedDouble, Star, Shield,
  AlertTriangle, CheckCircle2, ArrowRight, LogIn,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  :root {
    --gold:#C9A84C; --gold-dark:#9a7a2e; --gold-bg:rgba(201,168,76,0.1);
    --bg:#f4f6f8; --surface:#fff; --surface2:#f8f9fb;
    --text:#1a1f2e; --text-sub:#4a5568; --text-muted:#8a96a8; --border:#e2e8f0;
    --green:#2d9b6f; --green-bg:rgba(45,155,111,0.1);
    --red:#dc3545; --red-bg:rgba(220,53,69,0.1);
  }

  .lp-root { min-height:100vh; display:flex; font-family:'DM Sans',sans-serif; color:var(--text); background:var(--bg); -webkit-font-smoothing:antialiased; }
  .lp-root * { box-sizing:border-box; }

  /* ── Left Panel ── */
  .lp-left {
    width:420px; min-width:420px; display:none; flex-direction:column;
    background:#fff; border-right:1px solid var(--border);
    padding:3rem 2.5rem; position:relative; overflow:hidden;
  }
  @media(min-width:1024px){ .lp-left { display:flex } }
  .lp-left-grid {
    position:absolute; inset:0; pointer-events:none; opacity:.025;
    background-image:linear-gradient(rgba(201,168,76,1) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,1) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .lp-left-accent {
    position:absolute; bottom:-120px; left:-80px; width:360px; height:360px;
    border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%);
    pointer-events:none;
  }
  .lp-left-accent2 {
    position:absolute; top:-60px; right:-60px; width:240px; height:240px;
    border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.05) 0%,transparent 70%);
    pointer-events:none;
  }

  .lp-brand { display:flex; align-items:center; gap:.65rem; margin-bottom:3rem; position:relative; z-index:2; }
  .lp-brand-mark { width:38px; height:38px; border-radius:11px; background:linear-gradient(135deg,#9a7a2e,#C9A84C); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 4px 14px rgba(201,168,76,0.3); flex-shrink:0; }
  .lp-brand-name { font-family:'Cormorant Garamond',serif; font-size:1.15rem; font-weight:600; color:var(--text); line-height:1.2; }
  .lp-brand-sub  { font-size:.62rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.1em; }

  .lp-left-body { flex:1; display:flex; flex-direction:column; justify-content:center; position:relative; z-index:2; }
  .lp-left-title { font-family:'Cormorant Garamond',serif; font-size:2.8rem; font-weight:300; color:var(--text); line-height:1.18; margin-bottom:.75rem; }
  .lp-left-title span { color:var(--gold-dark); }
  .lp-left-sub { font-size:.85rem; color:var(--text-muted); line-height:1.65; margin-bottom:2.25rem; }

  .lp-divider { width:48px; height:2px; background:linear-gradient(to right,#9a7a2e,#C9A84C); border-radius:99px; margin-bottom:2rem; }

  .lp-features { display:flex; flex-direction:column; gap:.85rem; }
  .lp-feature { display:flex; align-items:center; gap:.8rem; }
  .lp-feature-ico { width:36px; height:36px; border-radius:10px; background:var(--gold-bg); border:1px solid rgba(201,168,76,0.2); display:flex; align-items:center; justify-content:center; color:var(--gold-dark); flex-shrink:0; }
  .lp-feature-title { font-weight:600; color:var(--text); font-size:.85rem; }
  .lp-feature-text  { font-size:.78rem; color:var(--text-muted); }

  .lp-left-footer { position:relative; z-index:2; margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid var(--border); font-size:.68rem; color:var(--text-muted); letter-spacing:.08em; text-transform:uppercase; }

  /* ── Right Panel ── */
  .lp-right { flex:1; display:flex; align-items:center; justify-content:center; padding:2rem 1.5rem; overflow-y:auto; }
  .lp-card { width:100%; max-width:420px; animation:lp-fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  @keyframes lp-fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  .lp-card-head { text-align:center; margin-bottom:1.85rem; }
  .lp-card-icon { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#9a7a2e,#C9A84C); display:flex; align-items:center; justify-content:center; color:#fff; margin:0 auto .85rem; box-shadow:0 6px 20px rgba(201,168,76,0.28); }
  .lp-card-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:var(--text); margin-bottom:.2rem; }
  .lp-card-sub   { font-size:.82rem; color:var(--text-muted); }

  /* ── Success banner ── */
  .lp-success { display:flex; align-items:center; gap:.6rem; padding:.75rem 1rem; border-radius:9px; font-size:.82rem; margin-bottom:1.1rem; background:var(--green-bg); border:1px solid rgba(45,155,111,0.22); color:var(--green); }
  .lp-error   { display:flex; align-items:center; gap:.6rem; padding:.75rem 1rem; border-radius:9px; font-size:.82rem; margin-bottom:1.1rem; background:var(--red-bg); border:1px solid rgba(220,53,69,0.22); color:var(--red); }

  /* ── Fields ── */
  .lp-field { margin-bottom:1rem; }
  .lp-label { display:block; font-size:.68rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); font-weight:700; margin-bottom:.42rem; }
  .lp-input-wrap { position:relative; }
  .lp-input {
    width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text);
    border-radius:9px; padding:.72rem 1rem; font-size:.875rem; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
  }
  .lp-input::placeholder { color:var(--text-muted); }
  .lp-input:focus { border-color:var(--gold); background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
  .lp-input.has-icon { padding-right:2.75rem; }
  .lp-input-btn { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; padding:0; transition:color .18s; }
  .lp-input-btn:hover { color:var(--gold-dark); }

  /* ── Remember me ── */
  .lp-remember { display:flex; align-items:center; gap:.6rem; margin-bottom:1.35rem; cursor:pointer; }
  .lp-check { width:19px; height:19px; border-radius:6px; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .18s; background:#fff; }
  .lp-check.on { border-color:var(--gold); background:var(--gold-bg); }
  .lp-remember-label { font-size:.83rem; color:var(--text-sub); user-select:none; }

  /* ── Button ── */
  .lp-btn { width:100%; padding:.78rem 1rem; border:none; border-radius:10px; font-size:.875rem; font-family:'DM Sans',sans-serif; font-weight:600; cursor:pointer; transition:all .22s; display:flex; align-items:center; justify-content:center; gap:.45rem; }
  .lp-btn-primary { background:linear-gradient(135deg,#9a7a2e,#C9A84C); color:#fff; box-shadow:0 3px 12px rgba(201,168,76,0.28); }
  .lp-btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#b09038,#dfc06e); transform:translateY(-1px); box-shadow:0 5px 18px rgba(201,168,76,0.32); }
  .lp-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

  @keyframes lp-spin { to { transform:rotate(360deg) } }
  .lp-spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:lp-spin .7s linear infinite; flex-shrink:0; }

  .lp-register { text-align:center; font-size:.82rem; color:var(--text-muted); margin-top:1.25rem; }
  .lp-register button { background:none; border:none; color:var(--gold-dark); font-weight:600; cursor:pointer; font-size:inherit; font-family:inherit; transition:color .18s; padding:0; }
  .lp-register button:hover { color:var(--gold); text-decoration:underline; }

  /* ── Card container with subtle border ── */
  .lp-card-wrap {
    background:#fff; border:1px solid var(--border); border-radius:18px;
    padding:2.25rem 2rem; box-shadow:0 4px 24px rgba(0,0,0,.06);
  }
  .lp-card-wrap::before {
    content:''; display:block; height:3px; margin:-2.25rem -2rem 2rem;
    border-radius:18px 18px 0 0;
    background:linear-gradient(to right,#9a7a2e,#C9A84C);
  }
`;

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
    setError(''); setLoading(true);
    try {
      const data    = await loginUser(email, password);
      const apiUser = data.user || data;
      const role    = (data.role || apiUser.role || 'USER').toUpperCase();
      const validRoles = [
  'ADMIN', 
  'RECEPTIONIST', 
  'USER', 
  'STAFF', 
  'HOUSEKEEPER',
  'MAINTENANCE',
  'SECURITY', 
  'FRONT_DESK', 
  'MANAGEMENT'
];
      if (!validRoles.includes(role)) throw new Error('Unknown account role. Please contact support.');
      onLogin(data.token || data.accessToken, { id:apiUser.id, username:apiUser.username, email:apiUser.email||email, role }, remember, role);
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="lp-root">
      <style>{css}</style>

      {/* ── Left Panel ── */}
      <div className="lp-left">
        <div className="lp-left-grid"/>
        <div className="lp-left-accent"/>
        <div className="lp-left-accent2"/>

        <div className="lp-brand">
          <div className="lp-brand-mark"><Hotel size={18}/></div>
          <div>
            <div className="lp-brand-name">Cebu Grand Hotel</div>
            <div className="lp-brand-sub">Guest Portal</div>
          </div>
        </div>

        <div className="lp-left-body">
          <div className="lp-divider"/>
          <h2 className="lp-left-title">
            Welcome<br/>Back to<br/><span>Grand</span> Living
          </h2>
          <p className="lp-left-sub">
            Sign in to manage your bookings, track rewards, and enjoy a seamless luxury experience.
          </p>
          <div className="lp-features">
            {[
              { Icon:BedDouble, title:'Manage Bookings',   text:'View and update your reservations' },
              { Icon:Star,      title:'Loyalty Rewards',   text:'Earn points with every stay' },
              { Icon:Shield,    title:'Secure Account',    text:'Bank-grade data protection' },
            ].map((f, i) => (
              <div key={i} className="lp-feature">
                <div className="lp-feature-ico"><f.Icon size={16}/></div>
                <div>
                  <div className="lp-feature-title">{f.title}</div>
                  <div className="lp-feature-text">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-left-footer">© 2026 Cebu Grand Hotel · Est. 1987</div>
      </div>

      {/* ── Right Panel ── */}
      <div className="lp-right">
        <div className="lp-card">
          <div className="lp-card-wrap">

            <div className="lp-card-head">
              <div className="lp-card-icon"><LogIn size={22}/></div>
              <h2 className="lp-card-title">Welcome Back</h2>
              <p className="lp-card-sub">Sign in to your account</p>
            </div>

            {success && (
              <div className="lp-success">
                <CheckCircle2 size={15} style={{ flexShrink:0 }}/>
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="lp-error">
                <AlertTriangle size={15} style={{ flexShrink:0 }}/>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label">Email Address</label>
                <div className="lp-input-wrap">
                  <input className="lp-input" type="email" required autoComplete="email"
                    value={email} placeholder="you@example.com"
                    onChange={e => setEmail(e.target.value)}/>
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input className={`lp-input has-icon`} type={showPw?'text':'password'} required autoComplete="current-password"
                    value={password} placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}/>
                  <button type="button" className="lp-input-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div className="lp-remember" onClick={() => setRemember(v => !v)}>
                <div className={`lp-check ${remember?'on':''}`}>
                  {remember && <CheckCircle2 size={13} color="var(--gold-dark)"/>}
                </div>
                <span className="lp-remember-label">Remember me</span>
              </div>

              <button type="submit" className="lp-btn lp-btn-primary" disabled={loading}>
                {loading
                  ? <><div className="lp-spinner"/>Signing in…</>
                  : <>Sign In <ArrowRight size={15}/></>
                }
              </button>
            </form>

            <p className="lp-register">
              No account yet? <button onClick={onGoRegister}>Create one</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}