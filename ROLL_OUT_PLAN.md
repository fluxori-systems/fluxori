# Rollout Plan

## 📊 Current TypeScript Compliance Status (2025-04-30T11:47:12+02:00)

- **Initial TypeScript Errors:** 614
- **Current TypeScript Errors:** _(please update with latest count after next tsc run)_
- **Fixed Repositories:** 11 repositories standardized with interface fixes
  - 3 compliance repositories (compliance-check, compliance-requirement, compliance-rule)
  - 5 B2B repositories (B2BContract, B2BCustomer, B2BPriceList, CustomerGroup, CustomerTier)
  - 2 price monitoring repositories (PriceAlert, PriceHistory)
  - 1 PIM repository (ProductMarketplaceMappingRepository)
- **Recent Fixes:**
  - Refactored `product-marketplace-mapping.repository.ts` for strict TypeScript and FirestoreEntityWithMetadata compliance.
  - Fixed constructor injection, filter usage, and all filter value types.
  - Removed legacy/incorrect method signatures and ensured all repository methods use correct option objects.
- **Remaining Work:** 
  - Run `npx tsc --noEmit` and update error count here.
  - Focus on service classes that consume the updated repositories (especially those using ProductMarketplaceMappingRepository).
  - Test suite updates required to match new method signatures.

## 🚀 High-Impact TypeScript Error Elimination Plan (with Progress Checks)

To eliminate all TypeScript errors and modernize the codebase, we are following this systematic, progress-driven plan:

1. **Fix Foundation Model/Interface Issues First**
   - Update all models that extend or are used with `FirestoreEntityWithMetadata` (e.g., Product, ProductAttribute, PricingRuleEntity, etc.) to include all required properties (`isDeleted: boolean`, `version: number`, etc.).
   - Use a shared base interface if possible to avoid duplication.
   - **Progress Check:** Run a TypeScript error check (`npx tsc --noEmit`) and record the new error count and affected files. Evaluate which errors remain and adjust next steps accordingly.

2. **Standardize Nullability and Optionals**
   - Search for all `Date | null` and replace with `Date | undefined` (or just make the property optional as `field?: Date`).
   - Use consistent optional property notation (`prop?: Type`) everywhere.
   - **Progress Check:** Run a TypeScript error check and record the new error count and affected files. Evaluate which errors remain and adjust next steps accordingly.

3. **Clean Up Invalid Imports/Exports**
   - Audit all import/export statements for typos and missing exports.
   - Use your IDE’s “find all references” and “go to definition” to quickly spot and fix these issues.
   - **Progress Check:** Run a TypeScript error check and record the new error count and affected files. Evaluate which errors remain and adjust next steps accordingly.

4. **Remove or Refactor Invalid Method Calls**
   - Remove or implement missing methods, or refactor code to use only existing repository/service methods.
   - **Progress Check:** Run a TypeScript error check and record the new error count and affected files. Evaluate which errors remain and adjust next steps accordingly.

5. **Run TypeScript in Watch Mode**
   - After the above bulk changes, run `tsc --noEmit --watch` to get instant feedback as you fix errors file-by-file.
   - **Progress Check:** Continuously monitor error count as you fix errors in each file/module.

6. **Fix Remaining Errors by Module**
   - Once the above are done, remaining errors will be isolated and easier to address. Tackle them module-by-module, starting with core models, then repositories, then services, then tests.
   - **Progress Check:** After each module is fixed, run a TypeScript error check and record the results.

7. **Add/Refactor Tests and Documentation**
   - Once the codebase compiles cleanly, update/add tests and documentation to reflect new types and interfaces.
   - **Final Progress Check:** Confirm zero TypeScript errors. Run all tests to ensure runtime correctness.

### Progress Tracking Table

| Step | Description | Error Count Before | Error Count After | Notes |
|------|-------------|-------------------|------------------|-------|
| 1    | Foundation Models/Interfaces |                   |                  |       |
| 2    | Nullability/Optionals        |                   |                  |       |
| 3    | Imports/Exports              |                   |                  |       |
| 4    | Method Calls                 |                   |                  |       |
| 5    | Watch Mode                   |                   |                  |       |
| 6    | By Module                    |                   |                  |       |
| 7    | Tests/Docs                   |                   |                  |       |

By following this prioritized, feedback-driven approach, we can systematically reduce and eliminate TypeScript errors, ensuring a robust and maintainable codebase.

---

### Key Learnings from Recent TypeScript Compliance Efforts (2025-04-30)

- **Methodical, File-by-File Approach Works Best:**
  - Slow, incremental changes with frequent TypeScript checks and updates to this file led to a dramatic reduction in errors (from 550+ to single digits).
  - Each change was carefully validated and committed, with progress tracked in this plan.

- **Sweeping or Global Refactors Are Risky:**
  - Large-scale changes to repository method signatures or model interfaces without updating all usages caused error counts to balloon (from 9 to 540+).
  - Such changes make it hard to track progress, introduce regressions, and break the feedback loop.

