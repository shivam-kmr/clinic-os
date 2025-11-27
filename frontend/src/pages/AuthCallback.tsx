import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // Redirect to login with error
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Navigate based on role and hospital setup status
        if (!user.hospitalId) {
          navigate('/setup');
        } else if (user.role === 'HOSPITAL_OWNER') {
          navigate('/setup');
        } else if (user.role === 'RECEPTIONIST') {
          navigate('/reception');
        } else if (user.role === 'DOCTOR') {
          if (user.doctorId) {
            navigate(`/doctor/${user.doctorId}`);
          } else {
            navigate('/setup');
          }
        } else {
          navigate('/reception');
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login?error=Invalid authentication data');
      }
    } else {
      navigate('/login?error=Authentication failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

