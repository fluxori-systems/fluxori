/**
 * Mantine Theme Adapter
 * 
 * Converts Mantine theme to our design system tokens
 * Enables compatibility between Mantine components and our design system
 */

import { MantineTheme } from '@mantine/core';
import { DesignTokens, SpacingScale } from '../types/tokens';
import { lightTheme } from '../tokens';

/**
 * Converts a Mantine theme to our design system tokens format
 * This allows us to use Mantine components with our design system
 * 
 * @param theme Mantine theme
 * @returns Design tokens compatible with our system
 */
export function mantineThemeToTokens(theme: MantineTheme): DesignTokens {
  // Start with our light theme as a base
  const baseTokens = { ...lightTheme };
  
  // Map Mantine spacing to our spacing tokens
  // This is a simplification and should be expanded as needed
  const spacingMap: Record<string, keyof SpacingScale> = {
    'xs': '3xs',
    'sm': '2xs',
    'md': 'xs',
    'lg': 'sm',
    'xl': 'md',
    '2xl': 'lg'
  };
  
  // Create a spacing object based on Mantine's spacing
  const spacing: Partial<SpacingScale> = {};
  
  // Map Mantine spacing values to our tokens
  Object.entries(spacingMap).forEach(([mantineKey, ourKey]) => {
    // Use Mantine's spacing scale converted to rems
    const spacingValue = theme.spacing[mantineKey as keyof typeof theme.spacing];
    // Convert to number if needed
    const numericValue = typeof spacingValue === 'string' ? parseFloat(spacingValue) : spacingValue;
    spacing[ourKey] = `${numericValue / 16}rem`;
  });
  
  // Return merged tokens
  return {
    ...baseTokens,
    // Override with Mantine values where applicable
    spacing: {
      ...baseTokens.spacing,
      ...spacing as SpacingScale
    }
  };
}

/**
 * Get a spacing value from a Mantine theme using our token keys
 * Adapter function that makes Mantine's theme compatible with our spacing tokens
 */
export function getSpacingFromMantine(
  theme: MantineTheme,
  space: keyof SpacingScale,
  fallback?: string
): string {
  // Mapping from our tokens to Mantine's tokens
  const reverseSpacingMap: Partial<Record<keyof SpacingScale, string>> = {
    '3xs': 'xs',
    '2xs': 'sm',
    'xs': 'md',
    'sm': 'lg', 
    'md': 'xl',
    'lg': '2xl'
  };
  
  // If we have a mapping for this token
  const mantineKey = reverseSpacingMap[space];
  if (mantineKey) {
    // Convert to rem for consistency
    const spacingValue = theme.spacing[mantineKey as keyof typeof theme.spacing];
    // Convert to number if needed
    const numericValue = typeof spacingValue === 'string' ? parseFloat(spacingValue) : spacingValue;
    return `${numericValue / 16}rem`;
  }
  
  // Fallback if we don't have a mapping
  return fallback || '';
}

/**
 * Get a radius value from Mantine theme
 */
export function getRadiusFromMantine(
  theme: MantineTheme,
  radius: string,
  fallback?: string
): string {
  // Map our tokens to Mantine radius values
  const radiusMap: Record<string, string> = {
    'none': '0',
    'sm': theme.radius.sm + 'px',
    'md': theme.radius.md + 'px',
    'lg': theme.radius.lg + 'px',
    'xl': theme.radius.xl + 'px',
    'full': '9999px'
  };
  
  return radiusMap[radius] || fallback || '';
}

/**
 * Get a shadow value from Mantine theme
 */
export function getShadowFromMantine(
  theme: MantineTheme,
  shadow: string,
  fallback?: string
): string {
  // Map our shadow tokens to Mantine shadow values
  const shadowMap: Record<string, string> = {
    'none': 'none',
    'xs': theme.shadows.xs,
    'sm': theme.shadows.sm,
    'md': theme.shadows.md,
    'lg': theme.shadows.lg,
    'xl': theme.shadows.xl
  };
  
  return shadowMap[shadow] || fallback || '';
}

/**
 * Get a color from Mantine theme
 * Maps our color paths to Mantine color values
 */
export function getColorFromMantine(
  theme: MantineTheme,
  colorPath: string,
  fallback?: string
): string {
  // Handle intent colors
  if (colorPath.startsWith('intent.')) {
    const intent = colorPath.split('.')[1];
    switch (intent) {
      case 'primary':
        return theme.colors.blue[6]; // Mantine primary is usually blue[6]
      case 'secondary':
        return theme.colors.violet[6];
      case 'success':
        return theme.colors.green[6];
      case 'warning':
        return theme.colors.yellow[6];
      case 'error':
        return theme.colors.red[6];
      case 'info':
        return theme.colors.cyan[6];
      case 'neutral':
        return theme.colors.gray[6];
      default:
        return fallback || '';
    }
  }
  
  // Handle other color paths
  const parts = colorPath.split('.');
  if (parts[0] === 'colors') {
    if (parts.length === 3) {
      // Format: colors.blue.6
      const colorName = parts[1];
      const shade = parts[2];
      
      if (theme.colors[colorName] && theme.colors[colorName][Number(shade)]) {
        return theme.colors[colorName][Number(shade)];
      }
    }
  }
  
  // Default fallback
  return fallback || '';
}