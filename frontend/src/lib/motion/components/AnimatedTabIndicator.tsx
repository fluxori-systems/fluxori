'use client';

import React, { useRef, useEffect, useState } from 'react';

import { gsap } from 'gsap';

import { useMotion } from '../context/MotionContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { durations, easings, complexityPresets } from '../utils/motion-tokens';

export interface AnimatedTabIndicatorProps {
  /** Currently active tab index */
  activeIndex: number;
  /** Total number of tabs */
  tabCount: number;
  /** Height of the indicator */
  height?: number;
  /** Color of the indicator */
  color?: string;
  /** Radius of the indicator */
  radius?: string;
  /** Class name for custom styling */
  className?: string;
  /** Whether indicator should stretch during animation */
  stretch?: boolean;
}

/**
 * Animated tab indicator component
 * Shows the currently active tab with smooth animation
 */
export function AnimatedTabIndicator({
  activeIndex,
  tabCount,
  height = 3,
  color = 'var(--color-primary-500)',
  radius = 'var(--radius-full)',
  className = '',
  stretch = true,
}: AnimatedTabIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [tabWidth, setTabWidth] = useState(0);
  const { motionMode } = useMotion();
  const shouldReduceMotion = useReducedMotion();
  const complexity = complexityPresets[motionMode];
  
  // Calculate tab width on mount and resize
  useEffect(() => {
    const calculateTabWidth = () => {
      const container = indicatorRef.current?.parentElement;
      if (container) {
        // Calculate width of a single tab
        const fullWidth = container.clientWidth;
        setTabWidth(fullWidth / tabCount);
      }
    };
    
    // Initial calculation
    calculateTabWidth();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateTabWidth);
    
    return () => {
      window.removeEventListener('resize', calculateTabWidth);
    };
  }, [tabCount]);
  
  // Animate indicator when activeIndex changes
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator || shouldReduceMotion) return;
    
    // Clean up any existing animations
    gsap.killTweensOf(indicator);
    
    // Apply animation based on complexity
    const duration = durations.normal * complexity.reduceDuration;
    const ease = complexity.useSimpleEasings ? 'power1.out' : easings.easeOutCubic;
    
    if (stretch && tabWidth > 0) {
      // Two-step animation with stretching effect
      const targetX = activeIndex * tabWidth;
      const currentX = parseFloat(indicator.style.left || '0');
      
      // Determine direction of movement
      const movingRight = targetX > currentX;
      
      // Create stretching animation timeline
      const tl = gsap.timeline();
      
      tl.to(indicator, {
        // First step: stretch in the direction of movement
        width: movingRight ? 
          tabWidth + (targetX - currentX) : 
          tabWidth + (currentX - targetX),
        duration: duration / 2,
        ease: 'power1.out'
      }).to(indicator, {
        // Second step: move to target position and return to normal width
        left: targetX,
        width: tabWidth,
        duration: duration / 2,
        ease
      });
    } else {
      // Simple slide animation without stretching
      gsap.to(indicator, {
        left: activeIndex * tabWidth,
        duration,
        ease
      });
    }
  }, [activeIndex, tabWidth, shouldReduceMotion, motionMode, stretch, complexity]);
  
  // Apply initial positioning
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    
    // Set initial position without animation
    gsap.set(indicator, {
      left: activeIndex * tabWidth,
      width: tabWidth
    });
  }, [activeIndex, tabWidth]);
  
  return (
    <div
      ref={indicatorRef}
      className={`animated-tab-indicator ${className}`}
      style={{
        position: 'absolute',
        bottom: 0,
        height: height,
        backgroundColor: color,
        borderRadius: radius,
        transition: shouldReduceMotion ? `left ${durations.instant}s ease` : 'none',
      }}
    />
  );
}