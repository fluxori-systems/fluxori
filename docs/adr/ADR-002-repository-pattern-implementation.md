# ADR-002: Repository Pattern Implementation

## Status

Accepted

## Date

2025-04-09

## Context

As our application scales, we need a consistent, testable, and maintainable approach to data access. The Fluxori platform uses Firestore as its primary data store, but we want to abstract the data access layer to:

1. Make it easier to swap the underlying data store in the future if needed
2. Centralize data validation, conversion, and business rules
3. Facilitate testing by allowing repository mocking
4. Provide consistent error handling and retry logic

We've already started implementing repositories across different modules, but inconsistencies in implementation have led to code duplication, varying approaches to caching and validation, and difficulties in testing.

## Decision

We will implement a unified repository pattern with the following characteristics:

1. **Base Repository Class**: Create a unified base repository class that handles common functionality like CRUD operations, caching, and validation
2. **Module-Specific Repositories**: Each module defines its own repositories that extend the base repository
3. **Repository Registration**: Repositories are registered with NestJS's dependency injection system
4. **Type-Safe APIs**: All repositories use TypeScript interfaces for strong typing
5. **Data Validation**: Validation rules are defined at the repository level
6. **Caching Strategy**: Consistent caching approach across all repositories
7. **Transaction Support**: Support for atomic operations across multiple documents

### Implementation

We will implement the following structure:

```typescript
// Base repository interface
export interface BaseRepository<T, K> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<void>;
  // Additional methods for transactions, caching, etc.
}

// Unified Firestore implementation
export class FirestoreBaseRepository<T, K> implements BaseRepository<T, K> {
  // Implementation of base methods
}

// Module-specific repository
@Injectable()
export class ProductRepository extends FirestoreBaseRepository<
  Product,
  string
> {
  constructor() {
    super("products");
  }

  // Additional product-specific methods
}
```

Each module will expose its repositories as part of its public API, allowing other modules to consume data through services that use these repositories.

## Module Dependencies

### Current Repository Structure

The current repository structure shows inconsistent implementation patterns:

![Repository Dependencies](visualizations/adr-002-repository-pattern-implementation.svg)

The visualization highlights:

- Inconsistent inheritance patterns
- Direct access to database services rather than through repositories
- Missing repository implementations in some modules
- Direct cross-module repository access

### Proposed Repository Structure

The proposed structure will follow a consistent pattern:

1. Common base repository classes in `src/common/repositories`
2. Module-specific repositories in each module's `repositories` directory
3. Clear public APIs for accessing repositories in other modules

## Boundary Rules

To ensure proper implementation of the repository pattern, we will enforce the following rules:

```javascript
{
  name: "repository-access-pattern",
  severity: "error",
  comment: "Repositories should only be accessed by services in the same module",
  from: {
    path: "^src/modules/([^/]+)/(?!repositories/)"
  },
  to: {
    path: "^src/modules/([^/]+)/repositories/",
    pathNot: [
      "^src/modules/$1/repositories/" // Same module is allowed
    ]
  }
}
```

Additional rules:

1. All repositories must extend the base repository classes
2. Repositories must be properly typed with entity interfaces
3. Services, not controllers, should access repositories
4. Cross-module data access should happen through service-to-service communication

## Consequences

### Positive

- **Consistency**: All data access follows the same patterns
- **Testability**: Easy to mock repositories for unit testing
- **Maintainability**: Common functionality is centralized
- **Performance**: Consistent caching and optimization strategies
- **Type Safety**: Strong typing for all data operations

### Negative

- **Learning Curve**: Developers need to understand the repository pattern
- **Migration Effort**: Existing code needs to be migrated to the new pattern
- **Potential Overhead**: Additional abstractions may add minimal overhead

### Neutral

- **Increased Verbosity**: The pattern requires more files and clearer separation, which can increase the codebase size but improves maintainability

## Compliance Validation

Compliance will be validated through:

1. **Automated Analysis**:

   - ESLint rules to enforce repository pattern usage
   - Dependency-cruiser rules to prevent improper dependencies
   - TypeScript interfaces to ensure type compliance

2. **Code Review**:

   - Code reviewers will check for proper repository pattern usage
   - Repository implementations will be reviewed for consistency

3. **Testing**:
   - Unit tests will verify repository behavior
   - Integration tests will check end-to-end flows

## Alternatives Considered

### 1. Direct Database Access

We considered allowing direct access to the database through service-level abstractions without formal repositories. This would be simpler but would lead to inconsistencies, code duplication, and tighter coupling to the database.

### 2. ORM-Based Approach

An ORM-like approach was considered, where entities map directly to database structures. While this provides more automatic functionality, it wouldn't be as well-suited to NoSQL databases like Firestore and would limit our flexibility.

### 3. Microservice Data Access

We considered implementing a data access microservice that centralizes all database operations. This would provide strong encapsulation but would add complexity and potential performance issues with additional network calls.

## Related Decisions

- [ADR-001: Module Boundary Enforcement](ADR-001-module-boundary-enforcement.md)
- [Repository Pattern Documentation](../repository-pattern.md)
