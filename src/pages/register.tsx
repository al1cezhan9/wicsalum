import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, UserProfile } from '../lib/auth';

type RegistrationStep = 'verification' | 'profile' | 'confirmation';

interface ProfileFormData {
  name: string;
  graduation_year: string;
  cu_email: string;
  current_company: string;
  job_title: string;
  current_city: string;
  bio: string;
  email: string;
  linkedin_url: string;
  sector: string;
  sector_other: string;
  member_status: string;
  profile_picture_url: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegistrationStep>('verification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [graduationYear, setGraduationYear] = useState<string>('');
  const [cuEmail, setCuEmail] = useState<string>('');
  const [isAlumni, setIsAlumni] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    graduation_year: '',
    current_company: '',
    job_title: '',
    current_city: '',
    bio: '',
    email: '',
    cu_email: '',
    linkedin_url: '',
    sector: '',
    sector_other: '',
    member_status: '',
    profile_picture_url: '',
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/signup');
      return;
    }

    // Check if profile already exists
    const profile = await getUserProfile();
    if (profile) {
      navigate('/directory');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!graduationYear) {
      setError('Please enter your graduation year.');
      return;
    }

    const year = parseInt(graduationYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 10) {
      setError('Please enter a valid graduation year.');
      return;
    }

    if (!isAlumni) {
      setError('Please confirm that you are a Columbia Women in CS alumna.');
      return;
    }

