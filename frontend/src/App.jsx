import { useState } from 'react';
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
import { RewardsPage, SettingsPage, SupportPage } from './pages/OtherPages';
import { PAGE_TITLES } from './constants/config';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import { AdminApp } from './admin/AdminApp';
import { ReceptionistApp } from './receptionist/ReceptionistApp';
function AppShell() {
  const { user, token, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    const props = { user, token, t, setPage };
    switch (page) {
      case 'dashboard':
        return <DashboardPage {...props} />;
      case 'bookings':
        return <BookingPage {...props} />;
      case 'mybookings':                          
        return <MyBookingsPage {...props} />;  
      case 'payments':
        return <PaymentsPage {...props} />;
      case 'profile':
        return <ProfilePage {...props} />;
      case 'rewards':
        return <RewardsPage {...props} />;
      case 'settings':
        return <SettingsPage {...props} />;
      case 'support':
        return <SupportPage {...props} />;
      default:
        return <DashboardPage {...props} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (desktop always visible, mobile offcanvas) */}
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          title={PAGE_TITLES[page] || page}
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          lang={lang}
          setLang={setLang}
        />
        <main className="flex-1 overflow-auto bg-[#f8f3e8]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}


export default function App() {
  const { isAuthed, login, user, token, logout } = useAuth();
  const [authView, setAuthView] = useState('login');

  // ✅ ADD THESE TWO LINES
  console.log('user:', user);
  console.log('role:', user?.role);

  if (!isAuthed) {
    return authView === 'login' ? (
      <LoginPage onLogin={login} onGoRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onGoLogin={() => setAuthView('login')} />
    );
  }

  if (user?.role === 'ADMIN') {
    return <AdminApp user={user} token={token} onLogout={logout} />;
  }
  if (user?.role === 'RECEPTIONIST') {
    return <ReceptionistApp user={user} token={token} onLogout={logout} />;
  }
  
  return <AppShell />;
}