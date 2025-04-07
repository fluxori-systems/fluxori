# TypeScript Rebuild Strategy

Since we're in early development with no customer impact, we can take a more aggressive rebuild approach to eliminate TypeScript errors completely.

## Complete Rebuild Strategy

### 1. UI Components Approach

**Option A: Full Mantine v7 Adoption**
- Eliminate all custom compatibility wrappers
- Rewrite components using proper Mantine v7 API
- Update all component usage throughout the codebase

**Option B: Create a Clean UI Layer**
- Create a clean UI component library that properly wraps Mantine
- Rebuild all UI component usage with the new library
- Document the new component API and usage patterns

We recommend Option B as it provides a cleaner abstraction and will make future Mantine upgrades easier.

### 2. Phase-Based Implementation

Rather than trying to fix everything at once, we'll implement the rebuild in focused phases:

**Phase 1: Core UI Components**
- Rebuild Button, Text, Stack, Group
- Update imports in all files
- These components represent ~60% of our type errors

**Phase 2: Layout Components**
- Rebuild Grid, SimpleGrid
- Update imports in all files
- ~20% of our type errors

**Phase 3: Interactive Components**
- Rebuild Tabs, Menu, other interactive components
- Update imports in all files
- ~10% of our type errors

**Phase 4: Data & Utilities**
- Fix Chart.js typing issues
- Fix API client type issues
- Remaining ~10% of errors

### 3. Implementation Approach

For each phase:
1. Create new component implementations with proper types
2. Use automated scripts to update imports and usage
3. Run TypeScript checks to verify progress
4. Document the updated component API

## Execution Plan

### Step 1: Prepare Project Structure

```bash
# Create UI library directory structure
mkdir -p src/lib/ui/components
mkdir -p src/lib/ui/hooks
mkdir -p src/lib/ui/types
mkdir -p src/lib/ui/theme
```

### Step 2: Implement Core Components

Create properly typed versions of all core components:
- Button
- Text
- Stack
- Group
- etc.

Example implementation pattern:
```tsx
import { Button as MantineButton } from '@mantine/core';
import { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ButtonProps extends ComponentPropsWithoutRef<typeof MantineButton> {
  children?: ReactNode;
}

export function Button(props: ButtonProps) {
  return <MantineButton {...props} />;
}
```

### Step 3: Update Imports and Usage

Use an automated script to:
1. Replace all Mantine imports with our UI library imports
2. Update any prop usage to match the new API

### Step 4: Clean Up and Document

1. Remove old component implementations
2. Document new component API
3. Verify all TypeScript errors are resolved

## Timeline

- Phase 1: 1 day
- Phase 2: 1 day
- Phase 3: 1 day
- Phase 4: 1 day

Total: 4 days to completely eliminate TypeScript errors

## Future-Proofing

This approach provides several long-term benefits:
1. Clean abstraction over Mantine UI
2. Proper TypeScript support
3. Easier future upgrades
4. Consistent component API across the application
5. Improved developer experience with fewer type errors