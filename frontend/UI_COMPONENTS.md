# UI Component Usage Guide

This document provides guidance on how to properly use our UI components to maintain TypeScript compatibility, integrate with our design system, and follow best practices.

## Core Principles

1. **Always use our UI library components** - never use Mantine components directly
2. **Always use the 'use client' directive** in client components
3. **Always provide explicit types** for props and parameters
4. **Always prefer modern prop names** over legacy ones
5. **Use design tokens** for consistent styling
6. **Leverage network-aware optimizations** for performance in South African markets
7. **Track design token usage** for system-wide consistency
8. **Consider variable network conditions** when building UIs

## Enhanced Features

Our UI components have been enhanced with several important features:

### Shared Type System

Components use standardized type interfaces:

- `BaseComponentProps` - Core props shared across all components
- `AnimatableComponentProps` - Animation-related props
- `Intent`, `Size`, `Radius`, `Spacing` - Standardized property types

```tsx
// BaseComponentProps provides standard HTML attributes and accessibility props
interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
  [key: `data-${string}`]: string | number | boolean;
  [key: `aria-${string}`]: string | number | boolean;
}

// AnimatableComponentProps adds animation capabilities
interface AnimatableComponentProps {
  animated?: boolean;
  animationType?: AnimationType;
  animationDelay?: number;
  animationSpeed?: number;
}
```

### Design Token Integration

Components automatically use our design system tokens:

- Components map standard props to design tokens
- Token usage tracking for analysis and optimization
- Helper functions like `getColor()`, `getSpacing()`, etc.

### Network-Aware Optimizations

Components intelligently adapt to network conditions:

- Animations scale back or disable on slow connections
- Layout complexity reduced on poor networks
- Optimized for South African mobile networks (2G/3G support)
- Respects reduced motion preferences and data saver mode
- Token usage tracking for optimization insights
- Adaptive padding and spacing for performance
- Simplified responsive layouts on slow connections
- Graceful degradation for legacy devices

## Mantine Prop Migration Guide

Mantine v7 introduced several changes to prop naming for better consistency. Our UI library supports both modern and legacy props, but you should always use the modern ones.

| Legacy Prop | Modern Prop      | Description                      |
| ----------- | ---------------- | -------------------------------- |
| `weight`    | `fw`             | Font weight                      |
| `align`     | `ta`             | Text align                       |
| `color`     | `c`              | Text/component color             |
| `spacing`   | `gap`            | Space between elements           |
| `position`  | `justify`        | Horizontal alignment             |
| `leftIcon`  | `leftSection`    | Left icon/content in a button    |
| `rightIcon` | `rightSection`   | Right icon/content in a button   |
| `uppercase` | `tt="uppercase"` | Text transform                   |
| `wrapLines` | `lineClamp`      | Line clamping in Text components |
| `underline` | `td="underline"` | Text decoration                  |
| `italic`    | `fs="italic"`    | Font style                       |

## Component Usage

### Text Component

```tsx
'use client';

import { Text } from '@/lib/ui';

// ✅ Correct usage with modern props
<Text fw={700} fz="xl" ta="center" c="blue.5">Hello World</Text>

// ✅ Using intent-based styling (uses design tokens)
<Text intent="primary" fw={700}>Primary text</Text>

// ❌ Incorrect usage with legacy props
<Text weight={700} size="xl" align="center" color="blue.5">Hello World</Text>
```

### Button Component

```tsx
'use client';

import { Button } from '@/lib/ui';
import { IconPlus } from '@tabler/icons-react';

// ✅ Correct usage with modern props
<Button leftSection={<IconPlus size={16} />} variant="filled">Click Me</Button>

// ✅ With animation and intent
<Button
  animated={true}
  animationType="scale"
  intent="primary"
>
  Animated Button
</Button>

// ✅ Network-aware animation
<Button
  animated={true}
  animationType="hover"
  // Will optimize for poor connections automatically
>
  Network-Aware Button
</Button>

// ❌ Incorrect usage with legacy props
<Button leftIcon={<IconPlus size={16} />} variant="filled">Click Me</Button>
```

