# Repository Refactoring Plan

## Overview

This document outlines the plan for refactoring the repository implementations across the Fluxori codebase to ensure proper architectural boundaries and improve consistency.

## Current Status

The codebase currently uses two repository implementations:

1. **FirestoreBaseRepository** - The newer, recommended implementation with improved TypeScript typings and better organization
2. **UnifiedFirestoreRepository** - The older implementation that should be phased out

## Refactoring Goals

1. Migrate all repositories from `UnifiedFirestoreRepository` to `FirestoreBaseRepository`
2. Ensure all repositories import from the public repositories API (`src/common/repositories`) rather than direct file imports
3. Maintain backward compatibility to prevent breaking changes
4. Update documentation to reflect the new repository pattern

## Refactoring Steps

### Phase 1: Update Repository Imports (Completed)

- [x] Update repository imports to use the public API instead of direct file imports
- [x] Replace `import { UnifiedFirestoreRepository } from '../../common/repositories/unified-firestore.repository'` with `import { FirestoreBaseRepository } from '../../common/repositories'`

### Phase 2: Update Repository Implementations (In Progress)

- [x] Update feature-flags module repositories
- [x] Update inventory module repositories
- [x] Update buybox module repositories 
- [ ] Update agent-framework module repositories
- [ ] Update rag-retrieval module repositories
- [ ] Update ai-insights module repositories
- [ ] Update marketplaces module repositories
- [ ] Update users module repositories

### Phase 3: Update Services and Consumers

- [ ] Identify and update services that might be affected by the repository changes
- [ ] Update any direct references to repository implementation details

### Phase 4: Testing

- [ ] Run end-to-end tests to ensure the refactoring doesn't break functionality
- [ ] Verify that dependency injection works correctly with the updated repositories
- [ ] Test transaction support across repositories

### Phase 5: Documentation & Knowledge Sharing

- [ ] Update developer documentation with the new repository pattern
- [ ] Create a presentation for the team on the new repository pattern and best practices
- [ ] Add to onboarding documentation for new developers

## Repository Pattern Best Practices

When implementing repositories, follow these guidelines:

1. **Import from the Public API**:
   ```typescript
   // CORRECT
   import { FirestoreBaseRepository } from 'src/common/repositories';
   
   // INCORRECT
   import { FirestoreBaseRepository } from 'src/common/repositories/firestore-base.repository';
   ```

2. **Extend the FirestoreBaseRepository**:
   ```typescript
   @Injectable()
   export class ProductRepository extends FirestoreBaseRepository<Product> {
     constructor(firestoreConfigService: FirestoreConfigService) {
       super(firestoreConfigService, 'products', {
         // options...
       });
     }
   }
   ```

3. **Follow the Repository Pattern**:
   - Create domain-specific query methods in your repository
   - Keep business logic out of repositories
   - Use appropriate error handling
   - Implement caching where appropriate

## Differences Between FirestoreBaseRepository and UnifiedFirestoreRepository

The main differences are:

1. **Improved TypeScript typings** in FirestoreBaseRepository
2. **Better organization** of utility functions and smaller file sizes
3. **Enhanced transaction support** in FirestoreBaseRepository
4. **Better error handling** and tracing

## Migration Checklist for Each Repository

When migrating a repository from UnifiedFirestoreRepository to FirestoreBaseRepository:

- [ ] Update the import statement to use the public API
- [ ] Change the class extension from UnifiedFirestoreRepository to FirestoreBaseRepository
- [ ] Update any repository-specific methods that might be using deprecated features
- [ ] Test the repository to ensure it works with the new implementation

## Future Considerations

- Remove the UnifiedFirestoreRepository implementation once all repositories have been migrated
- Further enhance the FirestoreBaseRepository with additional features (e.g., full-text search support)
- Consider implementing a repository factory for more dynamic repository creation