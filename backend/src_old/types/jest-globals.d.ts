/**
 * Custom type definitions for @jest/globals
 */
declare module "@jest/globals" {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: <T>(actual: T) => {
    toBe: (expected: T) => void;
    toEqual: (expected: any) => void;
    toBeDefined: () => void;
    toBeUndefined: () => void;
    toBeNull: () => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
    toContain: (expected: any) => void;
    toHaveProperty: (property: string, value?: any) => void;
    toMatchObject: (expected: any) => void;
    toThrow: (error?: any) => void;
    resolves: any;
    rejects: any;
  };
  export const beforeAll: (fn: () => void | Promise<void>) => void;
  export const afterAll: (fn: () => void | Promise<void>) => void;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  export const jest: any;
}
