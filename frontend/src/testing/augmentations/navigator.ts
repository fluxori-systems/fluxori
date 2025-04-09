/**
 * Type declarations for Navigator extensions used in testing
 */

interface NavigatorConnection {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  dispatchEvent: (event: Event) => boolean;
}

// Extend the Navigator interface to include the connection property
declare global {
  interface Navigator {
    connection?: NavigatorConnection;
  }
}

export {};