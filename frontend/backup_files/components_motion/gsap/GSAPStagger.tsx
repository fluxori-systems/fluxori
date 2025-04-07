import React, { ReactNode, useEffect, useRef, Children } from 'react';
import { Box, BoxProps } from '@mantine/core';
import gsap from 'gsap';
import { useReducedMotion } from '../useReducedMotion';
import { DURATION } from '../constants';

export interface GSAPStaggerProps extends BoxProps {
  /** Child elements to animate in a staggered sequence */
  children: ReactNode;
  /** Duration of each individual animation */
  duration?: keyof typeof DURATION | number;
  /** Delay before animation sequence starts in seconds */
  delay?: number;
  /** Time between each element's animation in seconds */
  staggerDelay?: number;
  /** Starting Y position */
  fromY?: number;
  /** Starting opacity */
  fromOpacity?: number;
  /** Starting scale */
  fromScale?: number;
  /** Easing function to use */
  ease?: 'power1.out' | 'power2.out' | 'power3.out' | 'power4.out' | 'back.out';
  /** Whether animation is enabled */
  enabled?: boolean;
  /** CSS selector for the children to animate */
  selector?: string;
}

/**
 * Component that creates staggered animations for multiple children
 * using GSAP for smooth, performance-optimized sequences
 */
export function GSAPStagger({
  children,
  duration = 'NORMAL',
  delay = 0,
  staggerDelay = 0.1,
  fromY = 20,
  fromOpacity = 0,
  fromScale = 1,
  ease = 'power2.out',
  enabled = true,
  selector = '> *',
  style,
  ...props
}: GSAPStaggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getDuration, prefersReducedMotion } = useReducedMotion();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const childCount = Children.count(children);

  // Convert duration to seconds for GSAP
  const durationValue = typeof duration === 'string'
    ? getDuration(DURATION[duration]) / 1000
    : getDuration(duration) / 1000;

  useEffect(() => {
    // Don't animate if disabled or reduced motion preference
    if (!enabled || prefersReducedMotion || !containerRef.current) {
      return;
    }

    // Get elements to animate
    const elements = containerRef.current.querySelectorAll(selector);
    if (!elements.length) return;

    // Create and configure timeline
    const tl = gsap.timeline({
      delay,
      paused: true,
    });

    // Set initial state
    gsap.set(elements, {
      y: fromY,
      opacity: fromOpacity,
      scale: fromScale,
    });

    // Add staggered animations to timeline
    tl.to(elements, {
      duration: durationValue,
      y: 0,
      opacity: 1,
      scale: 1,
      ease,
      stagger: staggerDelay,
    });

    // Store and play timeline
    timelineRef.current = tl;
    tl.play();

    // Cleanup
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [childCount, enabled, prefersReducedMotion]);

  return (
    <Box
      ref={containerRef}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}