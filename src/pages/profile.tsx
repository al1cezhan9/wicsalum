import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import TagSelector from '../components/TagSelector';
import Avatar from '../components/Avatar';

const SECTORS = [
  'software', 'finance', 'consulting', 'healthcare', 'education',
  'government', 'nonprofit', 'research', 'other',
];

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-[#C8B6F0] rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:border-[#673AB7]';

const LABEL_CLASS = 'block text-xs font-medium text-[#8B6AD9] uppercase tracking-wide mb-1';

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

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const user = await getCurrentUser();
    if (!user) { navigate('/signup'); return; }
    const userProfile = await getUserProfile();
    if (!userProfile) { navigate('/register'); return; }
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

  const handleEditCancel = () => { setEditing(false); setEditError(''); };

  const handleSave = async () => {
    if (!profile) return;
    setEditError('');
    if (!editData.name?.trim()) { setEditError('Name is required.'); return; }
    if (!editData.current_company?.trim()) { setEditError('Company is required.'); return; }
    if (!editData.current_city?.trim()) { setEditError('City is required.'); return; }
    if (!editData.bio?.trim()) { setEditError('Bio is required.'); return; }
    if ((editData.bio?.length ?? 0) > 500) { setEditError('Bio must be 500 characters or less.'); return; }
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
    if (error) { setEditError(`Error saving: ${error.message}`); return; }
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

  const handleSignOut = async () => { await signOut(); navigate('/signup'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8B6F0] border-t-[#673AB7] mx-auto"></div>
          <p className="mt-4 text-[#8B6AD9] text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F7F4FF]">
      <header className="sticky top-0 z-10 bg-[#2E1A47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white tracking-wide">My Profile</h1>
          <nav className="flex items-center gap-6">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-[#C8B6F0] text-sm font-medium">
                Admin
              </button>
            )}
            <button onClick={() => navigate('/directory')} className="text-[#C8B6F0] text-sm">
              Directory
            </button>
            <button onClick={handleSignOut} className="text-[#C8B6F0] text-sm">
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#C8B6F0] rounded-lg p-8">
          {editing ? (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#2E1A47]">Edit Profile</h2>

              <div className="flex items-center gap-4">
                <Avatar
                  name={profile.name}
                  profilePictureUrl={profilePicPreview || profile.profile_picture_url}
                  size="lg"
                />
                <div>
                  <label className="cursor-pointer text-sm text-[#673AB7] font-medium">
                    {profile.profile_picture_url || profilePicPreview ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG. Max 5MB.</p>
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{editError}</p>
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Current Company <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={editData.current_company || ''}
                    onChange={e => setEditData(d => ({ ...d, current_company: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Role / Title</label>
                  <input
                    type="text"
                    value={editData.job_title || ''}
                    onChange={e => setEditData(d => ({ ...d, job_title: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>City / Location <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={editData.current_city || ''}
                    onChange={e => setEditData(d => ({ ...d, current_city: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Sector</label>
                  <select
                    value={editData.sector || ''}
                    onChange={e => setEditData(d => ({ ...d, sector: e.target.value }))}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Bio <span className="text-red-400">*</span></label>
                <textarea
                  value={editData.bio || ''}
                  onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className={INPUT_CLASS}
                />
                <p className="mt-1 text-xs text-gray-400">{(editData.bio || '').length}/500 characters</p>
              </div>

              <TagSelector selected={editTags} onChange={setEditTags} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={editData.linkedin_url || ''}
                    onChange={e => setEditData(d => ({ ...d, linkedin_url: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#673AB7] text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={saving}
                  className="text-[#673AB7] px-6 py-2 rounded-md border border-[#C8B6F0] text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="pt-5 border-t border-[#F0EBF9]">
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    disabled={saving}
                    className="text-sm text-red-400"
                  >
                    Delete my profile
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Are you sure? This cannot be undone. You will be signed out.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="bg-red-500 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                      >
                        {saving ? 'Deleting...' : 'Yes, delete my profile'}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        disabled={saving}
                        className="text-gray-500 px-4 py-2 rounded-md border border-gray-200 text-sm disabled:opacity-50"
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
                    <h2 className="text-2xl font-bold text-[#2E1A47]">{profile.name}</h2>
                    <p className="text-[#8B6AD9] text-sm mt-0.5">Class of {profile.graduation_year}</p>
                  </div>
                </div>
                <button onClick={handleEditStart} className="text-sm text-[#673AB7] font-medium">
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className={LABEL_CLASS}>Company</h3>
                  <p className="text-[#4F2A94] font-semibold">{profile.current_company}</p>
                  {profile.job_title && <p className="text-gray-500 text-sm mt-0.5">{profile.job_title}</p>}
                </div>
                <div>
                  <h3 className={LABEL_CLASS}>Location</h3>
                  <p className="text-gray-700">{profile.current_city}</p>
                </div>
                {profile.sector && (
                  <div>
                    <h3 className={LABEL_CLASS}>Sector</h3>
                    <span className="inline-block text-sm bg-[#EDE7F6] text-[#4F2A94] px-3 py-0.5 rounded-full">
                      {profile.sector.charAt(0).toUpperCase() + profile.sector.slice(1)}
                    </span>
                  </div>
                )}
                {profile.email && (
                  <div>
                    <h3 className={LABEL_CLASS}>Email</h3>
                    <a href={`mailto:${profile.email}`} className="text-[#673AB7] text-sm">{profile.email}</a>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div>
                    <h3 className={LABEL_CLASS}>LinkedIn</h3>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#673AB7] text-sm">
                      {profile.linkedin_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-[#F0EBF9] pt-5">
                <h3 className={LABEL_CLASS}>Bio</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </div>

              {profile.tags && profile.tags.length > 0 && (
                <div className="border-t border-[#F0EBF9] pt-5">
                  <h3 className={LABEL_CLASS}>Areas of Expertise / Interest</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.tags.map(tag => (
                      <span key={tag} className="bg-[#EDE7F6] text-[#4F2A94] text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
