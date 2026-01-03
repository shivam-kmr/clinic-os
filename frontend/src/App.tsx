import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorScreen from './pages/DoctorScreen';
import WaitingRoom from './pages/WaitingRoom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import HospitalSetup from './pages/HospitalSetup';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import AppShell from './components/AppShell';
import { CalDemoInit } from './components/CalDemoPopup';
import { ScrollToTop } from './components/ScrollToTop';
import { MARKETING_BASE_URL } from './lib/urls';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

type StoredUser = {
  // kept intentionally minimal; dashboard routing is driven by token presence + memberships
};

function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getDefaultRouteForUser(user: StoredUser | null) {
  if (!user) return '/login';
  return '/dashboard';
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireActiveClinic({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const activeHospitalId = localStorage.getItem('activeHospitalId');
  if (!token) return <Navigate to="/login" replace />;
  if (!activeHospitalId) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const user = getStoredUser();
  if (token && user) return <Navigate to={getDefaultRouteForUser(user)} replace />;
  return <>{children}</>;
}

function ExternalRedirect({ to }: { to: string }) {
  // Use an effect-less redirect to keep it simple.
  window.location.replace(to);
  return null;
}

function App() {
  // Only wrap with GoogleOAuthProvider if client ID is configured
  const AppContent = () => (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CalDemoInit />
      <ScrollToTop />
      <Routes>
        {/* App entrypoint: default to Login; marketing lives on the main site */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        {/* If a user hits old marketing routes on the app, bounce them to the marketing domain. */}
        <Route path="/pricing" element={<ExternalRedirect to={`${MARKETING_BASE_URL}/pricing`} />} />
        <Route path="/testimonials" element={<ExternalRedirect to={`${MARKETING_BASE_URL}/testimonials`} />} />
        <Route path="/certifications" element={<ExternalRedirect to={`${MARKETING_BASE_URL}/certifications`} />} />
        <Route path="/schedule-demo" element={<ExternalRedirect to={`${MARKETING_BASE_URL}/schedule-demo`} />} />
        <Route
          path="/auth/callback"
          element={
            <PublicOnly>
              <AuthCallback />
            </PublicOnly>
          }
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<HospitalSetup />} />
          <Route path="/team" element={<Team />} />
          <Route
            path="/reception"
            element={
              <RequireActiveClinic>
                <ReceptionDashboard />
              </RequireActiveClinic>
            }
          />
          <Route
            path="/doctor/:doctorId"
            element={
              <RequireActiveClinic>
                <DoctorScreen />
              </RequireActiveClinic>
            }
          />
        </Route>
        <Route path="/waiting-room/:departmentId" element={<WaitingRoom />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );

  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-In will not work.');
    return <AppContent />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}

export default App;

