"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook that detects if the user prefers reduced motion
 * Used to provide alternative animations or disable animations entirely
 * for users who have set their system preferences to reduce motion
 *
 * @returns Boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  // Default to not animating (more accessible) until we know the user's preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    // Check for the media query
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Add listener for changes
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  return prefersReducedMotion;
}
