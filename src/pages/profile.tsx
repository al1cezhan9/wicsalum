import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/signup');
      return;
    }

    const userProfile = await getUserProfile();
    if (!userProfile) {
      navigate('/register');
      return;
    }

    setProfile(userProfile);

    // Check if user is admin
    const role = await getUserRole();
    setIsAdmin(role?.role === 'admin');

    setLoading(false);
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
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Admin Panel
                </button>
              )}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-lg text-gray-600 mt-1">Class of {profile.graduation_year}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Company</h3>
                <p className="text-gray-900">{profile.current_company}</p>
                {profile.job_title && (
                  <p className="text-gray-600 mt-1">{profile.job_title}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-gray-900">{profile.current_city}</p>
              </div>

            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{profile.bio}</p>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
              <div className="space-y-2">
                {profile.email && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Email:</span>
                    <a href={`mailto:${profile.email}`} className="text-blue-600 hover:text-blue-800">
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">LinkedIn:</span>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {profile.linkedin_url}
                    </a>
                  </div>
                )}
                {!profile.email && !profile.linkedin_url && (
                  <p className="text-gray-500 text-sm">No contact information provided</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

