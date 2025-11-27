import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorScreen from './pages/DoctorScreen';
import WaitingRoom from './pages/WaitingRoom';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import HospitalSetup from './pages/HospitalSetup';
import Landing from './pages/Landing';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  // Only wrap with GoogleOAuthProvider if client ID is configured
  const AppContent = () => (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/setup" element={<HospitalSetup />} />
        <Route path="/reception" element={<ReceptionDashboard />} />
        <Route path="/doctor/:doctorId" element={<DoctorScreen />} />
        <Route path="/waiting-room/:departmentId" element={<WaitingRoom />} />
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

