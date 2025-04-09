# Feature Flag Components

These components provide a clean way to integrate feature flags into your React application.

## Components

### FeatureFlag

Conditionally renders content based on a feature flag's status.

```tsx
import { FeatureFlag } from '../components/feature-flags/FeatureFlag';

function MyComponent() {
  return (
    <div>
      <FeatureFlag flag="new-dashboard">
        <NewDashboardComponent />
      </FeatureFlag>
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| flag | string | The feature flag key to check |
| children | ReactNode | Content to render when flag is enabled |
| fallback | ReactNode | Optional content to render when flag is disabled |
| context | FeatureFlagContext | Additional context for flag evaluation |
| renderWhileLoading | boolean | Whether to render children while flag is loading |
| loadingComponent | ReactNode | Optional component to show while loading |
| inverted | boolean | Whether to invert the check (show when disabled) |

### FeatureFlagGroup

Conditionally renders content based on multiple feature flags.

```tsx
import { FeatureFlagGroup } from '../components/feature-flags/FeatureFlag';

function MyComponent() {
  return (
    <div>
      <FeatureFlagGroup
        flags={['advanced-analytics', 'export-feature']}
        mode="all"
      >
        <AdvancedExportComponent />
      </FeatureFlagGroup>
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| flags | string[] | Array of feature flag keys to check |
| children | ReactNode | Content to render when flags condition is met |
| fallback | ReactNode | Optional content to render when condition isn't met |
| context | FeatureFlagContext | Additional context for flag evaluation |
| loadingComponent | ReactNode | Optional component to show while loading |
| mode | 'all' \| 'any' | How to evaluate multiple flags |
| inverted | boolean | Whether to invert the check |

### FeatureFlagAdmin

Admin interface for managing feature flags.

```tsx
import { FeatureFlagAdmin } from '../components/feature-flags/FeatureFlagAdmin';

function AdminPage() {
  return (
    <div>
      <h1>Feature Flag Management</h1>
      <FeatureFlagAdmin 
        environment="production"
        onFlagUpdated={(flag) => console.log(`Flag updated: ${flag.key}`)}
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| environment | Environment | Filter flags by environment |
| initialFilterType | FeatureFlagType | Initial filter by flag type |
| onFlagUpdated | (flag: FeatureFlag) => void | Callback when a flag is updated |

## Higher-Order Component

A HOC version is also available for class components:

```tsx
import { withFeatureFlag } from '../components/feature-flags/FeatureFlag';

class MyComponent extends React.Component {
  render() {
    return <div>Premium feature</div>;
  }
}

export default withFeatureFlag(MyComponent, 'premium-feature', {
  fallback: FallbackComponent,
  context: { userRole: 'admin' }
});
```

## React Hook

A React hook is available for programmatic flag checking:

```tsx
import { useFeatureFlag } from '../../hooks/useFeatureFlag';

function MyComponent() {
  const { isEnabled, isLoading, error, refetch } = useFeatureFlag('new-feature');
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div>
      {isEnabled ? (
        <NewFeature />
      ) : (
        <LegacyFeature />
      )}
      <button onClick={refetch}>Refresh feature status</button>
    </div>
  );
}
```

There's also a hook for checking multiple flags at once:

```tsx
import { useFeatureFlags } from '../../hooks/useFeatureFlag';

function MyComponent() {
  const { isLoading, newDashboard, advancedSearch } = useFeatureFlags(
    ['new-dashboard', 'advanced-search']
  );
  
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      {newDashboard && <NewDashboard />}
      {advancedSearch && <AdvancedSearch />}
    </div>
  );
}
```