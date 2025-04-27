/**
 * Border radius tokens for the Fluxori Design System
 * Defines the border radius scale used throughout the application
 */

import { RadiusScale } from "../types/tokens";

/**
 * Border radius scale
 * Uses rem units for better consistency
 */
export const radii: RadiusScale = {
  none: "0",
  sm: "0.125rem", // 2px
  md: "0.25rem", // 4px
  lg: "0.5rem", // 8px
  xl: "1rem", // 16px
  full: "9999px", // Fully rounded, useful for pills and avatars
};
