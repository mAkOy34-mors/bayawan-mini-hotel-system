// housekeeper/HousekeeperProfile.jsx
import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile } from './housekeeperService';
import { User, Mail, Phone, Calendar, Briefcase, Save, Edit2, X, MapPin, Building2 } from 'lucide-react';

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
      setForm({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phoneNumber: data.contact_number,
        homeAddress: data.home_address,
        skills: data.skills || '',
      });
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
      await updateMyProfile(token, {
        contactNumber: form.phoneNumber,
        homeAddress: form.homeAddress,
        skills: form.skills,
      });
      setProfile({ ...profile, ...form });
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
              {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                {profile.position_display || 'Housekeeping Staff'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8a96a8', marginTop: '0.2rem' }}>
                Employee ID: {profile.employee_id}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> First Name
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.first_name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={12} /> Last Name
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.last_name || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Mail size={12} /> Email
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.email || '—'}</div>
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
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.contact_number || '—'}</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Building2 size={12} /> Department
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.department_display || 'Housekeeping'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Briefcase size={12} /> Position
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.position_display || 'Housekeeper'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> Hire Date
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} /> Address
              </div>
              {editing ? (
                <input
                  value={form.homeAddress || ''}
                  onChange={e => setForm({ ...form, homeAddress: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }}
                />
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{profile.home_address || '—'}</div>
              )}
            </div>
          </div>

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
              <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>{profile.skills || 'No skills listed'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}