/**
 * Type declarations for Jest compatibility
 * Provides Jest-compatible type definitions to support existing test files
 */

// Map Jest globals to Vitest
declare namespace jest {
  // Mock function type
  export type Mock<T extends (...args: any) => any> = {
    (...args: Parameters<T>): ReturnType<T>;
    mock: {
      calls: Array<Parameters<T>>;
      results: Array<{ type: 'return' | 'throw'; value: ReturnType<T> }>;
      instances: Array<any>;
      invocationCallOrder: Array<number>;
      lastCall: Parameters<T>;
    };
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
    mockReturnValueOnce(value: ReturnType<T>): jest.Mock<T>;
    mockResolvedValueOnce(value: ReturnType<T>): jest.Mock<T>;
    mockRejectedValueOnce(value: any): jest.Mock<T>;
    mockReturnValue(value: ReturnType<T>): jest.Mock<T>;
    mockResolvedValue(value: ReturnType<T>): jest.Mock<T>;
    mockRejectedValue(value: any): jest.Mock<T>;
    mockImplementationOnce(fn: T): jest.Mock<T>;
    mockImplementation(fn: T): jest.Mock<T>;
    mockReturnThis(): jest.Mock<T>;
    mockName(name: string): jest.Mock<T>;
    getMockName(): string;
  };

  // Jest function API (redirects to vitest)
  export function fn<T extends (...args: any) => any>(implementation?: T): Mock<T>;
  export function spyOn<T, M extends keyof T>(object: T, method: M): Mock<T[M] extends (...args: any) => any ? T[M] : any>;
  export function resetAllMocks(): void;
  export function clearAllMocks(): void;
}

// Global properties
declare global {
  namespace jest {
    function fn<T extends (...args: any) => any>(implementation?: T): jest.Mock<T>;
    function spyOn<T, M extends keyof T>(object: T, method: M): jest.Mock<T[M] extends (...args: any) => any ? T[M] : any>;
    function resetAllMocks(): void;
    function clearAllMocks(): void;
  }
}