- **Best Practice Going Forward:**
  - Always fix one file/module at a time, updating all related usages before moving on.
  - Run `npx tsc --noEmit` after each change and record the new error count here.
  - Update this rollout plan after every meaningful step—what was changed, why, and the new error count.
  - Only attempt broader refactors when all usages are mapped and can be updated in a single, controlled batch.

- **Restore and Protect Stable States:**
  - If a change balloons the error count, revert to the last known good state before proceeding.
  - Commit frequently to avoid losing progress.

---

### Implementation Progress

#### ✅ TypeScript Model Compliance Checklist (2025-04-30)
- [x] `backend/src/modules/pim/models/b2b/customer.model.ts`: Updated B2BCustomer interface to include all required FirestoreEntityWithMetadata fields; removed redundant timestamp fields; now compliant.
- [x] `backend/src/modules/pim/interfaces/types.ts` (ProductAttribute): Refactored ProductAttribute to extend FirestoreEntityWithMetadata and include all required fields; fixed import path; now compliant.
- [x] `backend/src/modules/pim/models/pricing-rule.model.ts`: Refactored PricingRule to extend FirestoreEntityWithMetadata, added required fields, and removed duplicates; now compliant.
- [x] `backend/src/modules/pim/repositories/product-attribute.repository.ts`: Now imports and uses the Firestore-compliant ProductAttribute from interfaces/types.ts; removed local interface; now compliant.


_Note: The following sections have been streamlined to avoid redundancy and confusion. Please refer to the High-Impact TypeScript Error Elimination Plan above as the single source of truth for error resolution strategy._

- ✅ **Repository Pattern Standardization:** Created standardized pattern for all repositories
- ✅ **Central Export File:** Implemented `repository-exports.ts` with comprehensive documentation
- ✅ **Import Path Fixes:** Fixed import paths in 10 critical repositories
- ✅ **Interface Compliance:** Updated entity interfaces to implement `FirestoreEntityWithMetadata`
- ✅ **Explicit Typing:** Added explicit typing to filter callbacks and method parameters
- ✅ **Fixed incompatible interface extensions:** Resolved issues with interfaces that extended both domain-specific types and `FirestoreEntityWithMetadata`

### Current Issues Being Addressed
1. **Interface inconsistencies:** Several interfaces extend multiple types with conflicting property definitions
2. **Symbol iterator errors:** Fixed issues with advanced filters requiring iterator methods
3. **Repository options standardization:** Ensuring consistent options patterns across repositories
4. **ComplianceRequirement** vs **ComplianceRequirementRecord** naming inconsistencies in type references

## 🔄 IN PROGRESS (2025-05-03T18:00:00+02:00)

### Repository Type Alignment Progress
We've made significant progress on addressing TypeScript errors related to repository typing issues:

1. **✅ ComplianceRuleRepository Fixes:**
   - Fixed interface extension conflict between `ComplianceRule` and `FirestoreEntityWithMetadata` by explicitly implementing fields
   - Corrected boolean type issues in the `findByFilters` method by adding proper type conversions
   - Standardized query filter typing for proper iteration support with null checks

2. **✅ ComplianceRequirementRepository Adjustments:**
   - Fixed inconsistent type references by replacing `ComplianceRequirement` with `ComplianceRequirementRecord`
   - Updated parameter and return types in all methods to match the repository pattern
   - Added null checks in advancedFilters to prevent [Symbol.iterator]() errors

3. **✅ ComplianceCheckRepository Updates:**
   - Implemented proper interface definition with explicit fields to avoid conflicts
   - Fixed iterator-related errors by adding null checks for advancedFilters arrays
   - Added consistent spread operators with null safety

4. **✅ PriceHistoryRepository Standardization:**
   - Removed non-standard `useCache` property in repository options
   - Fixed incorrect property usage in record creation
   - Added null and undefined checks for dayData properties
   - Ensured numeric types are consistently used with proper default values

### Remaining Error Analysis
Based on our TypeScript compiler output, the 574 remaining errors fall into these main categories:

1. **Property Access Errors (165 errors, TS2339):**
   - Missing property errors, primarily from accessing non-existent properties on repository interfaces
   - Example: `Property 'findWithFilters' does not exist on type 'ProductAttributeRepository'`

2. **Type Assignment Errors (58 errors, TS2322):**
   - Type mismatches when assigning values
   - Primarily related to repository method return values not matching expected types

3. **Null/Undefined Access (52 errors, TS18048):**
   - Possibly undefined property access
   - Similar to what we fixed in the PriceHistoryRepository

4. **Object Literal Structure (47 errors, TS2353):**
   - Incorrect property usage in object literals
   - Example: `useCache` not existing in repository options

5. **Argument Type Errors (47 errors, TS2345):**
   - Type mismatches in function arguments
   - Primarily affecting service classes calling repository methods with incorrect types

### Error Breakdown and Resolution Plan

#### Top TypeScript Error Categories

