import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserRole, UserRole, UserProfile, signOut } from '../lib/auth';

const LABEL_CLASS = 'block text-xs font-medium text-[#8B6AD9] uppercase tracking-wide mb-1';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ totalAlumni: 0, recentRegistrations: 0 });

  useEffect(() => { checkAdminAccess(); }, []);

  useEffect(() => {
    if (userRole && userRole.role === 'admin') loadData();
  }, [userRole]);

  const checkAdminAccess = async () => {
    const user = await getCurrentUser();
    if (!user) { navigate('/signup'); return; }
    const role = await getUserRole();
    if (!role || role.role !== 'admin') { navigate('/directory'); return; }
    setUserRole(role);
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) { console.error('Error loading profiles:', error); return; }
      const profilesList = profiles || [];
      setAllProfiles(profilesList);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStats({
        totalAlumni: profilesList.length,
        recentRegistrations: profilesList.filter(p => new Date(p.created_at) >= weekAgo).length,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) { alert(`Error: ${error.message}`); return; }
      await loadData();
    } catch {
      alert('An unexpected error occurred.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Graduation Year', 'Company', 'Job Title', 'City', 'Bio', 'Email', 'LinkedIn'];
    const rows = allProfiles.map(p => [
      p.name, p.graduation_year, p.current_company, p.job_title || '',
      p.current_city, p.bio.replace(/"/g, '""'), p.email || '', p.linkedin_url || '',
    ]);
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `wics-alumni-directory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = async () => { await signOut(); navigate('/signup'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8B6F0] border-t-[#673AB7] mx-auto"></div>
          <p className="mt-4 text-[#8B6AD9] text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4FF]">
      <header className="sticky top-0 z-10 bg-[#2E1A47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-wide">Admin Panel</h1>
          <nav className="flex items-center gap-6">
            <button onClick={() => navigate('/directory')} className="text-[#C8B6F0] text-sm">
              Directory
            </button>
            <button onClick={handleSignOut} className="text-[#C8B6F0] text-sm">
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-[#C8B6F0] rounded-lg p-6">
            <h3 className={LABEL_CLASS}>Total Members</h3>
            <p className="text-4xl font-bold text-[#2E1A47]">{stats.totalAlumni}</p>
          </div>
          <div className="bg-white border border-[#C8B6F0] rounded-lg p-6">
            <h3 className={LABEL_CLASS}>New This Week</h3>
            <p className="text-4xl font-bold text-[#673AB7]">{stats.recentRegistrations}</p>
          </div>
        </div>

        <div className="bg-white border border-[#C8B6F0] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#2E1A47] mb-3">Export Directory</h3>
          <p className="text-xs text-gray-500 mb-4">Download all profiles as a CSV file.</p>
          <button
            onClick={exportToCSV}
            className="bg-[#673AB7] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Export to CSV
          </button>
        </div>

        {stats.recentRegistrations > 0 && (
          <div className="bg-white border border-[#C8B6F0] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#2E1A47] mb-4">Recent Registrations</h3>
            <div className="space-y-2">
              {allProfiles
                .filter(p => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(p.created_at) >= weekAgo;
                })
                .slice(0, 5)
                .map(profile => (
                  <div key={profile.id} className="flex items-center justify-between py-2 border-b border-[#F0EBF9] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#2E1A47]">{profile.name}</p>
                      <p className="text-xs text-gray-400">
                        {profile.current_company} · {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#C8B6F0] rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#2E1A47] mb-4">All Profiles</h3>
          {allProfiles.length === 0 ? (
            <p className="text-gray-400 text-sm">No profiles found.</p>
          ) : (
            <div className="space-y-3">
              {allProfiles.map(profile => (
                <AdminProfileCard
                  key={profile.id}
                  profile={profile}
                  onDelete={() => handleDelete(profile.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface AdminProfileCardProps {
  profile: UserProfile;
  onDelete: () => void;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({ profile, onDelete }) => {
  return (
    <div className="border border-[#F0EBF9] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#2E1A47]">{profile.name}</h3>
          <p className="text-xs text-[#8B6AD9] mt-0.5">Class of {profile.graduation_year}</p>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-xs text-[#8B6AD9] uppercase tracking-wide">Company</span>
          <p className="text-gray-700">{profile.current_company}{profile.job_title && ` · ${profile.job_title}`}</p>
        </div>
        <div>
          <span className="text-xs text-[#8B6AD9] uppercase tracking-wide">Location</span>
          <p className="text-gray-700">{profile.current_city}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{profile.bio}</p>

      <div className="flex items-center justify-between pt-3 border-t border-[#F0EBF9] text-xs text-gray-400">
        <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
        {(profile.email || profile.linkedin_url) && (
          <span>
            {profile.email && `${profile.email}`}
            {profile.email && profile.linkedin_url && ' · '}
            {profile.linkedin_url && 'LinkedIn'}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
