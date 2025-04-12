/**
 * Vitest Testing Utilities
 * This file provides utilities for testing with Vitest
 */

import { vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Theme Provider mock (using a regular function to avoid JSX in .ts files)
export const MockThemeProvider = ({ children }: {children: React.ReactNode}) => {
  return React.createElement(React.Fragment, null, children);
};

// Motion Provider mock (using a regular function to avoid JSX in .ts files)
export const MockMotionProvider = ({ children }: {children: React.ReactNode}) => {
  return React.createElement(React.Fragment, null, children);
};

// Mock providers for testing components (using createElement instead of JSX)
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    React.createElement(
      MockThemeProvider, 
      null, 
      React.createElement(MockMotionProvider, null, ui)
    )
  );
}

// Create a mock for matchMedia
export function createMatchMediaMock(matches = false) {
  // Define proper interface for MediaQueryList
  interface MockedMediaQueryList {
    matches: boolean;
    media: string;
    onchange: null | ((this: MediaQueryList, ev: MediaQueryListEvent) => any);
    addListener: (callback: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => void;
    removeListener: (callback: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => void;
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    dispatchEvent: (event: Event) => boolean;
  }
  
  return vi.fn().mockImplementation((query: string): MockedMediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Create navigator connection mock
export function createNavigatorConnectionMock({
  effectiveType = '4g',
  downlink = 10,
  rtt = 50,
  saveData = false,
  metered = false
} = {}): Partial<NetworkInformation> {
  return {
    effectiveType,
    downlink,
    rtt,
    saveData,
    onchange: undefined, // Changed null to undefined
    addEventListener: vi.fn() as unknown as NetworkInformation['addEventListener'],
    removeEventListener: vi.fn() as unknown as NetworkInformation['removeEventListener'],
    dispatchEvent: vi.fn().mockReturnValue(true) as unknown as NetworkInformation['dispatchEvent'],
  };
}

// Create mock for animation-related browser APIs
export function setupAnimationMocks() {
  // Mock requestAnimationFrame
  global.requestAnimationFrame = callback => {
    setTimeout(callback, 0);
    return 0;
  };

  // Mock performance.now()
  if (!window.performance) {
    Object.defineProperty(window, 'performance', {
      value: { now: () => Date.now() },
      writable: true,
    });
  } else {
    window.performance.now = () => Date.now();
  }

  // Mock cancelAnimationFrame
  global.cancelAnimationFrame = (handle: number): void => {};

  return {
    cleanup: () => {
      // Reset mocks if needed
      vi.resetAllMocks();
    }
  };
}

// Custom matchers for UI component testing
export const customMatchers = {
  toHaveVariant: (received: HTMLElement, variant: string) => {
    const pass = received.classList.contains(`variant-${variant}`);
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to have variant ${variant}`
          : `Expected element to have variant ${variant}`,
    };
  },
  toHaveIntent: (received: HTMLElement, intent: string) => {
    const pass = received.classList.contains(`intent-${intent}`);
    return {
      pass,
      message: () => 
        pass 
          ? `Expected element not to have intent ${intent}`
          : `Expected element to have intent ${intent}`,
    };
  },
};

// Test setup and cleanup utilities
export function setupTest() {
  const mediaMatchMock = createMatchMediaMock();
  const originalMatchMedia = window.matchMedia;
  const animationMocks = setupAnimationMocks();
  
  // Setup mocks
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mediaMatchMock,
  });
  
  // Return cleanup function
  return () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    animationMocks.cleanup();
    vi.resetAllMocks();
  };
}