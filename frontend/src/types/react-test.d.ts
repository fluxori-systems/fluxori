/**
 * Type declarations for React testing
 * Extends React's type definitions for test mocking
 */

import * as React from 'react';
import { vi } from 'vitest';

declare global {
  namespace jest {
    // Jest-compatible namespace for improved IDE support in tests
    interface MockInstance<T, Y extends any[]> {
      mockImplementation(fn: (...args: Y) => T): this;
      mockReturnValue(val: T): this;
      mockReturnValueOnce(val: T): this;
    }
  }
}

// Extend React module for testing
declare module 'react' {
  // Allow useState to be mocked in tests
  interface UseStateMockReturn<T> {
    [0]: T;
    [1]: (newValue: T | ((prev: T) => T)) => void;
  }

  // This matches the vi.spyOn behavior in tests
  export interface SpiedUseState {
    mockImplementation<T>(
      callback: (initialState: T) => [T, (newState: T | ((prevState: T) => T)) => void]
    ): jest.MockInstance<[T, (newState: T | ((prevState: T) => T)) => void], [T | (() => T)]>;
  }
  
  export interface StaticMockInterface {
    mockImplementation<T>(
      implementation: (initialState: T | (() => T)) => [T, React.Dispatch<React.SetStateAction<T>>]
    ): StaticMockInterface;
    mockReturnValue<T>(
      value: [T, React.Dispatch<React.SetStateAction<T>>]
    ): StaticMockInterface;
  }
}