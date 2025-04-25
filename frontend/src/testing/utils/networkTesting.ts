/**
 * Network Testing Utilities
 * 
 * This file provides type-safe utilities for testing components
 * that depend on network information and connection quality.
 */

import { vi } from 'vitest';

import { createConnectionMock } from '../types/vitest-augmentations';

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
export interface NetworkTestConfig extends Partial<NetworkInformation> {
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
  const connectionMock = createConnectionMock({
    effectiveType: config.effectiveType || preset?.effectiveType,
    downlink: config.downlink ?? preset?.downlink,
    rtt: config.rtt ?? preset?.rtt,
    saveData: config.saveData ?? preset?.saveData,
  });
  
  // Apply mock to navigator
  Object.defineProperty(navigator, 'connection', {
    value: connectionMock,
    configurable: true,
    writable: true,
  });
  
  // Create a safe way to update the connection mock
  const updateNetworkConditions = (newConfig: NetworkTestConfig = {}) => {
    const preset = newConfig.preset ? NetworkQuality[newConfig.preset] : undefined;
    
    // Create a new mock with updated values
    const newConnectionMock = createConnectionMock({
      effectiveType: newConfig.effectiveType || preset?.effectiveType || connectionMock.effectiveType,
      downlink: newConfig.downlink ?? preset?.downlink ?? connectionMock.downlink,
      rtt: newConfig.rtt ?? preset?.rtt ?? connectionMock.rtt,
      saveData: newConfig.saveData ?? preset?.saveData ?? connectionMock.saveData,
    });
    
    // Apply new mock to navigator
    Object.defineProperty(navigator, 'connection', {
      value: newConnectionMock,
      configurable: true,
      writable: true,
    });
    
    // Simulate a change event
    try {
      const changeEvent = new Event('change');
      newConnectionMock.dispatchEvent(changeEvent);
    } catch (e) {
      console.warn('Could not dispatch connection change event', e);
    }
    
    return newConnectionMock;
  };
  
  // Return utilities
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
export function withNetworkConditions<T>(
  testFn: (utils: { updateNetworkConditions: (config?: NetworkTestConfig) => NetworkInformation }, ...args: any[]) => T,
  networkConfig: NetworkTestConfig
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    // Setup network conditions
    const networkUtils = setupNetworkConditions(networkConfig);
    
    try {
      // Run the test with the ability to update network conditions
      return await testFn({ updateNetworkConditions: networkUtils.updateNetworkConditions }, ...args);
    } finally {
      // Clean up
      networkUtils.cleanup();
    }
  };
}

/**
 * Creates a series of tests with different network conditions
 */
export function describeWithNetworkConditions(
  name: string,
  testFn: (utils: { network: ReturnType<typeof setupNetworkConditions> }) => void
) {
  describe(name, () => {
    let networkUtils: ReturnType<typeof setupNetworkConditions>;
    
    beforeEach(() => {
      // Re-initialize in each test to ensure clean state
      networkUtils = setupNetworkConditions();
      
      // Execute the test function with the network utilities
      testFn({ network: networkUtils });
    });
    
    afterEach(() => {
      // Clean up after each test
      networkUtils.cleanup();
    });
  });
}