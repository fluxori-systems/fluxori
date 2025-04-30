/**
 * Type augmentations for Vitest
 *
 * This file provides proper TypeScript typing for Vitest functions
 * including vi.fn and MockInstance to resolve common TypeScript errors.
 */

import { vi, MockInstance as VitestMockInstance } from "vitest";

// Simplified mock interface for type safety
interface SimpleMock<TReturn = any, TArgs extends any[] = any[]> {
  (...args: TArgs): TReturn;
  mockReturnValue: (value: TReturn) => SimpleMock<TReturn, TArgs>;
  mockReturnValueOnce: (value: TReturn) => SimpleMock<TReturn, TArgs>;
  mockImplementation: (
    fn: (...args: TArgs) => TReturn,
  ) => SimpleMock<TReturn, TArgs>;
  mockClear: () => SimpleMock<TReturn, TArgs>;
  mockReset: () => SimpleMock<TReturn, TArgs>;
}

/**
 * Type-safe mock function creator
 */
export function createMock<TReturn = any, TArgs extends any[] = any[]>(
  implementation?: (...args: TArgs) => TReturn,
): SimpleMock<TReturn, TArgs> {
  // Always pass a defined function to vi.fn for type safety
  const impl = implementation ?? ((..._args: TArgs) => undefined as unknown as TReturn);
  return vi.fn(impl) as unknown as SimpleMock<TReturn, TArgs>;
}

/**
 * Type-safe mock function creator for callbacks
 */
export function createCallbackMock<TReturn = any>(
  returnValue?: TReturn,
): SimpleMock<TReturn, any[]> {
  return vi.fn().mockReturnValue(returnValue) as unknown as SimpleMock<
    TReturn,
    any[]
  >;
}

/**
 * Type-safe mock factory for browser event handlers
 */
export function createEventHandlerMock(): SimpleMock<void, [Event]> {
  return vi
    .fn()
    .mockImplementation((event: Event) => {}) as unknown as SimpleMock<
    void,
    [Event]
  >;
}

/**
 * Fix navigator.connection typing issues
 */
export function createConnectionMock(
  config: Partial<NetworkInformation> = {},
): NetworkInformation {
  return {
    effectiveType: config.effectiveType || "4g",
    downlink: config.downlink ?? 10,
    rtt: config.rtt ?? 50,
    saveData: config.saveData ?? false,
    onchange: undefined,
    addEventListener:
      vi.fn() as unknown as NetworkInformation["addEventListener"],
    removeEventListener:
      vi.fn() as unknown as NetworkInformation["removeEventListener"],
    dispatchEvent: vi
      .fn()
      .mockReturnValue(true) as unknown as NetworkInformation["dispatchEvent"],
  } as NetworkInformation;
}

/**
 * Apply these augmentations globally
 */
export function applyTypeAugmentations(): void {
  // Add these helper functions to 'vi' for global use
  Object.assign(vi, {
    createMock,
    createCallbackMock,
    createEventHandlerMock,
    createConnectionMock,
  });

  // Add network information to the global navigator type
  if (typeof navigator !== "undefined") {
    Object.defineProperty(navigator, "connection", {
      value: createConnectionMock(),
      configurable: true,
      writable: true,
    });
  }
}

// Auto-apply augmentations when imported
applyTypeAugmentations();
