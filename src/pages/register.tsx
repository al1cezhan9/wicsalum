import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import TagSelector from '../components/TagSelector';
import LocationAutocomplete from '../components/LocationAutocomplete';

type RegistrationStep = 'verification' | 'profile' | 'confirmation';

interface ProfileFormData {
  name: string;
  graduation_year: string;
  current_company: string;
  job_title: string;
  current_city: string;
  bio: string;
  email: string;
  linkedin_url: string;
  sector: string;
  sector_other: string;
  profile_picture_url: string;
}

const PREVIEW_PX = 112;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegistrationStep>('verification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [graduationYear, setGraduationYear] = useState<string>('');
  const [isAlumni, setIsAlumni] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    graduation_year: '',
    current_company: '',
    job_title: '',
    current_city: '',
    bio: '',
    email: '',
    linkedin_url: '',
    sector: '',
    sector_other: '',
    profile_picture_url: '',
  });

  useEffect(() => { checkAuthStatus(); }, []);

  const checkAuthStatus = async () => {
    const user = await getCurrentUser();
    if (!user) { navigate('/signup'); return; }
    const profile = await getUserProfile();
    if (profile) navigate('/directory');
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!graduationYear) { setError('Please enter your graduation year.'); return; }
    const year = parseInt(graduationYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 10) {
      setError('Please enter a valid graduation year.'); return;
    }
    if (!isAlumni) { setError('Please confirm that you are a Columbia Women in CS member.'); return; }
    setFormData(prev => ({ ...prev, graduation_year: graduationYear }));
    setStep('profile');
  };

  const handleProfileChange = (field: keyof ProfileFormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Profile picture must be less than 5MB.'); return; }
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
    setError('');
  };

  const uploadProfilePicture = async (userId: string): Promise<string | null> => {
    if (!profilePicFile) return null;
    const fileExt = profilePicFile.name.split('.').pop();
    const filePath = `${userId}/profile.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, profilePicFile, { upsert: true });
    if (uploadError) {
      console.error('Upload error:', uploadError);
      setError(`Upload error: ${uploadError.message}`);
      return null;
    }
    const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const validateProfileForm = (): boolean => {
    if (!formData.name.trim()) { setError('Name is required.'); return false; }
    if (!formData.current_company.trim()) { setError('Current company is required.'); return false; }
    if (!formData.current_city.trim()) { setError('Current city/location is required.'); return false; }
    if (formData.bio.length > 500) { setError('Bio must be 500 characters or less.'); return false; }
    if (!formData.linkedin_url.trim()) { setError('LinkedIn URL is required.'); return false; }
    if (!formData.sector) { setError('Please select a sector.'); return false; }
    if (formData.sector === 'other' && !formData.sector_other.trim()) {
      setError('Please describe your sector.'); return false;
    }
    return true;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateProfileForm()) return;
    setStep('confirmation');
  };

  const handleConfirmationSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await getCurrentUser();
      if (!user) { setError('You must be logged in to create a profile.'); setLoading(false); return; }

      const { error: ensureError } = await supabase.rpc('ensure_user_exists');
      if (ensureError) {
        const { error: userError } = await supabase
          .from('users')
          .insert({ id: user.id, email: user.email, role: 'non-admin' })
          .select()
          .single();
        if (userError) {
          setError(`Error creating user record: ${userError.message}`);
          setLoading(false); return;
        }
      }

      let profilePictureUrl: string | null = null;
      if (profilePicFile) {
        profilePictureUrl = await uploadProfilePicture(user.id);
        if (!profilePictureUrl) {
          setError('Failed to upload profile picture. Please try again.');
          setLoading(false); return;
        }
      }

      const sectorValue = formData.sector === 'other' ? formData.sector_other.trim() : formData.sector;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          graduation_year: parseInt(formData.graduation_year),
          current_company: formData.current_company.trim(),
          job_title: formData.job_title.trim() || null,
          current_city: formData.current_city.trim(),
          bio: formData.bio.trim() || null,
          email: formData.email.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          sector: sectorValue,
          tags: selectedTags,
          profile_picture_url: profilePictureUrl,
        })
        .select()
        .single();

      if (insertError) { setError(`Error creating profile: ${insertError.message}`); setLoading(false); return; }
      navigate('/profile');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const stepNum = step === 'verification' ? 1 : step === 'profile' ? 2 : 3;

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', padding: '4rem 1.5rem' }}>
      <div className="max-w-2xl mx-auto">
        <div className="card" style={{ padding: '2.75rem' }}>
          <div className="mb-10">
            <h1 className="font-black" style={{ color: 'var(--plum-900)', fontSize: '1.7rem' }}>
              Member Registration
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Columbia Women in CS</p>

            <div className="mt-8 flex items-center gap-2">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: n <= stepNum ? 'var(--plum-700)' : 'var(--line)' }}
                />
              ))}
            </div>
            <p
              className="text-xs mt-3 font-bold uppercase"
              style={{ color: 'var(--plum-500)', letterSpacing: '0.08em' }}
            >
              Step {stepNum} of 3
            </p>
          </div>

          {error && (
            <div
              className="mb-8 p-3 rounded-lg text-sm"
              style={{ background: '#FDECEC', border: '1px solid #F5CACA', color: '#8A1F1F' }}
            >
              {error}
            </div>
          )}

          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="form-stack">
              <FormField label="Graduation Year" required>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  className="input-plum"
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                  required
                />
              </FormField>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlumni}
                  onChange={e => setIsAlumni(e.target.checked)}
                  className="mt-1"
                  style={{ accentColor: 'var(--plum-700)' }}
                  required
                />
                <span className="text-sm" style={{ color: 'var(--ink)' }}>
                  I confirm that I am a Columbia Women in CS member{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
              </label>
              <button type="submit" className="btn-primary w-full">Continue</button>
            </form>
          )}

          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="form-stack">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleProfileChange('name', e.target.value)}
                  className="input-plum"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: '1.5rem', rowGap: '2.25rem' }}>
                <FormField label="Current Company" required>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={e => handleProfileChange('current_company', e.target.value)}
                    className="input-plum"
                    required
                  />
                </FormField>
                <FormField label="Role/Title">
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={e => handleProfileChange('job_title', e.target.value)}
                    className="input-plum"
                  />
                </FormField>
              </div>

              <FormField label="Current City/Location" required>
                <LocationAutocomplete
                  value={formData.current_city}
                  onChange={val => handleProfileChange('current_city', val)}
                  required
                />
              </FormField>

              <FormField label="Brief Bio (2-3 sentences)" required>
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                  Suggestions: education, past work, interests, hobbies, other preferred methods of contact.
                </p>
                <textarea
                  value={formData.bio}
                  onChange={e => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="input-plum"
                  placeholder="Tell us a bit about yourself..."
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {formData.bio.length}/500 characters
                </p>
              </FormField>

              <TagSelector selected={selectedTags} onChange={setSelectedTags} />

              <FormField label="Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleProfileChange('email', e.target.value)}
                  className="input-plum"
                  placeholder="your.email@example.com"
                />
              </FormField>

              <FormField label="LinkedIn URL" required>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={e => handleProfileChange('linkedin_url', e.target.value)}
                  className="input-plum"
                  placeholder="https://linkedin.com/in/yourprofile"
                  required
                />
              </FormField>

              <FormField label="Sector" required>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['Industry', 'Academia'].map(option => (
                    <label key={option} className="radio-row">
                      <input
                        type="radio"
                        name="sector"
                        value={option.toLowerCase()}
                        checked={formData.sector === option.toLowerCase()}
                        onChange={e => {
                          handleProfileChange('sector', e.target.value);
                          handleProfileChange('sector_other', '');
                        }}
                        style={{ accentColor: 'var(--plum-700)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--ink)' }}>{option}</span>
                    </label>
                  ))}
                  <label className="radio-row">
                    <input
                      type="radio"
                      name="sector"
                      value="other"
                      checked={formData.sector === 'other'}
                      onChange={e => handleProfileChange('sector', e.target.value)}
                      style={{ accentColor: 'var(--plum-700)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>Self-Describe</span>
                  </label>
                  {formData.sector === 'other' && (
                    <input
                      type="text"
                      value={formData.sector_other}
                      onChange={e => handleProfileChange('sector_other', e.target.value)}
                      className="input-plum"
                      style={{ marginTop: '0.5rem', marginLeft: '1.5rem', width: 'calc(100% - 1.5rem)' }}
                      placeholder="Please describe your sector"
                      required
                    />
                  )}
                </div>
              </FormField>

              <FormField label="Profile Picture">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="block w-full text-sm"
                  style={{ color: 'var(--muted)' }}
                />
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                  JPEG, PNG, or GIF. Max 5MB.
                </p>
                {profilePicPreview && (
                  <img
                    src={profilePicPreview}
                    alt="Profile preview"
                    className="rounded-full object-cover"
                    style={{
                      marginTop: '1rem',
                      width: PREVIEW_PX,
                      height: PREVIEW_PX,
                      minWidth: PREVIEW_PX,
                      minHeight: PREVIEW_PX,
                      maxWidth: PREVIEW_PX,
                      maxHeight: PREVIEW_PX,
                      border: '1px solid var(--line)',
                    }}
                  />
                )}
              </FormField>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('verification')} className="btn-ghost flex-1">
                  Back
                </button>
                <button type="submit" className="btn-primary flex-1">Review Profile</button>
              </div>
            </form>
          )}

          {step === 'confirmation' && (
            <div className="space-y-8">
              <div
                className="rounded-lg"
                style={{
                  background: 'var(--plum-50)',
                  border: '1px solid var(--plum-100)',
                  paddingLeft: '3.25rem',
                  paddingRight: '3.25rem',
                  paddingTop: '2.5rem',
                  paddingBottom: '2.5rem',
                }}
              >
                <h2 className="font-black mb-6" style={{ color: 'var(--plum-900)', fontSize: '1.15rem' }}>
                  Profile Preview
                </h2>
                {profilePicPreview && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={profilePicPreview}
                      alt="Profile"
                      className="rounded-full object-cover"
                      style={{
                        width: PREVIEW_PX,
                        height: PREVIEW_PX,
                        minWidth: PREVIEW_PX,
                        minHeight: PREVIEW_PX,
                        maxWidth: PREVIEW_PX,
                        maxHeight: PREVIEW_PX,
                        border: '1px solid var(--plum-100)',
                      }}
                    />
                  </div>
                )}
                <div
                  className="text-sm"
                  style={{ color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <PreviewRow k="Name" v={formData.name} />
                  <PreviewRow k="Graduation Year" v={formData.graduation_year} />
                  <PreviewRow
                    k="Sector"
                    v={
                      formData.sector === 'other'
                        ? formData.sector_other
                        : formData.sector.charAt(0).toUpperCase() + formData.sector.slice(1)
                    }
                  />
                  <PreviewRow
                    k="Current Company"
                    v={`${formData.current_company}${formData.job_title ? ` — ${formData.job_title}` : ''}`}
                  />
                  <PreviewRow k="Location" v={formData.current_city} />
                  <div>
                    <div className="font-bold" style={{ color: 'var(--plum-500)', marginBottom: 4 }}>
                      Bio
                    </div>
                    <p style={{ margin: 0 }}>{formData.bio}</p>
                  </div>
                  {selectedTags.length > 0 && (
                    <div>
                      <div className="font-bold" style={{ color: 'var(--plum-500)', marginBottom: 6 }}>
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTags.map(t => (
                          <span key={t} className="chip">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(formData.email || formData.linkedin_url) && (
                    <div>
                      <div className="font-bold" style={{ color: 'var(--plum-500)', marginBottom: 4 }}>
                        Contact
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {formData.email && <div>Email: {formData.email}</div>}
                        {formData.linkedin_url && (
                          <div style={{ wordBreak: 'break-all' }}>LinkedIn: {formData.linkedin_url}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Your profile will be visible in the directory immediately after submission.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep('profile')} className="btn-ghost flex-1">
                  Back to Edit
                </button>
                <button onClick={handleConfirmationSubmit} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Submitting…' : 'Submit Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div>
    <label className="field-label">
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    {children}
  </div>
);

const PreviewRow: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div>
    <span className="font-bold" style={{ color: 'var(--plum-500)' }}>{k}:</span> {v}
  </div>
);

export default RegisterPage;
