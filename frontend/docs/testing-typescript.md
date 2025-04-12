# Testing TypeScript Integration Guide

This document explains our approach to testing with TypeScript in the Fluxori frontend project.

## Background

Our project uses Vitest and React Testing Library for testing React components. We encountered TypeScript errors related to Jest-DOM matchers not being properly recognized by the TypeScript compiler, leading to the use of `@ts-expect-error` annotations.

## Current Approach

We've chosen to use properly documented `@ts-expect-error` annotations for Jest-DOM matchers. This approach balances code cleanliness with type safety:

```tsx
// @ts-expect-error - toBeInTheDocument comes from jest-dom
expect(button).toBeInTheDocument();
```

### Rationale

1. **DX vs. Perfect Types**: While we could create complex type augmentations, properly documented suppressions provide a better developer experience while still maintaining clarity.

2. **Explicit Documentation**: Each suppression explicitly documents which matcher comes from Jest-DOM, making it clear why the error is being suppressed.

3. **Maintainability**: This approach is more maintainable as it works consistently across different TypeScript versions and doesn't require complex type gymnastics.

4. **Module Boundaries**: This approach respects our module boundary enforcement (ADR-001) by not requiring complex cross-module type references.

## Type Definitions

We've added several TypeScript definition files to support testing:

- `/src/testing/types/jest-dom.d.ts`: Type definitions for Jest-DOM matchers
- `/src/testing/types/vitest-jest-dom.d.ts`: Integration of Vitest with Jest-DOM
- `/src/testing/types/testing-library.d.ts`: Type definitions for Testing Library
- `/src/testing/augmentations/vitest.ts`: Type augmentations for Vitest

## Adding New Tests

When adding new tests:

1. Import Jest-DOM at the top of your test file:
   ```tsx
   import '@testing-library/jest-dom';
   ```

2. Add the vitest environment directive:
   ```tsx
   // @vitest-environment jsdom
   ```

3. When using Jest-DOM matchers, add a properly documented `@ts-expect-error`:
   ```tsx
   // @ts-expect-error - toBeInTheDocument comes from jest-dom
   expect(element).toBeInTheDocument();
   ```

## Automated Tooling

We've created scripts to help manage TypeScript in tests:

- `/scripts/typescript-fixers/fix-jest-dom-matchers-with-expect-error.js`: Adds properly documented `@ts-expect-error` annotations for Jest-DOM matchers
- `/scripts/typescript-fixers/remove-ts-expect-errors.js`: Removes all `@ts-expect-error` annotations (if we switch to a different approach)

## Future Improvements

In the future, we may explore:

1. Using a dedicated type definition package for Vitest + Jest-DOM
2. Creating more comprehensive type augmentations
3. Contributing to upstream projects to improve type definitions

## Relation to ADRs

This approach is consistent with:

- **ADR-001: Module Boundary Enforcement**: Respects module boundaries by not requiring complex cross-module type references
- **Testing Guidelines**: Follows our testing guidelines for component testing