/**
 * Accessibility utilities for the Fluxori Design System
 * Provides functions for checking color contrast and other accessibility concerns
 */

/**
 * Calculate the relative luminance of a color
 * Based on the WCAG 2.0 formula
 * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 */
function getLuminance(hexColor: string): number {
  // Convert hex to rgb
  let r = 0,
    g = 0,
    b = 0;

  // Convert shorthand hex (#RGB) to full hex (#RRGGBB)
  if (hexColor.length === 4) {
    r = parseInt(hexColor[1] + hexColor[1], 16);
    g = parseInt(hexColor[2] + hexColor[2], 16);
    b = parseInt(hexColor[3] + hexColor[3], 16);
  } else {
    r = parseInt(hexColor.slice(1, 3), 16);
    g = parseInt(hexColor.slice(3, 5), 16);
    b = parseInt(hexColor.slice(5, 7), 16);
  }

  // Normalize rgb values
  const rSRGB = r / 255;
  const gSRGB = g / 255;
  const bSRGB = b / 255;

  // Convert to linear RGB
  const rLinear =
    rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4);
  const gLinear =
    gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4);
  const bLinear =
    bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * @returns Contrast ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);

  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA contrast standards
 * @param color1 Foreground or background color
 * @param color2 Background or foreground color
 * @param isLargeText Whether the text is large (>= 18pt or 14pt bold)
 * @returns Whether the contrast meets WCAG AA standards
 */
export function meetsWcagAA(
  color1: string,
  color2: string,
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if a color combination meets WCAG AAA contrast standards
 * @param color1 Foreground or background color
 * @param color2 Background or foreground color
 * @param isLargeText Whether the text is large (>= 18pt or 14pt bold)
 * @returns Whether the contrast meets WCAG AAA standards
 */
export function meetsWcagAAA(
  color1: string,
  color2: string,
  isLargeText = false,
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get the best text color (black or white) for a given background color
 * @param backgroundColor The background color in hex format
 * @returns '#ffffff' or '#000000' based on which has better contrast
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const blackContrast = getContrastRatio(backgroundColor, "#000000");
  const whiteContrast = getContrastRatio(backgroundColor, "#ffffff");

  return whiteContrast > blackContrast ? "#ffffff" : "#000000";
}
