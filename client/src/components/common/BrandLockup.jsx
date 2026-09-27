import React from 'react';

/**
 * Official ShiftAura Brand Lockup Component
 * 
 * Follows exact brand guidelines:
 * [SHIFT AURA LOGO]
 * ShiftAura
 * Social Communication Platform
 * 
 * The subtitle "Social Communication Platform" is ~1/4 the visual font-size/scale of "ShiftAura".
 */
export default function BrandLockup({
  size = 'md', // 'sm' | 'md' | 'lg'
  layout = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
  showSubtitle = true,
  onClick,
}) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  // Sizing definitions ensuring exact proportional hierarchy
  const logoDimensions = isSm
    ? 'w-7 h-7'
    : isLg
    ? 'w-16 h-16'
    : 'w-10 h-10';

  const titleSize = isSm
    ? 'text-[16px]'
    : isLg
    ? 'text-[28px]'
    : 'text-[20px]';

  // Subtitle is approximately 1/4 the visual scale
  const subtitleSize = isSm
    ? 'text-[7.5px] tracking-[0.14em]'
    : isLg
    ? 'text-[9.5px] tracking-[0.18em]'
    : 'text-[8.5px] tracking-[0.16em]';

  const isVertical = layout === 'vertical';

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${
        isVertical ? 'flex-col items-center text-center' : 'items-center gap-3 text-left'
      } select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Official ShiftAura Logo PNG without distortion */}
      <img
        src="/shiftaura_logo.png"
        alt="ShiftAura Logo"
        className={`${logoDimensions} object-contain shrink-0 drop-shadow-xs transition-transform duration-200`}
        loading="eager"
      />

      <div className={`flex flex-col ${isVertical ? 'items-center mt-2' : 'justify-center'} leading-none`}>
        <div className="flex items-center gap-1">
          <span className={`font-bold ${titleSize} tracking-tight text-[#111111] dark:text-[#F5F5F5]`}>
            ShiftAura
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C35] dark:bg-[#FF6845] shrink-0" />
        </div>

        {showSubtitle && (
          <span
            className={`font-semibold uppercase text-[#6B6B6B] dark:text-[#A0A0A0] mt-1 ${subtitleSize}`}
          >
            Social Communication Platform
          </span>
        )}
      </div>
    </div>
  );
}
