/**
 * NOVA Design Tokens
 * 
 * Aesthetic: Editorial + Minimal + Premium + Social + Human + Confident
 * Color philosophy: Warm, editorial neutral canvas with a signature coral/orange accent (#FF5C35 / #FF6845).
 */

export const TOKENS = {
  colors: {
    light: {
      background: '#FAFAF8',
      surface: '#FFFFFF',
      surfaceSubtle: '#F4F3F0',
      surfaceHover: '#EFEFEA',
      surfaceActive: '#E8E7E2',
      primaryText: '#111111',
      secondaryText: '#6B6B6B',
      mutedText: '#929292',
      border: '#E7E5E2',
      borderSubtle: '#F0EFEA',
      accent: '#FF5C35',
      accentHover: '#E84A23',
      accentSubtle: 'rgba(255, 92, 53, 0.08)',
      success: '#16845B',
      danger: '#D64545',
      dangerSubtle: 'rgba(214, 69, 69, 0.08)',
    },
    dark: {
      background: '#0D0D0D',
      surface: '#151515',
      surfaceSubtle: '#1C1C1C',
      surfaceHover: '#242424',
      surfaceActive: '#2C2C2C',
      primaryText: '#F5F5F5',
      secondaryText: '#A0A0A0',
      mutedText: '#707070',
      border: '#292929',
      borderSubtle: '#1F1F1F',
      accent: '#FF6845',
      accentHover: '#FF7D5D',
      accentSubtle: 'rgba(255, 104, 69, 0.12)',
      success: '#38A878',
      danger: '#E05252',
      dangerSubtle: 'rgba(224, 82, 82, 0.12)',
    },
  },

  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", "SF Mono", monospace',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    scale: {
      display: { size: '36px', lineHeight: '1.2', weight: 700 },
      pageHeading: { size: '26px', lineHeight: '1.25', weight: 700 },
      sectionHeading: { size: '19px', lineHeight: '1.3', weight: 650 },
      body: { size: '15px', lineHeight: '1.5', weight: 400 },
      meta: { size: '13px', lineHeight: '1.4', weight: 450 },
      badge: { size: '11px', lineHeight: '1', weight: 600 },
      button: { size: '14px', lineHeight: '1', weight: 600 },
    },
  },

  radius: {
    control: '8px',
    button: '9px',
    input: '9px',
    card: '12px',
    surface: '16px',
    pill: '9999px',
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    elevated: '0 4px 12px -2px rgba(0, 0, 0, 0.06)',
    modal: '0 12px 32px -4px rgba(0, 0, 0, 0.12)',
  },

  layout: {
    navRailWidth: '240px',
    timelineWidth: '620px',
    rightRailWidth: '320px',
    mobileBottomBarHeight: '56px',
    headerHeight: '52px',
  },
};

export default TOKENS;
