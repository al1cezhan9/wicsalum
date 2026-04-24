import React from 'react';
import { UserProfile } from '../lib/auth';
import Avatar from './Avatar';

interface ProfileCardProps {
  profile: UserProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const [bioExpanded, setBioExpanded] = React.useState(false);

  const bioExcerpt = profile.bio.length > 140
    ? profile.bio.substring(0, 140) + '...'
    : profile.bio;

  return (
    <div className="bg-white border border-[#C8B6F0] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={profile.name} profilePictureUrl={profile.profile_picture_url} size="sm" />
        <div className="min-w-0">
          <h3 className="font-bold text-[#2E1A47] leading-tight truncate">{profile.name}</h3>
          <p className="text-xs text-[#8B6AD9] mt-0.5">Class of {profile.graduation_year}</p>
        </div>
      </div>

      <div className="space-y-1 mb-4 text-sm">
        <p className="text-[#4F2A94] font-semibold">
          {profile.current_company}
          {profile.job_title && (
            <span className="text-gray-400 font-normal"> · {profile.job_title}</span>
          )}
        </p>
        <p className="text-gray-500">{profile.current_city}</p>
        {profile.sector && (
          <span className="inline-block text-xs bg-[#EDE7F6] text-[#4F2A94] px-2 py-0.5 rounded-full">
            {profile.sector}
          </span>
        )}
      </div>

      <div className="border-t border-[#F0EBF9] pt-4 mb-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {bioExpanded ? profile.bio : bioExcerpt}
        </p>
        {profile.bio.length > 140 && (
          <button
            onClick={() => setBioExpanded(!bioExpanded)}
            className="text-xs text-[#673AB7] mt-1.5"
          >
            {bioExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {(profile.email || profile.linkedin_url) && (
        <div className="border-t border-[#F0EBF9] pt-4 space-y-1.5 text-sm">
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="block text-[#673AB7]">
              {profile.email}
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-[#673AB7]">
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