### Stack Component

```tsx
'use client';

import { Stack } from '@/lib/ui';

// ✅ Basic usage with modern props - uses design tokens
<Stack gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// ✅ With intent-based styling and network awareness
<Stack
  gap="lg"
  intent="content"
  networkAware={true}
>
  <div>Network-optimized stack</div>
  <div>Adapts spacing on slow connections</div>
</Stack>

// ✅ With animated appearance
<Stack
  gap="md"
  animatePresence={true}
  animationDelay={200}
  networkAware={true} // Will disable animations on poor connections
>
  <div>Animated item 1</div>
  <div>Animated item 2</div>
</Stack>

// ❌ Incorrect usage with legacy props
<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

### Group Component

```tsx
'use client';

import { Group } from '@/lib/ui';

// ✅ Correct usage with modern props and design tokens
<Group gap="md" justify="space-between">
  <div>Left</div>
  <div>Right</div>
</Group>

// ❌ Incorrect usage with legacy props
<Group spacing="md" position="apart">
  <div>Left</div>
  <div>Right</div>
</Group>
```

### Menu Component

```tsx
'use client';

import { Menu, Button } from '@/lib/ui';
import { IconSettings } from '@tabler/icons-react';

// ✅ With animation, intent, and modern props
<Menu
  animated={true}
  animationType="fade"
  intent="primary"
>
  <Menu.Target>
    <Button>Open menu</Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item
      leftSection={<IconSettings size={14} />}
      intent="success"
    >
      Settings
    </Menu.Item>
  </Menu.Dropdown>
</Menu>

// ❌ Incorrect usage with legacy props
<Menu>
  <Menu.Target>
    <Button>Open menu</Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item icon={<IconSettings size={14} />}>Settings</Menu.Item>
  </Menu.Dropdown>
</Menu>
```

### Tabs Component

```tsx
"use client";

import { Tabs } from "@/lib/ui";

// ✅ With animation and intent
<Tabs defaultValue="tab1" animated={true} animationType="fade" intent="primary">
  <Tabs.List>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab value="tab2" intent="warning">
      Tab 2
    </Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
</Tabs>;
```

## TypeScript Best Practices

1. **Explicitly type all function parameters**

```tsx
// ✅ Correct
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  // ...
}

// ❌ Incorrect
function handleClick(event) {
  // ...
}
```

2. **Use type assertions sparingly and safely**

```tsx
// ✅ Correct
const user = response.data as User;

// ❌ Incorrect
const user = response.data as any;
```

3. **Define interfaces for component props using our shared types**

```tsx
// ✅ Correct - leveraging our shared type system
import {
  BaseComponentProps,
  AnimatableComponentProps,
  Intent,
} from "@/lib/ui/types";

interface CardProps extends BaseComponentProps, AnimatableComponentProps {
  title: string;
  description?: string;
  image?: string;
  intent?: Intent;
}

function Card({
  title,
  description,
  image,
  intent = "default",
  ...props
}: CardProps): JSX.Element {
  // ...
}
```

## Testing Components

Use our test utilities for testing components with proper theme and animation context:

```tsx
import { renderWithProviders } from "@/lib/ui/utils/test-utils";
import { screen } from "@testing-library/react";
import { Button } from "@/lib/ui";

test("Button renders correctly", () => {
  // Renders with ThemeProvider and proper animation context
  renderWithProviders(<Button>Test</Button>, {
    motionMode: "reduced", // Test with reduced animations
  });

  expect(screen.getByText("Test")).toBeInTheDocument();
});
```

## ESLint Plugin for Mantine

We have a custom ESLint plugin that checks for deprecated Mantine props and enforces the 'use client' directive. The plugin will warn you if you use any of the legacy props.

### Available Rules

- `mantine/no-deprecated-props`: Warns about deprecated Mantine props
- `mantine/enforce-client-directive`: Enforces 'use client' directive in client components

### Automated Linting and Type Checking

Run these commands before committing:

```bash
# Check TypeScript errors
npm run typecheck

