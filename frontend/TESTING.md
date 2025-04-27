# Testing Guidelines for Fluxori Frontend

This document provides guidance on testing React components in the Fluxori frontend, particularly focusing on our transition from Jest to Vitest.

## Testing Framework

We use Vitest as our primary testing framework, along with React Testing Library for component testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Directory Structure

```
src/
  testing/            # Core testing utilities
    augmentations/    # TypeScript type augmentations
    config/           # Vitest configuration
    mocks/            # Shared mock implementations
    types/            # TypeScript declarations
    utils/            # Testing utility functions
  lib/
    ui/
      components/
        __tests__/    # Component tests
  components/
    south-african/
      __tests__/      # South African market component tests
```

## Testing Utilities

### Rendering Components

Use the `renderWithProviders` utility to ensure components have access to all necessary contexts:

```tsx
import { renderWithProviders } from "../../../testing/utils/render";

test("renders component", () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText("Hello")).toBeInTheDocument();
});
```

### Network Testing

For components that adapt to network conditions, use the network testing utilities:

```tsx
import { setupNetworkConditions } from "../../../testing/utils/networkTesting";

test("optimizes for slow networks", () => {
  const { cleanup } = setupNetworkConditions({
    preset: "POOR", // Preset for South African rural networks
  });

  try {
    // Test component with poor network conditions
    const { getByTestId } = renderWithProviders(<NetworkAwareComponent />);
    expect(getByTestId("component")).toHaveAttribute("data-optimized", "true");
  } finally {
    cleanup(); // Always clean up network mocks
  }
});
```

## Testing React Components with Hooks

### The Problem with Hooks in Tests

React hooks like `useState` and `useEffect` can only be called from React component functions, not in regular functions or outside the component body. This poses challenges in testing.

### Solution: Component Mocking

For components that use hooks, create simplified mock implementations:

```tsx
// GOOD: Mock at the module level with a simplified implementation
vi.mock("../Component", () => ({
  Component: (props) => (
    <div data-testid="mocked-component" {...props}>
      {props.children}
    </div>
  ),
}));

// Then import the mocked component
import { Component } from "../Component";
```

### Simplified Network-Aware Testing

For components that adapt to network conditions:

```tsx
// Mock a component with network awareness
vi.mock("../NetworkAwareComponent", () => ({
  NetworkAwareComponent: (props) => {
    // Check connection quality
    const connection = navigator.connection || {};
    const isSlowConnection = (connection.downlink || 10) < 2;

    // Return simplified component with appropriate attributes
    return (
      <div
        data-testid="network-component"
        data-optimized={isSlowConnection ? "true" : undefined}
        {...props}
      >
        {props.children}
      </div>
    );
  },
}));
```

## Test File Structure

Each test file should follow this structure:

```tsx
"use client"; // Required for React component tests

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { renderWithProviders } from "../../../../testing/utils/render";

// Mock component if it uses hooks
vi.mock("../ComponentName", () => ({
  ComponentName: (props) => {
    // Simplified implementation
    return <div {...props}>{props.children}</div>;
  },
}));

// Import component after mocking
import { ComponentName } from "../ComponentName";

describe("ComponentName", () => {
  test("basic functionality", () => {
    // Test implementation
  });

  // Additional test cases...
});
```

## South African Market Testing

Components optimized for the South African market have special testing considerations:

1. Test with different network quality presets (HIGH, MEDIUM, LOW, POOR)
2. Test with data saver mode enabled and disabled
3. Verify that appropriate optimizations are applied for poor connections

## Best Practices

1. Add `'use client';` at the top of component test files
2. Mock components at the module level before importing them
3. Use `data-testid` attributes for test-specific element selection
4. Test network-aware components with different connection qualities
5. Clean up any global mocks after tests
6. Use type-safe mocks and assertions
7. Focus on testing behavior rather than implementation details

## TypeScript Compliance

All tests should be TypeScript compliant. We've created TypeScript augmentations for:

1. Vitest mocks and assertions
2. React Testing Library functions
3. Browser APIs like NetworkInformation

If you encounter type errors, check the `src/testing/augmentations` and `src/testing/types` directories for helpers.
