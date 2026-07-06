import React from 'react';
import { UserProfile } from '../lib/auth';
import Avatar from './Avatar';
import { toggleFavorite, isFavorited } from '../utils/favorites';

interface ProfileCardProps {
  profile: UserProfile;
  onOpen?: (profile: UserProfile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onOpen }) => {
  const [favorited, setFavorited] = React.useState(isFavorited(profile.id));

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(profile.id);
    setFavorited(!favorited);
  };

  return (
    <div
      onClick={() => onOpen?.(profile)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(profile);
        }
      }}
      role="button"
      tabIndex={0}
      className="card flex flex-col cursor-pointer"
      style={{
        minHeight: 240,
        padding: '1.75rem',
        overflow: 'hidden',
        minWidth: 0,
        width: '100%',
      }}
    >
      <div className="flex items-center" style={{ gap: '1.25rem' }}>
        <Avatar name={profile.name} profilePictureUrl={profile.profile_picture_url} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className="font-bold truncate"
                style={{ color: 'var(--plum-900)', fontSize: '1.05rem', lineHeight: 1.2, margin: 0 }}
              >
                {profile.name}
              </h3>
              <p
                className="truncate"
                style={{ color: 'var(--plum-500)', fontSize: '0.8rem', marginTop: 2 }}
              >
                Class of {profile.graduation_year}
              </p>
            </div>
            <button
              onClick={handleFavorite}
              aria-label={favorited ? 'Unsave' : 'Save'}
              title={favorited ? 'Unsave' : 'Save'}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}
              className="flex-shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={favorited ? 'var(--plum-700)' : 'none'}
                stroke={favorited ? 'var(--plum-700)' : '#9A93A8'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          fontSize: '0.875rem',
          color: 'var(--ink)',
          minWidth: 0,
        }}
      >
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          <span className="font-bold">{profile.current_company}</span>
          {profile.job_title && (
            <span style={{ color: 'var(--muted)' }}> · {profile.job_title}</span>
          )}
        </div>
        <div
          style={{
            color: 'var(--muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {profile.current_city}
        </div>

        {profile.bio && (
          <p
            style={{
              marginTop: '0.75rem',
              color: 'var(--muted)',
              fontSize: '0.85rem',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'anywhere',
            }}
          >
            {profile.bio}
          </p>
        )}
      </div>

      {profile.tags && profile.tags.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          style={{ marginTop: '1rem' }}
        >
          {profile.tags.slice(0, 3).map(tag => (
            <span key={tag} className="chip">{tag}</span>
          ))}
          {profile.tags.length > 3 && (
            <span className="chip" style={{ background: 'white' }}>
              +{profile.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
