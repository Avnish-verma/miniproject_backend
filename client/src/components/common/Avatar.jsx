import React from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
  '2xl': 'w-24 h-24 text-xl',
};

const dotSizeMap = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  className = '',
}) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const avatarUrl = typeof src === 'object' && src ? src.url : src;

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover ring-1 ring-[#E7E5E2] dark:ring-[#292929] bg-[#EFEFEA] dark:bg-[#202020]`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full bg-[#EFEFEA] dark:bg-[#202020] text-[#111111] dark:text-[#F5F5F5] font-semibold flex items-center justify-center ring-1 ring-[#E7E5E2] dark:ring-[#292929]`}
        >
          {initials}
        </div>
      )}

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeMap[size] || dotSizeMap.md} rounded-full bg-[#16845B] dark:bg-[#38A878] ring-2 ring-[#FAFAF8] dark:ring-[#0D0D0D]`}
          title="Online"
        />
      )}
    </div>
  );
}
