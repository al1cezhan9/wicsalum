import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import TagSelector from '../components/TagSelector';

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

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-[#C8B6F0] rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:border-[#673AB7]';

const LABEL_CLASS = 'block text-xs font-medium text-[#8B6AD9] uppercase tracking-wide mb-1.5';

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

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!graduationYear) { setError('Please enter your graduation year.'); return; }
    const year = parseInt(graduationYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 10) {
      setError('Please enter a valid graduation year.');
      return;
    }
    if (!isAlumni) { setError('Please confirm that you are a Columbia Women in CS member.'); return; }
    setFormData(prev => ({ ...prev, graduation_year: graduationYear }));
    setStep('profile');
  };

  const handleProfileChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPEG, PNG, etc.).'); return; }
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
    if (!formData.bio.trim()) { setError('Bio is required.'); return false; }
    if (formData.bio.length > 500) { setError('Bio must be 500 characters or less.'); return false; }
    if (!formData.linkedin_url.trim()) { setError('LinkedIn URL is required.'); return false; }
    if (!formData.sector) { setError('Please select a sector.'); return false; }
    if (formData.sector === 'other' && !formData.sector_other.trim()) {
      setError('Please describe your sector.');
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
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
          .insert({ id: user.id, email: user.email, role: 'alumni' })
          .select()
          .single();
        if (userError) { setError(`Error creating user record: ${userError.message}`); setLoading(false); return; }
      }

      let profilePictureUrl: string | null = null;
      if (profilePicFile) {
        profilePictureUrl = await uploadProfilePicture(user.id);
        if (!profilePictureUrl) { setLoading(false); return; }
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
          bio: formData.bio.trim(),
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
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const stepNum = step === 'verification' ? 1 : step === 'profile' ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#F7F4FF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-[#C8B6F0] rounded-lg p-8">

          <div className="mb-8">
            <h1 className="text-xl font-bold text-[#2E1A47] mb-4">Columbia Women in CS — Registration</h1>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className={`flex-1 h-1 rounded-full ${
                    n < stepNum ? 'bg-[#673AB7]' : n === stepNum ? 'bg-[#8B6AD9]' : 'bg-[#EDE7F6]'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#8B6AD9]">Step {stepNum} of 3</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-5">
              <div>
                <label htmlFor="graduation_year" className={LABEL_CLASS}>
                  Graduation Year <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="graduation_year"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                  required
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_alumni"
                  checked={isAlumni}
                  onChange={(e) => setIsAlumni(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#C8B6F0] text-[#673AB7] focus:ring-[#673AB7]"
                  required
                />
                <label htmlFor="is_alumni" className="text-sm text-gray-600">
                  I confirm that I am a Columbia Women in CS member <span className="text-red-400">*</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#673AB7] text-white py-2.5 px-4 rounded-md text-sm font-medium"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className={LABEL_CLASS}>Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className={INPUT_CLASS}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="current_company" className={LABEL_CLASS}>
                    Company <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="current_company"
                    value={formData.current_company}
                    onChange={(e) => handleProfileChange('current_company', e.target.value)}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="job_title" className={LABEL_CLASS}>Role / Title</label>
                  <input
                    type="text"
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleProfileChange('job_title', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="current_city" className={LABEL_CLASS}>
                  City / Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="current_city"
                  value={formData.current_city}
                  onChange={(e) => handleProfileChange('current_city', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>

              <div>
                <label htmlFor="bio" className={LABEL_CLASS}>
                  Bio <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-1.5">
                  Suggestions: other education, past work experience, interests, hobbies, other contact methods
                </p>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className={INPUT_CLASS}
                  placeholder="Tell us a bit about yourself..."
                  required
                />
                <p className="mt-1 text-xs text-gray-400">{formData.bio.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="email" className={LABEL_CLASS}>Email Address (Optional)</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="linkedin_url" className={LABEL_CLASS}>
                  LinkedIn URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleProfileChange('linkedin_url', e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="https://linkedin.com/in/yourprofile"
                  required
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Sector <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  {['Industry', 'Academia'].map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sector"
                        value={option.toLowerCase()}
                        checked={formData.sector === option.toLowerCase()}
                        onChange={(e) => {
                          handleProfileChange('sector', e.target.value);
                          handleProfileChange('sector_other', '');
                        }}
                        className="h-4 w-4 text-[#673AB7] border-[#C8B6F0] focus:ring-[#673AB7]"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="sector"
                      value="other"
                      checked={formData.sector === 'other'}
                      onChange={(e) => handleProfileChange('sector', e.target.value)}
                      className="h-4 w-4 text-[#673AB7] border-[#C8B6F0] focus:ring-[#673AB7]"
                    />
                    <span className="text-sm text-gray-700">Self-Describe</span>
                  </label>
                  {formData.sector === 'other' && (
                    <input
                      type="text"
                      value={formData.sector_other}
                      onChange={(e) => handleProfileChange('sector_other', e.target.value)}
                      className={`ml-6 ${INPUT_CLASS}`}
                      placeholder="Please describe your sector"
                      required
                    />
                  )}
                </div>
              </div>

              <TagSelector selected={selectedTags} onChange={setSelectedTags} />

              <div>
                <label className={LABEL_CLASS}>Profile Picture (Optional)</label>
                <input
                  type="file"
                  id="profile_picture"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#EDE7F6] file:text-[#673AB7]"
                />
                <p className="mt-1 text-xs text-gray-400">JPEG, PNG, or GIF. Max 5MB.</p>
                {profilePicPreview && (
                  <div className="mt-3">
                    <img
                      src={profilePicPreview}
                      alt="Profile preview"
                      className="w-28 h-28 min-w-[7rem] min-h-[7rem] max-w-[7rem] max-h-[7rem] rounded-full object-cover border border-[#C8B6F0]"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('verification')}
                  className="flex-1 text-[#673AB7] py-2.5 px-4 rounded-md border border-[#C8B6F0] text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#673AB7] text-white py-2.5 px-4 rounded-md text-sm font-medium"
                >
                  Review Profile
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 'confirmation' && (
            <div className="space-y-5">
              <div className="bg-[#F7F4FF] border border-[#C8B6F0] rounded-lg p-6">
                <h2 className="text-sm font-bold text-[#2E1A47] uppercase tracking-wide mb-4">Profile Preview</h2>
                <div className="space-y-3 text-sm">
                  {profilePicPreview && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={profilePicPreview}
                        alt="Profile"
                        className="w-24 h-24 min-w-[6rem] min-h-[6rem] max-w-[6rem] max-h-[6rem] rounded-full object-cover border border-[#C8B6F0]"
                      />
                    </div>
                  )}
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Name</span><p className="text-gray-800 mt-0.5">{formData.name}</p></div>
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Graduation Year</span><p className="text-gray-800 mt-0.5">{formData.graduation_year}</p></div>
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Sector</span><p className="text-gray-800 mt-0.5">{formData.sector === 'other' ? formData.sector_other : formData.sector.charAt(0).toUpperCase() + formData.sector.slice(1)}</p></div>
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Company</span><p className="text-gray-800 mt-0.5">{formData.current_company}{formData.job_title && ` · ${formData.job_title}`}</p></div>
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Location</span><p className="text-gray-800 mt-0.5">{formData.current_city}</p></div>
                  <div><span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Bio</span><p className="text-gray-700 mt-0.5 leading-relaxed">{formData.bio}</p></div>
                  {selectedTags.length > 0 && (
                    <div>
                      <span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTags.map(tag => (
                          <span key={tag} className="bg-[#EDE7F6] text-[#4F2A94] text-xs px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(formData.email || formData.linkedin_url) && (
                    <div>
                      <span className="text-[#8B6AD9] text-xs uppercase tracking-wide">Contact</span>
                      <div className="mt-1 space-y-0.5">
                        {formData.email && <p className="text-gray-700">{formData.email}</p>}
                        {formData.linkedin_url && <p className="text-gray-700">{formData.linkedin_url}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#EDE7F6] border border-[#C8B6F0] rounded-md p-3">
                <p className="text-xs text-[#4F2A94]">
                  Your profile will be visible in the directory immediately after submission.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="flex-1 text-[#673AB7] py-2.5 px-4 rounded-md border border-[#C8B6F0] text-sm"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleConfirmationSubmit}
                  disabled={loading}
                  className="flex-1 bg-[#673AB7] text-white py-2.5 px-4 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
