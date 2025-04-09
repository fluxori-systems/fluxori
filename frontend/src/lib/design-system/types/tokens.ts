/**
 * Core type definitions for the Fluxori Design System tokens
 * These types define the structure and constraints for all design tokens
 */

/**
 * Core color token interface
 */
export interface ColorToken {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Semantic color token interface for context-specific colors
 */
export interface SemanticColorToken {
  light: string;
  base: string;
  dark: string;
  contrast: string; // Text color that ensures WCAG AA contrast on base
}

/**
 * Complete color palette interface
 */
export interface ColorPalette {
  // Brand colors
  primary: ColorToken;
  secondary: ColorToken;
  
  // Neutrals
  neutral: ColorToken;
  
  // Semantic colors
  success: SemanticColorToken;
  warning: SemanticColorToken;
  error: SemanticColorToken;
  info: SemanticColorToken;
  
  // Special colors
  background: {
    surface: string;
    card: string;
    page: string;
    raised: string;
    sunken: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    light: string;
    default: string;
    strong: string;
  };
}

/**
 * Typography scale interface for font sizes
 */
export interface FontSizeScale {
  '2xs': string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

/**
 * Font weight options
 */
export type FontWeight = 400 | 500 | 600 | 700;

/**
 * Line height options
 */
export interface LineHeightScale {
  none: number;
  tight: number;
  snug: number;
  normal: number;
  relaxed: number;
  loose: number;
}

/**
 * Letter spacing options
 */
export interface LetterSpacingScale {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

/**
 * Complete typography system interface
 */
export interface TypographySystem {
  fonts: {
    base: string; // Inter
    heading: string; // Space Grotesk
    mono: string; // For code examples
  };
  fontSizes: FontSizeScale;
  fontWeights: {
    regular: FontWeight;
    medium: FontWeight;
    semibold: FontWeight;
    bold: FontWeight;
  };
  lineHeights: LineHeightScale;
  letterSpacings: LetterSpacingScale;
}

/**
 * Spacing scale interface
 */
export interface SpacingScale {
  '3xs': string;
  '2xs': string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

/**
 * Border radius scale interface
 */
export interface RadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Shadow scale interface
 */
export interface ShadowScale {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

/**
 * Z-index scale interface
 */
export interface ZIndexScale {
  0: number;
  10: number;
  20: number;
  30: number;
  40: number;
  50: number;
  auto: 'auto';
}

/**
 * Complete design token set interface
 */
export interface DesignTokens {
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingScale;
  radii: RadiusScale;
  shadows: ShadowScale;
  zIndices: ZIndexScale;
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  motion: {
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
  };
}

/**
 * Color mode type
 */
export type ColorMode = 'light' | 'dark';

/**
 * Theme context type
 */
export interface ThemeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  tokens: DesignTokens;
}