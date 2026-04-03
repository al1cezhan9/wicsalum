import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type SavedProfile = {
  id: string;
  first_name: string;
  last_name: string;
  cu_email: string;
  bio: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
};

const SavedPage: React.FC = () => {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSavedProfiles = async () => {
      setLoading(true);
      setMessage('');

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage('Please sign in to view saved profiles.');
        setLoading(false);
        return;
      }

      const { data: savedRows, error: savedError } = await supabase
        .from('saved_profiles')
        .select('profile_id')
        .eq('user_id', user.id);

      if (savedError) {
        setMessage(savedError.message);
        setLoading(false);
        return;
      }

      const profileIds = (savedRows ?? []).map((r: { profile_id: string }) => r.profile_id);
      if (profileIds.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, cu_email, bio, linkedin_url, profile_picture_url')
        .in('id', profileIds);

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      setProfiles((profileRows as SavedProfile[]) ?? []);
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
              <div key={p.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {p.profile_picture_url && (
                    <img
                      src={p.profile_picture_url}
                      alt={`${p.first_name} ${p.last_name}`}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="font-medium">{p.first_name} {p.last_name}</p>
                    <p className="text-sm text-gray-600">{p.cu_email}</p>
                  </div>
                </div>
                {p.bio && <p className="mt-3 text-sm text-gray-700">{p.bio}</p>}
                {p.linkedin_url && (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-sm text-indigo-600 hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPage;