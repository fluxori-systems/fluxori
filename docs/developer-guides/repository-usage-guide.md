# Repository Usage Guide

This guide provides best practices for implementing and using repositories in the Fluxori application. Following these guidelines will help maintain architectural integrity and ensure proper module boundaries.

## Table of Contents

1. [Repository Pattern Overview](#repository-pattern-overview)
2. [Implementing a Repository](#implementing-a-repository)
3. [Repository Public API](#repository-public-api)
4. [Common Repository Operations](#common-repository-operations)
5. [Transactions](#transactions)
6. [Caching](#caching)
7. [Error Handling](#error-handling)
8. [Testing Repositories](#testing-repositories)

## Repository Pattern Overview

The repository pattern abstracts data access logic, providing a clean interface for working with data sources. In our application, repositories manage data stored in Firestore. The main benefits include:

- **Abstraction**: Hiding implementation details of data access
- **Encapsulation**: Grouping related data access operations
- **Testability**: Making code easier to test by allowing mock implementations
- **Maintainability**: Centralizing data access code

We use the `FirestoreBaseRepository` as the base class for all repositories. This provides standardized methods for CRUD operations, query processing, caching, and soft delete support.

## Implementing a Repository

### Basic Repository Structure

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreBaseRepository } from '../../../common/repositories';
import { FirestoreConfigService } from '../../../config/firestore.config';
import { MyEntity } from '../models/my-entity.schema';

@Injectable()
export class MyEntityRepository extends FirestoreBaseRepository<MyEntity> {
  protected readonly logger = new Logger(MyEntityRepository.name);
  
  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'my_entities', {
      useSoftDeletes: true,
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 5 * 60 * 1000, // 5 minutes
      requiredFields: ['organizationId', 'name'],
    });
  }
  
  // Custom repository methods...
}
```

### Important Rules

1. **Always extend `FirestoreBaseRepository`** - Never create repositories from scratch or extend deprecated classes
2. **Always import from the public API** - Use `import { FirestoreBaseRepository } from '../../../common/repositories'`
3. **Define required fields** - Set the `requiredFields` option to enforce data integrity
4. **Use proper logging** - Include a logger instance to help with debugging and monitoring
5. **Implement domain-specific methods** - Add methods that make sense for your entity's domain

## Repository Public API

The repositories module exports a public API that should be used for all imports:

```typescript
// Correct
import { 
  FirestoreBaseRepository, 
  QueryFilter,
  equalTo,
  greaterThan
} from '../../../common/repositories';

// Incorrect
import { FirestoreBaseRepository } from '../../../common/repositories/firestore-base.repository';
import { QueryFilter } from '../../../common/repositories/base/repository-types';
```

The public API includes:

- **Repository Base Classes**: `FirestoreBaseRepository`, `TenantRepository`
- **Utility Functions**: `equalTo`, `greaterThan`, `lessThan`, `paginatedQuery`
- **Type Definitions**: `QueryFilter`, `QueryOptions`, `RepositoryOptions`, etc.
- **Transaction Helpers**: `RepositoryTransaction`, `TransactionOperation`

## Common Repository Operations

### Finding Entities

```typescript
// Find by ID
const entity = await repository.findById('entity-id');

// Find with filters
const entities = await repository.find({
  advancedFilters: [
    { field: 'organizationId', operator: '==', value: organizationId },
    { field: 'status', operator: '==', value: 'active' }
  ],
  queryOptions: {
    orderBy: 'createdAt',
    direction: 'desc',
    limit: 10
  }
});

// Using helper functions
const entities = await repository.find({
  advancedFilters: [
    equalTo('organizationId', organizationId),
    greaterThan('score', 100)
  ]
});
```

### Creating Entities

```typescript
const newEntity = await repository.create({
  name: 'New Entity',
  organizationId: 'org-123',
  // Other fields...
});
```

### Updating Entities

```typescript
const updatedEntity = await repository.update('entity-id', {
  name: 'Updated Name',
  description: 'New description'
});
```

### Deleting Entities

```typescript
// Soft delete (default)
await repository.delete('entity-id');

// Hard delete
await repository.delete('entity-id', { softDelete: false });
```

## Transactions

Use transactions for operations that need to be atomic:

```typescript
await repository.runTransaction(async (context) => {
  const { transaction } = context;
  
  // Get data within transaction
  const entityA = await repository.findById('entity-a', { transaction });
  const entityB = await repository.findById('entity-b', { transaction });
  
  // Perform updates within transaction
  transaction.update(repository.getDocRef('entity-a'), { 
    balance: entityA.balance - 100 
  });
  
  transaction.update(repository.getDocRef('entity-b'), { 
    balance: entityB.balance + 100 
  });
  
  return true; // Transaction result
});
```

## Caching

Repositories provide built-in caching support:

```typescript
// Enable caching in constructor options
super(firestoreConfigService, 'my_entities', {
  enableCache: true,
  cacheTTLMs: 5 * 60 * 1000, // 5 minutes
});

// Bypass cache for specific operations
const entity = await repository.findById('entity-id', { bypassCache: true });

// Invalidate cache after updates
await repository.update('entity-id', { name: 'New Name' }, { invalidateCache: true });
```

## Error Handling

Always use try/catch blocks in repository methods and properly log errors:

```typescript
async findByCustomField(value: string): Promise<MyEntity | null> {
  try {
    const results = await this.find({
      advancedFilters: [
        { field: 'customField', operator: '==', value }
      ]
    });
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    this.logger.error(`Error finding by custom field: ${error.message}`, error.stack);
    throw error;
  }
}
```

## Testing Repositories

When testing repositories, create a mock implementation of `FirestoreBaseRepository`:

```typescript
// Mock repository
class MockMyEntityRepository {
  private entities: MyEntity[] = [];
  
  async findById(id: string): Promise<MyEntity | null> {
    return this.entities.find(e => e.id === id) || null;
  }
  
  async create(data: Partial<MyEntity>): Promise<MyEntity> {
    const entity = { id: 'mock-id', ...data } as MyEntity;
    this.entities.push(entity);
    return entity;
  }
  
  // Implement other methods as needed
}

// In test
describe('MyEntityService', () => {
  let service: MyEntityService;
  let repository: MockMyEntityRepository;
  
  beforeEach(async () => {
    repository = new MockMyEntityRepository();
    service = new MyEntityService(repository as unknown as MyEntityRepository);
  });
  
  it('should find entity by id', async () => {
    // Test implementation
  });
});
```

## Conclusion

By following these guidelines, you'll help maintain architectural integrity and ensure proper module boundaries. The repository pattern is a key part of our application architecture, providing a clean and consistent interface for data access.

If you have any questions or need help implementing repositories, please contact the architecture team.