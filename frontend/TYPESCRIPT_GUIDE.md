# TypeScript Best Practices Guide

This guide outlines the TypeScript best practices to follow for the Fluxori frontend codebase. Following these guidelines will help prevent the accumulation of TypeScript errors.

## Table of Contents

1. [Type Safety Principles](#type-safety-principles)
2. [UI Component Usage](#ui-component-usage)
3. [State Management](#state-management)
4. [API Calls](#api-calls)
5. [Common TypeScript Errors](#common-typescript-errors)
6. [Validation Tools](#validation-tools)

## Type Safety Principles

### Use Explicit Types

Always define explicit types for variables, parameters, and return values:

```tsx
// ❌ Bad - implicit typing
const getUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// ✅ Good - explicit typing
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<User>;
};
```

### Avoid Type Assertions Where Possible

Type assertions (using `as`) bypass TypeScript's type checking. Use them sparingly:

```tsx
// ❌ Bad - overusing type assertions
const user = data as User;
const element = event.target as HTMLInputElement;
const config = JSON.parse(text) as Config;

// ✅ Good - use type guards instead
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' && 
    data !== null && 
    'id' in data && 
    'name' in data
  );
}

if (isUser(data)) {
  // data is typed as User here
}

// For DOM elements, check before asserting
if (event.target instanceof HTMLInputElement) {
  const value = event.target.value;
}
```

### Never Use `any`

Avoid using `any` type as it undermines TypeScript's type safety:

```tsx
// ❌ Bad - using any
function processData(data: any) {
  return data.map(item => item.value);
}

// ✅ Good - use generics or specific types
interface DataItem {
  value: string;
}

function processData<T extends DataItem>(data: T[]) {
  return data.map(item => item.value);
}
```

### Create Type Definitions for API Responses

Define interfaces for all API responses:

```tsx
// Define in a types file
export interface ApiResponse<T> {
  data: T;
  meta: {
    totalCount: number;
    page: number;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

// Use in API calls
async function getProducts(): Promise<ApiResponse<Product[]>> {
  const response = await fetch('/api/products');
  return response.json();
}
```

## UI Component Usage

### Use Our UI Components Library

Always use components from our UI library instead of importing directly from Mantine:

```tsx
// ❌ Bad - importing directly from Mantine
import { Button } from '@mantine/core';

// ✅ Good - using our UI library
import { Button } from '@/lib/ui';
```

### Use Modern Mantine Props

Use the modern Mantine prop naming conventions:

| Modern Prop | Legacy Prop (Don't Use) |
|-------------|-------------------------|
| `fw` | `weight` |
| `ta` | `align` |
| `gap` | `spacing` |
| `justify` | `position` |
| `leftSection` | `leftIcon` |
| `rightSection` | `rightIcon` |
| `c` | `color` |

```tsx
// ❌ Bad - using legacy props
<Text weight={700} align="center" color="blue">Hello</Text>
<Stack spacing="md">...</Stack>
<Group position="apart">...</Group>

// ✅ Good - using modern props
<Text fw={700} ta="center" c="blue">Hello</Text>
<Stack gap="md">...</Stack>
<Group justify="space-between">...</Group>
```

### Always Add 'use client' Directive

Add the 'use client' directive to all client components (components that use hooks, event handlers, etc.):

```tsx
// ✅ Good - add 'use client' at the top of the file
'use client';

import { useState } from 'react';
import { Button } from '@/lib/ui';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  );
}
```

### Define Interface for Component Props

Always create an interface or type for your component props:

```tsx
// ✅ Good - define props interface
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  onClick?: () => void;
}

export function Card({ title, description, image, onClick }: CardProps) {
  return (
    <div onClick={onClick}>
      {image && <img src={image} alt={title} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
```

## State Management

### Type Your React Hooks

Always provide type parameters to React hooks:

```tsx
// ❌ Bad - untyped useState
const [user, setUser] = useState();

// ✅ Good - typed useState
interface User {
  id: string;
  name: string;
}

const [user, setUser] = useState<User | null>(null);
```

### Context API Typing

Properly type your Context providers and consumers:

```tsx
// ✅ Good - typed context
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## API Calls

### Type Your API Function Parameters

Ensure API function parameters have explicit types:

```tsx
// ❌ Bad - untyped parameters
const fetchOrders = async (page, perPage, status) => {
  // ...
};

// ✅ Good - typed parameters
interface OrderQueryParams {
  page: number;
  perPage: number;
  status?: 'pending' | 'completed' | 'cancelled';
}

const fetchOrders = async (params: OrderQueryParams): Promise<Order[]> => {
  // ...
};
```

### Use Generic API Client Methods

Create generic API methods with proper typing:

```tsx
// ✅ Good - generic API methods
export const api = {
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    return response.json();
  },
  
  post: async <T, D = any>(url: string, data: D): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// Usage
interface Product {
  id: string;
  name: string;
  price: number;
}

const products = await api.get<Product[]>('/products', { category: 'electronics' });
```

## Common TypeScript Errors

### TS2322: Type Assignment Errors

This error occurs when you're trying to assign a value to a variable of an incompatible type:

```tsx
// ❌ Error TS2322
const user: User = { name: 'John' }; // Missing required properties

// ✅ Fix
const user: User = { id: '123', name: 'John', email: 'john@example.com' };
// Or use optional properties in the interface
interface User {
  id: string;
  name: string;
  email?: string; // Optional property
}
```

### TS7006: Implicit Any Parameter Type

This error occurs when function parameters don't have an explicit type:

```tsx
// ❌ Error TS7006
function handleChange(event) {
  // ...
}

// ✅ Fix
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  // ...
}
```

### TS2345: Argument Type Mismatch

This error occurs when passing an argument of the wrong type to a function:

```tsx
// ❌ Error TS2345
functionThatExpectsNumber('42'); // Passing string, expected number

// ✅ Fix
functionThatExpectsNumber(42); // Pass the correct type
// Or convert the type
functionThatExpectsNumber(parseInt('42', 10));
```

### TS2305, TS2339: Missing Properties/Exports

These errors occur when trying to access properties or imports that don't exist:

```tsx
// ❌ Error TS2339
console.log(user.address); // Property 'address' does not exist on type 'User'

// ✅ Fix - check if property exists first
if ('address' in user) {
  console.log(user.address);
}
// Or update the interface to include the property
interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
}
```

## Validation Tools

We have several tools to help you maintain TypeScript correctness:

### TypeScript Compiler

Run the TypeScript compiler to check for errors:

```bash
npm run typecheck        # Check once
npm run typecheck:watch  # Watch for changes
```

### ESLint with TypeScript Rules

Run ESLint with our TypeScript rules:

```bash
npm run lint-ts
```

### TypeScript Error Report

Generate a report of TypeScript errors:

```bash
npm run ts-error-report
```

### Pre-Commit Hooks

Our pre-commit hooks automatically check for TypeScript errors before allowing commits.

### CI/CD Pipeline

The CI/CD pipeline runs TypeScript validation on all pull requests, preventing TypeScript errors from being merged into the main branch.