"use client";

import { MotionMode } from "./motion-types";

import type { ConnectionQuality } from "./sa-market-types";

/**
 * Standard durations for animations
 */
export const durations: MotionDurations = {
  instant: 0.1, // 0.1s
  fast: 0.2, // 0.2s
  normal: 0.3, // 0.3s
  slow: 0.5, // 0.5s
  fadeIn: 0.4, // 0.4s
  fadeOut: 0.3, // 0.3s
  stagger: 0.05, // 0.05s (stagger between elements)
};

/**
 * Standard GSAP easing functions
 */
export const easings: MotionEasings = {
  easeIn: "power2.in",
  easeOut: "power2.out",
  easeInOut: "power2.inOut",
  easeInSine: "sine.in",
  easeOutSine: "sine.out",
  easeInOutSine: "sine.inOut",
  easeInQuad: "power1.in",
  easeOutQuad: "power1.out",
  easeInOutQuad: "power1.inOut",
  easeInCubic: "power2.in",
  easeOutCubic: "power2.out",
  easeInOutCubic: "power2.inOut",
  easeInQuart: "power3.in",
  easeOutQuart: "power3.out",
  easeInOutQuart: "power3.inOut",
  easeInQuint: "power4.in",
  easeOutQuint: "power4.out",
  easeInOutQuint: "power4.inOut",
  easeInExpo: "expo.in",
  easeOutExpo: "expo.out",
  easeInOutExpo: "expo.inOut",
  easeInCirc: "circ.in",
  easeOutCirc: "circ.out",
  easeInOutCirc: "circ.inOut",
  easeInBack: "back.in(1.7)",
  easeOutBack: "back.out(1.7)",
  easeInOutBack: "back.inOut(1.7)",
  easeInElastic: "elastic.in(1,0.3)",
  easeOutElastic: "elastic.out(1,0.3)",
  easeInOutElastic: "elastic.inOut(1,0.3)",
  easeInBounce: "bounce.in",
  easeOutBounce: "bounce.out",
  easeInOutBounce: "bounce.inOut",
};

/**
 * Animation patterns for AI components
 */
export const aiAnimations: AIAnimationTokens = {
  thinking: {
    duration: 1.5,
    ease: "power1.inOut",
  },
  processing: {
    duration: 0.8,
    ease: "power1.inOut",
  },
  confidence: {
    low: {
      duration: 0.3,
      ease: "power1.out",
      amplitude: 0.3,
    },
    medium: {
      duration: 0.4,
      ease: "power2.out",
      amplitude: 0.5,
    },
    high: {
      duration: 0.5,
      ease: "elastic.out(1,0.3)",
      amplitude: 0.7,
    },
    verifying: {
      duration: 0.3,
      ease: "power1.inOut",
    },
    processing: {
      duration: 0.2,
      ease: "power1.inOut",
    },
  },
  streaming: {
    characterDuration: 0.01,
    lineDuration: 0.3,
    ease: "power1.out",
    stagger: 0.008,
  },
};

/**
 * Interface for motion duration values
 */
export interface MotionDurations {
  instant: number; // 0.1s
  fast: number; // 0.2s
  normal: number; // 0.3s
  slow: number; // 0.5s
  fadeIn: number; // 0.4s
  fadeOut: number; // 0.3s
  stagger: number; // 0.05s (stagger between elements)
}

/**
 * Interface for easing functions (GSAP compatible)
 */
export interface MotionEasings {
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  easeInSine: string;
  easeOutSine: string;
  easeInOutSine: string;
  easeInQuad: string;
  easeOutQuad: string;
  easeInOutQuad: string;
  easeInCubic: string;
  easeOutCubic: string;
  easeInOutCubic: string;
  easeInQuart: string;
  easeOutQuart: string;
  easeInOutQuart: string;
  easeInQuint: string;
  easeOutQuint: string;
  easeInOutQuint: string;
  easeInExpo: string;
  easeOutExpo: string;
  easeInOutExpo: string;
  easeInCirc: string;
  easeOutCirc: string;
  easeInOutCirc: string;
  easeInBack: string;
  easeOutBack: string;
  easeInOutBack: string;
  easeInElastic: string;
  easeOutElastic: string;
  easeInOutElastic: string;
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
 * Animation complexity presets for different motion modes
 * Tailored for the South African market with bandwidth considerations
 */
export interface ComplexityPreset {
  disableGSAP: boolean;
  reduceDuration: number; // Multiplier for durations (1.0 = normal, 0.5 = half)
  useSimpleEasings: boolean;
  disableParticles: boolean;
  maxActiveAnimations: number;
  disableStaggering: boolean;
  reduceNetworkAnimations: boolean; // Whether to reduce animation complexity for network performance
}

/**
 * Network-specific animation settings for South African market
 */
export interface NetworkAnimationPreset {
  durationMultiplier: number; // Adjustment to animation duration
  useSimpleEasings: boolean; // Whether to use simplified easings
  disableParallel: boolean; // Whether to disable parallel animations
  disableStaggering: boolean; // Whether to disable staggered animations
  disableNonEssential: boolean; // Whether to disable non-essential animations
  replaceWithSimpler: boolean; // Whether to replace with simpler animations
}

/**
 * Network-specific animation settings for South African market
 * These are calibrated for the unique network conditions in South Africa
 */
export const networkAnimationPresets: Record<
  ConnectionQuality,
  NetworkAnimationPreset
> = {
  high: {
    durationMultiplier: 1.0,
    useSimpleEasings: false,
    disableParallel: false,
    disableStaggering: false,
    disableNonEssential: false,
    replaceWithSimpler: false,
  },
  medium: {
    durationMultiplier: 0.8, // 20% faster
    useSimpleEasings: false,
    disableParallel: false,
    disableStaggering: false,
    disableNonEssential: false,
    replaceWithSimpler: false,
  },
  low: {
    durationMultiplier: 0.6, // 40% faster
    useSimpleEasings: true,
    disableParallel: true,
    disableStaggering: false,
    disableNonEssential: true,
    replaceWithSimpler: true,
  },
  poor: {
    durationMultiplier: 0.4, // 60% faster
    useSimpleEasings: true,
    disableParallel: true,
    disableStaggering: true,
    disableNonEssential: true,
    replaceWithSimpler: true,
  },
};

/**
 * Default complexity presets for different motion modes
 */
export const complexityPresets: Record<MotionMode, ComplexityPreset> = {
  full: {
    disableGSAP: false,
    reduceDuration: 1.0,
    useSimpleEasings: false,
    disableParticles: false,
    maxActiveAnimations: Infinity,
    disableStaggering: false,
    reduceNetworkAnimations: false,
  },
  reduced: {
    disableGSAP: false,
    reduceDuration: 0.7, // 30% faster
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 5,
    disableStaggering: false,
    reduceNetworkAnimations: true,
  },
  minimal: {
    disableGSAP: true, // Disable most animations
    reduceDuration: 0.5, // 50% faster for essential animations
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 2,
    disableStaggering: true,
    reduceNetworkAnimations: true,
  },
};
