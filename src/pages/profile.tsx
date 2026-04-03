import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import TagSelector from '../components/TagSelector';
import LocationAutocomplete from '../components/LocationAutocomplete';
import Avatar from '../components/Avatar';

const SECTORS = [
  'software', 'finance', 'consulting', 'healthcare', 'education',
  'government', 'nonprofit', 'research', 'other',
];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [editTags, setEditTags] = useState<string[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');

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
    const role = await getUserRole();
    setIsAdmin(role?.role === 'admin');
    setLoading(false);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setEditError('Please upload an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setEditError('Image must be less than 5MB.'); return; }
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleEditStart = () => {
    if (!profile) return;
    setProfilePicFile(null);
    setProfilePicPreview('');
    setEditData({
      name: profile.name,
      current_company: profile.current_company,
      job_title: profile.job_title || '',
      current_city: profile.current_city,
      bio: profile.bio,
      email: profile.email || '',
      linkedin_url: profile.linkedin_url || '',
      sector: profile.sector || '',
    });
    setEditTags(profile.tags ?? []);
    setEditError('');
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditError('');
  };

  const handleSave = async () => {
    if (!profile) return;
    setEditError('');

    if (!editData.name?.trim()) { setEditError('Name is required.'); return; }
    if (!editData.current_company?.trim()) { setEditError('Company is required.'); return; }
    if (!editData.current_city?.trim()) { setEditError('City is required.'); return; }
    if (!editData.bio?.trim()) { setEditError('Bio is required.'); return; }
    if ((editData.bio?.length ?? 0) > 500) { setEditError('Bio must be 500 characters or less.'); return; }
    if (!editData.email?.trim() && !editData.linkedin_url?.trim()) {
      setEditError('Please provide at least one contact method (email or LinkedIn).');
      return;
    }

    setSaving(true);

    let newPictureUrl = profile.profile_picture_url;
    if (profilePicFile) {
      const user = await getCurrentUser();
      if (user) {
        const fileExt = profilePicFile.name.split('.').pop();
        const filePath = `${user.id}/profile.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, profilePicFile, { upsert: true });
        if (uploadError) {
          setEditError(`Upload error: ${uploadError.message}`);
          setSaving(false);
          return;
        }
        newPictureUrl = supabase.storage.from('profile-pictures').getPublicUrl(filePath).data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: editData.name!.trim(),
        current_company: editData.current_company!.trim(),
        job_title: editData.job_title?.trim() || null,
        current_city: editData.current_city!.trim(),
        bio: editData.bio!.trim(),
        email: editData.email?.trim() || null,
        linkedin_url: editData.linkedin_url?.trim() || null,
        sector: editData.sector?.trim() || null,
        tags: editTags,
        profile_picture_url: newPictureUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setEditError(`Error saving: ${error.message}`);
      return;
    }

    setProfile(data as UserProfile);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
    setSaving(false);
    if (error) { setEditError(`Error deleting profile: ${error.message}`); return; }
    await signOut();
    navigate('/signup');
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

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Admin Panel
                </button>
              )}
              <button onClick={() => navigate('/directory')} className="text-sm text-gray-700 hover:text-gray-900">
                Directory
              </button>
              <button onClick={handleSignOut} className="text-sm text-gray-700 hover:text-gray-900">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {editing ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>

              <div className="flex items-center gap-4">
                <Avatar
                  name={profile.name}
                  profilePictureUrl={profilePicPreview || profile.profile_picture_url}
                  size="lg"
                />
                <div>
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                    {profile.profile_picture_url || profilePicPreview ? 'Change photo' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG. Max 5MB.</p>
                </div>
              </div>

              {editError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{editError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Company <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editData.current_company || ''}
                    onChange={e => setEditData(d => ({ ...d, current_company: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
                  <input
                    type="text"
                    value={editData.job_title || ''}
                    onChange={e => setEditData(d => ({ ...d, job_title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City/Location <span className="text-red-500">*</span></label>
                  <LocationAutocomplete
                    value={editData.current_city || ''}
                    onChange={val => setEditData(d => ({ ...d, current_city: val }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                  <select
                    value={editData.sector || ''}
                    onChange={e => setEditData(d => ({ ...d, sector: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editData.bio || ''}
                  onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">{(editData.bio || '').length}/500 characters</p>
              </div>

              <TagSelector selected={editTags} onChange={setEditTags} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editData.linkedin_url || ''}
                    onChange={e => setEditData(d => ({ ...d, linkedin_url: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={saving}
                  className="text-gray-700 px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="pt-6 border-t">
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    disabled={saving}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete my profile
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">Are you sure? This cannot be undone. You will be signed out.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm transition disabled:opacity-50"
                      >
                        {saving ? 'Deleting...' : 'Yes, delete my profile'}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        disabled={saving}
                        className="text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-sm transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={profile.name} profilePictureUrl={profile.profile_picture_url} size="lg" />
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-lg text-gray-600 mt-1">Class of {profile.graduation_year}</p>
                  </div>
                </div>
                <button
                  onClick={handleEditStart}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Current Company</h3>
                  <p className="text-gray-900">{profile.current_company}</p>
                  {profile.job_title && <p className="text-gray-600 mt-1">{profile.job_title}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                  <p className="text-gray-900">{profile.current_city}</p>
                </div>
                {profile.sector && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Sector</h3>
                    <p className="text-gray-900">{profile.sector.charAt(0).toUpperCase() + profile.sector.slice(1)}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{profile.bio}</p>
              </div>

              {profile.tags && profile.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Areas of Expertise / Interest</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.tags.map(tag => (
                      <span key={tag} className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                <div className="space-y-2">
                  {profile.email && (
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">Email:</span>
                      <a href={`mailto:${profile.email}`} className="text-blue-600 hover:text-blue-800">{profile.email}</a>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">LinkedIn:</span>
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
