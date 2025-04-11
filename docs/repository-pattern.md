# Repository Access Pattern

## Overview

This document describes the standardized pattern for accessing repositories throughout the Fluxori application.

## Common Repository Module

The common repository module provides a unified interface for database access, making it easier to use repositories consistently across the application.

### Usage

```typescript
// Import all needed repository components from the common repository module
import { 
  UnifiedFirestoreRepository,
  equalTo,
  paginatedQuery,
  organizationFilters,
  createRepositoryOptions
} from 'src/common/repositories';

@Injectable()
export class MyRepository extends UnifiedFirestoreRepository<MyEntity> implements OnModuleInit {
  protected readonly logger = new Logger(MyRepository.name);

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'my_collection', createRepositoryOptions({
      enableCache: true,
      cacheTTLMs: 300000, // 5 minutes
      useSoftDeletes: true
    }));
  }

  async findByOrganization(organizationId: string, page = 1, pageSize = 20): Promise<MyEntity[]> {
    return this.find({
      ...paginatedQuery(page, pageSize, 'createdAt', 'desc'),
      advancedFilters: organizationFilters(organizationId)
    });
  }

  async findByName(name: string): Promise<MyEntity | null> {
    const items = await this.find({
      advancedFilters: [equalTo('name', name)]
    });
    return items.length > 0 ? items[0] : null;
  }
}
```

## Key Components

### 1. Base Repository Classes

The `UnifiedFirestoreRepository` is the primary base class for all repositories.

```typescript
export class MyRepository extends UnifiedFirestoreRepository<MyEntity> {
  // Repository methods
}
```

### 2. Query Helpers

Helper functions for creating common query patterns:

```typescript
// Simple equality filter
const filter = equalTo('field', value);

// Greater than filter
const filter = greaterThan('field', value);

// Less than filter
const filter = lessThan('field', value);

// Pagination query
const query = paginatedQuery(page, pageSize, orderBy, direction);

// Organization filters
const filters = organizationFilters(organizationId, additionalFilters);

// Soft-delete filters
const filters = deletedStateFilters(includeDeleted, additionalFilters);
```

### 3. Repository Options

Helper for creating standard repository options:

```typescript
const options = createRepositoryOptions({
  enableCache: true,
  cacheTTLMs: 300000,
  useSoftDeletes: true
});
```

## Best Practices

1. **Always use the common repository module**
   - Import from `src/common/repositories` instead of directly from internal modules
   - This ensures consistent usage and simplifies future refactoring

2. **Use the helper functions**
   - Use the provided helper functions for common operations
   - This improves code readability and ensures consistent patterns

3. **Standardize repository interfaces**
   - Use consistent method names and parameters across repositories
   - Follow the patterns established in the base repository classes

4. **Configure appropriate options**
   - Use appropriate caching settings based on the entity's update frequency
   - Enable soft deletes for most entities that may need recovery
   - Set other options based on the entity's specific requirements

## Common Repository Patterns

### Finding by ID

```typescript
async findById(id: string): Promise<MyEntity | null> {
  return super.findById(id);
}
```

### Finding by Organization

```typescript
async findByOrganization(organizationId: string, page = 1, pageSize = 20): Promise<MyEntity[]> {
  return this.find({
    ...paginatedQuery(page, pageSize),
    advancedFilters: organizationFilters(organizationId)
  });
}
```

### Finding by Field Value

```typescript
async findByField(field: keyof MyEntity, value: any): Promise<MyEntity[]> {
  return this.find({
    advancedFilters: [equalTo(field, value)]
  });
}
```

### Finding Active Items

```typescript
async findActive(): Promise<MyEntity[]> {
  return this.find({
    advancedFilters: [
      equalTo('isActive', true),
      ...deletedStateFilters()
    ]
  });
}
```

### Updating Status

```typescript
async updateStatus(id: string, isActive: boolean): Promise<MyEntity | null> {
  return this.update(id, { isActive });
}
```