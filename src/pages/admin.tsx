import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserRole, UserRole, UserProfile, signOut } from '../lib/auth';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalAlumni: 0,
    recentRegistrations: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (userRole && userRole.role === 'admin') {
      loadData();
    }
  }, [userRole]);

  const checkAdminAccess = async () => {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/signup');
      return;
    }

    const role = await getUserRole();
    if (!role || role.role !== 'admin') {
      navigate('/directory');
      return;
    }

    setUserRole(role);
    setLoading(false);
  };

  const loadData = async () => {
    try {
      // Load all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      const profilesList = profiles || [];
      setAllProfiles(profilesList);

      // Calculate stats
      const recent = profilesList.filter(p => {
        const createdAt = new Date(p.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt >= weekAgo;
      }).length;

      setStats({
        totalAlumni: profilesList.length,
        recentRegistrations: recent,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      await loadData();
    } catch (err) {
      alert('An unexpected error occurred.');
    }
  };

  const exportToCSV = () => {
    // CSV headers
    const headers = [
      'Name',
      'Graduation Year',
      'Company',
      'Job Title',
      'City',
      'Bio',
      'Email',
      'LinkedIn',
    ];

    // CSV rows
    const rows = allProfiles.map(profile => [
      profile.name,
      profile.graduation_year,
      profile.current_company,
      profile.job_title || '',
      profile.current_city,
      profile.bio.replace(/"/g, '""'), // Escape quotes
      profile.email || '',
      profile.linkedin_url || '',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/directory')}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Directory
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Alumni</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAlumni}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent (7 days)</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.recentRegistrations}</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Export Directory</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export all profiles to a CSV file.
          </p>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Export to CSV
          </button>
        </div>

        {/* Recent Registrations */}
        {allProfiles.filter(p => {
          const createdAt = new Date(p.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt >= weekAgo;
        }).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Registrations</h3>
            <div className="space-y-3">
              {allProfiles
                .filter(p => {
                  const createdAt = new Date(p.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdAt >= weekAgo;
                })
                .slice(0, 5)
                .map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{profile.name}</p>
                      <p className="text-sm text-gray-600">
                        {profile.current_company} • {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Profiles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Profiles</h3>
          {allProfiles.length === 0 ? (
            <p className="text-gray-500">No profiles found.</p>
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
      </div>
    </div>
  );
};

// Admin Profile Card Component
interface AdminProfileCardProps {
  profile: UserProfile;
  onDelete: () => void;
}

const AdminProfileCard: React.FC<AdminProfileCardProps> = ({ profile, onDelete }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
          <p className="text-sm text-gray-600 mt-1">Class of {profile.graduation_year}</p>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Company:</span> {profile.current_company}
          {profile.job_title && ` - ${profile.job_title}`}
        </div>
        <div>
          <span className="text-gray-500">Location:</span> {profile.current_city}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">{profile.bio}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t text-xs text-gray-500">
        <span>Created: {new Date(profile.created_at).toLocaleString()}</span>
        {(profile.email || profile.linkedin_url) && (
          <span>
            {profile.email && `Email: ${profile.email}`}
            {profile.email && profile.linkedin_url && ' • '}
            {profile.linkedin_url && 'LinkedIn available'}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
