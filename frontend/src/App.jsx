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
import { EmergencyPage } from './pages/EmergencyPage'; 
import { EmergencyProvider } from './context/EmergencyContext';
import { GuestComplaintPage } from './pages/GuestComplaintPage'; 
import { StaffApp } from './staff/StaffApp';
import { RewardsPage, SettingsPage, SupportPage } from './pages/OtherPages';
import { PAGE_TITLES } from './constants/config';
import { GuestServiceRequest } from './pages/GuestServiceRequest';
import { ReceptionServiceList } from './receptionist/ReceptionServiceList';
import { StaffServiceTasks } from './staff/StaffServiceTasks'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import { AdminApp } from './admin/AdminApp';
import { ReceptionistApp } from './receptionist/ReceptionistApp';
import { HousekeeperApp } from './housekeeper/HousekeeperApp';
function AppShell() {
  const { user, token, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    const props = { user, token, t, setPage };
    const roomNumber = user?.roomNumber || '';
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
      case 'emergency':
      return <EmergencyPage {...props} roomNumber={roomNumber} />;  // ← Add roomNumber
      case 'complaints':
      return <GuestComplaintPage {...props} roomNumber={roomNumber} />;  // ← Add roomNumber
      case 'services':
        return <GuestServiceRequest {...props} roomNumber={roomNumber} />;  // ← Add roomNumber
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
  if (user?.role === 'HOUSEKEEPER') {
  return <HousekeeperApp user={user} token={token} onLogout={logout} />;
  }
  const staffRoles = ['STAFF', 'MAINTENANCE', 'SECURITY', 'FRONT_DESK', 'MANAGEMENT'];
  if (staffRoles.includes(user?.role)) {
    return <StaffApp user={user} token={token} onLogout={logout} />;
  }
  
  return <AppShell />;
}