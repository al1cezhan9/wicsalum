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
        const filePath = `${user.id}/profile_${Date.now()}.${fileExt}`;
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
    const user = await getCurrentUser();
    if (user) {
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      setSaving(false);
      if (error) { setEditError(`Error deleting profile: ${error.message}`); return; }
      await signOut();
      navigate('/signup');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading profile…</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <header
        className="sticky top-0 z-40"
        style={{ background: '#A597D2', borderBottom: '1px solid #8B6AD9' }}
      >
        <div
          className="max-w-5xl mx-auto flex items-center justify-between"
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          <h1 className="font-black" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>My Profile</h1>
          <nav className="flex items-center gap-1">
            {isAdmin && <HeaderLink onClick={() => navigate('/admin')}>Admin</HeaderLink>}
            <HeaderLink onClick={() => navigate('/directory')}>Directory</HeaderLink>
            <HeaderLink onClick={handleSignOut}>Sign Out</HeaderLink>
          </nav>
        </div>
      </header>

      <main
        className="max-w-3xl mx-auto"
        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        <div className="card" style={{ padding: '2.75rem' }}>
          {editing ? (
            <div className="form-stack">
              <h2 className="font-black" style={{ color: 'var(--plum-900)', fontSize: '1.4rem' }}>
                Edit Profile
              </h2>

              <div className="flex items-center gap-4">
                <img
                  src={profilePicPreview || profile.profile_picture_url || undefined}
                  alt=""
                  className="rounded-full object-cover"
                  style={{
                    width: 64, height: 64,
                    minWidth: 64, minHeight: 64,
                    maxWidth: 64, maxHeight: 64,
                    border: '1px solid var(--line)',
                    display: (profilePicPreview || profile.profile_picture_url) ? 'block' : 'none',
                  }}
                />
                {!profilePicPreview && !profile.profile_picture_url && (
                  <Avatar name={profile.name} profilePictureUrl={null} size="md" />
                )}
                <div>
                  <label className="cursor-pointer text-sm font-bold" style={{ color: 'var(--plum-700)' }}>
                    {profile.profile_picture_url || profilePicPreview ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                  </label>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>JPEG, PNG. Max 5MB.</p>
                </div>
              </div>

              {editError && <ErrorBox>{editError}</ErrorBox>}

              <Field label="Full Name" required>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                  className="input-plum"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: '1.5rem', rowGap: '2.25rem' }}>
                <Field label="Current Company" required>
                  <input
                    type="text"
                    value={editData.current_company || ''}
                    onChange={e => setEditData(d => ({ ...d, current_company: e.target.value }))}
                    className="input-plum"
                  />
                </Field>
                <Field label="Role/Title">
                  <input
                    type="text"
                    value={editData.job_title || ''}
                    onChange={e => setEditData(d => ({ ...d, job_title: e.target.value }))}
                    className="input-plum"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: '1.5rem', rowGap: '2.25rem' }}>
                <Field label="City/Location" required>
                  <LocationAutocomplete
                    value={editData.current_city || ''}
                    onChange={val => setEditData(d => ({ ...d, current_city: val }))}
                  />
                </Field>
                <Field label="Sector">
                  <select
                    value={editData.sector || ''}
                    onChange={e => setEditData(d => ({ ...d, sector: e.target.value }))}
                    className="input-plum"
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Bio" required>
                <textarea
                  value={editData.bio || ''}
                  onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))}
                  rows={4}
                  maxLength={500}
                  className="input-plum"
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {(editData.bio || '').length}/500 characters
                </p>
              </Field>

              <TagSelector selected={editTags} onChange={setEditTags} />

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: '1.5rem', rowGap: '2.25rem' }}>
                <Field label="Email">
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                    className="input-plum"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <input
                    type="url"
                    value={editData.linkedin_url || ''}
                    onChange={e => setEditData(d => ({ ...d, linkedin_url: e.target.value }))}
                    className="input-plum"
                  />
                </Field>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)} disabled={saving} className="btn-ghost">
                  Cancel
                </button>
              </div>

              <div className="pt-8 mt-4" style={{ borderTop: '1px solid var(--line)' }}>
                {!confirmingDelete ? (
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    disabled={saving}
                    className="text-sm font-bold"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
                  >
                    Delete my profile
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--ink)' }}>
                      Are you sure? This cannot be undone. You will be signed out.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="text-sm font-bold px-4 py-2 rounded-lg"
                        style={{ background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
                      >
                        {saving ? 'Deleting…' : 'Yes, delete my profile'}
                      </button>
                      <button onClick={() => setConfirmingDelete(false)} disabled={saving} className="btn-ghost">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="form-stack">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center" style={{ gap: '3rem' }}>
                  <Avatar name={profile.name} profilePictureUrl={profile.profile_picture_url} size="lg" />
                  <div>
                    <h2
                      className="font-black"
                      style={{ color: 'var(--plum-900)', fontSize: '2rem', lineHeight: 1.1, margin: 0 }}
                    >
                      {profile.name}
                    </h2>
                    <p
                      className="font-bold"
                      style={{ color: 'var(--plum-500)', marginTop: 4 }}
                    >
                      Class of {profile.graduation_year}
                    </p>
                  </div>
                </div>
                <button onClick={handleEditStart} className="btn-ghost">Edit</button>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ columnGap: '1.5rem', rowGap: '2.25rem' }}
              >
                <ReadField label="Current Company">
                  <p className="font-bold" style={{ color: 'var(--ink)', margin: 0 }}>
                    {profile.current_company}
                  </p>
                  {profile.job_title && (
                    <p className="text-sm" style={{ color: 'var(--muted)', marginTop: 2 }}>
                      {profile.job_title}
                    </p>
                  )}
                </ReadField>
                <ReadField label="Location">{profile.current_city}</ReadField>
                {profile.sector && (
                  <ReadField label="Sector">
                    {profile.sector.charAt(0).toUpperCase() + profile.sector.slice(1)}
                  </ReadField>
                )}
                {profile.email && (
                  <ReadField label="Email">
                    <a href={`mailto:${profile.email}`} style={{ color: 'var(--plum-700)', fontWeight: 700 }}>
                      {profile.email}
                    </a>
                  </ReadField>
                )}
                {profile.linkedin_url && (
                  <ReadField label="LinkedIn">
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--plum-700)', fontWeight: 700 }}
                    >
                      LinkedIn Profile ↗
                    </a>
                  </ReadField>
                )}
              </div>

              <ReadField label="Bio">
                <p className="whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{profile.bio}</p>
              </ReadField>

              {profile.tags && profile.tags.length > 0 && (
                <ReadField label="Areas of Interest">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tags.map(t => (
                      <span key={t} className="chip">{t}</span>
                    ))}
                  </div>
                </ReadField>
              )}
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
    style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
  >
    {children}
  </button>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="field-label">
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    {children}
  </div>
);

const ReadField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="field-label">{label}</div>
    <div style={{ color: 'var(--ink)' }}>{children}</div>
  </div>
);

const ErrorBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="p-3 rounded-lg text-sm"
    style={{ background: '#FDECEC', border: '1px solid #F5CACA', color: '#8A1F1F' }}
  >
    {children}
  </div>
);

export default ProfilePage;