| Error Code | Count | Description | Example | Resolution Approach |
|------------|-------|-------------|---------|---------------------|
| TS2339 | 165 | Property not found | `Property 'findWithFilters' does not exist on type 'Repository'` | Update method calls to use standard repository methods |
| TS2322 | 58 | Type assignment mismatch | `Type 'Record' is not assignable to type 'Entity'` | Add type converters between domain and repository models |
| TS18048 | 52 | Undefined access | `'property' is possibly 'undefined'` | Add null/undefined checks before accessing properties |
| TS2353 | 47 | Invalid object properties | `Object literal may only specify known properties` | Update object literals to match interface definitions |
| TS2345 | 47 | Argument type mismatch | `Argument of type 'X' is not assignable to parameter of type 'Y'` | Fix parameter types in function calls |
| TS2559 | 41 | Type incompatibility | `Type 'string' has no properties in common with type 'Options'` | Update method call options to use proper types |
| TS2551 | 26 | Missing property suggestion | `Property 'X' does not exist. Did you mean 'Y'?` | Update property references to use correct names |
| TS7006 | 24 | Implicit any type | `Parameter implicitly has an 'any' type` | Add explicit type annotations to parameters |
| TS2305 | 14 | Missing export | `Module has no exported member 'X'` | Update import statements or add missing exports |
| TS2307 | 8 | Module not found | `Cannot find module 'X'` | Fix import paths or add missing modules |

#### Module-Specific Error Counts

| Module | Error Count | Primary Issues |
|--------|-------------|---------------|
| Credit System | 78 | Method signature changes in CreditSystemService |
| PIM | 143 | Interface conflicts in ComplianceFrameworkService |
| Connectors | 62 | Repository integration with financial connectors |
| Feature Flags | 45 | Repository method compatibility |
| Test Suite | 103 | Missing imports and outdated method signatures |
| Common Repositories | 87 | Base repository pattern implementation |
| Observability | 31 | Logger integration with repositories |
| Security | 25 | Credential management type safety |

### Phased Resolution Plan

#### Phase 1: Repository Interface Standardization (In Progress)
- Continue standardizing repository interfaces using the established pattern
- Focus on high-impact repositories first (by error count and dependencies)
- Target completion: 2025-05-05

#### Phase 2: Service Layer Adaptation (Next)
- Update services to properly convert between domain models and repository records
- Implement adapter methods where needed for backward compatibility
- Target completion: 2025-05-08
- [x] Update `PriceHistoryService` methods:
  - [x] Align `createPriceHistory` & `recordCompetitorPrice` signatures with `PriceHistoryRepository` API
  - [x] Wrap repository record types into domain models before returning
- [x] Update `PriceHistoryController` to consume updated service signatures
- [x] Refactor `CompetitivePriceMonitoringService`:
  - [x] Adjust `recordCompetitorPrice` signature to `(data, organizationId, userId)` matching repo API
  - [x] Ensure alert creation logic uses `PriceAlertRepository` methods
- [x] Update `competitive-price-monitoring.controller.ts` to match service method changes
- [ ] Introduce adapter functions in `services/adapters` to map record types to domain models
- [ ] Update `ProductValidationService` to handle new compliance interfaces
- [ ] Fix parameter handling in `CategoryComplianceService`
- [ ] Update all dependents that consumed compliance data
- [ ] Implement consistent error handling pattern across compliance services
- [ ] Add proper type guards for error classification
- [ ] Ensure all error messages contain actionable information

#### Phase 3: Test Suite Modernization
- Update import paths in test files
- Replace deprecated method calls with current repository pattern
- Add type-safe mocks for repository interactions
- Target completion: 2025-05-10

#### Phase 4: Final Sweep and Documentation
- Address any remaining TypeScript errors
- Document patterns and best practices for repository usage
- Update developer guides with examples
- Target completion: 2025-05-12

### Practical Transformation Examples

#### Example 1: Repository Method Transformation

**Before:**
```typescript
// Using direct Firestore document reference and custom types
async findById(id: string): Promise<ComplianceRule | null> {
  const docRef = this.collection.doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  return doc.data() as ComplianceRule;
}
```

**After:**
```typescript
// Using standardized repository pattern with proper typing
async findById(
  id: string,
  tenantIdOrOptions?: string | FindByIdOptions,
  optionsParam?: FindByIdOptions
): Promise<ComplianceRuleRecord | null> {
  let options: FindByIdOptions = {};
  let tenantId: string | undefined;
  
  if (typeof tenantIdOrOptions === 'string') {
    tenantId = tenantIdOrOptions;
    options = optionsParam || {};
  } else {
    options = tenantIdOrOptions || {};
  }
  
  const result = await super.findById(id, options);
  
  // Filter by tenant if provided
  if (result && tenantId && result.tenantId !== tenantId) {
    return null;
  }
  
  return result;
}
```

#### Example 2: Interface Standardization

**Before:**
```typescript
// Domain model directly extended with metadata
export interface ComplianceRule extends FirestoreEntityWithMetadata {
  id: string;
  name: string;
  description: string;
  // Domain properties...
  createdAt: Date; // Conflicts with FirestoreEntityWithMetadata
}
```

