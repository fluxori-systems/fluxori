/**
 * Utility to generate CSS variables from design tokens
 * Creates a complete set of CSS variables for both light and dark modes
 */

import { DesignTokens, ColorPalette, ColorToken, SemanticColorToken } from '../types/tokens';
import { lightTheme, darkTheme } from '../tokens';

/**
 * Converts camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Flattens nested objects into CSS variable names
 */
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

/**
 * Process color tokens into CSS variables
 */
function processColorTokens(colors: ColorPalette, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  // Process primary and secondary colors
  ['primary', 'secondary', 'neutral'].forEach((colorName) => {
    const colorToken = colors[colorName as keyof typeof colors] as ColorToken;
    Object.entries(colorToken).forEach(([shade, value]) => {
      result[`${prefix}${colorName}-${shade}`] = value;
    });
  });

  // Process semantic colors
  ['success', 'warning', 'error', 'info'].forEach((colorName) => {
    const semanticToken = colors[colorName as keyof typeof colors] as SemanticColorToken;
    Object.entries(semanticToken).forEach(([variant, value]) => {
      result[`${prefix}${colorName}-${variant}`] = value;
    });
  });

  // Process background, text, and border colors
  ['background', 'text', 'border'].forEach((category) => {
    const categoryObj = colors[category as keyof typeof colors] as Record<string, string>;
    Object.entries(categoryObj).forEach(([name, value]) => {
      result[`${prefix}${category}-${name}`] = value;
    });
  });

  return result;
}

/**
 * Generate CSS variables for all tokens
 */
export function generateCssVariables(): string {
  // Process light theme tokens
  const lightTokens: Record<string, string> = {
    ...processColorTokens(lightTheme.colors, 'color-'),
    ...flattenObject(lightTheme.typography, 'typography'),
    ...flattenObject(lightTheme.spacing, 'spacing'),
    ...flattenObject(lightTheme.radii, 'radius'),
    ...flattenObject(lightTheme.shadows, 'shadow'),
    ...flattenObject(lightTheme.zIndices, 'z-index'),
    ...flattenObject(lightTheme.motion, 'motion'),
  };

  // Process dark theme tokens
  const darkTokens: Record<string, string> = {
    ...processColorTokens(darkTheme.colors, 'color-'),
  };

  // Create CSS variables string
  let cssVariables = ':root {\n';
  
  // Add light theme variables
  Object.entries(lightTokens).forEach(([name, value]) => {
    cssVariables += `  --${name}: ${value};\n`;
  });
  
  cssVariables += '}\n\n';
  
  // Add dark theme variables
  cssVariables += '[data-theme="dark"] {\n';
  Object.entries(darkTokens).forEach(([name, value]) => {
    cssVariables += `  --${name}: ${value};\n`;
  });
  cssVariables += '}\n';
  
  return cssVariables;
}

/**
 * Generate CSS utility classes for tokens
 */
export function generateUtilityClasses(): string {
  const { typography, spacing, radii } = lightTheme;
  let utilityClasses = '';

  // Typography utility classes
  utilityClasses += '/* Typography utility classes */\n';
  Object.entries(typography.fontSizes).forEach(([size, value]) => {
    utilityClasses += `.text-${size} { font-size: var(--typography-font-sizes-${size}); }\n`;
  });

  Object.entries(typography.fontWeights).forEach(([weight, value]) => {
    utilityClasses += `.font-${weight} { font-weight: var(--typography-font-weights-${weight}); }\n`;
  });

  // Spacing utility classes
  utilityClasses += '\n/* Spacing utility classes */\n';
  Object.entries(spacing).forEach(([size, value]) => {
    utilityClasses += `.m-${size} { margin: var(--spacing-${size}); }\n`;
    utilityClasses += `.p-${size} { padding: var(--spacing-${size}); }\n`;
    
    // Also add directional classes
    ['t', 'r', 'b', 'l'].forEach(dir => {
      utilityClasses += `.m${dir}-${size} { margin-${dir === 't' ? 'top' : dir === 'r' ? 'right' : dir === 'b' ? 'bottom' : 'left'}: var(--spacing-${size}); }\n`;
      utilityClasses += `.p${dir}-${size} { padding-${dir === 't' ? 'top' : dir === 'r' ? 'right' : dir === 'b' ? 'bottom' : 'left'}: var(--spacing-${size}); }\n`;
    });
  });

  // Border radius utility classes
  utilityClasses += '\n/* Border radius utility classes */\n';
  Object.entries(radii).forEach(([size, value]) => {
    utilityClasses += `.rounded-${size} { border-radius: var(--radius-${size}); }\n`;
  });

  return utilityClasses;
}