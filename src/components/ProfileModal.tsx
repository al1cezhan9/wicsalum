import React, { useEffect } from 'react';
import { UserProfile } from '../lib/auth';
import Avatar from './Avatar';
import { toggleFavorite, isFavorited } from '../utils/favorites';

interface ProfileModalProps {
  profile: UserProfile | null;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose }) => {
  const [favorited, setFavorited] = React.useState(false);

  useEffect(() => {
    if (profile) setFavorited(isFavorited(profile.id));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [profile, onClose]);

  if (!profile) return null;

  const handleFavorite = () => {
    toggleFavorite(profile.id);
    setFavorited(!favorited);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
        backgroundColor: 'rgba(46, 26, 71, 0.55)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          marginTop: '2.5rem',
          marginBottom: '2.5rem',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(46, 26, 71, 0.25)',
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: 'var(--muted)',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            paddingLeft: '4rem',
            paddingRight: '4rem',
            paddingTop: '3.25rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="flex items-start" style={{ gap: '5.5rem' }}>
            <Avatar name={profile.name} profilePictureUrl={profile.profile_picture_url} size="xl" />
            <div className="flex-1 min-w-0" style={{ paddingTop: '0.5rem' }}>
              <h2
                className="font-black leading-tight"
                style={{ color: 'var(--plum-900)', fontSize: '1.75rem', margin: 0 }}
              >
                {profile.name}
              </h2>
              <p
                className="font-bold"
                style={{ color: 'var(--plum-500)', fontSize: '0.875rem', marginTop: 6 }}
              >
                Class of {profile.graduation_year}
              </p>
              <p style={{ color: 'var(--ink)', fontSize: '0.9rem', marginTop: '1.75rem' }}>
                <span className="font-bold">{profile.current_company}</span>
                {profile.job_title && (
                  <span style={{ color: 'var(--muted)' }}> · {profile.job_title}</span>
                )}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 6 }}>
                {profile.current_city}
              </p>
            </div>
            <button
              onClick={handleFavorite}
              className="flex items-center text-sm font-bold"
              style={{
                background: favorited ? 'var(--plum-50)' : 'white',
                border: '1px solid var(--plum-100)',
                color: 'var(--plum-700)',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                cursor: 'pointer',
                fontFamily: 'Lato, sans-serif',
                gap: '0.6rem',
              }}
            >
              {favorited ? 'Saved' : 'Save'}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={favorited ? 'var(--plum-700)' : 'none'}
                stroke="var(--plum-700)"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        <div
          style={{
            paddingLeft: '4rem',
            paddingRight: '4rem',
            paddingTop: '2.75rem',
            paddingBottom: '3rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem',
          }}
        >
          {profile.sector && (
            <Field
              label="Sector"
              value={profile.sector.charAt(0).toUpperCase() + profile.sector.slice(1)}
            />
          )}

          {profile.bio && (
            <div>
              <FieldLabel>Bio</FieldLabel>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--ink)', marginTop: '1rem' }}
              >
                {profile.bio}
              </p>
            </div>
          )}

          {profile.tags && profile.tags.length > 0 && (
            <div>
              <FieldLabel>Areas of Interest</FieldLabel>
              <div
                className="flex flex-wrap gap-1.5"
                style={{ marginTop: '1rem' }}
              >
                {profile.tags.map(t => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </div>
          )}

          {(profile.email || profile.linkedin_url) && (
            <div>
              <FieldLabel>Contact</FieldLabel>
              <div
                className="text-sm"
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {profile.email && (
                  <div>
                    <a
                      href={`mailto:${profile.email}`}
                      style={{ color: 'var(--plum-700)', fontWeight: 700 }}
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.linkedin_url && (
                  <div>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--plum-700)', fontWeight: 700 }}
                    >
                      LinkedIn Profile ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="field-label" style={{ marginBottom: 0 }}>{children}</div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <p className="text-sm" style={{ color: 'var(--ink)', marginTop: '1rem' }}>{value}</p>
  </div>
);

export default ProfileModal;