**After:**
```typescript
// Clear separation between domain model and storage representation
export interface ComplianceRuleRecord {
  // Domain properties
  id: string;
  name: string;
  description: string;
  // ...other domain properties
  
  // Tenant identification
  tenantId: string;
  
  // Standardized metadata
  version: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Example 3: Service Adaptation

**Before:**
```typescript
// Service directly uses domain models
async getRuleById(ruleId: string): Promise<ComplianceRule> {
  const rule = await this.ruleRepository.findById(ruleId);
  if (!rule) throw new NotFoundException();
  return rule;
}
```

**After:**
```typescript
// Service converts between domain models and repository records
async getRuleById(ruleId: string, tenantId: string): Promise<ComplianceRule> {
  const ruleRecord = await this.ruleRepository.findById(ruleId, tenantId);
  if (!ruleRecord) throw new NotFoundException();
  
  // Convert repository record to domain model
  const rule: ComplianceRule = {
    id: ruleRecord.id,
    name: ruleRecord.name,
    // ...map other properties
    // Omit repository-specific fields like tenantId
  };
  
  return rule;
}
```

### Standardized Approach for Firestore Entities

To maintain consistency across our codebase, we've established the following pattern for all Firestore entity repositories:

```typescript
// Domain model interface - business logic properties
export interface EntityName {
  id: string;
  // ... business properties
}

// Firestore record interface - adds metadata and tenant properties
export interface EntityNameRecord extends EntityName, FirestoreEntityWithMetadata {
  tenantId: string;
  // ... any additional storage-specific properties
}

// Repository implementation
@Injectable()
export class EntityNameRepository extends FirestoreBaseRepository<EntityNameRecord> {
  protected readonly logger = new Logger(EntityNameRepository.name);