    setFormData(prev => ({ ...prev, graduation_year: graduationYear }));
    setStep('profile');
  };

  const handleProfileChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.).');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture must be less than 5MB.');
      return;
    }

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

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };


  const validateProfileForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required.');
      return false;
    }
    if (!formData.current_company.trim()) {
      setError('Current company is required.');
      return false;
    }
    if (!formData.current_city.trim()) {
      setError('Current city/location is required.');
      return false;
    }
    if (!formData.bio.trim()) {
      setError('Bio is required.');
      return false;
    }
    if (formData.bio.length > 500) {
      setError('Bio must be 500 characters or less.');
      return false;
    }
    // At least one contact method should be provided
    if (!formData.email.trim() && !formData.linkedin_url.trim()) {
      setError('Please provide at least one contact method (email or LinkedIn).');
      return false;
    }
    if (!formData.sector) {
      setError('Please select a sector.');
      return false;
    }
    if (formData.sector === 'other' && !formData.sector_other.trim()) {
      setError('Please describe your sector.');
      return false;
    }
    if (!formData.member_status) {
      setError('Please select whether you are an alumni or current student.');
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateProfileForm()) {
      return;
    }

    setStep('confirmation');
  };

  const handleConfirmationSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const user = await getCurrentUser();
      if (!user) {
        setError('You must be logged in to create a profile.');
        setLoading(false);
        return;
      }

      // Ensure user record exists in public.users table
      const { error: ensureError } = await supabase.rpc('ensure_user_exists');

      if (ensureError) {
        // Try direct insert as fallback (with INSERT policy)
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: 'alumni'
          })
          .select()
          .single();

        if (userError) {
          setError(`Error creating user record: ${userError.message}`);
          setLoading(false);
          return;
        }
      }

      // Upload profile picture if provided
      let profilePictureUrl: string | null = null;
      if (profilePicFile) {
        profilePictureUrl = await uploadProfilePicture(user.id);
        if (!profilePictureUrl) {
          setError('Failed to upload profile picture. Please try again.');
          setLoading(false);
          return;
        }
      }

      const sectorValue = formData.sector === 'other' ? formData.sector_other.trim() : formData.sector;

      const { data, error: insertError } = await supabase
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
          member_status: formData.member_status,
          profile_picture_url: profilePictureUrl,
        })
        .select()
        .single();

      if (insertError) {
        setError(`Error creating profile: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Success! Redirect to profile page
      navigate('/profile');
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Columbia Women in CS Alumni Registration
            </h1>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`flex-1 h-2 rounded ${step === 'verification' ? 'bg-blue-600' : 'bg-green-600'}`}></div>
              <div className={`flex-1 h-2 rounded ${step === 'profile' ? 'bg-blue-600' : step === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`flex-1 h-2 rounded ${step === 'confirmation' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            <p className="text-sm text-gray-600">
              Step {step === 'verification' ? '1' : step === 'profile' ? '2' : '3'} of 3
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Verification */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <label htmlFor="graduation_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="graduation_year"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 10}
                  required
                />
              </div>

              <div>
                <label htmlFor="cu_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Columbia/Barnard student or alum email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="cu_email"
                  value={cuEmail}
                  onChange={(e) => setCuEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_alumni"
                  checked={isAlumni}
                  onChange={(e) => setIsAlumni(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="is_alumni" className="ml-2 text-sm text-gray-700">
                  I confirm that I am a Columbia Women in CS alum or current student <span className="text-red-500">*</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Profile Creation */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="current_company" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="current_company"
                    value={formData.current_company}
                    onChange={(e) => handleProfileChange('current_company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                    <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role/Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleProfileChange('job_title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="current_city" className="block text-sm font-medium text-gray-700 mb-2">
                  Current City/Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="current_city"
                  value={formData.current_city}
                  onChange={(e) => handleProfileChange('current_city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Bio (2-3 sentences, max 500 characters)<span className="text-red-500">*</span>
                </label>
                Suggestions: other education, past work experience, interests, hobbies, other preferred methods of contact
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us a bit about yourself..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL (Optional)
                </label>
                <input
                  type="url"
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleProfileChange('linkedin_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Provide at least one contact method (email or LinkedIn)
                </p>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {['Industry', 'Academia'].map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="sector"
                        value={option.toLowerCase()}
                        checked={formData.sector === option.toLowerCase()}
                        onChange={(e) => {
                          handleProfileChange('sector', e.target.value);
                          handleProfileChange('sector_other', '');
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sector"
                      value="other"
                      checked={formData.sector === 'other'}
                      onChange={(e) => handleProfileChange('sector', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Self-Describe</span>
                  </label>
                  {formData.sector === 'other' && (
                    <input
                      type="text"
                      value={formData.sector_other}
                      onChange={(e) => handleProfileChange('sector_other', e.target.value)}
                      className="ml-6 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please describe your sector"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Member Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'alumni', label: 'Alumni' },
                    { value: 'current_student', label: 'Current Student' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="member_status"
                        value={option.value}
                        checked={formData.member_status === option.value}
                        onChange={(e) => handleProfileChange('member_status', e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div>
                  <input
                    type="file"
                    id="profile_picture"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or GIF. Max 5MB.</p>
                </div>
                <div className="mt-3">
                  {profilePicPreview && (
                    <img
                      src={profilePicPreview}
                      alt="Profile preview"
                      className="w-28 h-28 min-w-[7rem] min-h-[7rem] max-w-[7rem] max-h-[7rem] rounded-full object-cover border border-gray-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('verification')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                >
                  Review Profile
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Profile Preview</h2>
                <div className="space-y-3 text-sm">
                  {profilePicPreview && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={profilePicPreview}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border border-gray-200"
                      />
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Graduation Year:</span> {formData.graduation_year}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {formData.member_status === 'current_student' ? 'Current Student' : 'Alumni'}
                  </div>
                  <div>
                    <span className="font-medium">Sector:</span> {formData.sector === 'other' ? formData.sector_other : formData.sector.charAt(0).toUpperCase() + formData.sector.slice(1)}
                  </div>
                  <div>
                    <span className="font-medium">Current Company:</span> {formData.current_company}
                    {formData.job_title && ` - ${formData.job_title}`}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {formData.current_city}
                  </div>
                  <div>
                    <span className="font-medium">Bio:</span>
                    <p className="mt-1 text-gray-700">{formData.bio}</p>
                  </div>
                  {(formData.email || formData.linkedin_url) && (
                    <div>
                      <span className="font-medium">Contact:</span>
                      <div className="mt-1 space-y-1">
                        {formData.email && <div>Email: {formData.email}</div>}
                        {formData.linkedin_url && <div>LinkedIn: {formData.linkedin_url}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  Your profile will be visible in the directory immediately after submission.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleConfirmationSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

