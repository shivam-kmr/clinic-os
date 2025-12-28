import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setActiveHospitalId, type Membership } from '@/lib/clinic';

function selectDefaultHospital(memberships: Membership[]) {
  if (memberships.length === 1) return memberships[0].hospitalId;
  return null;
}

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

        const memberships: Membership[] = user.memberships || [];
        setActiveHospitalId(selectDefaultHospital(memberships));

        navigate('/dashboard');
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

