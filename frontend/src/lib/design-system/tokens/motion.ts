/**
 * Motion tokens for the Fluxori Design System
 * Defines animation durations and easing functions
 * Based on the Motion Design Framework principles:
 * 1. Purposeful Intelligence
 * 2. Fluid Efficiency
 * 3. Precision & Accuracy
 */

interface MotionTokens {
  durations: {
    // Basic durations
    microInteraction: string; // 100-150ms
    elementTransition: string; // 200-300ms
    pageTransition: string; // 300-400ms
    dataVisualization: string; // 500-800ms
    agentThinking: string; // Ongoing
    highStakesConfirmation: string; // 400-600ms

    // Legacy values for backward compatibility
    instant: string;
    fast: string;
    normal: string;
    slow: string;
  };
  easings: {
    // Animation purpose-specific easings
    standard: string; // General UI transitions
    emphasis: string; // Attention-grabbing animations
    decelerate: string; // Elements entering the screen
    accelerate: string; // Elements leaving the screen
    sharp: string; // Quick, energetic movements

    // Legacy/specific easings
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    linear: string;
    bounce: string;
    pageTransition: string; // Special easing for page transitions
  };
  confidenceIndicators: {
    low: {
      duration: string;
      easing: string;
      intensity: string;
    };
    medium: {
      duration: string;
      easing: string;
      intensity: string;
    };
    high: {
      duration: string;
      easing: string;
      intensity: string;
    };
  };
  staggering: {
    default: string;
    fast: string;
    slow: string;
  };
}

/**
 * Motion tokens for animations and transitions
 * Carefully calibrated for performance and South African market optimization
 */
export const motion: MotionTokens = {
  durations: {
    // Motion timing reference values from design system
    microInteraction: "150ms",
    elementTransition: "250ms",
    pageTransition: "350ms",
    dataVisualization: "600ms",
    agentThinking: "800ms",
    highStakesConfirmation: "500ms",

    // Legacy values
    instant: "100ms",
    fast: "200ms",
    normal: "300ms",
    slow: "500ms",
  },
  easings: {
    // Purpose-specific easings
    standard: "cubic-bezier(0.4, 0, 0.2, 1)", // Material standard
    emphasis: "cubic-bezier(0.4, 0, 0.6, 1)", // Slight overshoot
    decelerate: "cubic-bezier(0, 0, 0.2, 1)", // Gentle entry
    accelerate: "cubic-bezier(0.4, 0, 1, 1)", // Quick exit
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)", // Energetic

    // Legacy/specific easings
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    pageTransition: "cubic-bezier(0.83, 0, 0.17, 1)", // Custom page transition easing
  },
  confidenceIndicators: {
    low: {
      duration: "400ms",
      easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Bouncy
      intensity: "0.8",
    },
    medium: {
      duration: "300ms",
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Slight overshoot
      intensity: "0.5",
    },
    high: {
      duration: "200ms",
      easing: "cubic-bezier(0, 0, 0.2, 1)", // Smooth
      intensity: "0.3",
    },
  },
  staggering: {
    default: "50ms",
    fast: "30ms",
    slow: "80ms",
  },
};

/**
 * Animation complexity presets for different performance profiles
 * Optimized for South African market with varying connectivity levels
 */
export interface AnimationComplexity {
  reduceDuration: number; // Multiplier for durations
  disableStaggering: boolean;
  useSimpleEasings: boolean;
  maxConcurrentAnimations: number;
  disableNonEssential: boolean;
}

export const animationComplexity = {
  full: {
    reduceDuration: 1.0,
    disableStaggering: false,
    useSimpleEasings: false,
    maxConcurrentAnimations: Infinity,
    disableNonEssential: false,
  },
  medium: {
    reduceDuration: 0.7, // 30% faster
    disableStaggering: false,
    useSimpleEasings: true,
    maxConcurrentAnimations: 5,
    disableNonEssential: false,
  },
  low: {
    reduceDuration: 0.5, // 50% faster
    disableStaggering: true,
    useSimpleEasings: true,
    maxConcurrentAnimations: 3,
    disableNonEssential: true,
  },
  minimal: {
    reduceDuration: 0.3, // 70% faster
    disableStaggering: true,
    useSimpleEasings: true,
    maxConcurrentAnimations: 1,
    disableNonEssential: true,
  },
};

/**
 * CSS variables for reduced motion preferences
 * Follows accessibility best practices
 */
export const reducedMotionStyles = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
