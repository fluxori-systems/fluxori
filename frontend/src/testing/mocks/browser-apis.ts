/**
 * Browser API Mocks
 * 
 * This file provides strongly typed mocks for browser APIs
 * for testing components that interact with browser features.
 */

import { vi, type MockInstance } from 'vitest';

/**
 * Helper function to create properly typed mock functions
 */
export function createTypedMock<T = any>(
  implementation?: (...args: any[]) => T
): MockInstance<T> {
  return vi.fn<any[], T>(implementation) as MockInstance<T>;
}

/**
 * Mock IntersectionObserver implementation with proper types
 */
export class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '';
  thresholds: ReadonlyArray<number> = [0];

  constructor(
    private callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) {
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold];
    }
  }

  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

/**
 * Mock ResizeObserver implementation with proper types
 */
export class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(target: Element, options?: ResizeObserverOptions): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
}

/**
 * MediaQueryList-like object for testing
 */
export interface MediaQueryListMock {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
  addListener: (callback: (ev: MediaQueryListEvent) => any) => void;
  removeListener: (callback: (ev: MediaQueryListEvent) => any) => void;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => void;
  dispatchEvent: (event: Event) => boolean;
}

/**
 * Create a MediaQueryList-like object for testing
 */
export function createMediaQueryListMock(media: string, matches: boolean = false): MediaQueryListMock {
  return {
    matches,
    media,
    onchange: null, 
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true)
  };
}

/**
 * Create a properly typed matchMedia function for testing
 */
export function createMatchMediaMock(defaultMatches: boolean = false) {
  return function matchMedia(query: string): MediaQueryListMock {
    return createMediaQueryListMock(query, defaultMatches);
  };
}

/**
 * Setup all mock browser APIs
 */
export function setupMockBrowserAPIs(): void {
  // Mock IntersectionObserver
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver
  });

  // Mock ResizeObserver
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => createMediaQueryListMock(query))
  });

  // Mock scrollTo with generic implementation
  window.scrollTo = vi.fn() as any;

  // Mock Animation API if available
  if (typeof window.Animation !== 'undefined') {
    Object.defineProperty(window, 'Animation', {
      writable: true,
      configurable: true,
      value: class MockAnimation {
        finished = Promise.resolve();
        ready = Promise.resolve();
        id = '';
        onfinish = null;
        onremove = null;
        oncancel = null;
        
        cancel(): void {}
        finish(): void {}
        play(): void {}
        pause(): void {}
        reverse(): void {}
        updatePlaybackRate(playbackRate: number): void {}
        
        addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
        dispatchEvent(event: Event): boolean { return true; }
        
        timeline = null;
        startTime = 0;
        currentTime = 0;
        playbackRate = 1;
        playState = 'idle';
        replaceState = 'active';
        pending = false;
        effect = null;
        
        get time() { return 0; }
        set time(_) {}
      }
    });
  }
}