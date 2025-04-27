/**
 * Utility functions for working with design tokens
 * Provides helpers for responsive usage and token access
 */

import { lightTheme, darkTheme } from "../tokens";
import {
  DesignTokens,
  ColorMode,
  FontSizeScale,
  SpacingScale,
  RadiusScale,
  ShadowScale,
} from "../types/tokens";

/**
 * Get a specific token value from the theme
 * Typesafe accessor for token values
 */
export function getToken<K extends keyof DesignTokens>(
  theme: DesignTokens,
  tokenCategory: K,
  tokenName: string,
  fallback?: string,
): string | number {
  const category = theme[tokenCategory] as any;

  if (!category) {
    console.warn(`Token category "${tokenCategory}" not found in theme`);
    return fallback || "";
  }

  if (typeof category[tokenName] === "undefined") {
    console.warn(
      `Token "${tokenName}" not found in category "${String(tokenCategory)}"`,
    );
    return fallback || "";
  }

  return category[tokenName];
}

/**
 * Get a color token from the theme
 */
export function getColor(
  theme: DesignTokens,
  colorPath: string,
  fallback?: string,
): string {
  const parts = colorPath.split(".");
  let value: any = theme.colors;

  for (const part of parts) {
    if (!value || typeof value[part] === "undefined") {
      console.warn(`Color path "${colorPath}" not found in theme`);
      return fallback || "";
    }
    value = value[part];
  }

  if (typeof value !== "string") {
    console.warn(`Color at path "${colorPath}" is not a string value`);
    return fallback || "";
  }

  return value;
}

/**
 * Get a font size token from the theme
 */
export function getFontSize(
  theme: DesignTokens,
  size: keyof FontSizeScale,
  fallback?: string,
): string {
  return theme.typography.fontSizes[size] || fallback || "";
}

/**
 * Get a spacing token from the theme
 */
export function getSpacing(
  theme: DesignTokens,
  space: keyof SpacingScale,
  fallback?: string,
): string {
  return theme.spacing[space] || fallback || "";
}

/**
 * Get a radius token from the theme
 */
export function getRadius(
  theme: DesignTokens,
  radius: keyof RadiusScale,
  fallback?: string,
): string {
  return theme.radii[radius] || fallback || "";
}

/**
 * Get a shadow token from the theme
 */
export function getShadow(
  theme: DesignTokens,
  shadow: keyof ShadowScale,
  fallback?: string,
): string {
  return theme.shadows[shadow] || fallback || "";
}

/**
 * Generate a responsive font size with proper fluid scaling
 * @param theme Current theme
 * @param mobileFontSize Font size on mobile devices
 * @param desktopFontSize Font size on desktop devices
 * @param lockBelow Optional viewport width to lock minimum font size (default: 375px)
 * @param lockAbove Optional viewport width to lock maximum font size (default: 1440px)
 * @returns CSS clamp() function for fluid typography
 */
export function fluidFontSize(
  theme: DesignTokens,
  mobileFontSize: keyof FontSizeScale,
  desktopFontSize: keyof FontSizeScale,
  lockBelow: number = 375,
  lockAbove: number = 1440,
): string {
  const mobileSize = parseFloat(theme.typography.fontSizes[mobileFontSize]);
  const desktopSize = parseFloat(theme.typography.fontSizes[desktopFontSize]);

  // Calculate the slope and intercept for the fluid scaling
  const slope = (desktopSize - mobileSize) / (lockAbove - lockBelow);
  const intercept = mobileSize - slope * lockBelow;

  // Create the clamp function
  return `clamp(${mobileSize}rem, ${intercept.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${desktopSize}rem)`;
}

/**
 * Get theme tokens based on color mode
 */
export function getThemeTokens(colorMode: ColorMode): DesignTokens {
  return colorMode === "dark" ? darkTheme : lightTheme;
}

/**
 * Get CSS variable reference for a token
 * Returns a string with the CSS variable format: 'var(--token-name)'
 */
export function getCssVar(name: string): string {
  return `var(--${name})`;
}
