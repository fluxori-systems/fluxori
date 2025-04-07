import { MantineThemeOverride } from '@mantine/core';

/**
 * Default theme configuration for the application
 */
export const defaultTheme: MantineThemeOverride = {
  // Set your theme options here
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  colors: {
    // Define your colors here
  },
};

/**
 * Utility function to get a theme value
 */
export function getThemeValue<T>(path: string, defaultValue?: T): T | undefined {
  const pathParts = path.split('.');
  let value: any = defaultTheme;
  
  for (const part of pathParts) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    value = value[part];
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Available breakpoints in the theme
 */
export const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400,
};

/**
 * Spacing values in the theme
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/**
 * Export theme types from Mantine
 */
export type { MantineThemeOverride };