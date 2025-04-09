# UI Component Usage Guide

This document provides guidance on how to properly use our UI components to maintain TypeScript compatibility.

## Core Principles

1. **Always use our UI library components** - never use Mantine components directly
2. **Always use the 'use client' directive** in client components 
3. **Always provide explicit types** for props and parameters
4. **Always prefer modern prop names** over legacy ones

## Component Usage

### Text Component

```tsx
import { Text } from '@/lib/ui';

// ✅ Correct usage with modern props
<Text fw={700} fz="xl" ta="center">Hello World</Text>

// ❌ Incorrect usage with legacy props
<Text weight={700} size="xl" align="center">Hello World</Text>
```

### Button Component

```tsx
import { Button } from '@/lib/ui';

// ✅ Correct usage with modern props
<Button leftSection={<Icon />} variant="filled">Click Me</Button>

// ❌ Incorrect usage with legacy props
<Button leftIcon={<Icon />} variant="filled">Click Me</Button>
```

### Stack Component

```tsx
import { Stack } from '@/lib/ui';

// ✅ Correct usage with modern props
<Stack gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// ❌ Incorrect usage with legacy props
<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

### Group Component

```tsx
import { Group } from '@/lib/ui';

// ✅ Correct usage with modern props
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

### Grid Component

```tsx
import { Grid } from '@/lib/ui';

// ✅ Correct usage with modern props
<Grid>
  <Grid.Col span={{ base: 12, md: 6 }}>Content</Grid.Col>
</Grid>

// ❌ Incorrect usage with legacy props
<Grid>
  <Grid.Col md={6}>Content</Grid.Col>
</Grid>
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

3. **Define interfaces for component props**
```tsx
// ✅ Correct
interface CardProps {
  title: string;
  description?: string;
  image?: string;
}

function Card({ title, description, image }: CardProps): JSX.Element {
  // ...
}
```

## Automated Linting and Type Checking

Run these commands before committing:

```bash
# Check TypeScript errors
npm run typecheck

# Lint code
npm run lint
```