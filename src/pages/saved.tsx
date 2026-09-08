import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';
import ProfileModal from '../components/ProfileModal';
import { getFavorites } from '../utils/favorites';

const SavedPage: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<UserProfile | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMessage('');
      const ids = getFavorites();
      if (ids.length === 0) { setProfiles([]); setLoading(false); return; }
      const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
      if (error) { setMessage(error.message); setLoading(false); return; }
      setProfiles((data as UserProfile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <header
        className="sticky top-0 z-40"
        style={{ background: '#A597D2', borderBottom: '1px solid #8B6AD9' }}
      >
        <div
          className="max-w-7xl mx-auto flex items-center justify-between"
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          <h1 className="font-black" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>Saved Profiles</h1>
          <nav className="flex items-center gap-1">
            <Link
              to="/directory"
              className="text-base font-black px-3 py-1.5 rounded-md"
              style={{ color: 'white', textDecoration: 'none' }}
            >
              Directory
            </Link>
          </nav>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto"
        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        {message && (
          <div
            className="mb-8 p-3 rounded-lg text-sm"
            style={{ background: '#FDECEC', border: '1px solid #F5CACA', color: '#8A1F1F' }}
          >
            {message}
          </div>
        )}
        {loading ? (
          <div className="card p-16 text-center" style={{ color: 'var(--muted)' }}>Loading…</div>
        ) : profiles.length === 0 ? (
          <div className="card p-16 text-center" style={{ color: 'var(--muted)' }}>
            No saved profiles yet.
          </div>
        ) : (
          <div className="card-grid">
            {profiles.map(p => (
              <ProfileCard key={p.id} profile={p} onOpen={setSelected} />
            ))}
          </div>
        )}
      </main>

      <ProfileModal profile={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default SavedPage;
