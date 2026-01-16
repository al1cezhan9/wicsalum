import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserProfile, getUserRole } from '../lib/auth';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/signup');
      return;
    }

    // Check if user is admin
    const role = await getUserRole();
    if (role && role.role === 'admin') {
      navigate('/admin');
      return;
    }

    // Check if profile exists
    const profile = await getUserProfile();
    if (profile) {
      navigate('/directory');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
