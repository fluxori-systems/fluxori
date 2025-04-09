/**
 * Vitest setup file
 * This file is run before tests to set up the testing environment
 */

import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Import DOM/global mocks
import { setupMockBrowserAPIs } from './src/testing/mocks/browser-apis';
import { setupMockPlatformAPIs } from './src/testing/mocks/platform-apis';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver
});

// Setup network connection API for tests
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true)
  },
  configurable: true,
  writable: true
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// IMPORTANT: Don't mock React hooks directly
// This causes "Invalid hook call" errors

// Mock GSAP
vi.mock('gsap', () => {
  // Create properly typed mock GSAP functions
  const createTween = () => ({ kill: vi.fn() });
  
  const createTimelineFunction = () => {
    return function() {
      return {
        to: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        fromTo: vi.fn().mockReturnThis(),
        kill: vi.fn()
      };
    };
  };
  
  return {
    to: vi.fn(() => createTween()),
    from: vi.fn(() => createTween()),
    set: vi.fn(),
    timeline: createTimelineFunction(),
    registerPlugin: vi.fn(),
    core: {
      Animation: vi.fn(),
      PropTween: vi.fn(),
      SimpleTimeline: vi.fn()
    },
    gsap: {
      to: vi.fn(() => createTween()),
      from: vi.fn(() => createTween()),
      set: vi.fn(),
      timeline: createTimelineFunction()
    }
  };
});

// Mock the theme context
vi.mock('./src/lib/design-system/theme/ThemeContext', () => {
  return {
    ThemeProvider: ({ children }) => children,
    useTheme: () => ({
      colorMode: 'light',
      setColorMode: vi.fn(),
      toggleColorMode: vi.fn(),
      tokens: {
        colors: {},
        spacing: {},
        typography: {},
        radii: {},
        shadows: {},
      },
    }),
  };
}, { virtual: true });

// Mock the motion context
vi.mock('./src/lib/motion/context/MotionContext', () => {
  return {
    MotionProvider: ({ children }) => children,
    useMotion: () => ({
      motionMode: 'full',
      setMotionMode: vi.fn(),
      isReducedMotion: false,
    }),
  };
}, { virtual: true });

// Add mock browser APIs
setupMockBrowserAPIs();
setupMockPlatformAPIs();

// Extend Vitest's expect with Jest-DOM matchers
expect.extend(matchers);

// For debugging
console.log('Vitest setup completed');