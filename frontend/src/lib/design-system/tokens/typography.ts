/**
 * Typography tokens for the Fluxori Design System
 * Implements a comprehensive typography system using Inter and Space Grotesk fonts
 */

import { TypographySystem, FontSizeScale, LineHeightScale, LetterSpacingScale } from '../types/tokens';

/**
 * Font size scale with responsive consideratons
 * Uses rem units for better accessibility and responsiveness
 */
export const fontSizes: FontSizeScale = {
  '2xs': '0.625rem', // 10px
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  md: '1rem',        // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
};

/**
 * Line height scale 
 * Provides appropriate spacing between lines of text
 */
export const lineHeights: LineHeightScale = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

/**
 * Letter spacing scale
 * Controls the spacing between letters
 */
export const letterSpacings: LetterSpacingScale = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

/**
 * Complete typography system
 * Defines our font families, sizes, weights, line heights, and letter spacings
 */
export const typography: TypographySystem = {
  fonts: {
    base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    heading: '"Space Grotesk", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSizes,
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights,
  letterSpacings,
};

/**
 * Font face declarations for Inter and Space Grotesk
 * This CSS will be inserted into the global stylesheet
 */
export const fontFaceDeclarations = `
  /* Inter Font */
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/inter-regular.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url('/fonts/inter-medium.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url('/fonts/inter-semibold.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/inter-bold.woff2') format('woff2');
  }
  
  /* Space Grotesk Font */
  @font-face {
    font-family: 'Space Grotesk';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/space-grotesk-regular.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Space Grotesk';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url('/fonts/space-grotesk-medium.woff2') format('woff2');
  }
  
  @font-face {
    font-family: 'Space Grotesk';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/space-grotesk-bold.woff2') format('woff2');
  }
`;