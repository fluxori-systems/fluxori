import { useEffect, useState } from 'react';
import { breakpoints } from '../theme';

type MediaQuerySize = keyof typeof breakpoints | number;

/**
 * Hook to check if a media query matches
 * 
 * @param query Media query to check, can be a breakpoint key (xs, sm, md, lg, xl) or a custom query
 * @param defaultValue Default value to use before the media query is evaluated
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * // Using named breakpoints
 * const isMobile = useMediaQuery('xs');
 * 
 * // Using custom queries
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 */
export function useMediaQuery(
  query: MediaQuerySize | string,
  defaultValue: boolean = false
): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    // Don't run in SSR
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Create media query string
    let mediaQuery: string;

    if (typeof query === 'string' && query in breakpoints) {
      // If it's a named breakpoint (xs, sm, md, lg, xl)
      mediaQuery = `(max-width: ${breakpoints[query as keyof typeof breakpoints]}px)`;
    } else if (typeof query === 'number') {
      // If it's a number, use it as a pixel breakpoint
      mediaQuery = `(max-width: ${query}px)`;
    } else {
      // Otherwise use it as a raw media query
      mediaQuery = query;
    }

    // Create media query list and event listener
    const mediaQueryList = window.matchMedia(mediaQuery);
    
    const updateMatches = () => {
      setMatches(mediaQueryList.matches);
    };

    // Set initial value
    updateMatches();

    // Add listener for changes
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(updateMatches);
    }

    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', updateMatches);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(updateMatches);
      }
    };
  }, [query]);

  return matches;
}