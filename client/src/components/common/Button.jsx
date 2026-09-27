import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'destructive' | 'follow'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  isLoading = false,
  disabled = false,
  isFollowing = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Size definitions with restrained 9–10px radii
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[12px] font-semibold gap-1.5 rounded-[8px] min-h-[28px]',
    sm: 'px-3 py-1.5 text-[13px] font-semibold gap-1.5 rounded-[9px] min-h-[34px]',
    md: 'px-4 py-2 text-[14px] font-semibold gap-2 rounded-[9px] min-h-[40px]',
    lg: 'px-5 py-2.5 text-[14px] font-semibold gap-2.5 rounded-[10px] min-h-[44px]',
    icon: 'p-2 rounded-[8px] min-w-[36px] min-h-[36px] flex items-center justify-center',
  }[size] || 'px-4 py-2 text-[14px] font-semibold gap-2 rounded-[9px] min-h-[40px]';

  // Variant definitions with warm editorial palette & restrained accents
  let variantClasses = '';

  if (variant === 'follow') {
    if (isFollowing) {
      variantClasses = isHovered
        ? 'border border-[#D64545]/40 bg-[#D64545]/10 text-[#D64545] dark:text-[#E05252] dark:border-[#E05252]/40 dark:bg-[#E05252]/10'
        : 'border border-[#E7E5E2] dark:border-[#292929] bg-transparent text-[#111111] dark:text-[#F5F5F5] hover:border-[#111111]/30 dark:hover:border-[#F5F5F5]/30';
    } else {
      variantClasses = 'bg-[#111111] text-[#FAFAF8] hover:bg-[#262626] dark:bg-[#F5F5F5] dark:text-[#111111] dark:hover:bg-[#E5E5E5] shadow-sm';
    }
  } else {
    variantClasses = {
      primary:
        'bg-[#111111] text-[#FAFAF8] hover:bg-[#262626] dark:bg-[#F5F5F5] dark:text-[#111111] dark:hover:bg-[#E5E5E5] shadow-sm',
      accent:
        'bg-[#FF5C35] hover:bg-[#E84A23] dark:bg-[#FF6845] dark:hover:bg-[#FF7D5D] text-white shadow-sm',
      secondary:
        'bg-[#F4F3F0] text-[#111111] hover:bg-[#EFEFEA] dark:bg-[#1C1C1C] dark:text-[#F5F5F5] dark:hover:bg-[#242424] border border-[#E7E5E2] dark:border-[#292929]',
      outline:
        'bg-transparent text-[#111111] dark:text-[#F5F5F5] border border-[#E7E5E2] dark:border-[#292929] hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C]',
      ghost:
        'bg-transparent text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111] dark:hover:text-[#F5F5F5] hover:bg-[#F4F3F0] dark:hover:bg-[#1C1C1C]',
      destructive:
        'bg-[#D64545]/10 text-[#D64545] hover:bg-[#D64545] hover:text-white dark:bg-[#E05252]/15 dark:text-[#E05252] dark:hover:bg-[#E05252] dark:hover:text-white border border-[#D64545]/20 dark:border-[#E05252]/20',
    }[variant] || 'bg-[#111111] text-white dark:bg-[#F5F5F5] dark:text-[#111111]';
  }

  const isDisabled = disabled || isLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </>
      );
    }

    if (variant === 'follow') {
      if (isFollowing) {
        return isHovered ? 'Unfollow' : 'Following';
      }
      return 'Follow';
    }

    return (
      <>
        {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0 stroke-[1.75px]" />}
        {children}
        {RightIcon && <RightIcon className="w-4 h-4 shrink-0 stroke-[1.75px]" />}
      </>
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C35]/30 ${
        isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]'
      } ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {renderContent()}
    </button>
  );
}
