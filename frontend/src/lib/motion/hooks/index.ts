/**
 * Motion system hooks index
 */

export { useAnimationPerformance } from "./useAnimationPerformance";
export { useConnectionQuality } from "./useConnectionQuality";
export type {
  ConnectionQuality,
  ConnectionQualityResult,
} from "./useConnectionQuality";
export { useGSAPAnimation } from "./useGSAPAnimation";
export { usePerformanceMonitoring } from "./usePerformanceMonitoring";
export { useReducedMotion } from "./useReducedMotion";
export { useAnimationService, useConnectionService } from "./useServices";
export { useSouthAfricanPerformance } from "./useSouthAfricanPerformance";

// Add useMotionMode export from context
export { useMotion as useMotionMode } from "../context/MotionContext";
