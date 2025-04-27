/**
 * Fluxori Motion Framework
 *
 * A comprehensive framework for animations and transitions
 * with a focus on accessibility, performance, and consistent
 * animation patterns optimized for the South African market.
 */

// Context
export { MotionProvider, useMotion } from "./context/MotionContext";
export type { MotionContextProps } from "./context/MotionContext";
export type { MotionMode } from "../shared/types/motion-types";

// Hooks
export { useReducedMotion } from "./hooks/useReducedMotion";
export { useConnectionQuality } from "./hooks/useConnectionQuality";
export type { ConnectionQuality } from "./hooks/useConnectionQuality";
export { useGSAPAnimation } from "./hooks/useGSAPAnimation";
export type {
  AnimationOptions,
  AnimationTarget,
  AnimationType,
  SlideDirection,
  SlideAnimationOptions,
  ScaleAnimationOptions,
  BounceAnimationOptions,
  HighlightAnimationOptions,
  ShakeAnimationOptions,
} from "./hooks/useGSAPAnimation";
export { useSouthAfricanPerformance } from "./hooks/useSouthAfricanPerformance";
export type { SouthAfricanPerformanceData } from "./hooks/useSouthAfricanPerformance";
export { useAnimationPerformance } from "./hooks/useAnimationPerformance";
export { usePerformanceMonitoring } from "./hooks/usePerformanceMonitoring";

// Components
export { AIProcessingIndicator } from "./components/AIProcessingIndicator";
export type { AIProcessingIndicatorProps } from "./components/AIProcessingIndicator";
export { StreamingText } from "./components/StreamingText";
export type { StreamingTextProps } from "./components/StreamingText";
export { TransitionFade } from "./components/TransitionFade";
export type { TransitionFadeProps } from "./components/TransitionFade";
export { IconFeedback } from "./components/IconFeedback";
export type { IconFeedbackProps } from "./components/IconFeedback";
export { AnimatedTabIndicator } from "./components/AnimatedTabIndicator";
export type { AnimatedTabIndicatorProps } from "./components/AnimatedTabIndicator";
export { ConnectionQualitySimulator } from "./components/ConnectionQualitySimulator";
export { default as SouthAfricanOptimizedContainer } from "./components/SouthAfricanOptimizedContainer";
export { default as AIResponseOptimizer } from "./components/AIResponseOptimizer";

// Utils
export {
  durations,
  easings,
  aiAnimations,
  complexityPresets,
} from "./utils/motion-tokens";
export type {
  MotionDurations,
  MotionEasings,
  AIAnimationTokens,
  ConfidenceLevel,
  ComplexityPreset,
} from "./utils/motion-tokens";

// GSAP utilities
export {
  initGSAP,
  getPerformanceMetrics,
  killAllAnimations,
  applyComplexityToTween,
} from "./gsap/gsap-core";

// GSAP Business License features (requires activation with valid license)
export {
  initGSAPBusiness,
  SplitTextUtils,
  SVGUtils,
  FlipUtils,
  TextUtils,
  PhysicsUtils,
  CustomEasingUtils,
} from "./gsap/gsap-business";

// South African market optimizations
export {
  getDeviceProfile,
  getNetworkProfile,
  southAfricanDeviceProfiles,
  southAfricanNetworkProfiles,
} from "./data/device-profiles";
export type {
  DeviceProfile,
  NetworkProfile,
  DeviceType,
  NetworkProvider,
  LocationType,
  ProcessorTier,
} from "./data/device-profiles";
