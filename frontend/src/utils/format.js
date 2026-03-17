export const fmt = (n) =>
  '₱' + parseFloat(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const getInitials = (u) =>
  (u?.username || u?.email || 'GU').slice(0, 2).toUpperCase();

export const getUsername = (u) =>
  u?.username || (u?.email ? u.email.split('@')[0] : '') || 'Guest';

export const todayISO = () => new Date().toISOString().split('T')[0];

export const addDays = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
};

export const calcPasswordStrength = (v) => {
  let s = 0;
  if (v.length >= 8)         s++;
  if (/[A-Z]/.test(v))       s++;
  if (/[0-9]/.test(v))       s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const lvls = [
    { w: '0%',   color: '#eee',     text: '' },
    { w: '25%',  color: '#dc3545',  text: 'Weak' },
    { w: '50%',  color: '#fd7e14',  text: 'Fair' },
    { w: '75%',  color: '#ffc107',  text: 'Good' },
    { w: '100%', color: '#28a745',  text: 'Strong ✓' },
  ];
  return v.length ? lvls[s] || lvls[1] : lvls[0];
};
