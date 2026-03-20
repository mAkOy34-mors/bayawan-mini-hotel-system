// AdminSettings.jsx
import { useState, useEffect } from 'react';
import { getHotelSettings, saveHotelSettings } from './adminApi';
import { Hotel, Calendar, Star, Info, Save } from 'lucide-react';
import { SHARED_CSS, Spinner, Toast, useToast } from './adminShared';

export function AdminSettings({ token }) {
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const { toast, show } = useToast();

  useEffect(() => {
    getHotelSettings(token).then(d => {
      setForm(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await saveHotelSettings(token, form);
      setForm(updated);
      show('Settings saved successfully');
    } catch (e) { show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="ap-root">
        <style>{SHARED_CSS}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '.75rem' }}>
          <Spinner /><span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div><h1 className="ap-title">Settings</h1><p className="ap-sub">Configure hotel system preferences</p></div>
        <button className="ap-btn-primary" disabled={saving || !form} onClick={save}>
          {saving ? <><div className="ap-spin-sm" />Saving…</> : <><Save size={14}/>Save Changes</>}
        </button>
      </div>

      {form && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', alignItems: 'start' }}>

          {/* ── Hotel Information ── */}
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">🏨 Hotel Information</div>
                <div className="ap-panel-sub">Basic hotel details displayed to guests</div>
              </div>
            </div>
            <div className="ap-panel-body">
              <div className="ap-field" style={{ marginBottom: '.9rem' }}>
                <label className="ap-label">Hotel Name</label>
                <input className="ap-input" value={form.hotelName || ''} onChange={e => set('hotelName', e.target.value)} />
              </div>
              <div className="ap-field" style={{ marginBottom: '.9rem' }}>
                <label className="ap-label">Address</label>
                <textarea className="ap-ta" rows={2} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Full hotel address…" />
              </div>
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label className="ap-label">Phone</label>
                  <input className="ap-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+63 32 XXX XXXX" />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Email</label>
                  <input className="ap-input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@hotel.com" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Booking Policy ── */}
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">📅 Booking Policy</div>
                <div className="ap-panel-sub">Check-in/out times and operational rules</div>
              </div>
            </div>
            <div className="ap-panel-body">
              <div className="ap-form-grid">
                <div className="ap-field">
                  <label className="ap-label">Check-in Time</label>
                  <input className="ap-input" type="time" value={form.checkInTime || '14:00'} onChange={e => set('checkInTime', e.target.value)} />
                </div>
                <div className="ap-field">
                  <label className="ap-label">Check-out Time</label>
                  <input className="ap-input" type="time" value={form.checkOutTime || '12:00'} onChange={e => set('checkOutTime', e.target.value)} />
                </div>
              </div>
              <div className="ap-form-grid" style={{ marginTop: '.9rem' }}>
                <div className="ap-field">
                  <label className="ap-label">Currency</label>
                  <select className="ap-sel" value={form.currency || 'PHP'} onChange={e => set('currency', e.target.value)}>
                    {['PHP', 'USD', 'EUR', 'SGD', 'JPY', 'AUD'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="ap-field">
                  <label className="ap-label">Tax Rate (%)</label>
                  <input className="ap-input" type="number" min={0} max={100} step={0.01} value={form.taxRate || 12} onChange={e => set('taxRate', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Rewards Configuration ── */}
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">⭐ Rewards Configuration</div>
                <div className="ap-panel-sub">Loyalty points earn rate</div>
              </div>
            </div>
            <div className="ap-panel-body">
              <div className="ap-field" style={{ marginBottom: '1rem' }}>
                <label className="ap-label">Points Earned per ₱ Spent</label>
                <input className="ap-input" type="number" min={0} step={0.01} value={form.pointsPerPhp || 1} onChange={e => set('pointsPerPhp', e.target.value)} />
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.3rem', display: 'block' }}>
                  Guests earn this many points for every ₱1 paid
                </span>
              </div>

              {/* Tier preview */}
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '.9rem 1rem' }}>
                <div style={{ fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '.65rem' }}>Tier Thresholds</div>
                {[
                  { name: 'Bronze',   min: 0,     max: 999,      icon: '🥉', color: '#cd7f32' },
                  { name: 'Silver',   min: 1000,  max: 4999,     icon: '🥈', color: '#94a3b8' },
                  { name: 'Gold',     min: 5000,  max: 9999,     icon: '🏅', color: '#C9A84C' },
                  { name: 'Platinum', min: 10000, max: '∞',      icon: '💎', color: '#7c3aed' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.45rem .6rem', borderRadius: 7, marginBottom: '.3rem', background: '#fff', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '.82rem', fontWeight: 700, color: t.color }}>{t.icon} {t.name}</span>
                    <span style={{ fontSize: '.74rem', color: 'var(--text-muted)' }}>{t.min.toLocaleString()} – {typeof t.max === 'number' ? t.max.toLocaleString() : t.max} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── System Info ── */}
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div>
                <div className="ap-panel-title">ℹ️ System Info</div>
                <div className="ap-panel-sub">Read-only system information</div>
              </div>
            </div>
            <div className="ap-panel-body">
              {[
                ['Settings ID', form.id || 1],
                ['Last Updated', form.updatedAt ? new Date(form.updatedAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
                ['API Version', 'v1'],
                ['Currency', form.currency || 'PHP'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.58rem .85rem', borderRadius: 8, marginBottom: '.4rem', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--text-sub)', fontFamily: k === 'Settings ID' || k === 'API Version' ? 'monospace' : 'inherit' }}>{v}</span>
                </div>
              ))}

              {/* Save button at bottom */}
              <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="ap-btn-primary" disabled={saving} onClick={save} style={{ width: '100%', justifyContent: 'center' }}>
                  {saving ? <><div className="ap-spin-sm" />Saving…</> : <><Save size={14}/>Save All Changes</>}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}