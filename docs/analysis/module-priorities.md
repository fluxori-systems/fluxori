# Module Refactoring Priorities

## High Priority

- **Agent Framework Module**

  - Foundation for all AI agent interactions
  - Imported by multiple modules
  - Has direct dependencies on feature-flags module
  - Contains boundary violations in controller (auth imports)

- **Feature Flags Module**
  - Core infrastructure module used throughout the application
  - Enables/disables features dynamically
  - Has direct dependencies on auth module
  - Contains boundary violations in controllers

## Medium Priority

- **Auth Module**

  - Provides authentication and authorization
  - Many modules depend on it directly
  - Need to create proper public interfaces
  - Standardize how other modules access auth functionality

- **Common Repositories**
  - Base repositories used throughout the application
  - Needs proper public interfaces
  - Has internal cross-boundary violations
  - Used directly by many modules

## Low Priority

- **Inventory Module**

  - Product and stock management
  - Contains boundary violations but less critical
  - Refactor after high/medium priority modules

- **Marketplaces Module**
  - Integration with external marketplaces
  - Contains boundary violations but less critical
  - Refactor after high/medium priority modules

## Dependencies Between Modules

(To be populated from full dependency analysis)

## Initial Patterns to Implement

### 1. Authentication Access Pattern

Create a standard way for modules to use authentication:

```typescript
// Instead of direct imports from auth module:
// import { FirebaseAuthGuard } from 'src/modules/auth/guards/firebase-auth.guard';

// Create proxy in each module or use a common pattern:
import { AuthUtils } from "src/common/auth";
// or
import { Auth } from "src/modules/auth";
```

### 2. Common Repository Access Pattern

Standardize repository imports:

```typescript
// Instead of:
// import { UnifiedFirestoreRepository } from 'src/common/repositories/unified-firestore.repository';

// Use:
import { Repositories } from "src/common/repositories";
```

### 3. Feature Flag Access Pattern

Create standard feature flag access:

```typescript
// Instead of:
// import { FeatureFlagService } from 'src/modules/feature-flags/services/feature-flag.service';

// Use:
import { FeatureFlags } from "src/modules/feature-flags";
```
