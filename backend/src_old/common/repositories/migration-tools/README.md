# Repository Migration Guide

This directory contains scripts and instructions for migrating from the modular repository architecture to the unified repository.

## Migration Process

### 1. Prepare for Migration

Make sure you have all changes committed before running the migration so you can review the differences or rollback if needed.

### 2. Run the Migration Scripts

Execute the migration in the following sequence:

```bash
# Make scripts executable
chmod +x migrate-all-repositories.sh

# Run the main migration script
./migrate-all-repositories.sh

# Compile and run the filter fix script
npx tsc fix-repository-query-filters.ts && node fix-repository-query-filters.js

# Compile and run the transaction method fix script
npx tsc fix-transaction-methods.ts && node fix-transaction-methods.js
```

### 3. Manual Fixes

After running the automated scripts, there will likely be some manual fixes needed:

1. Fix any remaining type errors related to Firestore operations
2. Update service classes that interact with repositories
3. Run TypeScript validation to ensure all errors are fixed

## Repository Class Changes

### Before:

```typescript
import { FirestoreBaseRepository } from "../../common/repositories/firestore-base.repository";

@Injectable()
export class ProductRepository extends FirestoreBaseRepository<Product> {
  protected readonly collectionName = "products";

  constructor(
    @Inject(FirestoreConfigService)
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  async findByType(type: string): Promise<Product[]> {
    return this.findAll({ type });
  }

  async setAsDefault(id: string): Promise<boolean> {
    return this.withTransaction(async (transaction) => {
      // Transaction logic
      return true;
    });
  }
}
```

### After:

```typescript
import { UnifiedFirestoreRepository } from "../../common/repositories/unified-firestore.repository";

@Injectable()
export class ProductRepository extends UnifiedFirestoreRepository<Product> {
  constructor(
    @Inject(FirestoreConfigService)
    firestoreConfigService: FirestoreConfigService,
  ) {
    super(firestoreConfigService, "products", {
      useSoftDeletes: true,
      useVersioning: true,
    });
  }

  async findByType(type: string): Promise<Product[]> {
    return this.find({
      filters: [{ field: "type", operator: "==", value: type }],
    });
  }

  async setAsDefault(id: string): Promise<boolean> {
    return this.runTransaction(async (context) => {
      // Transaction logic using context
      return true;
    });
  }
}
```

## Key Changes Summary

1. **Class Inheritance**

   - Change from `FirestoreBaseRepository` to `UnifiedFirestoreRepository`

2. **Constructor Changes**

   - Pass collection name directly to the constructor
   - Options are the third parameter now

3. **Query Method Changes**

   - `findAll()` with object properties becomes `find()` with filters array
   - Instead of `findAll({ type })`, use `find({ filters: [{ field: 'type', operator: '==', value: type }] })`

4. **Transaction Method Changes**
   - `withTransaction()` becomes `runTransaction()`
   - Transaction functions now receive a `context` object with get/create/update/delete methods
   - Use `context.get(id)` instead of `transaction.get(docRef)`
   - Use `context.update(id, data)` instead of `transaction.update(docRef, data)`

## Benefits

- Simplified repository implementation
- Consistent interface across repositories
- Resolved TypeScript errors related to parameter types
- Better compatibility with IDE type completion
- Easier to understand and maintain
