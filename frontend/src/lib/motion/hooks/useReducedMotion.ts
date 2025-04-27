"use client";

import { useMotion } from "../context/MotionContext";

/**
 * Hook to determine if animations should be reduced or disabled
 *
 * @returns {boolean} True if animations should be reduced
 */
export function useReducedMotion(): boolean {
  const { motionMode, prefersReducedMotion } = useMotion();

  // If user explicitly selected reduced/minimal mode, or system prefers reduced motion
  return motionMode !== "full" || Boolean(prefersReducedMotion);
}
