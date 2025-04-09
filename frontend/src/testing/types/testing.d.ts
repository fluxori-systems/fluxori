// Global test-related type definitions

// NetworkInformation interface for navigator.connection
interface NetworkInformation {
  readonly effectiveType: string;
  readonly downlink: number;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  readonly downlinkMax?: number;
  readonly onchange: null | ((this: NetworkInformation, ev: Event) => any);
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: Event): boolean;
}

// Extended Navigator interface with connection property
interface Navigator {
  readonly connection?: NetworkInformation;
}

// Add Testing Library custom matchers
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveStyle(style: Record<string, any>): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
  }
}

// Vitest testing types
declare namespace Vi {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveAttribute(attr: string, value?: string): T;
    toBeVisible(): T;
    toHaveTextContent(text: string | RegExp): T;
    toHaveStyle(style: Record<string, any>): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
  }

  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toHaveAttribute(attr: string, value?: string): any;
    toBeVisible(): any;
    toHaveTextContent(text: string | RegExp): any;
    toHaveStyle(style: Record<string, any>): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
  }
}
