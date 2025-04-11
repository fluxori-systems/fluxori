# Feature Flags Module

## Overview

The Feature Flags module provides a flexible system for dynamically enabling or disabling features across the Fluxori platform. It supports various targeting strategies, including percentage rollouts, user-specific targeting, and organizational-level toggles. This module is fundamental for implementing continuous delivery, A/B testing, and controlled feature releases.

## Module Boundaries

### Exports

The module exposes the following components to the rest of the application:

- **Public APIs**: 
  - `FeatureFlagsModule`: The main module for feature flag functionality
  - `FeatureFlagService`: Core service for checking and managing feature flags
  - `FeatureFlagCacheService`: Service for caching feature flags for performance
  - `FeatureFlagRepository`: Repository for storing and retrieving feature flags
  - `FeatureFlagAuditLogRepository`: Repository for tracking changes to feature flags
  - Data models: `FeatureFlag`, `FeatureFlagAuditLog`
  - Type definitions and enums

### Dependencies

This module has dependencies on:

- **Required Modules**:
  - None - The module is designed to be a foundational module

- **Optional Modules**:
  - `AuthModule`: For user-specific targeting and admin operations

## Architecture

```
feature-flags/
├── controllers/                    # HTTP endpoints
│   └── feature-flag.controller.ts  # API for flag management
├── interfaces/                     # TypeScript interfaces
│   └── types.ts                    # Type definitions
├── models/                         # Data structures
│   ├── feature-flag.schema.ts      # Flag definition schema
│   └── feature-flag-audit-log.schema.ts # Audit log schema
├── repositories/                   # Data access
│   ├── feature-flag.repository.ts  # Flag storage
│   └── feature-flag-audit-log.repository.ts # Audit logging
├── services/                       # Business logic
│   ├── feature-flag.service.ts     # Core flag management
│   └── feature-flag-cache.service.ts # Performance caching
├── feature-flags.module.ts         # Module definition
├── index.ts                        # Public API exports
└── README.md                       # Module documentation
```

## Integration Points

Other modules should interact with this module through its public API:

### How to Import

```typescript
// Import the entire module
import { FeatureFlagsModule } from 'src/modules/feature-flags';

// Import specific components
import { 
  FeatureFlagService, 
  FeatureFlagCacheService 
} from 'src/modules/feature-flags';
```

### Usage Examples

#### Checking if a Feature is Enabled

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlagService } from 'src/modules/feature-flags';

@Injectable()
export class SomeService {
  constructor(private readonly featureFlagService: FeatureFlagService) {}
  
  async performAction(userId: string, organizationId: string): Promise<void> {
    // Check if a feature is enabled with context
    const isNewFeatureEnabled = await this.featureFlagService.isEnabled(
      'new-pricing-algorithm',
      {
        userId,
        organizationId,
        environment: 'production'
      }
    );
    
    if (isNewFeatureEnabled) {
      // Use new algorithm
    } else {
      // Use existing algorithm
    }
  }
}
```

#### Evaluating Multiple Flags at Once

```typescript
import { Injectable } from '@nestjs/common';
import { 
  FeatureFlagService, 
  FlagEvaluationContext 
} from 'src/modules/feature-flags';

@Injectable()
export class UiStateService {
  constructor(private readonly featureFlagService: FeatureFlagService) {}
  
  async getUiState(userId: string, organizationId: string): Promise<Record<string, any>> {
    const context: FlagEvaluationContext = {
      userId,
      organizationId,
      environment: 'production'
    };
    
    // Evaluate multiple flags in a batch
    const featureFlags = await this.featureFlagService.evaluateFlags(
      [
        'new-dashboard-ui',
        'advanced-analytics',
        'ai-recommendations',
        'beta-features'
      ],
      context
    );
    
    return {
      showNewDashboard: featureFlags['new-dashboard-ui'].enabled,
      enableAdvancedAnalytics: featureFlags['advanced-analytics'].enabled,
      showAiRecommendations: featureFlags['ai-recommendations'].enabled,
      enableBetaFeatures: featureFlags['beta-features'].enabled
    };
  }
}
```

## Data Flow

The typical data flow through the Feature Flags module:

1. Application requests feature flag status via `FeatureFlagService.isEnabled()`
2. Service first checks the cache via `FeatureFlagCacheService`
3. If not in cache, retrieves from `FeatureFlagRepository`
4. Evaluates flag rules based on provided context (user ID, organization, etc.)
5. Returns boolean result (enabled/disabled)
6. For admin operations, all changes are logged to `FeatureFlagAuditLogRepository`

## Configuration

The Feature Flags module supports the following configuration options:

| Option | Description | Default Value |
|--------|-------------|---------------|
| `feature-flags.cache-ttl` | Time to live for cached flags (seconds) | `300` |
| `feature-flags.default-state` | Default state when flag is not found | `false` |
| `feature-flags.audit-log-retention` | Days to retain audit logs | `90` |

## Testing

The Feature Flags module can be tested as follows:

```typescript
describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let repository: MockFeatureFlagRepository;
  let cacheService: MockFeatureFlagCacheService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        {
          provide: FeatureFlagRepository,
          useClass: MockFeatureFlagRepository
        },
        {
          provide: FeatureFlagCacheService,
          useClass: MockFeatureFlagCacheService
        }
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    repository = module.get(FeatureFlagRepository);
    cacheService = module.get(FeatureFlagCacheService);
  });

  it('should return flag state from cache when available', async () => {
    // Setup
    const flag = 'test-flag';
    const context = { userId: 'user1' };
    cacheService.get.mockResolvedValue(true);
    
    // Execute
    const result = await service.isEnabled(flag, context);
    
    // Verify
    expect(result).toBe(true);
    expect(cacheService.get).toHaveBeenCalledWith('test-flag:user1');
    expect(repository.findByKey).not.toHaveBeenCalled();
  });
});
```