/**
 * Network Testing Utilities
 * 
 * This file provides type-safe utilities for testing components
 * that depend on network information and connection quality.
 */

import { vi } from 'vitest';
import { MockNetworkInformation } from '../mocks/platform-apis';

/**
 * Network quality presets for South African market
 */
export const NetworkQuality = {
  HIGH: {
    effectiveType: '4g',
    downlink: 15,
    rtt: 50,
    saveData: false,
  },
  MEDIUM: {
    effectiveType: '4g',
    downlink: 5,
    rtt: 150,
    saveData: false,
  },
  LOW: {
    effectiveType: '3g',
    downlink: 1.5,
    rtt: 350,
    saveData: false,
  },
  POOR: {
    effectiveType: '2g',
    downlink: 0.4,
    rtt: 650, 
    saveData: false,
  },
  DATA_SAVER: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: true,
  },
  OFFLINE: {
    effectiveType: 'slow-2g',
    downlink: 0.1,
    rtt: 1000,
    saveData: false,
  }
} as const;

export type NetworkQualityPreset = keyof typeof NetworkQuality;

/**
 * Network test configuration
 */
export interface NetworkTestConfig extends Partial<MockNetworkInformation> {
  preset?: NetworkQualityPreset;
}

/**
 * Setup network conditions for testing with proper cleanup
 */
export function setupNetworkConditions(config: NetworkTestConfig = {}) {
  // Store original navigator for cleanup
  const originalNavigator = global.navigator;
  
  // Get preset values if a preset is specified
  const preset = config.preset ? NetworkQuality[config.preset] : undefined;
  
  // Create mock with preset or custom values
  const connectionMock = {
    effectiveType: config.effectiveType || preset?.effectiveType || '4g',
    downlink: config.downlink ?? preset?.downlink ?? 10,
    rtt: config.rtt ?? preset?.rtt ?? 100,
    saveData: config.saveData ?? preset?.saveData ?? false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true)
  };
  
  // Apply mock to navigator
  Object.defineProperty(navigator, 'connection', {
    value: connectionMock,
    configurable: true,
    writable: true,
  });
  
  // Create an update function to change network conditions mid-test
  const updateNetworkConditions = (newConfig: NetworkTestConfig = {}) => {
    const preset = newConfig.preset ? NetworkQuality[newConfig.preset] : undefined;
    
    // Update existing connection object with new values
    if (newConfig.effectiveType || preset?.effectiveType) {
      connectionMock.effectiveType = newConfig.effectiveType || preset?.effectiveType || connectionMock.effectiveType;
    }
    
    if (newConfig.downlink !== undefined || preset?.downlink !== undefined) {
      connectionMock.downlink = newConfig.downlink ?? preset?.downlink ?? connectionMock.downlink;
    }
    
    if (newConfig.rtt !== undefined || preset?.rtt !== undefined) {
      connectionMock.rtt = newConfig.rtt ?? preset?.rtt ?? connectionMock.rtt;
    }
    
    if (newConfig.saveData !== undefined || preset?.saveData !== undefined) {
      connectionMock.saveData = newConfig.saveData ?? preset?.saveData ?? connectionMock.saveData;
    }
    
    // Simulate a change event (create event only if dispatchEvent exists)
    if (typeof connectionMock.dispatchEvent === 'function') {
      const changeEvent = new Event('change');
      connectionMock.dispatchEvent(changeEvent);
    }
    
    return connectionMock;
  };
  
  // Return the mock, update function, and cleanup function
  return {
    connection: connectionMock,
    updateNetworkConditions,
    cleanup: () => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    },
  };
}

/**
 * Higher-order function for testing components with different network conditions
 */
export function withNetworkConditions<T extends (...args: any[]) => any>(
  testFn: T,
  networkConfig: NetworkTestConfig
): T {
  return (async (...args: any[]) => {
    // Setup network conditions
    const { cleanup, updateNetworkConditions } = setupNetworkConditions(networkConfig);
    
    try {
      // Run the test with the ability to update network conditions
      return await testFn({ updateNetworkConditions }, ...args);
    } finally {
      // Clean up
      cleanup();
    }
  }) as T;
}

/**
 * Creates a series of tests with different network conditions
 */
export function describeWithNetworkConditions(
  name: string,
  testFn: (utils: { network: ReturnType<typeof setupNetworkConditions> }) => void
) {
  describe(name, () => {
    // Initialize this before the tests run
    let networkUtils = setupNetworkConditions();
    
    beforeEach(() => {
      // Re-initialize in each test to ensure clean state
      networkUtils = setupNetworkConditions();
    });
    
    afterEach(() => {
      // Clean up after each test
      networkUtils.cleanup();
    });
    
    // Execute the test function with the network utilities
    testFn({ network: networkUtils });
  });
}