/**
 * Extension of Navigator interface for NetworkInformation API
 * Provides types for connection information features used in the application
 */

interface NetworkInformation {
  /** Effective type of the connection (4g, 3g, 2g, etc.) */
  effectiveType?: string;
  
  /** Estimated download bandwidth in Mbps */
  downlink?: number;
  
  /** Round trip time in ms */
  rtt?: number;
  
  /** Whether the user has enabled data saver mode */
  saveData?: boolean;
  
  /** Whether the connection is metered (pay-per-use) */
  metered?: boolean;
  
  /** The type of connection (wifi, cellular, etc.) */
  type?: string;
  
  /** Add event listener for connection changes */
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  
  /** Remove event listener for connection changes */
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

interface Navigator {
  /** Network connection information - experimental API */
  connection?: NetworkInformation;
  
  /** Legacy network information (for Safari) */
  mozConnection?: NetworkInformation;
  
  /** Legacy network information (for Webkit) */
  webkitConnection?: NetworkInformation;
}