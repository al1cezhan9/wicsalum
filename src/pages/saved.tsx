import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';
import { getFavorites } from '../utils/favorites';

const SavedPage: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSavedProfiles = async () => {
      setLoading(true);
      setMessage('');

      const ids = getFavorites();
      if (ids.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setProfiles((data as UserProfile[]) ?? []);
      setLoading(false);
    };

    loadSavedProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex gap-2">
          <Link to="/directory" className="px-3 py-2 rounded bg-white shadow text-sm">Directory</Link>
          <Link to="/saved" className="px-3 py-2 rounded bg-indigo-600 text-white shadow text-sm">Saved</Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-semibold mb-4">Saved Profiles</h1>
          {message && <p className="text-red-600 mb-4">{message}</p>}
          {loading && <p>Loading...</p>}
          {!loading && profiles.length === 0 && <p>No saved profiles yet.</p>}

          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPage;
