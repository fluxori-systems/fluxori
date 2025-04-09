/**
 * Type declarations for Vitest
 * This allows TypeScript to recognize Vitest functions without having to install the full package
 */

declare module 'vitest' {
  // Global variables
  export const it: TestFunction;
  export const describe: DescribeFunction;
  export const expect: ExpectFunction;
  export const vi: ViFunction;
  export const test: TestFunction;
  export const beforeAll: HookFunction;
  export const afterAll: HookFunction;
  export const beforeEach: HookFunction;
  export const afterEach: HookFunction;

  // Types and interfaces
  export interface MockInstance<T extends (...args: any) => any> {
    getMockName(): string;
    mock: {
      calls: Array<Parameters<T>>;
      results: Array<{ type: 'return' | 'throw'; value: ReturnType<T> }>;
      instances: Array<any>;
      invocationCallOrder: Array<number>;
      lastCall: Parameters<T>;
    };
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockReturnValueOnce(value: ReturnType<T>): this;
    mockResolvedValueOnce(value: ReturnType<T>): this;
    mockRejectedValueOnce(value: any): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockResolvedValue(value: ReturnType<T>): this;
    mockRejectedValue(value: any): this;
    mockImplementationOnce(fn: T): this;
    mockImplementation(fn: T): this;
    mockReturnThis(): this;
    mockName(name: string): this;
    getMockImplementation(): T | undefined;
  }

  interface TestOptions {
    skip?: boolean;
    only?: boolean;
    todo?: boolean;
    timeout?: number;
    skipIf?: boolean | (() => boolean);
    runIf?: boolean | (() => boolean);
    retry?: number;
    each?: any[];
  }

  interface ExpectStatic {
    <T>(actual: T): Assertions<T>;
    assertions(count: number): void;
    hasAssertions(): void;
    extend(matchers: Record<string, any>): void;
    // Common matcher factories
    objectContaining<T>(obj: Partial<T>): T;
    stringContaining(str: string): string;
    stringMatching(regex: RegExp | string): string;
    arrayContaining<T>(arr: Array<T>): Array<T>;
    // Type matchers
    any: any;
    anything(): any;
  }

  interface ViFunction {
    fn<T extends (...args: any) => any>(implementation?: T): MockInstance<T>;
    spyOn<T, M extends keyof T>(object: T, method: M): MockInstance<T[M] extends (...args: any) => any ? T[M] : any>;
    mock(path: string, factory?: () => any): any;
    unmock(path: string): void;
    mockSystemTime(date: Date | number, now?: () => number): void;
    resetModules(): void;
    resetAllMocks(): void;
    clearAllMocks(): void;
    stubGlobal(name: string, value: any): () => void;
    unstubAllGlobals(): void;
    useFakeTimers(): void;
    useRealTimers(): void;
    runAllTimers(): void;
    runOnlyPendingTimers(): void;
    advanceTimersByTime(ms: number): void;
    advanceTimersToNextTimer(steps?: number): void;
    setSystemTime(date: Date | number): void;
    getTimerCount(): number;
  }

  type TestFunction = {
    (name: string, fn: () => void | Promise<void>, options?: TestOptions): void;
    skip: TestFunction;
    only: TestFunction;
    todo: TestFunction;
    concurrent: TestFunction;
    each: (...args: any[]) => TestFunction;
  };

  type DescribeFunction = {
    (name: string, fn: () => void): void;
    skip: DescribeFunction;
    only: DescribeFunction;
    todo: DescribeFunction;
    concurrent: DescribeFunction;
    each: (...args: any[]) => DescribeFunction;
  };

  type HookFunction = (fn: () => void | Promise<void>, timeout?: number) => void;

  interface Assertions<T> {
    // Basic matchers
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toStrictEqual(expected: any): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeNaN(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeTypeOf(type: string): void;
    toBeInstanceOf(klass: any): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThan(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toBeCloseTo(n: number, digits?: number): void;
    toMatch(regexp: RegExp | string): void;
    toMatchObject(object: Record<string, any>): void;
    toMatchSnapshot(name?: string): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(n: number): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenLastCalledWith(...args: any[]): void;
    toContain(item: any): void;
    toContainEqual(item: any): void;
    toHaveLength(n: number): void;
    toHaveProperty(keyPath: string | string[], value?: any): void;
    toThrow(error?: string | RegExp | Error): void;
    toThrowError(error?: string | RegExp | Error): void;
    resolves: Assertions<Promise<T>>;
    rejects: Assertions<Promise<T>>;
    not: Assertions<T>;
  }

  type ExpectFunction = ExpectStatic;
}