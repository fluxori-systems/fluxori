# Vitest Migration Guide

This document outlines the migration from Jest to Vitest for testing the frontend codebase, which helps solve TypeScript errors and provides a more modern testing experience.

## Migration Strategy

The migration follows a pragmatic approach:

1. **Dual Testing Setup**: Both Jest and Vitest are configured to run simultaneously
2. **Complete Rewrite of Problem Files**: Files with TypeScript errors are completely rewritten using Vitest
3. **Utility Migration**: Testing utilities are migrated to support Vitest patterns
4. **Clear Types**: Proper TypeScript typing of mocks and testing utilities

## Files Created/Modified

### Configuration Files

- `vitest.setup.ts`: Setup file for Vitest tests
- `vitest.config.ts`: Configuration for Vitest
- `package.json`: Updated with Vitest scripts while maintaining Jest compatibility

### Testing Utilities

- `/src/test-utils/vitest-utils.ts`: New testing utilities for Vitest
- `/src/lib/ui/components/testUtil.tsx`: React component testing utilities

### Test Files

- `/src/lib/shared/tests/service-interfaces.test.ts`: Completely rewritten with proper typing
- `/src/lib/ui/components/__tests__/Button.test.tsx`: Rewritten as an example

## Key Changes

### Typing Improvements

1. **Properly Typed Mocks**:
   ```typescript
   // Before:
   const mockFn = vi.fn().mockReturnValue(value);
   
   // After (with proper typing):
   const mockFn = vi.fn<[ArgumentType], ReturnType>().mockReturnValue(value);
   ```

2. **Type Definitions**:
   - Added proper type definitions for Vitest
   - Added type definitions for testing libraries
   - Improved mock function typings

### Testing Structure

1. **Re-exported Testing Utilities**:
   ```typescript
   export * from '@testing-library/react';
   ```

2. **Provider Wrappers**:
   ```typescript
   export function renderWithProviders(ui: React.ReactElement) {
     return render(ui, { wrapper: AllProviders });
   }
   ```

3. **Typed Context Mocks**:
   ```typescript
   export const MotionContext = React.createContext({
     motionMode: 'full',
     // ...properly typed values
   });
   ```

## Migration Path

1. **Install Dependencies**: 
   ```bash
   npm install --save-dev vitest @vitest/coverage-v8 @vitejs/plugin-react jsdom
   ```

2. **Run Both Test Suites**:
   ```bash
   # Run Jest (legacy)
   npm run test:jest
   
   # Run Vitest (new)
   npm run test
   ```

3. **Migrating Individual Tests**:
   - Copy each test file to a new location
   - Update imports to use Vitest
   - Fix type issues
   - Run both test suites in parallel to ensure equivalence

## Benefits

1. **TypeScript Compatibility**: Vitest has better TypeScript integration
2. **Performance**: Vitest is faster than Jest
3. **Modern Features**: Better ESM support and Vue/React integration
4. **Developer Experience**: Improved watch mode and reporting

## Module Boundaries

All tests have been written to respect the module boundaries defined in the dependency management system:

1. UI components only import from UI module
2. Motion components only import from Motion module
3. Shared utilities are properly imported

This ensures we maintain the architectural integrity while fixing TypeScript errors.

## Roadmap

1. **Immediate**: Fix all TypeScript errors in test files
2. **Short-term**: Migrate all critical components to use Vitest
3. **Medium-term**: Add new tests using Vitest only
4. **Long-term**: Complete migration to Vitest and remove Jest