/**
 * Motion design constants for Fluxori
 * Follows the principles defined in README.md
 */

export const DURATION = {
  /** Very quick micro-interactions (50-100ms) */
  INSTANT: 75,
  /** Quick UI feedback (100-200ms) */
  FAST: 150,
  /** Standard transitions (200-300ms) */
  NORMAL: 250,
  /** Elaborate transitions (300-500ms) */
  MEDIUM: 400,
  /** Complex animations (500-800ms) */
  SLOW: 650,
  /** Elaborate sequences (800-1200ms) */
  VERY_SLOW: 1000,
};

export const EASING = {
  /** Linear motion - rarely used except for continuous animations */
  LINEAR: [0, 0, 1, 1],
  /** Standard easing for most UI elements */
  STANDARD: [0.4, 0, 0.2, 1],
  /** Accelerating from zero velocity */
  EASE_IN: [0.4, 0, 1, 1],
  /** Decelerating to zero velocity */
  EASE_OUT: [0, 0, 0.2, 1],
  /** Accelerate from zero, decelerate to zero */
  EASE_IN_OUT: [0.4, 0, 0.2, 1],
  /** More dramatic overshoot */
  ANTICIPATE: [0.4, 0, 0.6, 1.4],
};

export const REDUCED_MOTION_SETTINGS = {
  /** For users with reduced motion preferences */
  DURATION_MULTIPLIER: 0.5,
  DISABLE_TRANSITIONS: false,
  DISABLE_ANIMATIONS: false,
};

export const ANIMATION_BREAKPOINTS = {
  /** Threshold for enabling higher complexity animations */
  MEDIUM_COMPLEXITY: 768, // Tablet
  /** Threshold for enabling highest complexity animations */
  HIGH_COMPLEXITY: 1280, // Desktop
};

/** Z-index values for animated elements */
export const Z_INDEX = {
  BEHIND: -1,
  BASE: 0,
  LOW: 10,
  MEDIUM: 100,
  HIGH: 1000,
  OVERLAY: 2000,
  MODAL: 3000,
  TOOLTIP: 4000,
};

/** Specific animation presets for AI interactions */
export const AI_ANIMATION = {
  /** Pulse effect for AI processing */
  PROCESSING_PULSE: {
    DURATION: DURATION.SLOW,
    REPEAT: Infinity,
    PATTERN: [0.97, 1.03], // Scale min/max
    EASING: EASING.EASE_IN_OUT,
  },
  /** Text streaming effect speed (characters per second) */
  STREAMING_TEXT: {
    FAST: 40, // Characters per second
    MEDIUM: 25,
    SLOW: 15,
  },
  /** Indicator for AI confidence levels */
  CONFIDENCE_INDICATORS: {
    HIGH: {
      OPACITY: 1,
      DURATION: DURATION.MEDIUM,
    },
    MEDIUM: {
      OPACITY: 0.8,
      DURATION: DURATION.NORMAL,
    },
    LOW: {
      OPACITY: 0.6,
      DURATION: DURATION.FAST,
    },
  },
};