# Fluxori Frontend Style Guide

## TypeScript and Mantine UI Best Practices

This style guide ensures consistent, type-safe code across the Fluxori frontend codebase, with special emphasis on Mantine UI components and Next.js app router conventions.

## Mantine UI Props

### Use Modern Property Names

| ❌ Deprecated | ✅ Modern | Component |
|--------------|-----------|-----------|
| `color` | `c` | Text, Title, Badge, etc. |
| `weight` | `fw` | Text, Title, etc. |
| `align` | `ta` | Text, Title, Stack, etc. |
| `spacing` | `gap` | Group, Stack, etc. |
| `position` | `justify` | Group, etc. |
| `leftIcon` | `leftSection` | Button, etc. |
| `rightIcon` | `rightSection` | Button, etc. |
| `breakpoint` | *removed* | Stepper, etc. |

### Grid Sizing

Use the responsive object syntax for Grid columns:

```tsx
// ❌ Deprecated
<Grid.Col md={8}>

// ✅ Modern
<Grid.Col span={{ base: 12, md: 8 }}>
```

## Next.js Client Components

### Always Add 'use client' Directive

Add the 'use client' directive to any component that:
- Uses React hooks like useState, useEffect, useRef, etc.
- Uses Next.js hooks like useRouter, useSearchParams, etc.
- Contains event handlers (onClick, onChange, etc.)
- Uses browser APIs

```tsx
// ✅ Correct
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Wrap useSearchParams in Suspense

Always wrap components using `useSearchParams()` in a Suspense boundary:

```tsx
// ✅ Correct
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  return <div>Search results for: {query}</div>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
```

## Type Safety

### Use TypeScript Generic Typing

```tsx
// ✅ Correct
interface DataItem {
  id: string;
  name: string;
}

function List<T extends DataItem>({ items }: { items: T[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Import UI Components from Our UI Library

```tsx
// ❌ Incorrect
import { Text, Button } from '@mantine/core';

// ✅ Correct
import { Text, Button } from '@/lib/ui-components';
```

## Code Organization

### Component Structure

```tsx
// Imports
import { useState } from 'react';
import { Text, Button } from '@/lib/ui-components';
import { YourType } from '@/types';

// Component interfaces/types
interface YourComponentProps {
  title: string;
  items: YourType[];
}

// Component
export default function YourComponent({ title, items }: YourComponentProps) {
  // Hooks
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper functions
  const handleToggle = () => setIsOpen(!isOpen);
  
  // JSX
  return (
    <div>
      <Text fw={700}>{title}</Text>
      <Button onClick={handleToggle}>Toggle</Button>
    </div>
  );
}
```

## Pre-commit Checks

Your code will be automatically checked on commit for:
- TypeScript errors
- ESLint warnings and errors, including:
  - Deprecated Mantine props
  - Missing 'use client' directives
- Formatting issues

## Using Our UI Components

We provide a set of pre-typed components that enforce the correct Mantine props:

```tsx
import { 
  Text, 
  Group, 
  Stack, 
  Button 
} from '@/lib/ui-components';

// These components are guaranteed to have the correct prop types
```