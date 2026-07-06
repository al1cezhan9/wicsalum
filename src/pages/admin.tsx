import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserRole, UserRole, UserProfile, signOut } from '../lib/auth';

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
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('Error loading profiles:', error); return; }
    const profilesList = profiles || [];
    setAllProfiles(profilesList);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = profilesList.filter(p => new Date(p.created_at) >= weekAgo).length;
    setStats({ totalAlumni: profilesList.length, recentRegistrations: recent });
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) { alert(`Error: ${error.message}`); return; }
    await loadData();
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Graduation Year', 'Company', 'Job Title', 'City', 'Bio', 'Email', 'LinkedIn'];
    const rows = allProfiles.map(p => [
      p.name,
      p.graduation_year,
      p.current_company,
      p.job_title || '',
      p.current_city,
      (p.bio || '').replace(/"/g, '""'),
      p.email || '',
      p.linkedin_url || '',
    ]);
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(',')),
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading admin panel…</p>
      </div>
    );
  }

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
          <div>
            <h1 className="font-black" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>Admin Panel</h1>
            <p className="text-sm mt-1 font-black" style={{ color: '#FFFFFF', opacity: 0.85 }}>
              Manage the WiCS directory
            </p>
          </div>
          <nav className="flex items-center gap-1">
            <HeaderLink onClick={() => navigate('/directory')}>Directory</HeaderLink>
            <HeaderLink onClick={handleSignOut}>Sign Out</HeaderLink>
          </nav>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto space-y-10"
        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard label="Total Members" value={stats.totalAlumni} />
          <StatCard label="Recent (7 days)" value={stats.recentRegistrations} accent />
        </div>

        <div className="card p-8">
          <h3 className="font-black mb-2" style={{ color: 'var(--plum-900)', fontSize: '1rem' }}>
            Export Directory
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Export all profiles to a CSV file.
          </p>
          <button onClick={exportToCSV} className="btn-primary">Export to CSV</button>
        </div>

        {stats.recentRegistrations > 0 && (
          <div className="card p-8">
            <h3 className="font-black mb-5" style={{ color: 'var(--plum-900)', fontSize: '1rem' }}>
              Recent Registrations
            </h3>
            <div className="space-y-3">
              {allProfiles
                .filter(p => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(p.created_at) >= weekAgo;
                })
                .slice(0, 5)
                .map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--plum-50)' }}
                  >
                    <div>
                      <p className="font-bold" style={{ color: 'var(--plum-900)' }}>{profile.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {profile.current_company} · {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="card p-8">
          <h3 className="font-black mb-5" style={{ color: 'var(--plum-900)', fontSize: '1rem' }}>
            All Profiles
          </h3>
          {allProfiles.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No profiles found.</p>
          ) : (
            <div className="space-y-4">
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
      </main>
    </div>
  );
};

const HeaderLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-base font-black px-3 py-1.5 rounded-md"
    style={{
      background: 'transparent',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Lato, sans-serif',
    }}
  >
    {children}
  </button>
);

const StatCard: React.FC<{ label: string; value: number; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="card p-6">
    <p className="field-label" style={{ marginBottom: '0.5rem' }}>{label}</p>
    <p
      className="font-black"
      style={{
        color: accent ? 'var(--plum-700)' : 'var(--plum-900)',
        fontSize: '2rem',
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </p>
  </div>
);

interface AdminProfileCardProps {
  profile: UserProfile;
  onDelete: () => void;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({ profile, onDelete }) => (
  <div className="p-5 rounded-lg" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-bold" style={{ color: 'var(--plum-900)', fontSize: '1rem' }}>
          {profile.name}
        </h3>
        <p className="text-xs mt-0.5 font-bold" style={{ color: 'var(--plum-500)' }}>
          Class of {profile.graduation_year}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="text-xs font-bold px-3 py-1.5 rounded-md"
        style={{ background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
      >
        Delete
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <span style={{ color: 'var(--muted)' }}>Company: </span>
        <span style={{ color: 'var(--ink)' }}>{profile.current_company}</span>
        {profile.job_title && <span style={{ color: 'var(--muted)' }}> — {profile.job_title}</span>}
      </div>
      <div>
        <span style={{ color: 'var(--muted)' }}>Location: </span>
        <span style={{ color: 'var(--ink)' }}>{profile.current_city}</span>
      </div>
    </div>

    {profile.bio && (
      <p className="text-sm mb-4" style={{ color: 'var(--ink)' }}>{profile.bio}</p>
    )}

    <div
      className="flex items-center justify-between pt-4 text-xs"
      style={{ borderTop: '1px solid var(--line)', color: 'var(--muted)' }}
    >
      <span>Created: {new Date(profile.created_at).toLocaleString()}</span>
      {(profile.email || profile.linkedin_url) && (
        <span>
          {profile.email && `Email: ${profile.email}`}
          {profile.email && profile.linkedin_url && ' · '}
          {profile.linkedin_url && 'LinkedIn available'}
        </span>
      )}
    </div>
  </div>
);

export default AdminPage;
