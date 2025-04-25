'use client';

import React, { forwardRef, ReactNode, useState, useRef, useEffect, useCallback } from 'react';

import { Stack as MantineStack } from '@mantine/core';

import { getSpacingFromMantine } from '../../design-system/utils/mantine-theme-adapter';
import { useTokenTracking } from '../../design-system/utils/token-analysis';

// Import from shared modules to avoid circular dependencies
import { SouthAfricanMarketOptimizer } from '../../shared/components/SouthAfricanMarketOptimizer';
import { 
  useSouthAfricanMarketOptimizations, 
  SANetworkProfile 
} from '../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { useComponentAnimation , useMotionMode } from '../hooks/useComponentAnimation';
import { useConnectionQuality, useNetworkAware } from '../hooks/useConnection';

// Define token intent variants for Stack
export type StackIntent = 'default' | 'content' | 'form' | 'navigation' | 'card';

export interface StackProps {
  /** Stack content */
  children?: ReactNode;
  
  /** Gap between elements (modern prop) */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy spacing prop (mapped to gap) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Align items */
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
  
  /** Justify content */
  justify?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  
  /** Purpose/intent of the stack for semantic styling */
  intent?: StackIntent;
  
  /** Whether to animate children staggered appearance */
  animatePresence?: boolean;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Animation delay in ms */
  animationDelay?: number;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Loading priority for South African optimizations */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  /** Enable South African market specific optimizations */
  saSensitive?: boolean;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Stack component with proper TypeScript typing, design token integration, and network-aware optimizations.
 * 
 * Features:
 * - Modern Mantine v7 gap support with legacy spacing fallback
 * - Intent-based styling variants
 * - Optional staggered animation for children
 * - Network-aware animations and performance optimizations 
 * - Design token tracking
 * - South African market optimizations
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ 
    children,
    spacing,
    gap: gapProp,
    intent = 'default',
    animatePresence = false,
    networkAware = true,
    animationDelay = 0,
    className = '',
    style,
    priority = 'medium',
    saSensitive = true,
    ...props 
  }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    // Create combined ref at the top level to avoid calling the hook conditionally
    const combinedRef = useCombinedRefs(forwardedRef, innerRef);
    const connectionQuality = useConnectionQuality();
    const { quality, isDataSaver } = connectionQuality;
    const motionMode = useMotionMode();
    const saMarket = useSouthAfricanMarketOptimizations();
    
    // Use token tracking to record which tokens are used
    const tokenTracking = useTokenTracking('Stack');
    
    // Map legacy spacing to Mantine v7 gap
    const gapValue = spacing !== undefined ? spacing : gapProp;
    
    // Track token usage
    useEffect(() => {
      if (typeof gapValue === 'string') {
        tokenTracking.trackToken(`spacing-${gapValue}`);
      }
      tokenTracking.trackToken(`intent-${intent}`);
    }, [gapValue, intent, tokenTracking]);
    
    // Handle animation
    const [isAnimationActive, setIsAnimationActive] = useState(false);
    
    // Use network-aware animation delay
    const networkAnimationDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Memoized function to handle animation activation
    const activateAnimation = useCallback(() => {
      if (animatePresence) {
        const timer = setTimeout(() => {
          setIsAnimationActive(true);
        }, networkAware ? networkAnimationDelay * 1000 : animationDelay);
        
        return () => {
          clearTimeout(timer);
        };
      }
      return undefined;
    }, [animatePresence, networkAnimationDelay, networkAware, animationDelay]);
    
    // Apply the animation activation effect
    useEffect(activateAnimation, [activateAnimation]);
    
    // Skip animations for poor connections or data saver mode
    const shouldDisableAnimations = networkAware && 
      (isDataSaver || quality === 'poor' || motionMode === 'minimal');
    
    // Apply animation if needed
    useComponentAnimation({
      ref: innerRef,
      enabled: animatePresence && !shouldDisableAnimations,
      mode: 'appear',
      isActive: isAnimationActive,
      networkAware,
      durationMultiplier: networkAware ? 
        saMarket.networkProfile === SANetworkProfile.RURAL ? 0.5 : 1.0 : 1.0,
      properties: {
        opacity: 1,
        y: 0,
        delay: networkAware ? networkAnimationDelay : animationDelay / 1000
      }
    });
    
    // Build class name with intent
    const combinedClassName = `${className} stack-${intent}`.trim();
    
    // Combine styles with defaults
    const combinedStyles: React.CSSProperties = {
      ...style,
      // Add any intent-specific styles here
    };
    
    // Apply simplified styling for data saver mode or poor connections
    if (networkAware && (isDataSaver || quality === 'poor')) {
      // Use optimized gap values for poor connections
      // Reduce spacing to optimize rendering and improve performance
      if (typeof gapValue === 'string') {
        switch (gapValue) {
          case 'xl':
            tokenTracking.trackToken('network-optimize-spacing');
            
            // If South African market optimizations are enabled and we're in rural areas,
            // use the SA optimizer component
            if (saSensitive && saMarket.isRural) {
              return (
                <SouthAfricanMarketOptimizer 
                  component="Stack"
                  priority={priority}
                  networkAware={networkAware}
                >
                  <MantineStack
                    ref={combinedRef}
                    gap="lg" // Reduce from xl to lg
                    className={`${combinedClassName} stack-network-optimized stack-sa-optimized`}
                    style={combinedStyles}
                    data-sa-optimized="true"
                    {...props}
                  >
                    {children}
                  </MantineStack>
                </SouthAfricanMarketOptimizer>
              );
            }
            
            return (
              <MantineStack
                ref={combinedRef}
                gap="lg" // Reduce from xl to lg
                className={`${combinedClassName} stack-network-optimized`}
                style={combinedStyles}
                {...props}
              >
                {children}
              </MantineStack>
            );
          case 'lg':
            tokenTracking.trackToken('network-optimize-spacing');
            
            if (saSensitive && saMarket.isRural) {
              return (
                <SouthAfricanMarketOptimizer 
                  component="Stack"
                  priority={priority}
                  networkAware={networkAware}
                >
                  <MantineStack
                    ref={combinedRef}
                    gap="md" // Reduce from lg to md
                    className={`${combinedClassName} stack-network-optimized stack-sa-optimized`}
                    style={combinedStyles}
                    data-sa-optimized="true"
                    {...props}
                  >
                    {children}
                  </MantineStack>
                </SouthAfricanMarketOptimizer>
              );
            }
            
            return (
              <MantineStack
                ref={combinedRef}
                gap="md" // Reduce from lg to md
                className={`${combinedClassName} stack-network-optimized`}
                style={combinedStyles}
                {...props}
              >
                {children}
              </MantineStack>
            );
          default:
            // Keep other gap values as is
            break;
        }
      }
    }
    
    // Wrap with South African market optimizations if rural or data-saver
    if (saSensitive && (saMarket.isRural || saMarket.shouldReduceDataUsage) && priority !== 'critical') {
      return (
        <SouthAfricanMarketOptimizer
          component="Stack"
          priority={priority}
          networkAware={networkAware}
          animate={animatePresence}
          animationDuration={animationDelay}
        >
          <MantineStack 
            ref={combinedRef}
            gap={gapValue}
            className={`${combinedClassName} stack-sa-optimized`}
            style={shouldDisableAnimations && animatePresence ? {
              ...combinedStyles,
              opacity: 1, // Ensure visibility without animation
              transform: 'none' // Prevent any transform issues
            } : combinedStyles}
            data-sa-optimized="true"
            {...props}
          >
            {children}
          </MantineStack>
        </SouthAfricanMarketOptimizer>
      );
    }
    
    // Default rendering with normal gap values
    return (
      <MantineStack 
        ref={combinedRef}
        gap={gapValue}
        className={combinedClassName}
        style={shouldDisableAnimations && animatePresence ? {
          ...combinedStyles,
          opacity: 1, // Ensure visibility without animation
          transform: 'none' // Prevent any transform issues
        } : combinedStyles}
        {...props}
      >
        {children}
      </MantineStack>
    );
  }
);

Stack.displayName = 'Stack';