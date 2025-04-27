/**
 * Export all design tokens for the Fluxori Design System
 */

import { lightModeColors, darkModeColors } from "./colors";
import { motion, reducedMotionStyles } from "./motion";
import { radii } from "./radii";
import { lightShadows, darkShadows } from "./shadows";
import { spacing } from "./spacing";
import { typography, fontFaceDeclarations } from "./typography";
import { DesignTokens, ZIndexScale } from "../types/tokens";

/**
 * Z-index scale
 * Ensures consistent layering throughout the application
 */
export const zIndices: ZIndexScale = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: "auto",
};

/**
 * Breakpoints for responsive design
 * Based on common device sizes
 */
export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Light theme tokens
 */
export const lightTheme: DesignTokens = {
  colors: lightModeColors,
  typography,
  spacing,
  radii,
  shadows: lightShadows,
  zIndices,
  breakpoints,
  motion,
};

/**
 * Dark theme tokens
 */
export const darkTheme: DesignTokens = {
  colors: darkModeColors,
  typography,
  spacing,
  radii,
  shadows: darkShadows,
  zIndices,
  breakpoints,
  motion,
};

export {
  lightModeColors,
  darkModeColors,
  typography,
  fontFaceDeclarations,
  spacing,
  radii,
  lightShadows,
  darkShadows,
  motion,
  reducedMotionStyles,
};
