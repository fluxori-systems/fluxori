/**
 * useDebounce Hook
 * 
 * Debounces a value with network-aware delay.
 */
import { useState, useEffect } from 'react';

import { useNetworkStatus } from './useNetworkStatus';

/**
 * Network-aware debounce hook
 * 
 * @param value Value to debounce
 * @param delay Delay in milliseconds
 * @param options Options for debounce behavior
 * @returns Debounced value
 */
export function useDebounce<T>(
  value: T, 
  delay: number,
  options: {
    networkAware?: boolean;
    minDelay?: number;
    maxDelay?: number;
  } = {}
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const { connectionQuality, isOnline } = useNetworkStatus();
  
  useEffect(() => {
    const { networkAware = true, minDelay = 100, maxDelay = 2000 } = options;
    
    // Adjust delay based on network conditions
    let adjustedDelay = delay;
    
    if (networkAware && isOnline) {
      if (connectionQuality === "poor" || connectionQuality === "critical") {
        // Increase delay for poor connections to reduce API calls
        adjustedDelay = Math.min(delay * 2, maxDelay);
      } else if (connectionQuality === "excellent" || connectionQuality === "good") {
        // Decrease delay for excellent connections
        adjustedDelay = Math.max(delay / 2, minDelay);
      }
    }
    
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, adjustedDelay);
    
    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, connectionQuality, isOnline, options]);
  
  return debouncedValue;
}

export default useDebounce;