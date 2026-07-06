import React from 'react';

const AVATAR_COLORS = [
  '#2E1A47', '#4F2A94', '#673AB7', '#8B6AD9',
  '#5E3AA0', '#7B5AC4', '#3B2170', '#A388DE',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string): string {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { px: number; font: string }> = {
  xs: { px: 32,  font: '0.7rem'  },
  sm: { px: 44,  font: '0.85rem' },
  md: { px: 72,  font: '1.1rem'  },
  lg: { px: 112, font: '1.6rem'  },
  xl: { px: 160, font: '2.4rem'  },
};

interface AvatarProps {
  name: string;
  profilePictureUrl?: string | null;
  size?: Size;
}

const Avatar: React.FC<AvatarProps> = ({ name, profilePictureUrl, size = 'sm' }) => {
  const { px, font } = SIZES[size];
  const box: React.CSSProperties = {
    width: px, height: px, minWidth: px, minHeight: px, fontSize: font,
  };

  if (profilePictureUrl) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{ ...box, border: '1px solid var(--line)' }}
      >
        <img src={profilePictureUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ ...box, backgroundColor: getColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
