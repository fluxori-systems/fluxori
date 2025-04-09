/**
 * Color tokens for the Fluxori Design System
 * All colors are defined with proper accessibility considerations
 */

import { ColorPalette, ColorToken, SemanticColorToken } from '../types/tokens';

/**
 * Primary color palette - Blue
 * Used for primary actions, links, and key UI elements
 */
export const primaryColors: ColorToken = {
  50: '#eef6ff',
  100: '#d8eaff',
  200: '#b9daff',
  300: '#8ac4ff',
  400: '#57a5ff',
  500: '#3a86ff', // Primary base color
  600: '#2667dd',
  700: '#1d4eb8',
  800: '#1c4496',
  900: '#1d3a7a',
  950: '#0f1e45',
};

/**
 * Secondary color palette - Magenta
 * Used for secondary actions and highlights
 */
export const secondaryColors: ColorToken = {
  50: '#fdf2f7',
  100: '#fce7f1',
  200: '#fbcfe4',
  300: '#f8a8ce',
  400: '#f472b6',
  500: '#ff006e', // Secondary base color
  600: '#db2777',
  700: '#be185d',
  800: '#9d174d',
  900: '#831843',
  950: '#500724',
};

/**
 * Neutral color palette - Slate
 * Used for text, backgrounds, and borders
 */
export const neutralColors: ColorToken = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

/**
 * Success color - Green
 * Used for positive actions, success messages, and confirmations
 */
export const successColors: SemanticColorToken = {
  light: '#d1fae5',
  base: '#38b000', // Success base color
  dark: '#166534',
  contrast: '#ffffff',
};

/**
 * Warning color - Amber
 * Used for warnings, alerts, and non-critical notifications
 */
export const warningColors: SemanticColorToken = {
  light: '#fef3c7',
  base: '#ffbe0b', // Warning base color
  dark: '#92400e',
  contrast: '#000000',
};

/**
 * Error color - Red
 * Used for errors, destructive actions, and critical notifications
 */
export const errorColors: SemanticColorToken = {
  light: '#fee2e2',
  base: '#ff0a54', // Error base color
  dark: '#991b1b',
  contrast: '#ffffff',
};

/**
 * Info color - Blue
 * Used for informational messages and help texts
 */
export const infoColors: SemanticColorToken = {
  light: '#dbeafe',
  base: '#0ea5e9', // Info base color
  dark: '#1e40af',
  contrast: '#ffffff',
};

/**
 * Complete light mode color palette
 */
export const lightModeColors: ColorPalette = {
  primary: primaryColors,
  secondary: secondaryColors,
  neutral: neutralColors,
  success: successColors,
  warning: warningColors,
  error: errorColors,
  info: infoColors,
  background: {
    surface: neutralColors[50],
    card: '#ffffff',
    page: '#f8fafc',
    raised: '#ffffff',
    sunken: neutralColors[100],
  },
  text: {
    primary: neutralColors[900],
    secondary: neutralColors[600],
    disabled: neutralColors[400],
    inverse: '#ffffff',
  },
  border: {
    light: neutralColors[200],
    default: neutralColors[300],
    strong: neutralColors[400],
  },
};

/**
 * Complete dark mode color palette
 * Ensures proper contrast ratios and accessibility
 */
export const darkModeColors: ColorPalette = {
  primary: {
    ...primaryColors,
    500: '#57a5ff', // Adjusted for better contrast in dark mode
  },
  secondary: {
    ...secondaryColors,
    500: '#f472b6', // Adjusted for better contrast in dark mode
  },
  neutral: neutralColors,
  success: {
    ...successColors,
    light: '#132e1a',
    base: '#4ade80', // Brighter for dark mode
    dark: '#d1fae5',
    contrast: '#000000',
  },
  warning: {
    ...warningColors,
    light: '#2e2511',
    base: '#fcd34d', // Brighter for dark mode
    dark: '#fef3c7',
    contrast: '#000000',
  },
  error: {
    ...errorColors,
    light: '#2a0e0e',
    base: '#f87171', // Brighter for dark mode
    dark: '#fee2e2',
    contrast: '#000000',
  },
  info: {
    ...infoColors,
    light: '#0e2954',
    base: '#38bdf8', // Brighter for dark mode
    dark: '#dbeafe',
    contrast: '#000000',
  },
  background: {
    surface: '#111827',
    card: '#1f2937',
    page: '#0f172a',
    raised: '#1e293b',
    sunken: '#0f172a',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    disabled: '#64748b',
    inverse: '#0f172a',
  },
  border: {
    light: '#334155',
    default: '#475569',
    strong: '#64748b',
  },
};