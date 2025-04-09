// Type declarations for Vitest mocks

/**
 * Better types for Vitest mocks that are compatible with components
 */
declare module "vitest" {
  interface MockInstance<Args extends any[] = any[], Returns = any> {
    mockImplementation(implementation: (...args: Args) => Returns): this;
    mockReturnValue(value: Returns): this;
    mockResolvedValue(value: Awaited<Returns>): this;
    mockRejectedValue(error: unknown): this;
    mockReturnValueOnce(value: Returns): this;
    mockResolvedValueOnce(value: Awaited<Returns>): this;
    mockRejectedValueOnce(value: unknown): this;
    mockReset(): this;
    mockRestore(): this;
    mockClear(): this;
    getMockName(): string;
    mockName(name: string): this;
    mockImplementationOnce(implementation: (...args: Args) => Returns): this;
    mockReturnThis(): this;
    mockReturnedThis(): this;
    getMockImplementation(): ((...args: Args) => Returns) | undefined;
    mock: {
      calls: Args[];
      instances: any[];
      invocationCallOrder: number[];
      results: ({ type: 'return'; value: Returns; } | { type: 'throw'; value: any; })[];
      lastCall: Args;
    };
    // Allow calling the mocked function
    (...args: Args): Returns;
  }

  export const fn: {
    <Return = any>(implementation?: (...args: any[]) => Return): MockInstance<any[], Return>;
    <Args extends any[] = any[], Return = any>(implementation?: (...args: Args) => Return): MockInstance<Args, Return>;
  };

  interface ViMockOptions {
    importActual?: boolean | string;
    mockImplementation?: (...args: any[]) => any;
    mockReturnValue?: any;
  }

  export const mock: {
    (path: string, options?: ViMockOptions): void;
    restoreAllMocks(): void;
    resetAllMocks(): void;
    clearAllMocks(): void;
  };

  export const importActual: <T>(path: string) => Promise<T>;

  interface InlineSnapshot {
    (snapshot: string): void;
    (properties: { [key: string]: unknown }, snapshot: string): void;
  }

  interface MatcherFunction<R = unknown> {
    (received: unknown, ...expected: unknown[]): R;
  }

  interface MatcherContext {
    readonly isNot: boolean;
    readonly promise: string;
    readonly toLabeledMatcher: (matcher: string, content: string, hint?: string) => string;
    readonly printLabel: (label: string, content: string) => string;
    readonly utils: {
      readonly getType: (value: unknown) => string;
      readonly printReceived: (object: unknown) => string;
      readonly printExpected: (value: unknown) => string;
      readonly diff: (a: unknown, b: unknown, options?: { expand?: boolean }) => string | null;
      readonly deepEqual: (a: unknown, b: unknown) => boolean;
      readonly replaceTrailingComment: (text: string, comment: string) => string;
      readonly subsetEquality: (object: unknown, subset: unknown) => boolean | undefined;
      readonly iterableEquality: (a: unknown, b: unknown, iterableEqualitySnapshotGuids?: [Set<unknown>, Set<unknown>]) => boolean | undefined;
      readonly getLabelPrinter: () => (key: string, value: string) => string;
      readonly snapshot: {
        readonly toMatchSnapshot: InlineSnapshot;
        readonly snapshotState: Set<string>;
      };
    };
  }

  interface AsymmetricMatcher {
    asymmetricMatch(received: unknown): boolean;
    toString(): string;
    toAsymmetricMatcher?(): string;
  }
}