# Run ESLint with standard config
npm run lint

# Run ESLint with our custom TypeScript config
npm run lint-ts

# Run ESLint specifically on Mantine components
npm run lint-mantine

# Automatically fix deprecated Mantine props
npm run fix-mantine-props
```

## Layout Components with Network-Aware Optimizations

Our core layout components (Stack, Grid, Container) include extensive support for network-aware optimizations, which are especially important for the South African market with variable network conditions.

### Network-Aware Container

```tsx
"use client";

import { Container } from "@/lib/ui";

// Network-aware container that adapts to connection quality
<Container
  size="lg"
  intent="section"
  networkAware={true} // Will reduce width and padding on poor connections
  animatePresence={true} // Animation will disable on poor connections
>
  <h2>Page Section</h2>
  <p>Content adapts to network conditions</p>
</Container>;
```

### Network-Aware Grid

```tsx
"use client";

import { Grid } from "@/lib/ui";

// Grid with network-aware responsive behavior
<Grid
  gutter="lg"
  networkAware={true} // Will reduce gutter on poor connections
>
  <Grid.Col
    span={{ xs: 12, sm: 6, md: 4, lg: 3 }}
    networkAware={true} // Will simplify responsive breakpoints on poor connections
  >
    Column content
  </Grid.Col>
  <Grid.Col span={6}>Column content</Grid.Col>
</Grid>;
```

### Network-Aware Alert

```tsx
"use client";

import { Alert } from "@/lib/ui";

// Alert with network-aware optimizations
<Alert
  color="error"
  title="Connection Error"
  variant="light"
  intent="notification"
  networkAware={true} // Will adapt animations and styling for poor connections
>
  The application couldn't connect to the server. Check your network connection
  and try again.
</Alert>;
```

### Network-Aware Form Fields

```tsx
'use client';

import { FormField } from '@/lib/ui';

// Form field with network-aware optimizations
<FormField
  label="Country"
  type="select"
  intent="critical"
  required
  networkAware={true} // Will simplify features on poor connections
  options={[
    { value: 'za', label: 'South Africa' },
    { value: 'us', label: 'United States' }
  ]}
  description="Select your country of residence" // Hidden in data-saver mode
/>

// Textarea with network-aware optimizations
<FormField
  label="Comments"
  type="textarea"
  networkAware={true} // Will disable autosize on poor connections
  description="Enter any additional comments" // Hidden in data-saver mode
/>
```

### South African Market Optimizations

Our components include specific optimizations for the South African market:

1. **Data Saver Mode Detection**: All components detect and adapt to Data Saver mode
2. **Connection Quality Detection**: Optimized for South African carrier networks
3. **Layout Simplification**: Reduces layout complexity on poor connections
4. **Responsive Optimization**: Collapses multi-breakpoint layouts to simpler layouts
5. **Animation Disabling**: Completely disables animations on very slow connections
6. **Token Tracking**: Records which components use network optimizations
7. **Bandwidth-Aware Content**: Adapts content for different connection speeds

## Troubleshooting

If you encounter TypeScript errors related to UI components:

1. Check that you're using the modern prop names (`fw` instead of `weight`, etc.)
2. Ensure you're importing from our UI library (`@/lib/ui`) not directly from Mantine
3. Verify you have added the 'use client' directive if using client components
4. Check if you're using the shared types correctly (`BaseComponentProps`, etc.)
5. Run the fix script: `npm run fix-mantine-props`

For more complex issues, refer to our [TypeScript Guide](./TYPESCRIPT_GUIDE.md) or ask for help in the #frontend-dev Slack channel.

For specific information about optimizations for the South African market, see the [South African Market Optimizations](./docs/sa-market-optimizations.md) guide.
