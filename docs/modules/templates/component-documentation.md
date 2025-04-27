# [Component Name]

## Overview

Brief description of the component's purpose and main functionalities.

## Component API

### Props

| Name       | Type       | Default        | Description             |
| ---------- | ---------- | -------------- | ----------------------- |
| `propName` | `PropType` | `defaultValue` | Description of the prop |

### Events

| Name        | Parameters                   | Description              |
| ----------- | ---------------------------- | ------------------------ |
| `eventName` | `(param: ParamType) => void` | Description of the event |

## Usage

```tsx
import { ExampleComponent } from '@/components/example';

// Basic usage
<ExampleComponent prop="value" />

// Advanced usage with callback
<ExampleComponent
  prop="value"
  onSomeEvent={(result) => handleResult(result)}
/>
```

## Boundaries and Dependencies

This component:

- **Can import from**:
  - Other components in the same directory
  - Shared UI components
  - Hooks
  - Utility functions
- **Cannot import from**:
  - Page components
  - API services directly (should use hooks instead)
  - Other feature-specific components

## Styling

Describe how the component is styled and how to customize its appearance:

```tsx
// Example of styling this component
<ExampleComponent className="custom-class" />
```

## Accessibility

- [ ] Supports keyboard navigation
- [ ] Has appropriate ARIA attributes
- [ ] Color contrast meets WCAG AA standards
- [ ] Works with screen readers

## Testing

```tsx
// Example test for the component
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExampleComponent } from "./ExampleComponent";

describe("ExampleComponent", () => {
  it("renders correctly", () => {
    render(<ExampleComponent prop="value" />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });
});
```
