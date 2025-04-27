# Feature Flagging System

The Feature Flagging System for Fluxori provides a robust solution for controlling feature availability, gradual rollouts, and A/B testing capabilities.

## Overview

This module allows for controlled rollout of features and the ability to quickly disable problematic features without redeployment. It supports parallel development and minimizes risk during the deployment of new features.

## Core Concepts

- **Feature Flags**: Configuration entries that determine the availability of specific features
- **Flag Types**: Boolean, percentage rollout, user-targeted, organization-targeted, environment-targeted, and scheduled
- **Evaluation Context**: User, organization, and environment information used to evaluate flag status
- **Real-time Updates**: Ability to update flag status without redeployment

## Feature Flag Types

1. **Boolean**: Simple on/off switch for features
2. **Percentage**: Gradually roll out a feature to a percentage of users
3. **User-Targeted**: Target specific users by ID, role, or email
4. **Organization-Targeted**: Target specific organizations
5. **Environment-Targeted**: Control features per environment (dev, staging, prod)
6. **Scheduled**: Time-based feature activation/deactivation

## Usage Examples

### Backend Usage

```typescript
// Inject the service
constructor(private readonly featureFlagService: FeatureFlagService) {}

// Simple check
async someMethod() {
  const isFeatureEnabled = await this.featureFlagService.isEnabled(
    'my-feature',
    {
      userId: 'user123',
      organizationId: 'org456',
      environment: Environment.PRODUCTION
    }
  );

  if (isFeatureEnabled) {
    // Feature-specific code
  } else {
    // Default behavior
  }
}

// Detailed evaluation
async someOtherMethod() {
  const evaluation = await this.featureFlagService.evaluateFlag(
    'advanced-feature',
    {
      userId: 'user123',
      userRole: 'admin',
      organizationId: 'org456'
    }
  );

  if (evaluation.enabled) {
    // Feature is enabled
    console.log(`Feature enabled because: ${evaluation.reason}`);
  }
}
```

### Frontend Usage

```tsx
// Using the FeatureFlag component for conditional rendering
import { FeatureFlag } from "../components/feature-flags/FeatureFlag";

function MyComponent() {
  return (
    <div>
      <h1>My App</h1>

      {/* Simple feature flag */}
      <FeatureFlag flag="new-dashboard">
        <NewDashboardComponent />
      </FeatureFlag>

      {/* With fallback content */}
      <FeatureFlag
        flag="beta-analytics"
        fallback={<LegacyAnalyticsComponent />}
      >
        <BetaAnalyticsComponent />
      </FeatureFlag>

      {/* With additional context */}
      <FeatureFlag flag="premium-features" context={{ userRole: "premium" }}>
        <PremiumFeatures />
      </FeatureFlag>
    </div>
  );
}

// Using the React hook
import { useFeatureFlag } from "../hooks/useFeatureFlag";

function ConditionalFeature() {
  const { isEnabled, isLoading } = useFeatureFlag("fancy-feature");

  if (isLoading) return <Spinner />;

  return <div>{isEnabled ? <NewFeature /> : <OldFeature />}</div>;
}
```

## Integration Points

### 1. Authentication System

Feature flags integrate with the authentication system to determine feature availability based on user roles and organizations.

### 2. Multi-Model Agent Framework

The Agent Framework uses feature flags to control which agents are available to specific organizations:

```typescript
// Check if an agent is available for a specific organization
const agentEnabled = await this.featureFlagService.isEnabled(
  `agent-${agentName.toLowerCase().replace(/\s+/g, "-")}`,
  { organizationId },
);
```

### 3. Frontend Integration

The frontend uses React hooks and components to conditionally render features based on flag status:

```tsx
function MyComponent() {
  const { isEnabled } = useFeatureFlag("new-ui");

  return <div>{isEnabled ? <NewUI /> : <LegacyUI />}</div>;
}
```

## Administration

The system includes an admin interface for managing feature flags with the following capabilities:

1. Create, update, and delete flags
2. Toggle flags on/off
3. Configure targeting rules
4. View audit logs of flag changes
5. Set up scheduled activation/deactivation

## Performance Considerations

- The system uses caching to minimize database reads
- The cache is automatically refreshed every 60 seconds
- Frontend components batch flag requests where possible
- The system is designed for minimal impact on application performance

## Security

- Access to flag management is restricted to admin users
- All flag changes are audited
- The system ensures that end users cannot manipulate flag status
