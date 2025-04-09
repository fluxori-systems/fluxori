# Fluxori Design System

A comprehensive design system for the Fluxori application that provides consistent styling, typography, spacing, and more.

## Overview

The Fluxori Design System is a set of design tokens, components, and utilities that ensure visual consistency across the application. It includes color palettes, typography, spacing, and more, all designed with accessibility in mind.

## Features

- **Color System** - Comprehensive color palette with primary, secondary, neutral, and semantic colors
- **Typography** - Complete typography system using Inter and Space Grotesk fonts
- **Spacing** - Consistent spacing scale for layout and component spacing
- **Shadows** - Elevation system for adding depth to UI elements
- **Border Radius** - Border radius scale for consistent component styling
- **Motion** - Animation durations and easing functions for consistent motion
- **Accessibility** - Tools for ensuring accessible color contrast and motion preferences
- **Dark Mode** - Full support for light and dark modes
- **Responsive Design** - Utilities for building responsive interfaces

## Directory Structure

```
/lib/design-system/
├── tokens/               # Design tokens (colors, typography, spacing, etc.)
├── theme/                # Theme provider and context for managing themes
├── types/                # TypeScript interfaces for design tokens
├── utils/                # Utility functions for working with design tokens
├── hooks/                # React hooks for accessing design tokens
├── components/           # Components for showcasing and documenting the design system
├── README.md             # Documentation
└── index.ts              # Main entry point
```

## Usage

### ThemeProvider

Wrap your application in the ThemeProvider:

```tsx
import { ThemeProvider } from '@/lib/design-system';

export default function Layout({ children }) {
  return (
    <ThemeProvider defaultColorMode="light">
      {children}
    </ThemeProvider>
  );
}
```

### Using Design Tokens

Access design tokens using the useDesignTokens hook:

```tsx
import { useDesignTokens } from '@/lib/design-system';

function MyComponent() {
  const { color, fontSize, spacing } = useDesignTokens();
  
  return (
    <div style={{
      color: color('text.primary'),
      fontSize: fontSize('md'),
      padding: spacing('md'),
    }}>
      Styled using design tokens
    </div>
  );
}
```

### Managing Color Mode

Toggle between light and dark modes:

```tsx
import { useTheme } from '@/lib/design-system';

function ThemeToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  
  return (
    <button onClick={toggleColorMode}>
      Switch to {colorMode === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}
```

### Responsive Design

Create responsive interfaces:

```tsx
import { useBreakpoint, useResponsiveValue } from '@/lib/design-system';

function ResponsiveComponent() {
  const isMobile = useBreakpoint('md', 'down');
  const padding = useResponsiveValue({
    base: '8px',
    md: '16px',
    lg: '32px',
  });
  
  return (
    <div style={{ padding }}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

## Principles

The design system is built on the following principles:

- **Consistency** - Ensuring visual and functional consistency across the application
- **Accessibility** - Meeting WCAG AA standards for color contrast and providing tools for accessibility
- **Flexibility** - Supporting both light and dark modes and providing a foundation for customization
- **Performance** - Using CSS variables for efficient updates and optimizing for performance
- **Type Safety** - Full TypeScript support for all design tokens and utilities

## Showcase

View the design system showcase at `/design-system` to see all design tokens and documentation.

## Credits

This design system uses the following technologies:

- **Next.js** - React framework
- **TypeScript** - Type safety
- **CSS Variables** - For token implementation
- **Mantine UI** - Component foundation
- **Inter & Space Grotesk** - Typography