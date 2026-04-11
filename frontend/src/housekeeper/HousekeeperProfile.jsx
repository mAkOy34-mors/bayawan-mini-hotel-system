// housekeeper/HousekeeperProfile.jsx
import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile } from './housekeeperService';
import { User, Mail, Phone, Calendar, Briefcase, Save, Edit2, X } from 'lucide-react';

export function HousekeeperProfile({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getMyProfile(token);
      setProfile(data);
      setForm(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile(token, form);
      setProfile(form);
      setEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>No profile found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Profile</h1>
          <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>View and manage your personal information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{ padding: '0.4rem 1rem', border: '1px solid #10b981', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Edit2 size={14} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setEditing(false)}
              style={{ padding: '0.4rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '0.4rem 1rem', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, color: '#fff' }}>
              {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{profile.firstName} {profile.lastName}</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Housekeeping Staff</div>
              <div style={{ fontSize: '0.75rem', color: '#8a96a8', marginTop: '0.2rem' }}>Employee ID: {profile.employeeId}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> First Name
              </div>
              {editing ? (
                <input
                  value={form.firstName || ''}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.firstName || '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> Last Name
              </div>
              {editing ? (
                <input
                  value={form.lastName || ''}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.lastName || '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={12} /> Email
              </div>
              {editing ? (
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.email || '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={12} /> Phone Number
              </div>
              {editing ? (
                <input
                  value={form.phoneNumber || ''}
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.phoneNumber || '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> Hire Date
              </div>
              {editing ? (
                <input
                  type="date"
                  value={form.hireDate || ''}
                  onChange={e => setForm({ ...form, hireDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase size={12} /> Shift
              </div>
              {editing ? (
                <select
                  value={form.shift || 'MORNING'}
                  onChange={e => setForm({ ...form, shift: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                >
                  <option value="MORNING">Morning (6AM - 2PM)</option>
                  <option value="AFTERNOON">Afternoon (2PM - 10PM)</option>
                  <option value="NIGHT">Night (10PM - 6AM)</option>
                </select>
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {profile.shift === 'MORNING' ? 'Morning (6AM - 2PM)' : 
                   profile.shift === 'AFTERNOON' ? 'Afternoon (2PM - 10PM)' : 
                   profile.shift === 'NIGHT' ? 'Night (10PM - 6AM)' : '—'}
                </div>
              )}
            </div>
          </div>

          {profile.skills && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Skills</div>
              {editing ? (
                <textarea
                  value={form.skills || ''}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                  placeholder="List your skills..."
                />
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{profile.skills}</div>
              )}
            </div>
          )}

          {profile.specialization && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem' }}>Specialization</div>
              {editing ? (
                <input
                  value={form.specialization || ''}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{profile.specialization}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}