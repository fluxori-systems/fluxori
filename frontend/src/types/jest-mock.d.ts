/**
 * Enhanced type definitions for Jest mocking
 * This file extends the basic Jest types to properly handle complex mock return types
 */

// Extend Jest namespace to support complex mock returns
declare namespace jest {
  interface Mock<T = any, Y extends any[] = any[]> {
    <TResult>(this: any, ...args: Y): TResult;
    mockImplementation<TResult extends (...args: Y) => any>(
      fn: (...args: Y) => TResult
    ): this & ((...args: Y) => ReturnType<TResult>);
    mockReturnValue<TResult>(value: TResult): this & ((...args: Y) => TResult);
    mockReturnValueOnce<TResult>(value: TResult): this & ((...args: Y) => TResult);
    mockResolvedValue<TResult>(value: TResult): this & ((...args: Y) => Promise<TResult>);
    mockResolvedValueOnce<TResult>(value: TResult): this & ((...args: Y) => Promise<TResult>);
    mockRejectedValue<TResult>(value: TResult): this & ((...args: Y) => Promise<never>);
    mockRejectedValueOnce<TResult>(value: TResult): this & ((...args: Y) => Promise<never>);
    mockReturnThis(): this & ((...args: Y) => this);
    mockName(name: string): this;
    getMockName(): string;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockImplementationOnce<TResult extends (...args: Y) => any>(
      fn: (...args: Y) => TResult
    ): this & ((...args: Y) => ReturnType<TResult>);
    withImplementation<R>(fn: (...args: Y) => any, cb: () => R): R;
    mockType?: 'function' | 'return' | 'throw';
  }

  /**
   * Type for Jest's fn() function that supports complex return objects
   */
  interface MockableFunction {
    <T = any, Y extends any[] = any[]>(
      implementation?: (...args: Y) => T
    ): jest.Mock<T, Y>;
  }

  /**
   * Type for jest.fn() that supports proper return of complex objects
   */
  export const fn: MockableFunction;
  
  /**
   * Type for complex DOM API mocks
   */
  interface DOMApiMock<T> {
    (query: string): T;
  }

  /**
   * Type for browser API mocks
   */
  interface BrowserApiMock<T> {
    (): T;
  }
  
  /**
   * Extends the mock implementation to handle complex object returns
   */
  interface MockImplementation<TResult, Y extends any[]> {
    (callback: (...args: Y) => TResult): jest.Mock<TResult, Y>;
  }
  
  /**
   * Properly types matchMedia mock implementation
   */
  interface MatchMediaMock extends Mock<MediaQueryList, [string]> {
    mockImplementation(
      implementation: (query: string) => MediaQueryList
    ): this & ((query: string) => MediaQueryList);
  }
  
  /**
   * Properly types GSAP mock returns
   */
  interface GSAPMock extends Mock<any, any[]> {
    mockReturnValue(value: { kill: jest.Mock }): this & ((...args: any[]) => { kill: jest.Mock });
    mockImplementation(implementation: (...args: any[]) => any): this;
  }
  
  interface GSAPTimelineMock extends Mock<any, any[]> {
    mockReturnValue(value: { 
      to: jest.Mock,
      from: jest.Mock,
      kill: jest.Mock
    }): this & ((...args: any[]) => { 
      to: jest.Mock,
      from: jest.Mock,
      kill: jest.Mock
    });
  }
}

// Enhance window.matchMedia type for testing
interface Window {
  matchMedia: jest.MatchMediaMock | ((query: string) => MediaQueryList);
}

// Adds types for mocked MediaQueryList
interface MediaQueryList {
  matches: boolean;
  media: string;
  onchange: null | ((this: MediaQueryList, ev: MediaQueryListEvent) => any);
  addListener: jest.Mock;
  removeListener: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  dispatchEvent: jest.Mock;
}