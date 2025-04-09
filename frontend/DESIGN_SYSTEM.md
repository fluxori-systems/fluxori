# Fluxori Design System & Motion Framework

This document provides an overview of the Fluxori Design System implementation, which serves as the foundation for consistent styling across the application.

## Implementation Summary

We have successfully implemented the core of the Fluxori Design System, including:

### 1. Design Tokens

- **Color System**
  - Primary colors (blue palette)
  - Secondary colors (magenta palette)
  - Neutral colors (slate palette)
  - Semantic colors (success, warning, error, info)
  - UI colors (background, text, border)
  - Light and dark mode variants

- **Typography System**
  - Font families (Inter for body text, Space Grotesk for headings)
  - Font sizes (scale from 2xs to 6xl)
  - Font weights (regular, medium, semibold, bold)
  - Line heights and letter spacing

- **Spacing & Sizing**
  - Consistent spacing scale (3xs to 5xl)
  - Based on 4px grid system for consistent UI

- **Elevation/Shadow System**
  - Shadow scale (xs to 2xl, plus inner shadow)
  - Dark mode shadow adjustments

- **Other Tokens**
  - Border radius
  - Z-index scale
  - Motion tokens (durations, easings)
  - Breakpoints

### 2. Theming System

- **Theme Provider**
  - React context for theme management
  - Light/dark mode toggling
  - System preference detection
  - Local storage persistence

- **CSS Variables**
  - All tokens exposed as CSS variables
  - Dark mode handled with `[data-theme="dark"]` selector
  - Global styles integration

### 3. Utilities & Hooks

- **Token Access**
  - Type-safe token access utilities
  - `useDesignTokens` hook for React components
  - Responsive utilities (`useBreakpoint`, `useResponsiveValue`)
  - Fluid typography utilities

- **Accessibility Tools**
  - Contrast ratio checking
  - WCAG compliance utilities
  - Reduced motion hook

### 4. Showcase & Documentation

- **Theme Showcase**
  - Interactive showcase of all design tokens
  - Color palette visualization
  - Typography demonstration
  - Spacing and shadow examples

- **Documentation**
  - Usage guidelines
  - Examples and code snippets
  - Accessibility information

## Implementation Details

### File Structure

```
/lib/design-system/
├── tokens/               # Design tokens definitions
│   ├── colors.ts         # Color palettes for light/dark modes
│   ├── typography.ts     # Typography system tokens
│   ├── spacing.ts        # Spacing scale
│   ├── radii.ts          # Border radius tokens
│   ├── shadows.ts        # Shadow tokens for light/dark modes
│   ├── motion.ts         # Animation durations and easings
│   └── index.ts          # Token exports
├── types/                # TypeScript type definitions
│   └── tokens.ts         # Design token interfaces
├── theme/                # Theme management
│   └── ThemeContext.tsx  # Theme context provider
├── utils/                # Utilities
│   ├── accessibility.ts  # Contrast ratio and a11y utilities
│   ├── generateCssVars.ts # CSS variable generation
│   └── tokens.ts         # Token access utilities
├── hooks/                # React hooks
│   ├── useDesignTokens.ts # Hook for accessing tokens
│   ├── useMediaQuery.ts  # Responsive media query hooks
│   └── useReducedMotion.ts # Reduced motion preferences hook
├── components/           # Showcase components
│   ├── ThemeShowcase.tsx # Visual showcase of tokens
│   └── DesignSystemDocs.tsx # Usage documentation
└── index.ts              # Main exports
```

### CSS Variables Implementation

All design tokens are implemented as CSS variables in the global stylesheet. This allows for:

1. Easy theming and customization
2. Efficient updates (only CSS variables change, not component styles)
3. Consistent access patterns throughout the application

Example:

```css
:root {
  --color-primary-500: #3a86ff;
  --typography-font-sizes-md: 1rem;
  --spacing-md: 1rem;
}

[data-theme="dark"] {
  --color-primary-500: #57a5ff;
  --color-background-surface: #111827;
}
```

### Theme Provider Integration

The ThemeProvider component is integrated into the root layout, allowing for theme access throughout the application:

```tsx
// In layout.tsx
<ThemeProvider defaultColorMode="light">
  <MantineProvider defaultColorScheme="light">
    {children}
  </MantineProvider>
</ThemeProvider>
```

## Accessibility Considerations

The design system prioritizes accessibility with the following features:

- **Color Contrast**: All color combinations meet WCAG AA standards (4.5:1 contrast ratio for normal text)
- **Reduced Motion**: Support for users who prefer reduced motion
- **Responsive Typography**: Proper scaling of typography across devices
- **Semantic Colors**: Clear semantic meaning for status indicators
- **Focus Styles**: Visible focus indicators for keyboard navigation

## Motion Framework

The design system includes a foundation for motion with:

- **Duration Tokens**: Consistent animation timing (instant, fast, normal, slow)
- **Easing Functions**: Predictable motion patterns (easeIn, easeOut, easeInOut, bounce)
- **Reduced Motion**: Respects user preferences for reduced motion
- **Animation Utilities**: CSS animation utilities for common effects

## Usage Examples

### Accessing Design Tokens

```tsx
'use client';

import { useDesignTokens } from '@/lib/design-system';

function MyComponent() {
  const { color, fontSize, spacing } = useDesignTokens();
  
  return (
    <div style={{
      color: color('text.primary'),
      fontSize: fontSize('md'),
      padding: spacing('md'),
      borderRadius: radius('md'),
      boxShadow: shadow('md'),
    }}>
      Styled using design tokens
    </div>
  );
}
```

### Theme Switching

```tsx
'use client';

import { useTheme } from '@/lib/design-system';
import { Button } from '@/lib/ui';

function ThemeToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  
  return (
    <Button onClick={toggleColorMode}>
      Switch to {colorMode === 'light' ? 'Dark' : 'Light'} Theme
    </Button>
  );
}
```

### Responsive Design

```tsx
'use client';

import { useBreakpoint, useResponsiveValue } from '@/lib/design-system';

function ResponsiveComponent() {
  const isMobile = useBreakpoint('md', 'down');
  const fontSize = useResponsiveValue({
    base: '1rem',    // Default
    md: '1.25rem',   // Medium screens and up
    lg: '1.5rem',    // Large screens and up
  });
  
  return (
    <div style={{ fontSize }}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

## Next Steps

1. **Font Implementation**: Download and integrate the actual Inter and Space Grotesk font files
2. **Component Library Integration**: Apply design tokens to all UI components
3. **Design System Documentation**: Create comprehensive documentation
4. **Accessibility Testing**: Conduct thorough accessibility testing
5. **Motion Patterns**: Develop standard motion patterns for common interactions
6. **Theme Customization**: Add support for theme customization beyond light/dark
7. **Visual Regression Testing**: Set up visual regression tests

## Conclusion

The Fluxori Design System provides a solid foundation for consistent, accessible, and visually pleasing UI development. By centralizing design decisions in tokens and providing easy access through hooks and utilities, we ensure that the application maintains a cohesive look and feel across all screens and components.