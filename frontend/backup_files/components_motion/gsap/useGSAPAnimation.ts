import { useEffect, useRef, RefObject } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../useReducedMotion';
import { DURATION, EASING } from '../constants';

export interface GSAPAnimationOptions {
  /** Duration of the animation */
  duration?: keyof typeof DURATION | number;
  /** Easing function to use */
  ease?: 'power1.out' | 'power2.out' | 'power3.out' | 'power4.out' | 'back.out' | 'elastic.out' | 'bounce.out';
  /** Delay before animation starts */
  delay?: number;
  /** Animation properties to apply */
  from?: gsap.TweenVars;
  /** Animation target properties */
  to?: gsap.TweenVars;
  /** Whether animation should run on mount */
  runOnMount?: boolean;
  /** Whether animation should run on every render */
  runOnRender?: boolean;
  /** Whether animation should run when dependencies change */
  runOnDepsChange?: boolean;
}

/**
 * Hook for creating GSAP animations that respect motion design principles
 * and accessibility preferences
 */
export function useGSAPAnimation<T extends HTMLElement = HTMLDivElement>(
  options: GSAPAnimationOptions,
  deps: any[] = []
): {
  ref: RefObject<T>;
  play: () => void;
  reverse: () => void;
  restart: () => void;
} {
  const ref = useRef<T>(null);
  const { getDuration, prefersReducedMotion } = useReducedMotion();
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // Get appropriate duration value
  const getDurationValue = () => {
    if (typeof options.duration === 'string') {
      return getDuration(DURATION[options.duration]);
    }
    if (typeof options.duration === 'number') {
      return getDuration(options.duration);
    }
    return getDuration(DURATION.NORMAL);
  };

  // Map our easing function constants to GSAP equivalents
  const getEaseValue = () => {
    // If explicit ease is provided, use it
    if (options.ease) {
      return options.ease;
    }
    
    // Otherwise map from our standard easing functions
    return 'power2.out'; // Equivalent to our STANDARD ease
  };

  // Create the animation
  const createAnimation = () => {
    if (!ref.current) return;

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion) {
      // For reduced motion, we still want to set the final state
      if (options.to) {
        gsap.set(ref.current, options.to);
      }
      return;
    }

    // Set initial state if provided
    if (options.from) {
      gsap.set(ref.current, options.from);
    }

    // Create the tween
    tweenRef.current = gsap.to(ref.current, {
      ...options.to,
      duration: getDurationValue() / 1000, // GSAP uses seconds
      ease: getEaseValue(),
      delay: options.delay || 0,
      paused: !options.runOnMount, // Only autoplay if runOnMount is true
    });
  };

  // Initialize animation on mount and when deps change
  useEffect(() => {
    createAnimation();
    
    // Play animation if requested
    if (options.runOnDepsChange && tweenRef.current) {
      tweenRef.current.restart();
    }
    
    // Cleanup
    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [prefersReducedMotion, ...deps]);

  // Methods to control the animation
  const play = () => {
    if (tweenRef.current) {
      tweenRef.current.play();
    }
  };

  const reverse = () => {
    if (tweenRef.current) {
      tweenRef.current.reverse();
    }
  };

  const restart = () => {
    if (tweenRef.current) {
      tweenRef.current.restart();
    }
  };

  return { ref, play, reverse, restart };
}