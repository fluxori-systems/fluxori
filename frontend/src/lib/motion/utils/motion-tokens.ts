/**
 * Motion tokens for the Fluxori Motion Framework
 * Extends the design system motion tokens with GSAP-specific values
 * Implementation of the Fluid Efficiency and Precision & Accuracy motion principles
 */

/**
 * Interface for motion duration values
 */
export interface MotionDurations {
  // Animation types with specific durations from design spec
  microInteraction: number; // 100-150ms
  elementTransition: number; // 200-300ms
  pageTransition: number; // 300-400ms
  dataVisualization: number; // 500-800ms
  agentThinking: number; // Ongoing
  highStakesConfirmation: number; // 400-600ms

  // Fade-specific durations
  fadeIn: number;
  fadeOut: number;

  // Staggering values
  stagger: number;

  // Legacy values for backward compatibility
  instant: number;
  fast: number;
  normal: number;
  slow: number;
}

/**
 * Interface for easing functions (GSAP compatible)
 */
export interface MotionEasings {
  // Animation purpose-specific easings
  standard: string; // General UI transitions
  emphasis: string; // Attention-grabbing animations
  decelerate: string; // Elements entering the screen
  accelerate: string; // Elements leaving the screen
  sharp: string; // Quick, energetic movements
  pageTransition: string; // Special easing for page transitions

  // Basic easings
  easeIn: string;
  easeOut: string;
  easeInOut: string;

  // Sine easings (gentle)
  easeInSine: string;
  easeOutSine: string;
  easeInOutSine: string;

  // Quad easings (medium acceleration)
  easeInQuad: string;
  easeOutQuad: string;
  easeInOutQuad: string;

  // Cubic easings (stronger acceleration)
  easeInCubic: string;
  easeOutCubic: string;
  easeInOutCubic: string;

  // Quart easings (even stronger acceleration)
  easeInQuart: string;
  easeOutQuart: string;
  easeInOutQuart: string;

  // Quint easings (very strong acceleration)
  easeInQuint: string;
  easeOutQuint: string;
  easeInOutQuint: string;

  // Expo easings (explosive)
  easeInExpo: string;
  easeOutExpo: string;
  easeInOutExpo: string;

  // Circ easings (circular)
  easeInCirc: string;
  easeOutCirc: string;
  easeInOutCirc: string;

  // Back easings (slight overshoot)
  easeInBack: string;
  easeOutBack: string;
  easeInOutBack: string;

  // Elastic easings (springy)
  easeInElastic: string;
  easeOutElastic: string;
  easeInOutElastic: string;

  // Bounce easings (bouncy)
  easeInBounce: string;
  easeOutBounce: string;
  easeInOutBounce: string;
}

/**
 * Type for AI confidence levels
 */
export type ConfidenceLevel =
  | "low"
  | "medium"
  | "high"
  | "verifying"
  | "processing";

/**
 * Interface for AI-specific animation patterns
 * Implements the Purposeful Intelligence motion principle
 */
export interface AIAnimationTokens {
  thinking: {
    duration: number;
    ease: string;
  };
  processing: {
    duration: number;
    ease: string;
  };
  confidence: Record<
    ConfidenceLevel,
    {
      duration: number;
      ease: string;
      amplitude?: number;
    }
  >;
  streaming: {
    characterDuration: number;
    lineDuration: number;
    ease: string;
    stagger: number;
  };
}

/**
 * Duration values in seconds (GSAP format)
 * Follows the Animation Timing Reference from the design spec
 */
export const durations: MotionDurations = {
  // Animation-type specific durations
  microInteraction: 0.15,
  elementTransition: 0.25,
  pageTransition: 0.35,
  dataVisualization: 0.6,
  agentThinking: 0.8,
  highStakesConfirmation: 0.5,

  // Fade-specific durations
  fadeIn: 0.4,
  fadeOut: 0.3,

  // Staggering value
  stagger: 0.05,

  // Legacy values
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
};

/**
 * Easing functions (GSAP format)
 * Providing a comprehensive set of options for different animation needs
 */
