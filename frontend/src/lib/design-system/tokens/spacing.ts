/**
 * Spacing tokens for the Fluxori Design System
 * Defines the spacing scale used throughout the application
 */

import { SpacingScale } from "../types/tokens";

/**
 * Spacing scale based on a 4px grid system
 * Uses rem units for better accessibility and responsiveness
 */
export const spacing: SpacingScale = {
  "3xs": "0.125rem", // 2px
  "2xs": "0.25rem", // 4px
  xs: "0.5rem", // 8px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem", // 48px
  "4xl": "4rem", // 64px
  "5xl": "6rem", // 96px
};

/**
 * Helper function to get a spacing value
 * Useful for programmatic access to spacing values
 */
export function getSpacing(size: keyof SpacingScale): string {
  return spacing[size];
}
