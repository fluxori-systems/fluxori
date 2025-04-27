/**
 * Custom type definitions for jest
 */
declare module "jest" {
  export interface MockFunctionMetadata {
    name: string;
    length: number;
    type?: string;
  }

  export interface Mock<T = any, Y extends any[] = any> {
    (...args: Y): T;
    mock: {
      calls: Y[];
      instances: T[];
      invocationCallOrder: number[];
      results: Array<{ type: "return" | "throw"; value: any }>;
      lastCall: Y;
    };
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockReturnValueOnce(value: T): this;
    mockResolvedValueOnce(value: any): this;
    mockRejectedValueOnce(value: any): this;
    mockReturnValue(value: T): this;
    mockResolvedValue(value: any): this;
    mockRejectedValue(value: any): this;
    mockImplementationOnce(fn: (...args: Y) => T): this;
    mockImplementation(fn: (...args: Y) => T): this;
    getMockName(): string;
    mockName(name: string): this;
    mockReturnThis(): this;
  }

  export type SpyOnProperty<T, K extends keyof T> = T[K] extends (
    ...args: any[]
  ) => any
    ? Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
}
