/**
 * Properly typed Jest setup file
 * This file provides TypeScript-compatible setup for Jest tests
 */

import '@testing-library/jest-dom';
import 'jest-environment-jsdom';
import './src/types/jest-mock';  // Import our enhanced types

/**
 * Properly typed IntersectionObserver mock
 */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  observe: jest.Mock = jest.fn();
  disconnect: jest.Mock = jest.fn();
  unobserve: jest.Mock = jest.fn();
  takeRecords: jest.Mock = jest.fn().mockReturnValue([]);
}

// Apply the mock to window
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
});

/**
 * Create a properly typed matchMedia mock
 * This avoids type errors when mocking complex browser APIs
 */
const matchMediaMock = () => {
  return function matchMedia(query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
};

// Apply the mock to window.matchMedia with proper type casting
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn(matchMediaMock()),
});

/**
 * Properly typed ResizeObserver mock
 */
class MockResizeObserver implements ResizeObserver {
  observe: jest.Mock = jest.fn();
  disconnect: jest.Mock = jest.fn();
  unobserve: jest.Mock = jest.fn();
}

// Apply the mock to window
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver
});

// Mock scrollTo with proper typing
window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;

/**
 * Mock requestAnimationFrame with proper return type
 */
global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback): number => {
  setTimeout(callback, 0);
  return 0;
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = jest.fn() as unknown as typeof global.cancelAnimationFrame;

/**
 * Create properly typed GSAP mock
 * This ensures complex return types work correctly
 */
jest.mock('gsap', () => {
  const mockKillFunction = jest.fn();
  const mockToFunction = jest.fn().mockReturnValue({ kill: mockKillFunction });
  const mockFromFunction = jest.fn().mockReturnValue({ kill: mockKillFunction });
  const mockSetFunction = jest.fn();
  
  const mockTimelineToFunction = jest.fn().mockReturnThis();
  const mockTimelineFromFunction = jest.fn().mockReturnThis();
  const mockTimelineKillFunction = jest.fn();
  
  const mockTimelineFunction = jest.fn().mockReturnValue({
    to: mockTimelineToFunction,
    from: mockTimelineFromFunction,
    kill: mockTimelineKillFunction
  });
  
  const mockRegisterPluginFunction = jest.fn();
  
  return {
    to: mockToFunction,
    from: mockFromFunction,
    set: mockSetFunction,
    timeline: mockTimelineFunction,
    registerPlugin: mockRegisterPluginFunction,
    core: {
      Animation: jest.fn(),
      PropTween: jest.fn(),
      SimpleTimeline: jest.fn()
    },
    gsap: {
      to: mockToFunction,
      from: mockFromFunction,
      set: mockSetFunction,
      timeline: mockTimelineFunction
    }
  };
});

/**
 * Create properly typed navigator.connection mock
 */
type ConnectionMock = {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

const connectionMock: ConnectionMock = {
  effectiveType: '4g',
  downlink: 10,
  rtt: 50,
  saveData: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Apply the connection mock
Object.defineProperty(navigator, 'connection', {
  value: connectionMock,
  configurable: true
});