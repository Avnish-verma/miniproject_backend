/**
 * NOVA Spacing & Sizing Scale
 * Content-first density: generous whitespace where editorial focus is needed,
 * high density in feeds, conversations, and lists.
 */

export const SPACING = {
  container: {
    rail: 'w-[240px]',
    timeline: 'max-w-[620px]',
    rightRail: 'w-[320px]',
    chatApp: 'max-w-6xl',
    settings: 'max-w-2xl',
  },
  
  height: {
    topHeader: 'h-[52px]',
    mobileBottomBar: 'h-[56px]',
    touchTargetMin: 'min-h-[44px]',
    buttonPrimary: 'h-[42px]',
    buttonSm: 'h-[34px]',
    buttonXs: 'h-[28px]',
    inputBase: 'h-[40px]',
    inputSm: 'h-[34px]',
  },

  radius: {
    control: 'rounded-[8px]',
    button: 'rounded-[9px]',
    input: 'rounded-[9px]',
    card: 'rounded-[12px]',
    surface: 'rounded-[16px]',
    pill: 'rounded-full',
  },
};

export default SPACING;
