import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserProfile, getUserRole } from '../lib/auth';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { navigate('/signup'); return; }
      const role = await getUserRole();
      if (role && role.role === 'admin') { navigate('/admin'); return; }
      const profile = await getUserProfile();
      navigate(profile ? '/directory' : '/register');
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
      <div className="text-center">
        <div
          className="inline-block w-10 h-10 rounded-full animate-spin"
          style={{ border: '3px solid var(--plum-100)', borderTopColor: 'var(--plum-700)' }}
        />
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    </div>
  );
}
