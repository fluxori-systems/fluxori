# Breaking Circular Dependencies: Developer Guide

## Problem Statement

We've identified circular dependencies between the UI and Motion modules in our codebase. These circular dependencies make the codebase harder to maintain, can lead to unexpected behavior, and create challenges for building and testing.

## Solution: Dependency Inversion

We've implemented a solution based on the Dependency Inversion Principle (the 'D' in SOLID). This approach:

1. Extracts shared types to a common module
2. Creates abstract interfaces for services
3. Uses a service registry for implementation management
4. Applies dependency injection through React context

## Folder Structure

```
src/lib/
├── shared/              # Shared code that both UI and Motion can depend on
│   ├── providers/       # Context providers for service injection
│   ├── services/        # Service interfaces and registry
│   └── types/           # Shared type definitions
├── motion/              # Motion implementation (depends on shared)
└── ui/                  # UI components (depends on shared)
```

## Implementation Details

### 1. Shared Types

We've extracted common types to `src/lib/shared/types/motion-types.ts`:
- `ConnectionQuality`
- `AnimationMode`
- `AnimationParams`
- etc.

### 2. Service Interfaces

We've defined abstract service interfaces:
- `IConnectionService` for network-aware functionality
- `IAnimationService` for animation capabilities

### 3. Service Registry

The service registry pattern allows us to:
- Register service implementations at app startup
- Retrieve service implementations when needed
- Avoid direct dependencies between modules

### 4. Service Provider

The service provider gives components access to services through React context:
- `ServiceProvider` component that injects services
- `useXxxService()` hooks to access services

## How to Use

### Accessing Services in Components

```tsx
import { useConnectionQuality } from '@/lib/shared/services/connection-service.interface';

function MyComponent() {
  // Get connection quality information
  const { quality, isDataSaver } = useConnectionQuality();
  
  // Adapt component based on connection
  if (isDataSaver || quality === 'poor') {
    return <SimplifiedVersion />;
  }
  
  return <FullVersion />;
}
```

### Animating Components

```tsx
import { useComponentAnimation } from '@/lib/shared/services/animation-service.interface';

function MyButton({ isActive }) {
  const buttonRef = useRef(null);
  
  // Apply animation with network-aware optimizations
  useComponentAnimation({
    ref: buttonRef,
    mode: 'hover',
    isActive,
    networkAware: true
  });
  
  return (
    <button ref={buttonRef}>
      Click Me
    </button>
  );
}
```

## Benefits

- **No circular dependencies**: UI and Motion modules depend only on the shared module
- **Loose coupling**: Modules communicate through abstractions, not concrete implementations
- **Testability**: Services can be easily mocked for testing
- **Flexibility**: Different implementations can be provided based on environment
- **Clear boundaries**: Module responsibilities are clearly defined

## Migration Guide

1. **For UI components**:
   - Import from `@/lib/shared/...` instead of `@/lib/motion/...`
   - Use the service hooks instead of direct imports

2. **For Motion features**:
   - Implement the service interfaces
   - Register implementations at app startup
   - Avoid direct imports from UI modules

## Technical Debt Addressed

This refactoring addresses these technical debt issues:
- Circular dependencies between UI and Motion modules
- Tight coupling between components and animations
- Difficulty in testing animation and network-aware behavior
- Unclear module boundaries and responsibilities

## Future Development

- Add more service interfaces as needed
- Create mock implementations for testing
- Consider adding a service locator for non-React code
