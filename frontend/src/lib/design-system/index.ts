/**
 * Fluxori Design System
 * A comprehensive design system for the Fluxori application
 */

// Export types
export * from './types/tokens';

// Export tokens
export * from './tokens';

// Export theme provider
export { ThemeProvider, useTheme } from './theme/ThemeContext';

// Export hooks
export * from './hooks';

// Export utilities
export { 
  getContrastRatio, 
  meetsWcagAA, 
  meetsWcagAAA, 
  getAccessibleTextColor 
} from './utils/accessibility';

export {
  getToken,
  getColor,
  getFontSize,
  getSpacing,
  getRadius,
  getShadow,
  fluidFontSize,
  getThemeTokens,
  getCssVar
} from './utils/tokens';

export {
  generateCssVariables,
  generateUtilityClasses
} from './utils/generateCssVariables';

// Export token analysis utilities
export {
  // Token usage tracking
  registerTokenUsage,
  getAllTokenUsages,
  getTokenUsagesByComponent,
  getTokenMetrics,
  generateTokenReport,
  useTokenTracking,
  
  // Token registration
  setAvailableTokens,
  registerDefaultTokens
} from './utils/token-analysis';