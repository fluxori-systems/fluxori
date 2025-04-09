/**
 * Motion tokens for the Fluxori Design System
 * Defines animation durations and easing functions
 */

interface MotionTokens {
  durations: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
  };
  easings: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    linear: string;
    bounce: string;
  };
}

/**
 * Motion tokens for animations and transitions
 */
export const motion: MotionTokens = {
  durations: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
  },
  easings: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * CSS variables for reduced motion preferences
 * Follows accessibility best practices
 */
export const reducedMotionStyles = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;