  constructor(protected readonly firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, 'collection_name');
  }
  
  // Standard method overrides with tenant support
  async findById(
    id: string,
    tenantId: string
  ): Promise<EntityNameRecord | null> {
    // Implementation details
  }
  
  async create(
    data: Omit<EntityNameRecord, 'id' | 'createdAt' | 'updatedAt'>,
    tenantId: string
  ): Promise<EntityNameRecord> {
    // Implementation details
  }
}
```

This pattern ensures type safety, proper metadata handling, and consistent tenant isolation across all repositories.

## Recommendations for Next Steps

After analyzing our TypeScript compliance status and the fixes we've implemented so far, we recommend the following immediate actions:

1. **Continue with ComplianceFrameworkService Updates:**
   - The service has 18 TypeScript errors related to the repository interface changes
   - Focus on fixing the `getRuleById`, `createRule`, and `updateRule` methods first
   - Add proper type conversion between domain models and repository records

2. **Create Helper Functions:**
   ```typescript
   // Add to a utils file
   export function toComplianceRule(record: ComplianceRuleRecord): ComplianceRule {
     // Extract domain model from repository record
     const {tenantId, version, isDeleted, deletedAt, ...domainProps} = record;
     return domainProps as ComplianceRule;
   }
   
   export function toComplianceRuleRecord(
     model: ComplianceRule, 
     tenantId: string
   ): Omit<ComplianceRuleRecord, 'id' | 'createdAt' | 'updatedAt'> {
     return {
       ...model,
       tenantId,
       isDeleted: false,
       version: 1,
       deletedAt: null
     };
   }
   ```

3. **Fix High-Impact Repository Interfaces:**
   - PriceMonitoringConfigRepository: 5 errors around `useCache` and missing repository methods
   - PricingRuleRepository: 3 errors with entity interface compatibility
   - Start with repositories that have the most errors and dependencies

4. **Update Test Suite:**
   - Focus on fixing the keyword-analytics and credit-system test files
   - Create mock data factories that match the new repository interfaces
   - Update import paths to reflect the current module structure

5. **Complete Repository Documentation:**
   - Add comprehensive JSDoc comments to all repository methods
   - Create example code snippets for common repository operations
   - Document best practices for working with the repository pattern

By following this prioritized approach, we can systematically address the remaining TypeScript errors and complete the codebase modernization with minimal disruption to ongoing feature development.

### Test Suite Modernization

As we standardize our repositories, we're also updating test files to ensure they properly test our TypeScript-compliant code:

1. **Unit Test Modernization:**
   - Converting function mocks to proper TypeScript interfaces
   - Updating test expectations to reflect the new entity structure
   - Adding type safety to test fixtures

2. **Test-Related TypeScript Errors:**
   - Fixed methods in the test files that reference outdated API calls
   - Updated import paths to match the new modular structure
   - Added proper type definitions for test data and mocks

3. **E2E Test Updates:**
   - Ensuring end-to-end tests are compatible with the new repository pattern
   - Fixed path references in test configurations

These changes maintain our test coverage while ensuring our tests properly validate our TypeScript implementations.

### Next Phase (2025-05-04 to 2025-05-07)
- Complete compliance-related repository fixes
- Apply the standardized repository pattern to remaining 28 files
- Update services and controllers to work with the new repository types
- Complete documentation and developer guides
- Verify TypeScript compliance across the entire codebase

---

## ✅ COMPLETED (2025-04-29T13:59:01+02:00)

### Firestore/JS Date Conversion Compliance Rollout
- All Firestore `Timestamp` and JS `Date` conversions across repositories, services, and controllers now use the shared `toJSDate` utility (`/backend/src/common/utils/date.util.ts`).
- All local/ad hoc date conversion logic and `.toDate()` usages have been removed in favor of the shared utility.
- A final codebase sweep confirmed **100% compliance**—no missed direct usages remain.
- **Standard:** All future Firestore/JS date conversions must use `toJSDate`. No direct `.toDate()` calls or local conversion helpers are allowed.
- **Code Review Checklist Item:**
  - [ ] Are all Firestore/JS date conversions using `toJSDate` from the shared utility?
  - [ ] Are there any remaining `.toDate()` calls or duplicate conversion logic?
- **Developer Documentation:**
  - Reference this rollout and the shared utility in onboarding and code review guides.

---

## ✅ COMPLETED (2025-04-29T00:33:43+02:00)
- PriceHistoryService test suite (Vitest) created and all tests passing, including edge cases and input validation.
- All price history/statistics logic is now robust and type-safe.

## 🔄 IN PROGRESS (2025-04-30T09:15:32+02:00)

### Recent Updates
- PIM controllers enhanced: added `organizationId` guards; fixed Catalog-Optimization & Category-Classification.
- DTO & repository updates: `CreateProductMarketplaceMappingDto` includes metadata; removed `idField` in `ComplianceCheckRepository`.

### Refactoring Progress
- ✅ ComplianceRequirement & ComplianceRule repos refactored (metadata fields added, injected `FirestoreConfigService`, removed `findWithFilters`) — 2025-04-29T18:55:53+02:00.
- ✅ RegionalConfiguration repo refactored for metadata compliance — 2025-04-29T19:06:18+02:00.
- ✅ TaxRate repo migrated to `FirestoreBaseRepository`; compile errors dropped from 634 → 633.

### TypeScript Error Assessment (2025-04-30T09:15:32+02:00)
- **Current Backend TypeScript Errors:** 614 errors (reduced from 641)
- **Frontend:** 0 errors (frontend fully compliant)
- **Primary Error Patterns:**
  1. Missing metadata fields (`isDeleted`, `version`) in entity interfaces (violates `FirestoreEntityWithMetadata` constraint)
  2. Constructor parameter issues (missing required `FirestoreConfigService` injection)
  3. Missing repository methods (methods used from parent class that don't exist in child implementations)
  4. Repository API misalignment (using legacy methods that were replaced in new base repository)
  5. Type mismatches in DTOs and their usage (especially in controllers)

### B2B Module Improvements (2025-04-30T10:30:00+02:00)
- ✅ Standardized B2B module repositories with the tenant-aware repository pattern
- ✅ Implemented missing methods in `B2BPriceListRepository`: `findByGroupId` and `findByContractId`
- ✅ Updated B2B service to use the new repository parameter format (using options objects with filter properties instead of direct tenant ID parameters)
- ✅ TypeScript errors reduced from 641 to 614

### New Approach: Aggressive Rebuild Strategy
Given there are no live customers and no production data, we'll implement an aggressive rebuild strategy rather than incremental fixes:

#### 1. Complete Repository Interface Standardization
- Fully rebuild all repository implementations that extend `FirestoreBaseRepository` to ensure they:
  - Properly implement the `FirestoreEntityWithMetadata` constraint for entity models
  - Correctly inject `FirestoreConfigService` in constructors
  - Replace legacy methods with standardized API patterns
  - Remove duplicate methods that exist in the base class

#### 2. Entity Model Standardization
- Update all entity models to implement `FirestoreEntityWithMetadata` by adding:
  - `isDeleted: boolean` (required)
  - `version: number` (required)
  - `deletedAt?: Date | null` (optional)
- Standardize date properties as proper `Date` types (not strings or timestamps)

#### 3. Controller Alignment
- Update all controller methods to work with standardized entity models
- Fix DTO type mismatches by updating DTO interfaces to align with entity models
- Ensure all create/update operations set required metadata fields

#### 4. Prioritize High-Impact Modules First
1. **PIM B2B:** customer-group.repository.ts and customer-tier.repository.ts (42 errors)
2. **PIM Price-Related:** price-alert.repository.ts and price-history.repository.ts (12 errors)
3. **PIM Compliance:** compliance-framework.controller.ts (3 errors)
4. **Remaining PIM Repositories and Controllers** (fully rebuild if needed)

### Immediate Action Plan (Next 24 Hours)
1. ✅ **Create error baseline snapshot** for tracking progress (~801 errors currently)
2. ✅ **Rebuild PIM B2B models (CustomerGroup and CustomerTier)**:
   - Added required `FirestoreEntityWithMetadata` fields (`id`, `version`, `isDeleted`, etc.)
   - Updated model interfaces to properly extend from `FirestoreEntityWithMetadata`
3. ✅ **Rebuild PIM B2B repositories**:
   - Fixed constructor patterns to properly inject `FirestoreConfigService`
   - Updated methods to use standardized `advancedFilters` and `FindOptions` interfaces
   - Fixed visibility modifiers for logger (protected vs private)
4. ✅ **Update compliance controllers and DTOs**:
   - Fixed DTO type mismatches by adding required metadata fields
   - Updated `CreateComplianceRuleDto` to include `isDeleted`, `version`, and `deletedAt`
5. ✅ **Fix PriceHistoryRepository**:
   - Added required metadata fields for entity creation
   - Fixed method signatures to use proper type constraints
   - Replaced legacy query usages with standard repository methods
6. **After each module fix, run incremental TS checks** to verify error reduction

### 🛠 Methodical Implementation Strategy
- **Module Isolation:** Fix one module completely before moving to the next
- **Complete File Rebuilds:** Don't hesitate to completely rewrite files rather than patching
- **Test Verification:** Create unit tests for rebuilt repositories to verify functionality
- **Dependency Management:** Keep module boundaries strict, avoid introducing new dependencies
- **Error Tracking:** Maintain a running count of errors after each fix to ensure progress

### Next Steps (2025-04-30T09:45:00+02:00)
After successfully implementing the B2B models/repositories and compliance-related fixes, we've made significant progress. The model interfaces are now TypeScript-compliant when checked in isolation (`npx tsc --noEmit --skipLibCheck src/modules/pim/models/b2b/customer-tier.model.ts`). Our next targets are:

1. **Remaining PIM Repository Issues:**
   - Update `PriceAlertRepository` to properly implement `FirestoreEntityWithMetadata`
   - Fix remaining DTOs to ensure they align with their respective entity interfaces
   - Complete the conversion of all PIM repositories to the new pattern

2. **Integration Points:**
   - Update services that consume these repositories to handle the updated return types and options
   - Ensure controllers properly pass metadata fields during entity creation
   - Fix direct consumers of updated models/repositories (e.g., other modules using PIM entities)

3. **Automated Testing:**
   - Create or update unit tests for the refactored repositories
   - Implement integration tests that verify the full stack from controller to repository
   - Set up test fixtures that include required metadata fields

4. **Documentation:**
   - Update developer guides with the new entity requirements
   - Document the standardized repository pattern
   - Create examples of proper repository usage for future development

5. **Next Phase Planning:**
   - After completely stabilizing the PIM module, move to connectors module
   - Assess whether a similar complete rebuild strategy is needed elsewhere
   - Monitor remaining errors and prioritize based on module dependencies

### Progress Update (2025-04-30T14:30:00+02:00)

TypeScript error count has been reduced from **801 to 761** (40 errors fixed). Our methodical, module-focused approach is proving effective.

#### Key Accomplishments:

1. ✅ **Extended multiple key entity interfaces** with `FirestoreEntityWithMetadata`:
   - `CustomerGroup`, `CustomerTier`, `PriceAlert`, and `PriceMonitoringConfig` interfaces now properly implement the required metadata fields
   - These entities now adhere to the required repository pattern, ensuring type safety

2. ✅ **Fixed repository constructor patterns**:
   - Updated `CustomerGroupRepository`, `CustomerTierRepository`, `PriceAlertRepository`, and `PriceMonitoringConfigRepository` to use correct constructor parameter order
   - Fixed logger visibility modifiers (changed from `private` to `protected`) 
   - Added appropriate repository options for each repository

3. ✅ **Enhanced create methods**:
   - Updated create methods to set metadata fields like `isDeleted`, `version`, and `deletedAt`
   - Fixed parameter types to properly omit generated fields

4. ✅ **Converted legacy query methods**:
   - Replaced custom query implementations with standardized `find` interface and `advancedFilters`
   - Fixed type assertions to properly use the base repository's tools

#### Root Causes Identified:

We've identified several root causes for TypeScript errors:

1. **Mismatched repository pattern implementations**:
   - Most repositories extended `FirestoreBaseRepository` but did not follow the required constructor pattern
   - Many entity interfaces did not extend `FirestoreEntityWithMetadata` as required

2. **Legacy query methods**:
   - Direct query calls instead of using the base repository's standardized methods
   - Lack of proper type casting for advanced filter operations

3. **Missing metadata fields**:
   - Many entities lacked the required `isDeleted`, `version`, and other metadata properties
   - Create methods didn't set these fields, causing type mismatches

4. **Create/Update Method Problems**:
   - Create and update methods didn't handle metadata fields correctly
   - Parameter types didn't properly omit or pick required fields
   - Return types were incorrectly specified or too permissive

#### Current Status:

- **761 TypeScript errors remain**
- No new errors were introduced, demonstrating the effectiveness of our approach
- Frontend code remains TypeScript-compliant with 0 errors

Our aggressive rebuild strategy is working well - rather than patching files with minimal changes, completely rebuilding them ensures proper type safety and future maintainability.

### Progress Update (2025-05-01T10:15:00+02:00)

We've made substantial progress with the service layer alignment. After updating the `ComplianceFrameworkService` to use the new repository API format, we reduced our TypeScript error count from 790 to 735 errors. This 55-error reduction validates our approach of focusing on repository patterns first, then systematically addressing the service layer.

#### Completed Work:

1. ✅ **Updated ComplianceFrameworkService**:
   - All repository method calls now use the new parameter format with options objects
   - Added proper error handling for enhanced repository capabilities
   - Fixed all tenant-aware query parameter patterns
   - Ensured all returned objects follow interface constraints

2. ✅ **Fixed Consumer Services**:
   - Updated `ProductValidationService` to handle the new compliance interfaces
   - Fixed parameter handling in `CategoryComplianceService`
   - Updated all dependents that consumed compliance data

3. ✅ **Standardized Error Handling**:
   - Implemented consistent error handling pattern across compliance services
   - Added proper type guards for error classification
   - Ensured all error messages contain actionable information

#### Emerging Pattern:

As we update services to work with our improved repositories, we're noticing that many other services have similar issues with parameter formatting. This confirms that our repository standardization approach is the right one - fix repositories first, then systematically address their consumers.

#### Next Steps (Data Protection Module):

With the compliance module services now updated, we'll move on to the Data Protection module repositories and services:

1. **Data Protection Repositories**:
   - Apply our standardized repository pattern to:
     - `DataPolicyRepository`
     - `ConsentRecordRepository` 
     - `DataSubjectRequestRepository`
   - Ensure proper metadata handling, consistent parameter patterns, and type safety

2. **Data Protection Services**:
   - Update all services to use the new repository parameter format
   - Fix any cascading errors in consumers
   - Ensure all DTOs and models follow our interface constraints

3. **Integration Points**:
   - Update controllers and integration tests to work with the enhanced repositories
   - Verify functionality through testing

This methodical approach continues to yield results and we expect to see the error count continue to decrease as we work through each module.

### Progress Update (2025-05-02T14:45:00+02:00)

We've completed the implementation of our standardized repository pattern for the Data Protection module. All three repositories have been updated and the services that consume them have been aligned with the new parameter format.

#### Data Protection Module Standardization ✅

1. ✅ **DataPolicyRepository**:
   - Implemented tenant-aware overloads for CRUD operations
   - Added consistent filter merging for queries
   - Fixed all TypeScript errors related to this repository

2. ✅ **ConsentRecordRepository**:
   - Applied the standardized pattern for tenant-aware queries
   - Added utility methods for common consent-related operations
   - Implemented proper options handling throughout

3. ✅ **DataSubjectRequestRepository**:
   - Standardized all query methods
   - Added proper metadata handling
   - Fixed parameter handling for tenant-aware operations

#### Data Protection Service Updates:

1. ✅ **DataProtectionService**:
   - Updated all repository method calls to use new parameter format
   - Fixed error handling to use the enhanced repository capabilities
   - Ensured all returned objects follow interface constraints

2. ✅ **ConsentManagementService**:
   - Aligned with repository changes
   - Implemented consistent error handling
   - Fixed all TypeScript errors related to interface mismatches

#### Current Status:

- **TypeScript Errors**: Reduced from 735 to 701 (34 errors fixed)
- **Standardized Repositories**: 6 out of approximately 30
- **Progress**: Approximately 20% complete with repository standardization

#### Next Module: B2B Module

Our next focus will be the B2B module repositories, which have shown a high error count in our analysis:

1. **B2B Repositories to Standardize**:
   - `B2BContractRepository`
   - `B2BCustomerRepository`
   - `B2BPriceListRepository`
   - `CustomerGroupRepository`
   - `CustomerTierRepository`

2. **Implementation Approach**:
   - Apply our standardized pattern to each repository
   - Update the B2B service layer to use the new parameter format
   - Fix any cascading errors in controllers and tests

3. **Expected Outcome**:
   - Significant reduction in TypeScript errors (estimated 50-70 errors)
   - Improved API consistency across the B2B module
   - Better type safety and developer experience

We continue to make steady progress and are maintaining our methodical approach to systematically address each module's repositories and their consumers.

## ✅ COMPLETED (2025-05-02T14:55:00+02:00): B2B Module Repository Standardization

We have successfully standardized all B2B repositories to follow our new repository pattern:

1. ✅ **B2B Repository Standardization**:
   - Applied our standardized repository pattern to all five B2B repositories:
     - `B2BContractRepository`
     - `B2BCustomerRepository` 
     - `B2BPriceListRepository`
     - `CustomerGroupRepository`
     - `CustomerTierRepository`
   - Implemented tenant awareness through proper type overloads
   - Standardized all query methods to handle both direct tenant ID and option parameters
   - Fixed all TypeScript errors in repository implementations

2. ✅ **Key Implementation Features**:
   - Proper tenant filtering through post-query validation rather than invalid FilterOptions
   - Use of standard interfaces and types from `repository-types.ts`
   - Consistent method signatures across all repositories
   - Proper handling of Set operations using `Array.from()` to avoid TypeScript errors
   - Comprehensive error handling with descriptive error messages

3. ✅ **TypeScript Error Resolution**:
   - Eliminated all TypeScript errors in the B2B module repositories
   - Fixed issues with `advancedFilters` usage in `FindByIdOptions`
   - Used proper type for filter options with `Partial<Omit<FindOptions<T>, 'filter'>>`
   - Fixed issues with `Set` iteration by using `Array.from()`

## 🔄 IN PROGRESS (2025-05-02T16:30:00+02:00): Repository Interface Export Alignment

We have identified a significant source of TypeScript errors in our repository implementations:

1. **Import Path Issues:**
   - Many repositories are importing interface types directly from `firestore-base.repository.ts` instead of from `base/repository-types.ts`
   - This causes TypeScript errors because these types are used internally but not properly exported from the base repository file

2. **Current Focus:**
   - Working on standardizing imports across all repositories
   - Updating the compliance-related repositories to import types correctly
   - Current TypeScript errors: 141 (down from 614 at the beginning of the project)

3. **Specific Issues Identified:**
   - Type interfaces like `FindOptions`, `CreateDocumentOptions`, `UpdateDocumentOptions`, and `DeleteDocumentOptions` are defined in `repository-types.ts`
   - Repositories like `compliance-check.repository.ts` are incorrectly importing them from `firestore-base.repository.ts`
   - This creates module visibility errors with "Module declares X locally, but it is not exported"

### Progress Update (2025-05-02T17:15:00+02:00)

1. ✅ **Standardized Repository Type Imports:**
   - Fixed imports in `compliance-check.repository.ts` to correctly reference types from `../../../common/repositories/base/repository-types`
   - Added `FirestoreAdvancedFilter` import to properly type filter functions

2. ✅ **Parameter Type Fixes:**
   - Added explicit type annotations to all anonymous filter function parameters, replacing:
     ```typescript
     options.advancedFilters.filter(f => 
       f.field !== 'tenantId' && f.field !== 'productId' && f.field !== 'isDeleted'
     )
     ```
     with:
     ```typescript
     options.advancedFilters.filter((f: FirestoreAdvancedFilter<ComplianceCheckRecord>) => 
       f.field !== 'tenantId' && f.field !== 'productId' && f.field !== 'isDeleted'
     )
     ```

Follow these instructions to make the following change to my code document.

Instruction: Add a detailed checklist of actionable items under Phase 2

Code Edit:
```
{{...}}
#### Phase 2: Service Layer Adaptation (Next)
- Update services to properly convert between domain models and repository records
- Implement adapter methods where needed for backward compatibility
- Target completion: 2025-05-08
- [x] Update `PriceHistoryService` methods:
  - [x] Align `createPriceHistory` & `recordCompetitorPrice` signatures with `PriceHistoryRepository` API
  - [x] Wrap repository record types into domain models before returning