export const easings: MotionEasings = {
  // Purpose-specific easings
  standard: "power2.inOut",
  emphasis: "back.out(1.3)",
  decelerate: "power1.out",
  accelerate: "power2.in",
  sharp: "expo.out",
  pageTransition: "power3.inOut",

  // Basic easings
  easeIn: "power2.in",
  easeOut: "power2.out",
  easeInOut: "power2.inOut",

  // Sine easings (gentle)
  easeInSine: "sine.in",
  easeOutSine: "sine.out",
  easeInOutSine: "sine.inOut",

  // Quad easings (medium acceleration)
  easeInQuad: "power1.in",
  easeOutQuad: "power1.out",
  easeInOutQuad: "power1.inOut",

  // Cubic easings (stronger acceleration)
  easeInCubic: "power2.in",
  easeOutCubic: "power2.out",
  easeInOutCubic: "power2.inOut",

  // Quart easings (even stronger acceleration)
  easeInQuart: "power3.in",
  easeOutQuart: "power3.out",
  easeInOutQuart: "power3.inOut",

  // Quint easings (very strong acceleration)
  easeInQuint: "power4.in",
  easeOutQuint: "power4.out",
  easeInOutQuint: "power4.inOut",

  // Expo easings (explosive)
  easeInExpo: "expo.in",
  easeOutExpo: "expo.out",
  easeInOutExpo: "expo.inOut",

  // Circ easings (circular)
  easeInCirc: "circ.in",
  easeOutCirc: "circ.out",
  easeInOutCirc: "circ.inOut",

  // Back easings (slight overshoot)
  easeInBack: "back.in(1.7)",
  easeOutBack: "back.out(1.7)",
  easeInOutBack: "back.inOut(1.7)",

  // Elastic easings (springy)
  easeInElastic: "elastic.in(1,0.3)",
  easeOutElastic: "elastic.out(1,0.3)",
  easeInOutElastic: "elastic.inOut(1,0.3)",

  // Bounce easings (bouncy)
  easeInBounce: "bounce.in",
  easeOutBounce: "bounce.out",
  easeInOutBounce: "bounce.inOut",
};

/**
 * Specific animation patterns for AI-related components
 * Implements the Ambient Awareness design principle
 */
export const aiAnimations: AIAnimationTokens = {
  thinking: {
    duration: 1.2,
    ease: easings.easeInOutSine,
  },
  processing: {
    duration: 0.8,
    ease: easings.easeInOutQuad,
  },
  confidence: {
    low: {
      duration: 0.4,
      ease: easings.easeOutBounce,
      amplitude: 0.2,
    },
    medium: {
      duration: 0.3,
      ease: easings.easeOutBack,
      amplitude: 0.1,
    },
    high: {
      duration: 0.2,
      ease: easings.easeOutCubic,
    },
    verifying: {
      duration: 0.6,
      ease: easings.easeInOutSine,
    },
    processing: {
      duration: 1.0,
      ease: easings.easeInOutQuad,
    },
  },
  streaming: {
    characterDuration: 0.01,
    lineDuration: 0.3,
    ease: easings.easeOutQuad,
    stagger: 0.015,
  },
};

/**
 * Animation complexity presets for different motion modes
 * Tailored for the South African market with bandwidth considerations
 * Implements the South African Optimization design principle
 */
export interface ComplexityPreset {
  disableGSAP: boolean;
  reduceDuration: number; // Multiplier for durations (1.0 = normal, 0.5 = half)
  useSimpleEasings: boolean;
  disableParticles: boolean;
  maxActiveAnimations: number;
  disableStaggering: boolean;
  reduceNetworkAnimations: boolean; // Whether to reduce animation complexity for network performance
  dataCost: "minimal" | "low" | "medium" | "high"; // Indicator of data usage impact
  cpuUsage: number; // Estimated CPU usage percentage (target < 5%)
}

export const complexityPresets: Record<
  "full" | "reduced" | "minimal" | "critical",
  ComplexityPreset
> = {
  full: {
    disableGSAP: false,
    reduceDuration: 1.0,
    useSimpleEasings: false,
    disableParticles: false,
    maxActiveAnimations: Infinity,
    disableStaggering: false,
    reduceNetworkAnimations: false,
    dataCost: "medium",
    cpuUsage: 4.5,
  },
  reduced: {
    disableGSAP: false,
    reduceDuration: 0.7, // 30% faster
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 5,
    disableStaggering: false,
    reduceNetworkAnimations: true,
    dataCost: "low",
    cpuUsage: 3.0,
  },
  minimal: {
    disableGSAP: false, // Still use GSAP but with minimal settings
    reduceDuration: 0.5, // 50% faster
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 2,
    disableStaggering: true,
    reduceNetworkAnimations: true,
    dataCost: "minimal",
    cpuUsage: 1.5,
  },
  critical: {
    disableGSAP: true, // Disable GSAP entirely
    reduceDuration: 0.3, // 70% faster
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 1,
    disableStaggering: true,
    reduceNetworkAnimations: true,
    dataCost: "minimal",
    cpuUsage: 0.5,
  },
};
