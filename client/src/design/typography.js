/**
 * NOVA Typography System
 * Primary font: Plus Jakarta Sans
 * 
 * Rules:
 * - Hierarchy achieved through size, weight, spacing, and line-height — not excessive colors.
 * - Uniformly applied across all components.
 */

export const TYPOGRAPHY = {
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // Hierarchy presets
  display: 'text-[32px] sm:text-[36px] font-bold tracking-tight leading-tight',
  pageHeading: 'text-[24px] sm:text-[26px] font-bold tracking-tight leading-snug',
  sectionHeading: 'text-[18px] sm:text-[19px] font-semibold tracking-tight leading-snug',
  subheading: 'text-[16px] font-medium tracking-normal leading-normal',
  body: 'text-[14px] sm:text-[15px] font-normal leading-relaxed',
  bodyMedium: 'text-[14px] sm:text-[15px] font-medium leading-relaxed',
  meta: 'text-[12px] sm:text-[13px] font-normal leading-normal',
  metaMedium: 'text-[12px] sm:text-[13px] font-medium leading-normal',
  caption: 'text-[11px] font-medium leading-none',
  button: 'text-[14px] font-semibold leading-none select-none',
  buttonSm: 'text-[13px] font-semibold leading-none select-none',
  buttonXs: 'text-[12px] font-semibold leading-none select-none',
  code: 'font-mono text-[12px] tracking-tight',
};

export default TYPOGRAPHY;
