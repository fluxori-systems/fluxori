# Dependency Management Enforcement Guide

## Overview

This guide provides instructions on how dependency management is enforced in the Fluxori project, including tools, configurations, and best practices.

## Tools and Configuration

### 1. Dependency Cruiser

Dependency-cruiser is used to analyze and validate module dependencies:

- **Configuration**: `.dependency-cruiser.js` in both backend and frontend
- **Validation Rules**: 
  - No circular dependencies
  - No cross-module dependencies except through public APIs
  - No direct imports from common utilities
  - Proper layering of components

### 2. ESLint Rules

ESLint enforces module boundaries and import patterns:

- **Configuration**: `.eslintrc.js` (backend) and `.eslintrc.json` (frontend)
- **Rules**:
  - `import/order`: Consistent import ordering
  - `import/no-cycle`: No circular dependencies
  - `import/no-restricted-paths`: Restrictions on importing from certain directories
  - `boundaries/element-types`: Controls which types of modules can import from others
  - `boundaries/dependency-type`: Defines module types and their allowed dependencies

### 3. Pre-commit Hooks

Husky and lint-staged are configured to run dependency checks before commits:

- **Configuration**: `.lintstagedrc.js` and `.husky/pre-commit`
- **Checks**:
  - ESLint validation
  - TypeScript type checking
  - Circular dependency detection
  - Module boundary validation

### 4. GitHub Workflow

A GitHub workflow automatically validates dependencies on PRs and pushes:

- **Configuration**: `.github/workflows/dependency-checks.yml`
- **Actions**:
  - Checks for circular dependencies
  - Validates module boundaries
  - Generates dependency visualizations
  - Creates issues for violations

## Module Structure

### Public API Pattern

Every module should expose a clear public API through an index.ts file:

```typescript
// src/modules/example/index.ts
export { ExampleModule } from './example.module';
export { ExampleService } from './services/example.service';
// ... other exports
```

Components not exported in the index.ts file are considered private to the module.

### Common Utility Access

Common utilities should be accessed through their public APIs:

```typescript
// GOOD: Import from the public API
import { UnifiedFirestoreRepository } from 'src/common/repositories';

// BAD: Import directly from internal implementations
import { UnifiedFirestoreRepository } from 'src/common/repositories/unified-firestore.repository';
```

### Auth Pattern

Authentication components should be accessed through the common auth module:

```typescript
// GOOD: Import from common auth
import { FirebaseAuthGuard, GetUser } from 'src/common/auth';

// BAD: Import directly from auth module
import { FirebaseAuthGuard } from 'src/modules/auth/guards/firebase-auth.guard';
```

## Best Practices

### 1. Use Absolute Imports

Always use absolute imports from the src root:

```typescript
// GOOD
import { SomeService } from 'src/modules/some-module';

// BAD
import { SomeService } from '../../some-module/services/some.service';
```

### 2. Export Carefully

Be selective about what you export from your module's public API:

- Export only what other modules actually need
- Don't export implementation details
- Use named exports for clarity

### 3. Check Dependencies Regularly

Run dependency checks regularly:

```bash
# Validate dependencies
npm run deps:validate

# Check for circular dependencies
npm run deps:circular

# Generate visualizations
npm run deps:graph
```

### 4. Follow the Dependency Flow

Remember the proper dependency flow:

- Controllers depend on Services
- Services depend on Repositories
- Repositories depend on infrastructure
- All depend on shared utilities

### 5. Address Violations Promptly

When a dependency violation is detected:

1. Understand why it's a violation
2. Consider if the dependency is necessary
3. Find the proper way to implement the dependency
4. Update the code to follow the correct pattern
5. Verify the fix with dependency validation

## Enforcing in Code Reviews

When reviewing code, check for:

1. Proper use of public APIs
2. No direct imports from other modules
3. No circular dependencies
4. Appropriate module boundaries
5. Proper use of common patterns

## Additional Resources

- [Auth Pattern Documentation](./auth-pattern.md)
- [Repository Pattern Documentation](./repository-pattern.md)
- [Module Documentation Templates](./modules/templates/module-documentation.md)