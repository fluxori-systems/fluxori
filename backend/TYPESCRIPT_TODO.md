# TypeScript Modernization TODO Checklist

## Overview

This checklist outlines the steps needed to complete the TypeScript modernization effort. It builds on progress made so far in fixing 40 of the initial 801 errors by updating entity interfaces and repository patterns.

**Current Status (2025-04-30):**
- 761 TypeScript errors remain
- Primary focus is on PIM module repositories and models
- Strategy is to aggressively rebuild files with proper types rather than patching

## High-Priority Repository Files

These repositories require immediate attention as they have similar patterns to the ones already fixed:

### PIM Module

- [ ] **PriceHistoryRepository**
  - [x] Update constructor to use proper parameter order
  - [x] Fix method signatures and parameter types
  - [ ] Fix remaining null value issues in recordOutPrice, markAsSuspicious, and getAggregatedPriceHistory methods

- [ ] **PricingRuleRepository**
  - [ ] Fix interface missing required metadata fields
  - [ ] Update constructor to use proper parameter order
  - [ ] Fix any instances of direct query usage
  - [ ] Update create methods to set metadata fields

- [ ] **ProductAttributeRepository**
  - [ ] Update entity interface to extend FirestoreEntityWithMetadata
  - [ ] Fix constructor implementation
  - [ ] Replace legacy findWithFilters methods with standardized find
  - [ ] Fix implicit any types in parameters

- [ ] **ProductMarketplaceMappingRepository**
  - [ ] Fix FirestoreService import (should be FirestoreConfigService)
  - [ ] Update constructor parameters
  - [ ] Fix FindOptions property errors (remove tenantId)

### Other Critical PIM Repositories

- [ ] **ComplianceRuleRepository**
  - [ ] Ensure DTOs include all necessary metadata fields
  - [ ] Fix potential constructor issues
  - [ ] Check query methods for custom implementations

- [ ] **ApprovalWorkflowRepository**
  - [ ] Update entity interface
  - [ ] Fix constructor implementation
  - [ ] Standardize query methods

## Entity Interface Fixes

- [ ] **PricingRuleEntity**
  - [ ] Add isDeleted, version properties to interface
  - [ ] Fix nullable endTime property (should be undefined, not null)

- [ ] **ProductAttribute**
  - [ ] Add isDeleted, version properties to interface
  - [ ] Ensure interface extends FirestoreEntityWithMetadata

## Service/Controller Fixes

- [ ] **ComplianceFrameworkService**
  - [ ] Fix parameter type issues in method calls
  - [ ] Ensure proper type casting for FindByIdOptions, UpdateDocumentOptions

- [ ] **ComplianceFrameworkController**
  - [ ] Fix decorator errors
  - [ ] Ensure DTOs include required metadata fields

## Implementation Strategy

1. **Entity Interfaces First**
   - Update all entity interfaces to extend FirestoreEntityWithMetadata
   - Add required fields (id, isDeleted, version, etc.)
   - Fix type definitions for nullable/optional fields

2. **Repositories Second**
   - Fix constructor implementations to use proper parameter order and types
   - Replace direct query usage with standardized find interface
   - Update create/update methods to handle metadata fields

3. **Services/Controllers Last**
   - Fix method calls to repositories using the updated patterns
   - Ensure DTOs include the required metadata fields

## Validation Steps

After each group of fixes:

1. Run targeted TypeScript check on the specific files:
   ```
   npx tsc --noEmit --skipLibCheck <file_path>
   ```

2. Check error reduction with a full TypeScript check:
   ```
   npx tsc --noEmit | wc -l
   ```

3. Update this checklist with progress and new findings

## Post-Modernization Tasks

- [ ] Create unit tests for repositories verifying metadata handling
- [ ] Document the standardized repository pattern
- [ ] Update developer guides with entity requirements
- [ ] Document common TypeScript error patterns and solutions

## References

- FirestoreEntityWithMetadata interface: `backend/src/common/repositories/base/repository-types.ts`
- FirestoreBaseRepository implementation: `backend/src/common/repositories/firestore-base.repository.ts`
- Example fixed repository: `backend/src/modules/pim/repositories/customer-group.repository.ts`