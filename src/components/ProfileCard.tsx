import React, { useState } from 'react';
import { UserProfile } from '../lib/auth';

interface ProfileCardProps {
  profile: UserProfile;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const [showContact, setShowContact] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const bioExcerpt = profile.bio.length > 150 
    ? profile.bio.substring(0, 150) + '...' 
    : profile.bio;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
          <p className="text-sm text-gray-600">Class of {profile.graduation_year}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-900">{profile.current_company}</span>
          {profile.job_title && (
            <span className="text-gray-500"> • {profile.job_title}</span>
          )}
        </div>
        <div className="text-gray-600">{profile.current_city}</div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700">
          {bioExpanded ? profile.bio : bioExcerpt}
        </p>
        {profile.bio.length > 150 && (
          <button
            onClick={() => setBioExpanded(!bioExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm mt-1"
          >
            {bioExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>


      <div className="border-t pt-4 mt-4">
        {!showContact ? (
          <button
            onClick={() => setShowContact(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition text-sm"
          >
            Show Contact Info
          </button>
        ) : (
          <div className="space-y-2">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="block w-full bg-gray-50 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 text-center text-sm border border-gray-200 transition"
              >
                {profile.email}
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-100 text-center text-sm border border-blue-200 transition"
              >
                View LinkedIn
              </a>
            )}
            {(!profile.email && !profile.linkedin_url) && (
              <p className="text-sm text-gray-500 text-center py-2">No contact information available</p>
            )}
            <button
              onClick={() => setShowContact(false)}
              className="w-full text-gray-500 text-xs hover:text-gray-700 mt-2"
            >
              Hide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;

