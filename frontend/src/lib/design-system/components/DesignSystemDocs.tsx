'use client';

import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useDesignTokens } from '../hooks';
import { Box, Paper, Title, Text, Tabs, Code, Anchor, Stack } from '@mantine/core';

/**
 * Component for documenting the design system
 * Explains how to use the design system in the application
 */
export function DesignSystemDocs() {
  const { colorMode } = useTheme();
  const { tokens } = useDesignTokens();
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  
  return (
    <Box p="xl">
      <Title order={1} mb="xl">Fluxori Design System Documentation</Title>
      
      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="overview">Overview</Tabs.Tab>
          <Tabs.Tab value="usage">Usage Guide</Tabs.Tab>
          <Tabs.Tab value="tokens">Design Tokens</Tabs.Tab>
          <Tabs.Tab value="theming">Theming</Tabs.Tab>
          <Tabs.Tab value="accessibility">Accessibility</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="overview" pt="md">
          <OverviewTab />
        </Tabs.Panel>
        
        <Tabs.Panel value="usage" pt="md">
          <UsageGuideTab />
        </Tabs.Panel>
        
        <Tabs.Panel value="tokens" pt="md">
          <TokensTab />
        </Tabs.Panel>
        
        <Tabs.Panel value="theming" pt="md">
          <ThemingTab />
        </Tabs.Panel>
        
        <Tabs.Panel value="accessibility" pt="md">
          <AccessibilityTab />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

/**
 * Overview tab explaining the design system
 */
function OverviewTab() {
  return (
    <Stack gap="md">
      <Title order={2}>Fluxori Design System</Title>
      
      <Text>
        The Fluxori Design System is a comprehensive design language that provides
        consistency across the Fluxori application. It includes color palettes,
        typography, spacing, shadows, and other design tokens that define the visual
        language of the application.
      </Text>
      
      <Paper withBorder p="md">
        <Title order={3} mb="md">Design System Principles</Title>
        
        <Stack gap="md">
          <Box>
            <Text fw={700}>Consistency</Text>
            <Text>
              The design system ensures visual and interaction consistency
              across the application, making the interface predictable and easy to use.
            </Text>
          </Box>
          
          <Box>
            <Text fw={700}>Accessibility</Text>
            <Text>
              All design tokens are designed with accessibility in mind, ensuring
              the application is usable by everyone, including those with disabilities.
              Color contrast ratios meet WCAG AA standards.
            </Text>
          </Box>
          
          <Box>
            <Text fw={700}>Flexibility</Text>
            <Text>
              The design system supports both light and dark modes and can be
              extended for future needs. It provides a foundation for building
              custom components that match the Fluxori brand.
            </Text>
          </Box>
          
          <Box>
            <Text fw={700}>Performance</Text>
            <Text>
              The design system is optimized for performance, using CSS variables
              for efficient updates and minimizing unnecessary re-renders.
            </Text>
          </Box>
        </Stack>
      </Paper>
      
      <Title order={3} mt="lg">Design System Structure</Title>
      
      <Stack gap="md">
        <Box>
          <Text fw={700}>Tokens</Text>
          <Text>
            Core design values like colors, typography, spacing, and shadows.
            These are the building blocks of the design system.
          </Text>
        </Box>
        
        <Box>
          <Text fw={700}>Theme</Text>
          <Text>
            The theme provides access to tokens in both light and dark modes.
            It also handles user preferences and system settings.
          </Text>
        </Box>
        
        <Box>
          <Text fw={700}>Hooks & Utilities</Text>
          <Text>
            Helper functions and React hooks that make it easy to use the design
            system in components. These include responsive utilities and accessibility
            helpers.
          </Text>
        </Box>
        
        <Box>
          <Text fw={700}>Components</Text>
          <Text>
            UI components built on top of the design system. These extend the
            existing UI library with new features and design system integration.
          </Text>
        </Box>
      </Stack>
    </Stack>
  );
}

/**
 * Usage guide tab with code examples
 */
function UsageGuideTab() {
  return (
    <Stack gap="md">
      <Title order={2}>Usage Guide</Title>
      
      <Text>
        This guide explains how to use the Fluxori Design System in your components.
        The design system is built on top of Mantine UI and provides additional
        functionality and theming.
      </Text>
      
      <Title order={3} mt="lg">ThemeProvider</Title>
      
      <Text>
        First, you need to wrap your application with the ThemeProvider. This is
        typically done in the root layout.
      </Text>
      
      <Code block>
{`import { ThemeProvider } from '@/lib/design-system';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultColorMode="light">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}`}
      </Code>
      
      <Title order={3} mt="lg">Using Design Tokens</Title>
      
      <Text>
        You can access design tokens using the useDesignTokens hook.
      </Text>
      
      <Code block>
{`'use client';

import { useDesignTokens } from '@/lib/design-system';

export default function MyComponent() {
  const { color, fontSize, spacing, radius, shadow } = useDesignTokens();
  
  return (
    <div style={{
      color: color('text.primary'),
      fontSize: fontSize('md'),
      padding: spacing('md'),
      borderRadius: radius('md'),
      boxShadow: shadow('md'),
      backgroundColor: color('background.card'),
    }}>
      This is styled using design tokens
    </div>
  );
}`}
      </Code>
      
      <Title order={3} mt="lg">Using Color Mode</Title>
      
      <Text>
        You can access and change the color mode using the useTheme hook.
      </Text>
      
      <Code block>
{`'use client';

import { useTheme } from '@/lib/design-system';
import { Button } from '@/lib/ui';

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  
  return (
    <Button onClick={toggleColorMode}>
      Switch to {colorMode === 'light' ? 'Dark' : 'Light'} Mode
    </Button>
  );
}`}
      </Code>
      
      <Title order={3} mt="lg">Responsive Design</Title>
      
      <Text>
        The design system provides hooks for responsive design.
      </Text>
      
      <Code block>
{`'use client';

import { useBreakpoint, useResponsiveValue } from '@/lib/design-system';
import { Box } from '@/lib/ui';

export default function ResponsiveComponent() {
  const isMobile = useBreakpoint('md', 'down');
  
  // Use different values based on screen size
  const padding = useResponsiveValue({
    base: '8px',    // default
    sm: '16px',     // small screens and up
    md: '24px',     // medium screens and up
    lg: '32px',     // large screens and up
  });
  
  return (
    <Box p={padding}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </Box>
  );
}`}
      </Code>
      
      <Title order={3} mt="lg">Fluid Typography</Title>
      
      <Text>
        You can create responsive typography that scales between viewport sizes.
      </Text>
      
      <Code block>
{`'use client';

import { useDesignTokens } from '@/lib/design-system';

export default function FluidHeading() {
  const { fluidType } = useDesignTokens();
  
  // Font size will scale from 'md' to '2xl' between the default viewport sizes
  const fontSize = fluidType('md', '2xl');
  
  return (
    <h1 style={{ fontSize }}>
      This heading uses fluid typography
    </h1>
  );
}`}
      </Code>
    </Stack>
  );
}

/**
 * Tokens tab explaining available design tokens
 */
function TokensTab() {
  return (
    <Stack gap="md">
      <Title order={2}>Design Tokens</Title>
      
      <Text>
        Design tokens are the visual design atoms of the design system. They define 
        colors, typography, spacing, and other visual properties. Here's an overview
        of the available tokens.
      </Text>
      
      <Title order={3} mt="lg">Color Tokens</Title>
      
      <Text>
        The color system is organized into several categories:
      </Text>
      
      <Stack gap="xs">
        <Text>• <b>Primary & Secondary:</b> Brand colors with shades from 50 to 950</Text>
        <Text>• <b>Neutral:</b> Gray scale for text, backgrounds, and borders</Text>
        <Text>• <b>Semantic:</b> Colors for success, warning, error, and info states</Text>
        <Text>• <b>Background:</b> Surface, card, page, and other background colors</Text>
        <Text>• <b>Text:</b> Primary, secondary, disabled, and inverse text colors</Text>
        <Text>• <b>Border:</b> Border colors for different states and emphasis</Text>
      </Stack>
      
      <Code block>
{`// Access color tokens
const primaryColor = color('primary.500');
const warningLight = color('warning.light');
const textColor = color('text.primary');
const cardBg = color('background.card');`}
      </Code>
      
      <Title order={3} mt="lg">Typography Tokens</Title>
      
      <Text>
        Typography includes font families, sizes, weights, line heights, and letter spacings.
      </Text>
      
      <Stack gap="xs">
        <Text>• <b>Font Families:</b> Base (Inter), Heading (Space Grotesk), Mono</Text>
        <Text>• <b>Font Sizes:</b> Scale from 2xs to 6xl</Text>
        <Text>• <b>Font Weights:</b> Regular (400), Medium (500), Semibold (600), Bold (700)</Text>
        <Text>• <b>Line Heights:</b> None, Tight, Snug, Normal, Relaxed, Loose</Text>
        <Text>• <b>Letter Spacings:</b> Tighter, Tight, Normal, Wide, Wider, Widest</Text>
      </Stack>
      
      <Code block>
{`// Access typography tokens
const baseFont = tokens.typography.fonts.base;
const mdSize = fontSize('md');
const boldWeight = tokens.typography.fontWeights.bold;
const normalLineHeight = tokens.typography.lineHeights.normal;`}
      </Code>
      
      <Title order={3} mt="lg">Spacing Tokens</Title>
      
      <Text>
        Spacing tokens define consistent spacing throughout the application.
      </Text>
      
      <Code block>
{`// Access spacing tokens
const smallSpacing = spacing('sm');   // 0.75rem (12px)
const mediumSpacing = spacing('md');  // 1rem (16px)
const largeSpacing = spacing('lg');   // 1.5rem (24px)`}
      </Code>
      
      <Title order={3} mt="lg">Other Tokens</Title>
      
      <Stack gap="xs">
        <Text>• <b>Border Radius:</b> From none to full</Text>
        <Text>• <b>Shadows:</b> From xs to 2xl, plus inner shadow</Text>
        <Text>• <b>Z-Index:</b> Standard z-index values for layering</Text>
        <Text>• <b>Breakpoints:</b> Viewport sizes for responsive design</Text>
        <Text>• <b>Motion:</b> Duration and easing for animations</Text>
      </Stack>
      
      <Code block>
{`// Access other tokens
const mediumRadius = radius('md');
const largeShadow = shadow('lg');
const duration = tokens.motion.durations.normal;
const breakpoint = tokens.breakpoints.md;`}
      </Code>
    </Stack>
  );
}

/**
 * Theming tab explaining theme management
 */
function ThemingTab() {
  return (
    <Stack gap="md">
      <Title order={2}>Theming</Title>
      
      <Text>
        The Fluxori Design System supports both light and dark themes. The theme
        is managed by the ThemeProvider and can be accessed using the useTheme hook.
      </Text>
      
      <Title order={3} mt="lg">Theme Provider</Title>
      
      <Text>
        The ThemeProvider handles theme management and user preferences. It:
      </Text>
      
      <Stack gap="xs">
        <Text>• Stores the current color mode (light or dark)</Text>
        <Text>• Syncs with user's system preferences</Text>
        <Text>• Persists user's theme preference in local storage</Text>
        <Text>• Sets CSS variables for the current theme</Text>
        <Text>• Provides theme switching functionality</Text>
      </Stack>
      
      <Title order={3} mt="lg">CSS Variables</Title>
      
      <Text>
        The design system uses CSS variables for theming. These variables are set
        on the :root element and [data-theme="dark"] selector.
      </Text>
      
      <Code block>
{`:root {
  --color-primary-500: #3a86ff;
  --typography-font-sizes-md: 1rem;
  --spacing-md: 1rem;
  --radius-md: 0.25rem;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  /* And many more... */
}

[data-theme="dark"] {
  --color-primary-500: #57a5ff;
  --color-background-surface: #111827;
  --color-text-primary: #f8fafc;
  /* Dark mode overrides... */
}`}
      </Code>
      
      <Title order={3} mt="lg">Customizing the Theme</Title>
      
      <Text>
        To customize the theme, you can modify the token files in the design system.
        The main places to modify are:
      </Text>
      
      <Stack gap="xs">
        <Text>• <Code>tokens/colors.ts</Code> - Color palette</Text>
        <Text>• <Code>tokens/typography.ts</Code> - Typography system</Text>
        <Text>• <Code>tokens/spacing.ts</Code> - Spacing scale</Text>
        <Text>• <Code>tokens/radii.ts</Code> - Border radius scale</Text>
        <Text>• <Code>tokens/shadows.ts</Code> - Shadow scale</Text>
      </Stack>
      
      <Text mt="md">
        After modifying the tokens, you'll need to rebuild the application for the
        changes to take effect.
      </Text>
    </Stack>
  );
}

/**
 * Accessibility tab explaining accessibility features
 */
function AccessibilityTab() {
  return (
    <Stack gap="md">
      <Title order={2}>Accessibility</Title>
      
      <Text>
        The Fluxori Design System is built with accessibility in mind. It follows
        the Web Content Accessibility Guidelines (WCAG) and provides tools for
        ensuring accessible interfaces.
      </Text>
      
      <Title order={3} mt="lg">Color Contrast</Title>
      
      <Text>
        All color combinations in the design system meet WCAG AA standards for contrast.
        The system provides utilities for checking contrast ratios:
      </Text>
      
      <Code block>
{`import { 
  getContrastRatio, 
  meetsWcagAA, 
  meetsWcagAAA,
  getAccessibleTextColor
} from '@/lib/design-system';

// Get contrast ratio between two colors (1:1 to 21:1)
const ratio = getContrastRatio('#3a86ff', '#ffffff'); // e.g. 3.5:1

// Check if colors meet WCAG AA standard (4.5:1 for normal text)
const isAACompliant = meetsWcagAA('#3a86ff', '#ffffff'); // true/false

// Check if colors meet WCAG AAA standard (7:1 for normal text)
const isAAACompliant = meetsWcagAAA('#3a86ff', '#ffffff'); // true/false

// Get the best text color (black or white) for a background
const textColor = getAccessibleTextColor('#3a86ff'); // '#ffffff'`}
      </Code>
      
      <Title order={3} mt="lg">Reduced Motion</Title>
      
      <Text>
        The design system respects the user's motion preferences and provides
        a hook for detecting reduced motion settings:
      </Text>
      
      <Code block>
{`import { useReducedMotion } from '@/lib/design-system';

function MyAnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  // Use alternate animation or no animation
  const animation = prefersReducedMotion
    ? 'none'
    : 'fadeIn 0.3s ease-in-out';
  
  return (
    <div style={{ animation }}>
      Animated content
    </div>
  );
}`}
      </Code>
      
      <Text mt="md">
        Additionally, the design system includes global CSS for reducing animations
        when the user has requested reduced motion:
      </Text>
      
      <Code block>
{`@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`}
      </Code>
      
      <Title order={3} mt="lg">Screen Reader Support</Title>
      
      <Text>
        The design system encourages proper semantic HTML and ARIA attributes.
        When building components, follow these guidelines:
      </Text>
      
      <Stack gap="xs">
        <Text>• Use semantic HTML elements (<Code>button</Code>, <Code>nav</Code>, etc.)</Text>
        <Text>• Provide alt text for images</Text>
        <Text>• Use ARIA attributes when needed</Text>
        <Text>• Ensure keyboard navigation works properly</Text>
        <Text>• Use proper heading hierarchy</Text>
        <Text>• Include focus styles (already included in the design system)</Text>
      </Stack>
      
      <Title order={3} mt="lg">Accessibility Resources</Title>
      
      <Stack gap="xs">
        <Anchor href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank">
          Web Content Accessibility Guidelines (WCAG)
        </Anchor>
        <Anchor href="https://www.a11yproject.com/" target="_blank">
          The A11Y Project
        </Anchor>
        <Anchor href="https://webaim.org/resources/contrastchecker/" target="_blank">
          WebAIM Contrast Checker
        </Anchor>
        <Anchor href="https://developer.mozilla.org/en-US/docs/Web/Accessibility" target="_blank">
          MDN Web Accessibility Documentation
        </Anchor>
      </Stack>
    </Stack>
  );
}