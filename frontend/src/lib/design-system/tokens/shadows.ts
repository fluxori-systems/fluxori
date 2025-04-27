/**
 * Shadow tokens for the Fluxori Design System
 * Defines the elevation system with light and dark mode variants
 * Based on the Design System Elevation & Shadows guidelines
 */

import { ShadowScale } from "../types/tokens";

/**
 * Shadow scale for light mode
 * Creates depth and elevation in the UI
 * Following specified elevation levels from the design system
 */
export const lightShadows: ShadowScale = {
  // Level 0: Flat elements
  none: "none",

  // Level 1: Cards, navigation
  sm: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",

  // Level 2: Dropdowns, popovers
  md: "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",

  // Level 3: Dialogs, modals
  lg: "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",

  // Level 4: Highest elevation elements
  xl: "0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)",

  // Additional levels for backward compatibility and specific use cases
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)",
};

/**
 * Shadow scale for dark mode
 * Adjusted for better visibility in dark backgrounds
 * Using higher opacity values as specified in the design system
 */
export const darkShadows: ShadowScale = {
  // Level 0: Flat elements
  none: "none",

  // Level 1: Cards, navigation
  sm: "0 1px 3px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)",

  // Level 2: Dropdowns, popovers
  md: "0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",

  // Level 3: Dialogs, modals
  lg: "0 10px 15px rgba(0,0,0,0.35), 0 4px 6px rgba(0,0,0,0.2)",

  // Level 4: Highest elevation elements
  xl: "0 20px 25px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.2)",

  // Additional levels for backward compatibility and specific use cases
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.2)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)",
};
