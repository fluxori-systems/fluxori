# Fluxori UI Component Guidelines

This document outlines the standards and best practices for creating and modifying components in the Fluxori UI library. Following these guidelines ensures consistency, maintainability, and high-quality components optimized for the South African market.

## Table of Contents

1. [Component Structure](#component-structure)
2. [Type Safety](#type-safety)
3. [Design System Integration](#design-system-integration)
4. [Animation & Motion](#animation--motion)
5. [Network Awareness](#network-awareness)
6. [Accessibility](#accessibility)
7. [Testing](#testing)
8. [Performance Considerations](#performance-considerations)
9. [Documentation](#documentation)
10. [South African Market Optimizations](#south-african-market-optimizations)

## Component Structure

### File Organization

- All components should be located in `src/lib/ui/components/`
- Each component should have its own file named after the component (PascalCase)
- Complex components can have their own directory with subcomponents
- Test files should be in a `__tests__` subdirectory

### Export Pattern

- Always use named exports
- Export the component through `index.ts` files
- Include displayName for React DevTools

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  // Component implementation
});

Button.displayName = 'Button';
```

### Props Structure

- Extend the BaseComponentProps interface for common props
- For animated components, also extend AnimatableComponentProps
- Define specific prop interfaces for each component
- Use descriptive property names with JSDoc comments

```tsx
export interface ButtonProps extends BaseComponentProps, AnimatableComponentProps {
  /** The intent/purpose of the button */
  intent?: Intent;
  
  /** Whether the button spans full width */
  fullWidth?: boolean;
  
  /** For network optimization - if true, animations adapt to connection quality */
  networkAware?: boolean;
  
  // Other props...
}
```

## Type Safety

### Typing Guidelines

- Use stricter types instead of `any`
- Prefer discriminated unions for variants
- Use React.ElementType for component props
- Properly type event handlers
- Utilize shared types from `/types` directory

### Ref Handling

- Always use `forwardRef` for components
- Use `useCombinedRefs` utility for handling multiple refs
- Type ref generics properly

```tsx
const buttonRef = useRef<HTMLButtonElement>(null);
const combinedRef = useCombinedRefs(ref, buttonRef);
return <button ref={combinedRef} />;
```

## Design System Integration

### Token Usage

- Use token helpers instead of hardcoded values
- Use `getColor()`, `getSpacing()`, `getRadius()`, etc. from `tokens.ts`
- Register token usage for analysis with `useTokenTracking`

```tsx
// Good
const color = getColor(theme, `intent.${intent}`, undefined);
tokenTracking.trackToken(`color-intent-${intent}`);

// Bad
const color = '#3f51b5';
```

### Theme Awareness

- Support both light and dark themes
- Use CSS variables for token values
- Test components in both themes
- Track token usage for all theme-related styling

## Animation & Motion

### Animation Guidelines

- Use `useComponentAnimation` hook for standardized animations
- Support motion preferences (reduced, minimal) via animation strategy
- Be network-aware for South African market
- Implement the Strategy pattern for animation complexity

```tsx
// Network-aware animation
useComponentAnimation({
  ref: buttonRef,
  enabled: animated,
  mode: 'hover',
  isActive: isHovered,
  networkAware: true,  // Will adapt to connection quality
  durationMultiplier: animationSpeed,
  properties: { scale: 1.05 }
});
```

### Animation Types

- Standardize on these animation types:
  - `fade`: Opacity transitions
  - `scale`: Size changes
  - `slide`: Position changes
  - `hover`: Mouse hover effects
  - `press`: Click/press effects
  - `focus`: Focus state transitions
  - `shake`: Error/alert attention grabbers
  - `success`: Success state transitions
  - `error`: Error state transitions
  - `loading`: Loading state animations

### Animation Performance

- Respect user preferences for reduced motion
- Implement animation budget for low-powered devices
- Optimize animations based on network conditions
- Use GSAP for complex animations, CSS for simpler ones

## Network Awareness

### Connection Quality Detection

- Use the `useConnectionQuality` hook for detecting network conditions
- Adapt animation complexity based on connection quality
- Support data-saving mode

```tsx
const { quality, isDataSaver } = useConnectionQuality();

// Adapt content based on connection quality
if (isDataSaver || quality === 'poor') {
  // Use simpler animations or disable them
}
```

### Adaptive Loading

- Implement progressive loading for components
- Provide skeleton state during loading
- Set appropriate animation thresholds for different connection speeds
- Reduce animation complexity on poor connections

```tsx
// Animation strategy adapts automatically based on network
const strategy = getAnimationStrategy({
  animationType: 'hover',
  motionMode,
  networkAware: true,
  networkCondition: networkQuality,
});
```

## Accessibility

### Minimum Requirements

- All components must be keyboard navigable
- Use correct HTML semantics
- Support screen readers with proper ARIA attributes
- Meet WCAG AA contrast requirements
- Support focus states
- Implement via A11yProps interface

### Testing Accessibility

- Test with keyboard-only navigation
- Test with screen readers
- Use the accessibility testing utilities
- Include tests with `toRespectReducedMotion` matcher

## Testing

### Test Coverage

- All components require unit tests
- Use the `renderWithProviders` helper
- Test all component variants
- Test motion behavior and accessibility
- Test network-aware features

```tsx
// Example of modern test structure
describe('Button', () => {
  it('renders correctly with default props', () => {
    renderWithProviders(<Button>Test</Button>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('respects reduced motion preferences', () => {
    const { container } = renderWithProviders(
      <Button animated={true}>Test</Button>,
      { motionMode: 'reduced' }
    );
    
    // Use custom matcher
    expect(container.firstChild).toRespectReducedMotion();
  });
  
  it('applies design tokens correctly', () => {
    renderWithProviders(<Button intent="primary">Test</Button>);
    // Test token usage...
  });
});
```

## Performance Considerations

### Rendering Optimization

- Use React.memo for complex components
- Avoid unnecessary re-renders
- Implement proper memoization for callbacks
- Use refs instead of state when appropriate
- Don't compute styles in render if possible

### Bundle Size

- No large dependencies in individual components
- Be mindful of imported utilities
- Support code splitting for complex components

### Network Considerations

- Implement connection-aware code for South African market
- Support offline fallbacks where appropriate
- Respect data savings preferences

## Documentation

### Code Documentation

- Use JSDoc comments for all props and public methods
- Explain complex logic with inline comments
- Document animation behavior
- Include network optimization information

### Example Usage

- Include example usage in component tests
- Show various configurations
- Demonstrate network-aware usage patterns

## South African Market Optimizations

### Network Conditions

South Africa faces unique connectivity challenges. Our components should be optimized for:

- Variable connection speeds (especially mobile)
- Higher latency in certain regions
- Data costs concerns
- Intermittent connectivity

### Optimization Techniques

- Network-aware animations that adapt to connection quality
- Reduced animation complexity on poor connections
- Support for "lite mode" or "data saver mode"
- Offline support where appropriate
- Progressive loading patterns

```tsx
// Example of South African market optimization
<Card
  animated={true}
  animationType="fade"
  networkAware={true} // Will automatically adjust based on connection
>
  Content
</Card>
```

### Testing for South African Conditions

- Test with simulated network throttling
- Include tests with poor connectivity profiles
- Test data saver mode behaviors

---

## Component Development Checklist

Use this checklist when creating or modifying components:

- [ ] Component follows the naming convention and file structure
- [ ] Props extend BaseComponentProps and have proper JSDoc comments
- [ ] Properly typed with no `any` usage
- [ ] Uses token helpers for design system integration
- [ ] Implements animation via useComponentAnimation hook
- [ ] Supports network-aware optimizations for South African market
- [ ] Respects motion preferences and network conditions
- [ ] Meets accessibility requirements (WCAG AA)
- [ ] Has comprehensive tests including network and animation tests
- [ ] Documentation is complete and accurate
- [ ] Performs well in both full and reduced motion modes
- [ ] Looks correct in both light and dark themes
- [ ] Works correctly on mobile devices
- [ ] Optimized for variable network conditions