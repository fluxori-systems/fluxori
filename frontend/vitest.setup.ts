/**
 * Vitest setup file
 * This file is run before tests to set up the testing environment
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
// @ts-ignore - Complex mock structure
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

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
  return 0;
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn();

// Mock GSAP
vi.mock('gsap', () => {
  return {
    // @ts-ignore - Complex mock structure
    to: vi.fn().mockReturnValue({
      kill: vi.fn()
    }),
    // @ts-ignore - Complex mock structure
    from: vi.fn().mockReturnValue({
      kill: vi.fn()
    }),
    set: vi.fn(),
    // @ts-ignore - Complex mock structure
    timeline: vi.fn().mockReturnValue({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      kill: vi.fn()
    }),
    registerPlugin: vi.fn(),
    core: {
      Animation: vi.fn(),
      PropTween: vi.fn(),
      SimpleTimeline: vi.fn()
    },
    gsap: {
      // @ts-ignore - Complex mock structure
      to: vi.fn().mockReturnValue({
        kill: vi.fn()
      }),
      // @ts-ignore - Complex mock structure
      from: vi.fn().mockReturnValue({
        kill: vi.fn()
      }),
      set: vi.fn(),
      // @ts-ignore - Complex mock structure
      timeline: vi.fn().mockReturnValue({
        to: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        kill: vi.fn()
      })
    }
  };
});

// Setup for network detection API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  configurable: true
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

// Add custom matchers for UI components if needed
// expect.extend(customMatchers);

// Add any additional setup needed for Vitest