# ADR-001: Module Boundary Enforcement

## Status

Accepted

## Date

2025-04-09

## Context

As the Fluxori codebase grows in complexity, maintaining clear module boundaries becomes increasingly important for several reasons:

- **Maintainability**: Well-defined boundaries make it easier to understand and maintain the codebase
- **Testability**: Isolated modules are easier to test in isolation
- **Scalability**: Clear boundaries allow different teams to work on different modules without interference
- **Evolvability**: Modules with well-defined interfaces can evolve independently

The codebase currently has several instances of module boundary violations, where one module directly imports from another module's internal implementation rather than using its public API. These violations create tight coupling between modules, making changes more difficult and increasing the risk of introducing bugs.

## Decision

We will enforce strict module boundaries through automated tools and clear guidelines:

1. **Public APIs**: Each module must define a clear public API through its `index.ts` file
2. **No Direct Imports**: Modules must not import directly from other modules' internal files
3. **Dependency-Cruiser Rules**: We will implement rules in dependency-cruiser to detect and prevent boundary violations
4. **ESLint Rules**: We will add ESLint rules to enforce import patterns
5. **CI Validation**: Automated checks will be added to CI/CD pipelines to prevent violations from being merged

### Implementation

We will implement the following rules in `.dependency-cruiser.js`:

```javascript
{
  name: 'no-module-cross-boundaries',
  severity: 'error',
  comment: 'Module boundaries should be respected - import from module\'s public API only',
  from: {
    path: '^src/modules/([^/]+)/(?!.*index\\.ts)'
  },
  to: {
    path: '^src/modules/([^/]+)/(?!.*index\\.ts)',
    pathNot: [
      '^src/modules/$1/.+' // Same module is allowed
    ]
  }
}
```

In addition, we will enforce rules for common utilities:

```javascript
{
  name: 'no-common-utils-cross-boundaries',
  severity: 'error',
  comment: 'Common utilities should be imported through their public API, not directly',
  from: {},
  to: {
    path: '^src/common/(?!index\\.ts)',
    pathNot: [
      '^src/common/[^/]+/index\\.ts$',
      '^src/common/[^/]+$'
    ]
  }
}
```

## Module Dependencies

### Current Module Structure

In our current analysis of the module dependencies, we've found multiple cross-module boundary violations. The diagram below shows module dependencies focusing on the feature-flags and agent-framework modules, which have several boundary violations:

![Current Module Dependencies](visualizations/adr-001-module-boundary-enforcement.svg)

This visualization illustrates several issues:
- Direct imports from one module's internal files to another module
- Bypass of public APIs
- Common utility access violations

Red lines indicate dependency violations, showing where module boundaries are being crossed improperly.

## Boundary Rules

We will enforce the following boundary rules:

1. **Module Public API**: All inter-module dependencies must go through the module's public API
   - Modules must export their public interface through `index.ts`
   - Other modules must only import from these index files

2. **Common Utilities**: Common utilities must be accessed through their public APIs
   - Common utilities should be organized in their own directories
   - Each utility directory should have an index.ts exporting the public API
   - Modules should import from the public API, not from internal implementation files

3. **Circular Dependencies**: Circular dependencies between modules are strictly prohibited

4. **Repository Access Pattern**: Repository access will follow a standard pattern
   - Repositories should only be accessed by services in the same module
   - Cross-module data access should be through service-to-service communication

## Consequences

### Positive

- **Clear Boundaries**: Modules will have well-defined interfaces, making the system easier to understand
- **Reduced Coupling**: Modules will be less tightly coupled, making changes safer
- **Better Documentation**: Public APIs force explicit documentation of what each module provides
- **Easier Refactoring**: Implementation details can be changed without affecting other modules

### Negative

- **Initial Refactoring Effort**: Significant refactoring will be needed to fix existing violations
- **Learning Curve**: Developers will need to learn and follow the new patterns
- **Potential Boilerplate**: Some cases may require additional code to maintain proper boundaries

### Neutral

- **More Explicit Dependencies**: Dependencies between modules will be more explicit, which increases verbosity but improves clarity

## Compliance Validation

Compliance with module boundaries will be validated through:

1. **Automated Checks**:
   - dependency-cruiser validation in CI/CD pipelines
   - ESLint rules to catch violations during development
   - Pre-commit hooks to prevent committing violations

2. **Visualization**:
   - Regularly updated dependency graphs to visualize compliance
   - Highlighted violations in dependency visualizations

3. **Code Review**:
   - Code reviewers will check for proper import patterns
   - Dependency graphs can be generated for PRs to visualize changes

## Alternatives Considered

### 1. Less Strict Boundaries

We considered allowing more flexible boundaries, where modules could import from specific files in other modules rather than only through the public API. This would be more permissive, making it easier to share code between modules. However, this approach would lead to tighter coupling and make it harder to evolve modules independently.

### 2. Monorepo with Multiple Packages

Another alternative was to split the codebase into multiple packages in a monorepo. This would enforce boundaries at the package level through the module system. While this would provide stronger boundary enforcement, it would add complexity to the build process and make it harder to share code.

### 3. Feature-Based Organization

We also considered organizing the code by feature rather than by module type. This would group related code together, potentially making it easier to understand. However, this approach would make it harder to maintain clear boundaries between features, especially as the codebase grows.

## Related Decisions

- [Dependency Management Guide](../dependency-enforcement-guide.md)
- [Repository Pattern](../repository-pattern.md)