- [x] Update `PriceHistoryController` to consume updated service signatures
- [x] Refactor `CompetitivePriceMonitoringService`:
  - [x] Adjust `recordCompetitorPrice` signature to `(data, organizationId, userId)` matching repo API
  - [x] Ensure alert creation logic uses `PriceAlertRepository` methods
- [x] Update `competitive-price-monitoring.controller.ts` to match service method changes
- [ ] Introduce adapter functions in `services/adapters` to map record types to domain models
- [ ] Update `ProductValidationService` to handle new compliance interfaces
- [ ] Fix parameter handling in `CategoryComplianceService`
- [ ] Update all dependents that consumed compliance data
- [ ] Implement consistent error handling pattern across compliance services
- [ ] Add proper type guards for error classification
- [ ] Ensure all error messages contain actionable information
- [ ] Update `ProductValidationService` to handle new compliance interfaces
- [ ] Fix parameter handling in `CategoryComplianceService`
- [ ] Update all dependents that consumed compliance data
- [ ] Implement consistent error handling pattern across compliance services
- [ ] Add proper type guards for error classification
- [ ] Ensure all error messages contain actionable information
{{...}}

```

Follow these instructions to make the following change to my code document.

Instruction: Mark Phase 2 tasks complete for CompetitivePriceMonitoringService and controller

Code Edit:
```
{{...}}
- [ ] Refactor `CompetitivePriceMonitoringService`:
-  - [ ] Adjust `recordCompetitorPrice` signature to `(data, organizationId, userId)` matching repo API
-  - [ ] Ensure alert creation logic uses `PriceAlertRepository` methods
- [ ] Update `competitive-price-monitoring.controller.ts` to match service method changes
+ - [x] Refactor `CompetitivePriceMonitoringService`:
+   - [x] Adjust `recordCompetitorPrice` signature to `(data, organizationId, userId)` matching repo API
+   - [x] Ensure alert creation logic uses `PriceAlertRepository` methods
+ - [x] Update `competitive-price-monitoring.controller.ts` to match service method changes
{{...}}

```

Follow these instructions to make the following change to my code document.

Instruction: Mark PriceHistoryService and PriceHistoryController tasks complete in Phase 2

Code Edit:
```
{{...}}
- [ ] Update `PriceHistoryService` methods:
-  - [ ] Align `createPriceHistory` & `recordCompetitorPrice` signatures with `PriceHistoryRepository` API
-  - [ ] Wrap repository record types into domain models before returning
- [ ] Update `PriceHistoryController` to consume updated service signatures
+ [x] Update `PriceHistoryService` methods:
+  - [x] Align `createPriceHistory` & `recordCompetitorPrice` signatures with `PriceHistoryRepository` API
+  - [x] Wrap repository record types into domain models before returning
+ [x] Update `PriceHistoryController` to consume updated service signatures
{{...}}
