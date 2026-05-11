// housekeeper/HousekeeperProfile.jsx
export function HousekeeperProfile({ user }) {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>My Profile</h1>
        <p style={{ fontSize: '0.8rem', color: '#8a96a8', margin: 0 }}>Your account information</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>
            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'H'}
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Housekeeper')}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8a96a8' }}>{user?.email}</div>
            <div style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 99, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-block', marginTop: '0.3rem' }}>HOUSEKEEPER</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Full Name</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Email</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Role</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Housekeeping Staff</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8a96a8', marginBottom: '0.2rem' }}>Department</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Housekeeping Department</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}