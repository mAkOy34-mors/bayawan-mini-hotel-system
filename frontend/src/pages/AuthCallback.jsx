// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const role     = (params.get('role') || 'USER').toUpperCase();
    const email    = params.get('email')    || '';
    const username = params.get('username') || '';
    const id       = params.get('id')       || '';
    const error    = params.get('auth_error');

    if (error || !token) {
      // Redirect back to home with login modal open + error flag
      navigate(`/?login=true&google_error=${error || 'unknown'}`, { replace: true });
      return;
    }

    // Reuses your existing onLogin — same as email/password login
    onLogin?.(token, { id, username, email, role }, false, role);

    const dashboard =
      role === 'ADMIN'        ? '/admin/dashboard'        :
      role === 'RECEPTIONIST' ? '/receptionist/dashboard' :
      '/guest/dashboard';

    navigate(dashboard, { replace: true });
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: '1rem',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e8e3d9',
        borderTopColor: '#C9A84C',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>Signing you in…</p>
    </div>
  );
}