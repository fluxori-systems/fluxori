/**
 * Motion tokens for the Fluxori Motion Framework
 * Extends the design system motion tokens with GSAP-specific values
 */

/**
 * Interface for motion duration values
 */
export interface MotionDurations {
  instant: number;  // 0.1s
  fast: number;     // 0.2s
  normal: number;   // 0.3s
  slow: number;     // 0.5s
  fadeIn: number;   // 0.4s
  fadeOut: number;  // 0.3s
  stagger: number;  // 0.05s (stagger between elements)
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
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verifying' | 'processing';

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
  confidence: Record<ConfidenceLevel, {
    duration: number;
    ease: string;
    amplitude?: number;
  }>;
  streaming: {
    characterDuration: number;
    lineDuration: number;
    ease: string;
    stagger: number;
  };
}

/**
 * Duration values in seconds (GSAP format)
 */
export const durations: MotionDurations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  fadeIn: 0.4,
  fadeOut: 0.3,
  stagger: 0.05,
};

/**
 * Easing functions (GSAP format)
 * Providing a comprehensive set of options for different animation needs
 */
export const easings: MotionEasings = {
  // Basic easings
  easeIn: 'power2.in',
  easeOut: 'power2.out',
  easeInOut: 'power2.inOut',
  
  // Sine easings (gentle)
  easeInSine: 'sine.in',
  easeOutSine: 'sine.out',
  easeInOutSine: 'sine.inOut',
  
  // Quad easings (medium acceleration)
  easeInQuad: 'power1.in',
  easeOutQuad: 'power1.out',
  easeInOutQuad: 'power1.inOut',
  
  // Cubic easings (stronger acceleration)
  easeInCubic: 'power2.in',
  easeOutCubic: 'power2.out',
  easeInOutCubic: 'power2.inOut',
  
  // Quart easings (even stronger acceleration)
  easeInQuart: 'power3.in',
  easeOutQuart: 'power3.out',
  easeInOutQuart: 'power3.inOut',
  
  // Quint easings (very strong acceleration)
  easeInQuint: 'power4.in',
  easeOutQuint: 'power4.out',
  easeInOutQuint: 'power4.inOut',
  
  // Expo easings (explosive)
  easeInExpo: 'expo.in',
  easeOutExpo: 'expo.out',
  easeInOutExpo: 'expo.inOut',
  
  // Circ easings (circular)
  easeInCirc: 'circ.in',
  easeOutCirc: 'circ.out',
  easeInOutCirc: 'circ.inOut',
  
  // Back easings (slight overshoot)
  easeInBack: 'back.in(1.7)',
  easeOutBack: 'back.out(1.7)',
  easeInOutBack: 'back.inOut(1.7)',
  
  // Elastic easings (springy)
  easeInElastic: 'elastic.in(1,0.3)',
  easeOutElastic: 'elastic.out(1,0.3)',
  easeInOutElastic: 'elastic.inOut(1,0.3)',
  
  // Bounce easings (bouncy)
  easeInBounce: 'bounce.in',
  easeOutBounce: 'bounce.out',
  easeInOutBounce: 'bounce.inOut',
};

/**
 * Specific animation patterns for AI-related components
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

export const complexityPresets: Record<'full' | 'reduced' | 'minimal', ComplexityPreset> = {
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
    disableGSAP: false, // Still use GSAP but with minimal settings
    reduceDuration: 0.5, // 50% faster
    useSimpleEasings: true,
    disableParticles: true,
    maxActiveAnimations: 2,
    disableStaggering: true,
    reduceNetworkAnimations: true,
  },
};