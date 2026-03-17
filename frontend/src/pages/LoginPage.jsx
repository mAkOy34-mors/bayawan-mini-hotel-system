import { useState, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { Icons } from '../components/ui/Icons';
import { loginUser } from '../services/api';

export function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('regSuccess') === 'true') {
      setSuccess('Account verified! Please sign in.');
      sessionStorage.removeItem('regSuccess');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data    = await loginUser(email, password);
      const apiUser = data.user || data;
      const role    = (data.role || apiUser.role || 'USER').toUpperCase();

      // Validate role
      const validRoles = ['ADMIN', 'RECEPTIONIST', 'USER'];
      if (!validRoles.includes(role)) {
        throw new Error('Unknown account role. Please contact support.');
      }

      onLogin(
        data.token || data.accessToken,
        {
          id:       apiUser.id,
          username: apiUser.username,
          email:    apiUser.email || email,
          role,
        },
        remember,
        role,   // ← pass role to parent so it can redirect
      );

    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080c14]">

      {/* ── Left decorative panel ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden border-r border-[rgba(201,168,76,0.08)]"
        style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(201,168,76,0.07) 0%, transparent 55%), #080c14' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(201,168,76,0.06),transparent_60%)]" />

        <div className="relative z-10 text-center">
          <div className="font-serif text-5xl font-light text-[#C9A84C] leading-tight mb-6 tracking-wide">
            Cebu Grand<br />Hotel
          </div>
          <div className="w-14 h-px bg-[rgba(201,168,76,0.35)] mx-auto mb-5" />
          <div className="text-[rgba(201,168,76,0.45)] text-xs tracking-[0.14em] uppercase mb-12">
            Where Luxury Meets Heritage
          </div>

          <div className="flex flex-col gap-3 max-w-[260px] mx-auto">
            {[
              'Executive Dashboard & Analytics',
              'Advanced Booking Management',
              'Guest Loyalty Programme',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-[13px] text-[rgba(232,228,220,0.45)]">
                <span className="w-[18px] h-[18px] rounded-[5px] bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.2)] flex items-center justify-center text-[10px] text-[#C9A84C] shrink-0">
                  ✓
                </span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-[400px]"
          style={{ animation: 'fadeUp 0.5s ease both' }}
        >
          <div className="font-serif text-[28px] font-semibold text-[#C9A84C] tracking-[0.06em] text-center mb-8">
            ✦ CGH
          </div>

          <h2 className="font-serif text-[32px] font-light text-[#e8e4dc] mb-1.5">Welcome back</h2>
          <p className="text-[13px] text-[rgba(232,228,220,0.4)] mb-8">Sign in to your account</p>

          {success && <Alert variant="success" className="text-sm">{success}</Alert>}
          {error   && <Alert variant="danger"  className="text-sm">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-[18px]">
              <Form.Label className="text-[11px] uppercase tracking-[0.08em] text-[rgba(201,168,76,0.6)] font-semibold mb-2 block">
                Email Address
              </Form.Label>
              <Form.Control
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[rgba(255,255,255,0.04)] border border-[rgba(201,168,76,0.15)] text-[#e8e4dc] rounded-[10px] px-3.5 py-2.5 placeholder-[rgba(232,228,220,0.25)] focus:border-[rgba(201,168,76,0.5)] focus:bg-[rgba(255,255,255,0.06)] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)]"
              />
            </Form.Group>

            <Form.Group className="mb-5">
              <Form.Label className="text-[11px] uppercase tracking-[0.08em] text-[rgba(201,168,76,0.6)] font-semibold mb-2 block">
                Password
              </Form.Label>
              <div className="relative">
                <Form.Control
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[rgba(255,255,255,0.04)] border border-[rgba(201,168,76,0.15)] text-[#e8e4dc] rounded-[10px] px-3.5 py-2.5 pr-10 placeholder-[rgba(232,228,220,0.25)] focus:border-[rgba(201,168,76,0.5)] focus:bg-[rgba(255,255,255,0.06)]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(201,168,76,0.5)] hover:text-[#C9A84C] transition-colors"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </Form.Group>

            <div className="flex items-center gap-2 mb-6">
              <div
                onClick={() => setRemember(!remember)}
                className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                style={{
                  border:     `2px solid ${remember ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
                  background: remember ? 'rgba(201,168,76,0.2)' : 'transparent',
                }}
              >
                {remember && <span className="text-[#C9A84C] text-[11px] font-bold">✓</span>}
              </div>
              <span className="text-[13px] text-[rgba(232,228,220,0.5)] cursor-pointer" onClick={() => setRemember(!remember)}>
                Remember me
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#9a7a2e] to-[#C9A84C] border-0 text-[#080c14] font-semibold py-[13px] rounded-[10px] text-[15px] hover:from-[#C9A84C] hover:to-[#e2c476] transition-all"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </Form>

          <p className="text-center text-[#8a7a5a] text-[13px] mt-6">
            No account yet?{' '}
            <button
              className="bg-transparent border-0 p-0 text-[#C9A84C] font-semibold hover:text-[#e2c476] hover:underline transition-colors"
              onClick={onGoRegister}
            >
              Create one
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}