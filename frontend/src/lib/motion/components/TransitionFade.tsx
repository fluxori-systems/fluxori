'use client';

import React, { useRef, useEffect } from 'react';
import { useGSAPAnimation } from '../hooks/useGSAPAnimation';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface TransitionFadeProps {
  /** Child components to apply fade transition to */
  children: React.ReactNode;
  /** Direction of the fade animation */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Duration of the animation in seconds */
  duration?: number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Distance to move during the fade */
  distance?: number;
  /** GSAP easing function */
  ease?: string;
  /** Class name for custom styling */
  className?: string;
}

/**
 * Component for smooth fade transitions with optional direction
 * Optimized for page transitions and component mounting/unmounting
 */
export function TransitionFade({
  children,
  direction = 'up',
  duration = 0.4,
  delay = 0,
  distance = 20,
  ease = 'power2.out',
  className = '',
}: TransitionFadeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animation = useGSAPAnimation(containerRef);
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    // Skip animation for reduced motion
    if (shouldReduceMotion) return;
    
    // Determine if we should use slide or just fade
    if (direction === 'none') {
      animation.fadeIn({
        duration,
        delay,
        ease,
      });
    } else {
      animation.slideIn({
        direction,
        distance,
        duration,
        delay,
        ease,
      });
    }
    
    // Clean up animation on unmount
    return () => {
      animation.kill();
    };
  }, [animation, direction, distance, duration, delay, ease, shouldReduceMotion]);
  
  return (
    <div 
      ref={containerRef}
      className={`transition-fade ${className}`}
      style={{ 
        opacity: shouldReduceMotion ? 1 : 0,
        visibility: shouldReduceMotion ? 'visible' : 'hidden'
      }}
    >
      {children}
    </div>
  );
}