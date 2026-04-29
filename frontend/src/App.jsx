// App.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useLang } from './context/LangContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { EmergencyProvider } from './context/EmergencyContext';
import { GuestComplaintPage } from './pages/GuestComplaintPage';
import GuestPartnerServices from './pages/GuestPartnerServices';
import { NotificationProvider } from './context/NotificationContext';
import { StaffApp } from './staff/StaffApp';
import { RewardsPage, SettingsPage, SupportPage } from './pages/OtherPages';
import { PAGE_TITLES } from './constants/config';
import { GuestServiceRequest } from './pages/GuestServiceRequest';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import { AdminApp } from './admin/AdminApp';
import { ReceptionistApp } from './receptionist/ReceptionistApp';
import { HousekeeperApp } from './housekeeper/HousekeeperApp';
import Homepage from './pages/Homepage';
import { fetchProfile } from './services/api';
// ─────────────────────────────────────────────────────────────
// GuestApp — authenticated guest shell
// ─────────────────────────────────────────────────────────────
function GuestApp() {
  const { user, token, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Single profile fetch on mount ──────────────────────────
  const [cachedProfile, setCachedProfile] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchProfile(token)
      .then(profile => { if (profile) setCachedProfile(profile); })
      .catch(() => {});
  }, [token]);

  const userWithPic = cachedProfile?.profilePicture
    ? { ...user, profilePicture: cachedProfile.profilePicture }
    : user;

  const handleProfileSave = (savedProfile) => {
    if (savedProfile) setCachedProfile(savedProfile);
  };

  const renderPage = () => {
    const props = { user: userWithPic, token, t, setPage };
    const roomNumber = user?.roomNumber || '';
    switch (page) {
      case 'home':
        return <Homepage {...props} setPage={setPage} />;
      case 'dashboard':
        return <DashboardPage {...props} />;
      case 'bookings':
        return <BookingPage {...props} />;
      case 'mybookings':
        return <MyBookingsPage {...props} />;
      case 'payments':
        return <PaymentsPage {...props} />;
      case 'profile':
        return (
          <ProfilePage
            {...props}
            initialProfile={cachedProfile}
            onProfileSave={handleProfileSave}
          />
        );
      case 'rewards':
        return <RewardsPage {...props} />;
      case 'settings':
        return <SettingsPage {...props} />;
      case 'support':
        return <SupportPage {...props} />;
      case 'emergency':
        return <EmergencyPage {...props} roomNumber={roomNumber} />;
      case 'complaints':
        return <GuestComplaintPage {...props} roomNumber={roomNumber} />;
      case 'services':
        return <GuestServiceRequest {...props} roomNumber={roomNumber} />;
      case 'partner-services':
        return <GuestPartnerServices {...props} />;
      case 'partner-services-spa':
        return <GuestPartnerServices {...props} initialCategory="SPA" />;
      case 'partner-services-tours':
        return <GuestPartnerServices {...props} initialCategory="TOUR_GUIDE" />;
      case 'partner-services-transport':
        return <GuestPartnerServices {...props} initialCategory="TRANSPORT" />;
      case 'partner-services-dining':
        return <GuestPartnerServices {...props} initialCategory="DINING" />;
      case 'partner-services-salon':
        return <GuestPartnerServices {...props} initialCategory="SALON" />;
      default:
        return <Homepage {...props} setPage={setPage} />;
    }
  };

  return (
    // ── NotificationProvider wraps the entire guest shell so
    //    Topbar (bell), and any future page that calls
    //    useNotifications(), all share the same polling state.
    <NotificationProvider token={token}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          page={page}
          setPage={setPage}
          user={userWithPic}
          onLogout={logout}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            title={PAGE_TITLES[page] || page}
            user={userWithPic}
            onMenuClick={() => setSidebarOpen(true)}
            lang={lang}
            setLang={setLang}
          />
          <main className="flex-1 overflow-auto bg-[#f8f3e8]">
            {renderPage()}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// PublicApp — unauthenticated shell (no sidebar)
// ─────────────────────────────────────────────────────────────
function PublicApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const { login } = useAuth();

  const renderPublicPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <LoginPage
            onLogin={(user, token) => {
              login(user, token);
              window.location.reload();
            }}
            onGoRegister={() => setCurrentPage('register')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onGoLogin={() => setCurrentPage('login')}
          />
        );
      default:
        return (
          <Homepage
            onLoginClick={() => setCurrentPage('login')}
            onRegisterClick={() => setCurrentPage('register')}
          />
        );
    }
  };

  return <>{renderPublicPage()}</>;
}

// ─────────────────────────────────────────────────────────────
// Root — routes by auth state and role
// ─────────────────────────────────────────────────────────────
// App.jsx — replace your Root component at the bottom

export default function App() {
  const { isAuthed, user, token, logout, login } = useAuth();

  // ── Handle Google OAuth callback (/auth/callback?token=...&role=...) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cbToken = params.get('token');
    const role    = (params.get('role') || 'USER').toUpperCase();
    const email   = params.get('email')    || '';
    const username= params.get('username') || '';
    const id      = params.get('id')       || '';
    const authError = params.get('auth_error');

    if (authError) {
      // Clean the URL — let PublicApp show with an error
      window.history.replaceState({}, '', '/');
      return;
    }

    if (cbToken) {
      // Log the user in using your existing AuthContext login
      login(cbToken, { id, username, email, role });
      // Clean the token out of the URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (isAuthed) {
    if (user?.role === 'ADMIN')        return <AdminApp        user={user} token={token} onLogout={logout} />;
    if (user?.role === 'RECEPTIONIST') return <ReceptionistApp user={user} token={token} onLogout={logout} />;
    if (user?.role === 'HOUSEKEEPER')  return <HousekeeperApp  user={user} token={token} onLogout={logout} />;

    const staffRoles = ['STAFF', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT'];
    if (staffRoles.includes(user?.role)) return <StaffApp user={user} token={token} onLogout={logout} />;

    return <GuestApp />;
  }

  return <PublicApp />;
}