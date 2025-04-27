# Dependency Inversion Implementation Plan

## Overview

This document outlines the plan to rebuild the dependencies between the UI and Motion modules to implement proper dependency inversion. Since the project is in early development without live customers, we can take a more direct approach to fix the circular dependencies.

## Current State Analysis

1. **Shared Module Structure**

   - A proper `/lib/shared` directory already exists with interfaces and providers
   - Service interfaces for animation and connection services exist
   - Service registry and provider implementations are in place

2. **Circular Dependencies**
   - UI components directly import from Motion module
   - Motion services may reference UI types or components
   - Component hooks in UI module import directly from Motion

## Implementation Plan

### Phase 1: Complete Shared Module Structure

1. Create index.ts files in each shared subdirectory for proper exports
2. Ensure all shared types are properly defined and exported
3. Add any missing service interfaces

### Phase 2: Implement Service Implementations

1. Create proper implementation of ConnectionService in Motion module
2. Create proper implementation of AnimationService in Motion module
3. Ensure proper registration of services at app startup

### Phase 3: Update Module Entry Points

1. Update UI index.ts to avoid direct imports from Motion
2. Update Motion index.ts to avoid direct imports from UI
3. Make all cross-module references go through shared interfaces

### Phase 4: Update Component Implementation

For each UI component:

1. Remove direct imports from Motion module
2. Use shared interfaces and service hooks instead
3. Implement South African market optimizations
4. Ensure TypeScript compliance

### Phase 5: Update Motion Framework

1. Remove any direct imports from UI module
2. Implement services that fulfill the shared interfaces
3. Ensure proper performance monitoring

### Phase 6: Testing and Validation

1. Implement comprehensive tests for the dependency structure
2. Validate that no circular dependencies exist
3. Test South African market optimizations
4. Verify TypeScript compliance

## Implementation Details

### UI Component Refactoring Pattern

For each UI component:

```typescript
// BEFORE: Direct imports from Motion
import { useMotion } from "../../motion/context/MotionContext";
import { useConnectionQuality } from "../../motion/hooks/useConnectionQuality";

// AFTER: Imports from shared module or UI hooks
import { useConnectionQuality, useNetworkAware } from "../hooks/useConnection";
import { useSouthAfricanMarketOptimizations } from "../../shared/hooks/useSouthAfricanMarketOptimizations";
```

### Service Implementation Pattern

```typescript
// In Motion module implementing the shared interface
import {
  IConnectionService,
  ConnectionQualityResult,
} from "../../shared/services/connection-service.interface";
import { registerConnectionService } from "../../shared/services/service-registry";

export class ConnectionServiceImpl implements IConnectionService {
  // Implementation...
}

// Export default instance
export const defaultConnectionService = new ConnectionServiceImpl();

// Register service at module initialization
registerConnectionService(defaultConnectionService);
```

### App Initialization

```typescript
// In app provider
import { ServiceProvider } from '../lib/shared/providers/service-provider';
import { defaultAnimationService } from '../lib/motion/services/animation-service.impl';
import { defaultConnectionService } from '../lib/motion/services/connection-service.impl';

export function AppProvider({ children }) {
  return (
    <ServiceProvider
      animationService={defaultAnimationService}
      connectionService={defaultConnectionService}
    >
      {children}
    </ServiceProvider>
  );
}
```

## File Structure Changes

New files to create:

- `/lib/motion/services/animation-service.impl.ts`
- `/lib/motion/services/connection-service.impl.ts`
- `/lib/shared/types/index.ts`
- `/lib/shared/services/index.ts`
- `/lib/shared/utils/index.ts`
- `/lib/shared/hooks/index.ts`

Files to update:

- All UI components that import directly from Motion module
- Any Motion components that import directly from UI module
- Module index.ts files

## Timeline

1. Phase 1: 1 day
2. Phase 2: 1 day
3. Phase 3: 1 day
4. Phase 4: 3-5 days (depending on number of components)
5. Phase 5: 1-2 days
6. Phase 6: 1-2 days

Total: 7-12 days
