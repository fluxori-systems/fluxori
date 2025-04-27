# Dependency Inversion Pattern Implementation

## Overview

This document describes how dependency inversion pattern is implemented in the Fluxori frontend application to prevent circular dependencies between UI and Motion modules.

## Problem Statement

The UI components needed features from the Motion module, and the Motion module needed features from the UI components, creating a circular dependency. This can lead to:

1. Build-time errors
2. Runtime issues
3. Code that is hard to maintain and refactor
4. Inability to properly test components in isolation

## Solution: Dependency Inversion Pattern

We implemented the Dependency Inversion Principle, which states:

- High-level modules should not depend on low-level modules. Both should depend on abstractions.
- Abstractions should not depend on details. Details should depend on abstractions.

### Implementation Architecture

1. **Shared Module**

   - Contains interfaces, types, and utilities used by both UI and Motion modules
   - Acts as the contract that both modules adhere to
   - Houses the service registry and provider implementations

2. **Service Registry**

   - A central registry for storing and retrieving service implementations
   - Allows runtime lookup instead of compile-time dependencies
   - Implemented in `shared/services/service-registry.ts`

3. **Service Interfaces**

   - Defines the contract for services like animation and connection quality
   - Located in `shared/services/*.interface.ts`
   - Enables both UI and Motion to depend on abstractions instead of implementations

4. **Service Implementations**

   - Motion module provides concrete implementations of the service interfaces
   - These are registered with the Service Registry at application startup
   - Located in `motion/services/*.impl.ts`

5. **Service Provider**

   - React context provider that makes services available to components
   - Acts as a facade for accessing services
   - Located in `shared/providers/service-provider.tsx`

6. **South African Market Optimizations**
   - Market-specific optimizations are implemented in the shared module
   - Both UI and Motion can access these optimizations
   - Located in `shared/hooks/useSouthAfricanMarketOptimizations.ts`

## Usage Examples

### Accessing Connection Quality in UI Components

**Before:**

```typescript
import { useConnectionQuality } from "../../motion/hooks/useConnectionQuality";

function MyComponent() {
  const { quality, isDataSaver } = useConnectionQuality();
  // ...
}
```

**After:**

```typescript
import { useConnectionQuality } from "../hooks/useConnection";

function MyComponent() {
  const { quality, isDataSaver } = useConnectionQuality();
  // ...
}
```

### Accessing Animation Services in UI Components

**Before:**

```typescript
import { useGSAPAnimation } from "../../motion/hooks/useGSAPAnimation";

function MyComponent() {
  const { animate } = useGSAPAnimation();
  // ...
}
```

**After:**

```typescript
import { useAnimationService } from "../../shared/services";

function MyComponent() {
  const animationService = useAnimationService();
  // ...
}
```

## Application Startup Process

1. The main `AppProvider` component wraps the application
2. It imports the service implementations from the Motion module
3. Service implementations are registered with the Service Registry
4. The ServiceProvider component provides access to these services via React Context
5. Components can access these services through hooks like `useConnectionQuality`

## Benefits

1. **No Circular Dependencies**: UI and Motion modules only depend on shared abstractions
2. **Testability**: Components can be tested with mock service implementations
3. **Flexibility**: Implementations can be changed without affecting components
4. **South African Market Optimizations**: Consistent optimizations across all components
5. **Performance**: Network-aware rendering across all components

## Validation

A validation script (`scripts/validate-dependencies.js`) checks for any remaining circular dependencies. Run it with:

```bash
node scripts/validate-dependencies.js
```

## Contributing

When creating new components or services:

1. Define interfaces in the shared module
2. Implement services in the appropriate module
3. Register services with the Service Registry
4. Access services through the shared hooks
5. Never import directly between UI and Motion modules
