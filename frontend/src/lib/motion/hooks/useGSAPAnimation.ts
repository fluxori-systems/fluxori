'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useMotion } from '../context/MotionContext';
import { useReducedMotion } from './useReducedMotion';
import { applyComplexityToTween, initGSAP } from '../gsap/gsap-core';
import { complexityPresets } from '../utils/motion-tokens';
import { useConnectionQuality } from './useConnectionQuality';

/**
 * Animation targets - either a React ref or a direct DOM element
 */
export type AnimationTarget = React.RefObject<HTMLElement> | HTMLElement | null;

/**
 * Common animation options
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  paused?: boolean;
  repeat?: number;
  yoyo?: boolean;
  onComplete?: () => void;
  overwrite?: boolean | 'auto';
}

/**
 * Animation types for different visual effects
 */
export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideIn' 
  | 'slideOut' 
  | 'scale' 
  | 'pulse' 
  | 'bounce'
  | 'highlight'
  | 'shake'
  | 'wiggle';

/**
 * Direction for slide animations
 */
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Slide animation options
 */
export interface SlideAnimationOptions extends AnimationOptions {
  direction?: SlideDirection;
  distance?: number | string;
}

/**
 * Scale animation options
 */
export interface ScaleAnimationOptions extends AnimationOptions {
  from?: number;
  to?: number;
}

/**
 * Bounce animation options
 */
export interface BounceAnimationOptions extends AnimationOptions {
  strength?: number;
}

/**
 * Highlight animation options
 */
export interface HighlightAnimationOptions extends AnimationOptions {
  color?: string;
}

/**
 * Shake animation options
 */
export interface ShakeAnimationOptions extends AnimationOptions {
  intensity?: number;
}

/**
 * Type for GSAP animation instance
 */
export type GSAPAnimation = gsap.core.Tween | gsap.core.Timeline;

/**
 * Hook for easy GSAP animations with performance optimizations
 * 
 * @returns Animation control functions
 */
