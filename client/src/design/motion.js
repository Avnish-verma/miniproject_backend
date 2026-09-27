/**
 * NOVA Motion & Interaction Tokens
 * Duration: 150–220ms
 * Easing: Natural cubic-bezier for tactile feedback
 * Avoid: bouncing everything, excessive springs, continuous animations
 */

export const MOTION = {
  duration: {
    fast: '150ms',
    base: '180ms',
    moderate: '220ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  transitions: {
    interactive: 'transition-all duration-150 ease-out active:scale-[0.98]',
    colors: 'transition-colors duration-150 ease-out',
    fade: 'transition-opacity duration-180 ease-out',
  },
};

export default MOTION;
