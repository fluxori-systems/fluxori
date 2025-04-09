/**
 * Platform API Mocks
 * 
 * This file provides strongly typed mocks for platform-specific APIs.
 */

import { vi, type MockInstance } from 'vitest';

/**
 * Network information API mock with proper types
 */
export interface MockNetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListener, options?: boolean | EventListenerOptions) => void;
  dispatchEvent: (event: Event) => boolean;
}

/**
 * Creates a properly typed navigator.connection mock
 */
function createConnectionMock(config: Partial<MockNetworkInformation> = {}): MockNetworkInformation {
  return {
    effectiveType: config.effectiveType || '4g',
    downlink: config.downlink !== undefined ? config.downlink : 10,
    rtt: config.rtt !== undefined ? config.rtt : 100,
    saveData: config.saveData !== undefined ? config.saveData : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true)
  };
}

// Basic GSAP API shared types
type GSAPCallback = () => void;
type GSAPTarget = string | Element | Element[] | NodeList;

/**
 * Simple mock of GSAP
 * 
 * Creates a simplified version that works for testing without
 * all the complexity of the actual GSAP library.
 */
function createGSAPMock() {
  // Create a basic tween object that can be returned by to/from/etc.
  const createTween = () => {
    const tween = {
      kill: vi.fn(() => undefined),
      pause: vi.fn(() => tween),
      play: vi.fn(() => tween),
      restart: vi.fn(() => tween),
      resume: vi.fn(() => tween),
      reverse: vi.fn(() => tween),
      progress: vi.fn((value?: number) => typeof value === 'undefined' ? 0 : tween),
      duration: vi.fn((value?: number) => typeof value === 'undefined' ? 1 : tween),
      time: vi.fn((value?: number) => typeof value === 'undefined' ? 0 : tween)
    };
    return tween;
  };

  // Create a timeline object with chaining methods
  const createTimeline = () => {
    const timelineTween = createTween();
    const timeline = {
      ...timelineTween,
      to: vi.fn(() => timeline),
      from: vi.fn(() => timeline),
      fromTo: vi.fn(() => timeline),
      add: vi.fn(() => timeline),
      clear: vi.fn(() => timeline)
    };
    return timeline;
  };

  // Create the main GSAP object mock
  const gsapMock = {
    to: vi.fn(() => createTween()),
    from: vi.fn(() => createTween()),
    fromTo: vi.fn(() => createTween()),
    set: vi.fn(),
    timeline: vi.fn(() => createTimeline()),
    registerPlugin: vi.fn(),
    core: {
      Animation: {},
      PropTween: {},
      SimpleTimeline: {}
    },
    gsap: {} as any // Will be set below
  };

  // Make sure gsap.gsap has the same methods
  gsapMock.gsap = {
    to: gsapMock.to,
    from: gsapMock.from,
    fromTo: gsapMock.fromTo,
    set: gsapMock.set,
    timeline: gsapMock.timeline
  };

  return gsapMock;
}

/**
 * Setup all platform-specific API mocks
 */
export function setupMockPlatformAPIs(): void {
  // Mock navigator.connection
  Object.defineProperty(navigator, 'connection', {
    value: createConnectionMock(),
    configurable: true,
    writable: true,
  });
  
  // Set global GSAP mock
  (global as any).gsap = createGSAPMock();
  
  // Mock Next.js navigation
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
}

// Export individual mock creators
export {
  createConnectionMock,
  createGSAPMock
};