export function useGSAPAnimation(target: AnimationTarget) {
  const animationRef = useRef<GSAPAnimation | null>(null);
  const { motionMode } = useMotion();
  const shouldReduceMotion = useReducedMotion();
  const connectionQuality = useConnectionQuality();
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Initialize GSAP when the hook is first used
  useEffect(() => {
    const complexity = complexityPresets[motionMode];
    initGSAP(connectionQuality.quality, complexity);
  }, [motionMode, connectionQuality]);
  
  // Function to get the DOM element from target
  const getElement = (): HTMLElement | null => {
    if (!target) return null;
    
    if ((target as React.RefObject<HTMLElement>).current) {
      return (target as React.RefObject<HTMLElement>).current;
    }
    
    return target as HTMLElement;
  };
  
  // Fade In animation
  const fadeIn = (options: AnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Set initial state
    gsap.set(element, { autoAlpha: 0 });
    
    // Create and run animation
    const animation = gsap.to(element, {
      autoAlpha: 1,
      duration: options.duration || 0.4,
      delay: options.delay || 0,
      ease: options.ease || "power2.out",
      paused: options.paused || false,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      },
      overwrite: options.overwrite || "auto"
    });
    
    // Store reference to animation
    animationRef.current = animation;
    
    return animation;
  };
  
  // Fade Out animation
  const fadeOut = (options: AnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Create and run animation
    const animation = gsap.to(element, {
      autoAlpha: 0,
      duration: options.duration || 0.3,
      delay: options.delay || 0,
      ease: options.ease || "power2.in",
      paused: options.paused || false,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      },
      overwrite: options.overwrite || "auto"
    });
    
    // Store reference to animation
    animationRef.current = animation;
    
    return animation;
  };
  
  // Slide animation
  const slide = (options: SlideAnimationOptions = {}, isIn = true) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    const direction = options.direction || 'up';
    const distance = options.distance || 50;
    
    // Calculate start and end values based on direction
    let fromVars: gsap.TweenVars = { autoAlpha: isIn ? 0 : 1 };
    let toVars: gsap.TweenVars = { autoAlpha: isIn ? 1 : 0 };
    
    switch (direction) {
      case 'up':
        fromVars.y = isIn ? distance : 0;
        toVars.y = isIn ? 0 : -distance;
        break;
      case 'down':
        fromVars.y = isIn ? -distance : 0;
        toVars.y = isIn ? 0 : distance;
        break;
      case 'left':
        fromVars.x = isIn ? distance : 0;
        toVars.x = isIn ? 0 : -distance;
        break;
      case 'right':
        fromVars.x = isIn ? -distance : 0;
        toVars.x = isIn ? 0 : distance;
        break;
    }
    
    // Set initial state
    gsap.set(element, fromVars);
    
    // Create and run animation
    toVars.duration = options.duration || 0.4;
    toVars.delay = options.delay || 0;
    toVars.ease = options.ease || "power2.out";
    toVars.paused = options.paused || false;
    toVars.onStart = () => setIsAnimating(true);
    toVars.onComplete = () => {
      setIsAnimating(false);
      options.onComplete?.();
    };
    toVars.overwrite = options.overwrite || "auto";
    
    const animation = gsap.to(element, toVars);
    
    // Store reference to animation
    animationRef.current = animation;
    
    return animation;
  };
  
  // Slide In wrapper
  const slideIn = (options: SlideAnimationOptions = {}) => {
    return slide(options, true);
  };
  
  // Slide Out wrapper
  const slideOut = (options: SlideAnimationOptions = {}) => {
    return slide(options, false);
  };
  
  // Scale animation
  const scale = (options: ScaleAnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    const fromScale = options.from || 0.8;
    const toScale = options.to || 1;
    
    // Set initial state
    gsap.set(element, { scale: fromScale, autoAlpha: fromScale === 0 ? 0 : 1 });
    
    // Create and run animation
    const animation = gsap.to(element, {
      scale: toScale,
      autoAlpha: toScale === 0 ? 0 : 1,
      duration: options.duration || 0.4,
      delay: options.delay || 0,
      ease: options.ease || "power2.out",
      paused: options.paused || false,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      },
      overwrite: options.overwrite || "auto"
    });
    
    // Store reference to animation
    animationRef.current = animation;
    
    return animation;
  };
  
  // Pulse animation
  const pulse = (options: AnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Create and run animation
    const timeline = gsap.timeline({
      paused: options.paused || false,
      repeat: options.repeat || 0,
      yoyo: options.yoyo || false,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      }
    });
    
    timeline.to(element, {
      scale: 1.05,
      duration: (options.duration || 0.4) / 2,
      ease: options.ease || "power2.out"
    }).to(element, {
      scale: 1,
      duration: (options.duration || 0.4) / 2,
      ease: options.ease || "power2.in"
    });
    
    // Apply complexity adjustments based on timeline duration
    if (complexity.reduceDuration !== 1.0) {
      timeline.timeScale(1 / complexity.reduceDuration);
    }
    
    // Store reference to animation
    animationRef.current = timeline;
    
    return timeline;
  };
  
  // Bounce animation
  const bounce = (options: BounceAnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    const strength = options.strength || 20;
    
    // Create and run animation
    const timeline = gsap.timeline({
      paused: options.paused || false,
      repeat: options.repeat || 0,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      }
    });
    
    timeline.from(element, {
      y: -strength,
      duration: (options.duration || 0.4) * 0.4,
      ease: "power2.in"
    }).to(element, {
      y: 0,
      duration: (options.duration || 0.4) * 0.6,
      ease: "bounce.out"
    });
    
    // Apply complexity adjustments based on timeline duration
    if (complexity.reduceDuration !== 1.0) {
      timeline.timeScale(1 / complexity.reduceDuration);
    }
    
    // Store reference to animation
    animationRef.current = timeline;
    
    return timeline;
  };
  
  // Highlight animation for drawing attention to elements
  const highlight = (options: HighlightAnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    const highlightColor = options.color || 'rgba(58, 134, 255, 0.2)'; // Primary color with alpha
    
    // Store original background
    const originalBackground = window.getComputedStyle(element).backgroundColor;
    
    // Create and run animation
    const timeline = gsap.timeline({
      paused: options.paused || false,
      repeat: options.repeat || 0,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      }
    });
    
    timeline.to(element, {
      backgroundColor: highlightColor,
      duration: (options.duration || 0.6) * 0.3,
      ease: "power1.out"
    }).to(element, {
      backgroundColor: originalBackground,
      duration: (options.duration || 0.6) * 0.7,
      ease: "power1.inOut"
    });
    
    // Apply complexity adjustments based on timeline duration
    if (complexity.reduceDuration !== 1.0) {
      timeline.timeScale(1 / complexity.reduceDuration);
    }
    
    // Store reference to animation
    animationRef.current = timeline;
    
    return timeline;
  };
  
  // Shake animation (for errors, alerts)
  const shake = (options: ShakeAnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    const intensity = options.intensity || 5;
    
    // Create and run animation
    const timeline = gsap.timeline({
      paused: options.paused || false,
      repeat: options.repeat || 0,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      }
    });
    
    // Multi-step shake
    timeline.to(element, {
      x: -intensity,
      duration: 0.1,
      ease: "none"
    }).to(element, {
      x: intensity,
      duration: 0.1,
      ease: "none"
    }).to(element, {
      x: -intensity * 0.6,
      duration: 0.1,
      ease: "none"
    }).to(element, {
      x: intensity * 0.6,
      duration: 0.1,
      ease: "none"
    }).to(element, {
      x: -intensity * 0.3,
      duration: 0.1,
      ease: "none"
    }).to(element, {
      x: 0,
      duration: 0.1,
      ease: "power1.out"
    });
    
    // Apply complexity adjustments based on timeline duration
    if (complexity.reduceDuration !== 1.0) {
      timeline.timeScale(1 / complexity.reduceDuration);
    }
    
    // Store reference to animation
    animationRef.current = timeline;
    
    return timeline;
  };
  
  // Wiggle animation (for subtle attention)
  const wiggle = (options: AnimationOptions = {}) => {
    if (shouldReduceMotion) return null;
    
    const element = getElement();
    if (!element) return null;
    
    // Apply complexity settings
    const complexity = complexityPresets[motionMode];
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }
    
    // Create and run animation
    const timeline = gsap.timeline({
      paused: options.paused || false,
      repeat: options.repeat || 0,
      yoyo: options.yoyo || false,
      onStart: () => setIsAnimating(true),
      onComplete: () => {
        setIsAnimating(false);
        options.onComplete?.();
      }
    });
    
    // Rotation wiggle
    timeline.to(element, {
      rotation: 3,
      duration: (options.duration || 0.5) / 4,
      ease: "power1.inOut"
    }).to(element, {
      rotation: -3,
      duration: (options.duration || 0.5) / 2,
      ease: "power1.inOut"
    }).to(element, {
      rotation: 0,
      duration: (options.duration || 0.5) / 4,
      ease: "power1.out"
    });
    
    // Apply complexity adjustments based on timeline duration
    if (complexity.reduceDuration !== 1.0) {
      timeline.timeScale(1 / complexity.reduceDuration);
    }
    
    // Store reference to animation
    animationRef.current = timeline;
    
    return timeline;
  };
  
  // Run an animation by type
  const animate = (
    type: AnimationType, 
    options: AnimationOptions & 
      SlideAnimationOptions & 
      ScaleAnimationOptions & 
      BounceAnimationOptions & 
      HighlightAnimationOptions &
      ShakeAnimationOptions = {}
  ) => {
    switch (type) {
      case 'fadeIn':
        return fadeIn(options);
      case 'fadeOut':
        return fadeOut(options);
      case 'slideIn':
        return slideIn(options);
      case 'slideOut':
        return slideOut(options);
      case 'scale':
        return scale(options as ScaleAnimationOptions);
      case 'pulse':
        return pulse(options);
      case 'bounce':
        return bounce(options as BounceAnimationOptions);
      case 'highlight':
        return highlight(options as HighlightAnimationOptions);
      case 'shake':
        return shake(options as ShakeAnimationOptions);
      case 'wiggle':
        return wiggle(options);
      default:
        return null;
    }
  };
  
  // Pause the current animation
  const pause = () => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  };
  
  // Resume the current animation
  const resume = () => {
    if (animationRef.current) {
      animationRef.current.resume();
    }
  };
  
  // Kill the current animation
  const kill = () => {
    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
      setIsAnimating(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);
  
  return {
    animate,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scale,
    pulse,
    bounce,
    highlight,
    shake,
    wiggle,
    pause,
    resume,
    kill,
    isAnimating
  };
}