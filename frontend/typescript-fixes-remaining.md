# Remaining TypeScript Fixes

This document outlines the remaining TypeScript errors that need to be fixed in the Fluxori frontend codebase.

## Test Files Setup

Most remaining TypeScript errors are in test files. To fix them, the following steps need to be taken:

1. **Update Jest.setup.ts files**:
   - Change all instances of `jest.*` to `vi.*` (e.g., `jest.fn()` to `vi.fn()`)
   - Fix mock implementations for complex objects like GSAP and matchMedia
   - Use proper typings for mock return values

2. **Fix Test Library Imports**:
   - Add `// @ts-ignore` comments before imports from @testing-library/react and @testing-library/dom
   - Import `vi` from 'vitest' in all test files

3. **Replace Jest with Vitest References**:
   - Change all `jest.fn()` calls to `vi.fn()`
   - Change `jest.useFakeTimers()` to `vi.useFakeTimers()`
   - Change `jest.useRealTimers()` to `vi.useRealTimers()`
   - Change `jest.advanceTimersByTime()` to `vi.advanceTimersByTime()`

## Specific Problems to Fix

1. **Missing Jest to Vitest Conversion**:
   ```typescript
   // Before
   jest.useFakeTimers();
   const onClose = jest.fn();
   jest.advanceTimersByTime(1100);
   jest.useRealTimers();
   
   // After
   vi.useFakeTimers();
   const onClose = vi.fn();
   vi.advanceTimersByTime(1100);
   vi.useRealTimers();
   ```

2. **Testing Library Type Errors**:
   ```typescript
   // Before
   import { screen, fireEvent, waitFor } from '@testing-library/react';
   
   // After
   // @ts-ignore - Using custom type definitions for @testing-library/react
   import { screen, fireEvent, waitFor } from '@testing-library/react';
   ```

3. **Mock Function Type Errors**:
   Files like `service-interfaces.test.ts` have type errors with mock functions. They can be fixed with:
   ```typescript
   // Before
   const animateComponent = vi.fn().mockReturnValue(() => {});
   
   // After
   // @ts-ignore - Mock function return type is acceptable at runtime
   const animateComponent = vi.fn().mockReturnValue(() => {});
   ```

4. **GSAP and DOM API Mocking Errors**:
   The jest.setup.ts and test-utils/jest.setup.ts files have type errors when mocking complex browser APIs:
   ```typescript
   // The error
   // No overload matches this call. Type '{ kill: jest.Mock<any, any> }' is not assignable to type '(...args: any) => any'
   
   // Solution
   // @ts-ignore - Complex mock object structure
   vi.fn().mockReturnValue({ kill: vi.fn() })
   ```

## Recommended Approach

1. Fix one test file at a time starting with the simpler ones
2. Add necessary type declarations or strategic `@ts-ignore` comments
3. Ensure all tests still pass with these changes
4. Document why `@ts-ignore` comments were used in each case
5. Consider using a more structured approach for the most complex test files

## Future Work

1. Consider upgrading to Vitest officially (including configuration files)
2. Replace Jest usage completely with native Vitest APIs
3. Add proper type definitions for complex mocks
4. Add more structured test utilities with proper TypeScript definitions