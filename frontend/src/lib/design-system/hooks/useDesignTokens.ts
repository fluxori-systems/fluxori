"use client";

import { useTheme } from "../theme/ThemeContext";
import {
  FontSizeScale,
  SpacingScale,
  RadiusScale,
  ShadowScale,
} from "../types/tokens";
import {
  getColor,
  getFontSize,
  getSpacing,
  getRadius,
  getShadow,
  fluidFontSize,
} from "../utils/tokens";

/**
 * Hook that provides easy access to design tokens
 * with proper typing and consistent access patterns
 */
export function useDesignTokens() {
  const { tokens, colorMode } = useTheme();

  return {
    /**
     * The current color mode (light or dark)
     */
    colorMode,

    /**
     * Get a color token using a path notation
     * @example color('primary.500')
     */
    color: (path: string, fallback?: string) =>
      getColor(tokens, path, fallback),

    /**
     * Get a font size token
     * @example fontSize('md')
     */
    fontSize: (size: keyof FontSizeScale, fallback?: string) =>
      getFontSize(tokens, size, fallback),

    /**
     * Get a spacing token
     * @example spacing('md')
     */
    spacing: (space: keyof SpacingScale, fallback?: string) =>
      getSpacing(tokens, space, fallback),

    /**
     * Get a border radius token
     * @example radius('md')
     */
    radius: (radius: keyof RadiusScale, fallback?: string) =>
      getRadius(tokens, radius, fallback),

    /**
     * Get a shadow token
     * @example shadow('md')
     */
    shadow: (shadow: keyof ShadowScale, fallback?: string) =>
      getShadow(tokens, shadow, fallback),

    /**
     * Generate a responsive font size
     * @example fluidType('sm', 'lg')
     */
    fluidType: (
      mobileFontSize: keyof FontSizeScale,
      desktopFontSize: keyof FontSizeScale,
      lockBelow?: number,
      lockAbove?: number,
    ) =>
      fluidFontSize(
        tokens,
        mobileFontSize,
        desktopFontSize,
        lockBelow,
        lockAbove,
      ),

    /**
     * Raw access to the full tokens object
     */
    tokens,

    /**
     * Font families from the theme
     */
    fonts: tokens.typography.fonts,

    /**
     * Motion tokens from the theme
     */
    motion: tokens.motion,
  };
}
