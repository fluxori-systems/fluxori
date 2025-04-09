/**
 * Type augmentations for Vitest
 * 
 * This file provides proper TypeScript typing for Vitest functions
 * including vi.fn and MockInstance to resolve common TypeScript errors.
 */

import { vi, type MockInstance } from 'vitest';

/**
 * Type-safe mock function creator that returns a properly typed MockInstance
 */
export function createMock<Args extends any[] = any[], Returns = any>(
  implementation?: (...args: Args) => Returns
): any {
  return vi.fn(implementation);
}

/**
 * Type-safe mock function creator for callbacks
 */
export function createCallbackMock<Args extends any[] = any[], Returns = any>(
  returnValue?: Returns
): any {
  return vi.fn().mockReturnValue(returnValue);
}

/**
 * Type-safe mock factory for browser event handlers
 */
export function createEventHandlerMock(): any {
  return vi.fn().mockImplementation(() => {});
}

/**
 * Fix navigator.connection typing issues
 */
export function createConnectionMock(config: Partial<NetworkInformation> = {}): NetworkInformation {
  const mock = {
    effectiveType: config.effectiveType || '4g',
    downlink: config.downlink ?? 10,
    rtt: config.rtt ?? 50,
    saveData: config.saveData ?? false,
    onchange: undefined, // Changed from null to undefined
    addEventListener: vi.fn() as unknown as NetworkInformation['addEventListener'],
    removeEventListener: vi.fn() as unknown as NetworkInformation['removeEventListener'],
    dispatchEvent: vi.fn().mockReturnValue(true) as unknown as NetworkInformation['dispatchEvent'],
  };
  
  return mock as NetworkInformation;
}

/**
 * Apply these augmentations globally
 */
export function applyTypeAugmentations() {
  // Add these helper functions to 'vi' for global use
  (vi as any).createMock = createMock;
  (vi as any).createCallbackMock = createCallbackMock;
  (vi as any).createEventHandlerMock = createEventHandlerMock;
  (vi as any).createConnectionMock = createConnectionMock;

  // Add network information to the global navigator type
  Object.defineProperty(navigator, 'connection', {
    value: createConnectionMock(),
    configurable: true,
    writable: true,
  });
  
  // Add importActual to vi
  (vi as any).importActual = async (modulePath: string) => {
    // This is a simple mock - in real code this would actually import the module
    return await import(modulePath);
  };
}

// Auto-apply augmentations when imported
applyTypeAugmentations();