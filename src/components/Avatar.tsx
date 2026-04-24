import React from 'react';

const COLORS = [
  'bg-[#2E1A47]', 'bg-[#4F2A94]', 'bg-[#673AB7]', 'bg-[#8B6AD9]',
  'bg-[#3D2170]', 'bg-[#5B3EA0]', 'bg-[#7B58CB]', 'bg-[#9B7AE5]',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string): string {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
}

interface AvatarProps {
  name: string;
  profilePictureUrl?: string | null;
  size?: 'sm' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ name, profilePictureUrl, size = 'sm' }) => {
  const px = size === 'sm' ? 128 : 320;
  const textClass = size === 'sm' ? 'text-xs' : 'text-xl';
  const sizeStyle: React.CSSProperties = { width: px, height: px, minWidth: px, minHeight: px };

  if (profilePictureUrl) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={sizeStyle}>
        <img
          src={profilePictureUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden ${getColor(name)} flex items-center justify-center text-white font-semibold flex-shrink-0 ${textClass}`}
      style={sizeStyle}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
