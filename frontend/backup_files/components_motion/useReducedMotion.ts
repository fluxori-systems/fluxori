import { useEffect, useState } from 'react';
import { REDUCED_MOTION_SETTINGS, DURATION } from './constants';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Hook that detects if user prefers reduced motion
 * and provides adjusted animation settings
 */
export function useReducedMotion() {
  // Initialize to false to ensure animations work even if JS disabled
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Update value when user preference changes
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  }, []);

  /**
   * Adjust duration based on reduced motion preference
   */
  const getDuration = (defaultDuration: number): number => {
    if (prefersReducedMotion) {
      if (REDUCED_MOTION_SETTINGS.DISABLE_TRANSITIONS) {
        return 0;
      }
      return defaultDuration * REDUCED_MOTION_SETTINGS.DURATION_MULTIPLIER;
    }
    return defaultDuration;
  };

  /**
   * Get animation settings with respect to user preference
   */
  const getAnimationSettings = (type: keyof typeof DURATION = 'NORMAL') => {
    const baseDuration = DURATION[type];
    
    return {
      enabled: !prefersReducedMotion || !REDUCED_MOTION_SETTINGS.DISABLE_ANIMATIONS,
      duration: getDuration(baseDuration),
      prefersReducedMotion,
    };
  };

  return {
    prefersReducedMotion,
    getDuration,
    getAnimationSettings,
  };
}