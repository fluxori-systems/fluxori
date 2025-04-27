/**
 * Typography tokens for the Fluxori Design System
 * Implements a comprehensive typography system using Inter and Space Grotesk fonts
 * Based on the Agent-First Interface design philosophy
 */

import {
  TypographySystem,
  FontSizeScale,
  LineHeightScale,
  LetterSpacingScale,
} from "../types/tokens";

/**
 * Font size scale with responsive consideratons
 * Uses rem units for better accessibility and responsiveness
 */
export const fontSizes: FontSizeScale = {
  "2xs": "0.75rem", // 12px (Micro)
  xs: "0.875rem", // 14px (Small/Caption)
  sm: "1rem", // 16px (Body, Agent Responses)
  md: "1.25rem", // 20px (H3)
  lg: "1.5rem", // 24px (H2)
  xl: "1.75rem", // 28px (H1)
  "2xl": "2rem", // 32px
  "3xl": "2.25rem", // 36px
  "4xl": "2.5rem", // 40px
  "5xl": "3rem", // 48px
  "6xl": "3.75rem", // 60px
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
  // Specific line heights from design system
  micro: 1.333, // 16px/12px
  caption: 1.428, // 20px/14px
  body: 1.5, // 24px/16px
  h3: 1.4, // 28px/20px
  h2: 1.333, // 32px/24px
  h1: 1.285, // 36px/28px
};

/**
 * Letter spacing scale
 * Controls the spacing between letters
 */
export const letterSpacings: LetterSpacingScale = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
};

/**
 * Complete typography system
 * Defines our font families, sizes, weights, line heights, and letter spacings
 * Uses Inter for UI elements and Space Grotesk for AI-generated content
 */
export const typography: TypographySystem = {
  fonts: {
    base: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    heading:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    agent:
      '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  // Specific text styles from design system
  styles: {
    h1: {
      fontFamily: "base",
      fontSize: "xl",
      fontWeight: "bold",
      lineHeight: "h1",
    },
    h2: {
      fontFamily: "base",
      fontSize: "lg",
      fontWeight: "semibold",
      lineHeight: "h2",
    },
    h3: {
      fontFamily: "base",
      fontSize: "md",
      fontWeight: "semibold",
      lineHeight: "h3",
    },
    body: {
      fontFamily: "base",
      fontSize: "sm",
      fontWeight: "regular",
      lineHeight: "body",
    },
    small: {
      fontFamily: "base",
      fontSize: "xs",
      fontWeight: "regular",
      lineHeight: "caption",
    },
    micro: {
      fontFamily: "base",
      fontSize: "2xs",
      fontWeight: "medium",
      lineHeight: "micro",
    },
    agentResponse: {
      fontFamily: "agent",
      fontSize: "sm",
      fontWeight: "regular",
      lineHeight: "body",
    },
    dataViz: {
      fontFamily: "agent",
      fontSize: "xs",
      fontWeight: "medium",
      lineHeight: "caption",
    },
    code: {
      fontFamily: "mono",
      fontSize: "xs",
      fontWeight: "regular",
      lineHeight: "caption",
    },
  },
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
