'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Container as MantineContainer } from '@mantine/core';
import { BaseComponentProps, Spacing, AnimatableComponentProps } from '../types';
import { getSpacingValue } from '../utils/token-helpers';
import { useCombinedRefs } from '../utils/use-combined-refs';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { useConnectionQuality, useNetworkAware } from '../hooks/useConnection';
import { useSouthAfricanMarketOptimizations } from '../../shared/hooks/useSouthAfricanMarketOptimizations';
/**
 * Container sizing options with semantic names
 */
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fluid';

/**
 * Container intent/purpose for semantic styling
 */
export type ContainerIntent = 'default' | 'content' | 'layout' | 'feature' | 'section' | 'banner';

/**
 * Props for the Container component
 */
export interface ContainerProps extends BaseComponentProps, AnimatableComponentProps {
  /** Container size preset */
  size?: ContainerSize;
  
  /** Container width */
  w?: string | number;
  
  /** Container fluid (100% width) */
  fluid?: boolean;
  
  /** Semantic intent/purpose of the container */
  intent?: ContainerIntent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Whether to animate container appearance */
  animatePresence?: boolean;
  
  /** Container padding */
  p?: Spacing;
  
  /** Container padding horizontal */
  px?: Spacing;
  
  /** Container padding vertical */
  py?: Spacing;
  
  /** Container padding top */
  pt?: Spacing;
  
  /** Container padding bottom */
  pb?: Spacing;
  
  /** Container padding left */
  pl?: Spacing;
  
  /** Container padding right */
  pr?: Spacing;
  
  /** Container center content */
  centered?: boolean;
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** South African market optimizations */
  saSensitive?: boolean;
  
  /** Content priority for resource loading */
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Enhanced Container component that integrates with Fluxori Design System
 * 
 * Features:
 * - Consistent max-widths and responsive padding
 * - Design token integration and tracking
 * - Network-aware optimizations for South African market
 * - Animated entrance effects
 * - Semantic intent/purpose variants
 * - Uses dependency inversion pattern to avoid circular dependencies
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    children,
    size = 'md',
    fluid = false,
    intent = 'default',
    networkAware = true,
    animatePresence = false,
    animated = false,
    animationDelay = 0,
    animationSpeed = 1,
    animationType = 'fade',
    centered = false,
    className = '',
    saSensitive = false,
    priority = 'medium',
    p,
    px,
    py,
    pt,
    pb,
    pl,
    pr,
    style,
    ...props 
  }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const ref = useCombinedRefs(innerRef, forwardedRef);
    const { quality, isDataSaver } = useConnectionQuality();
    const saMarket = useSouthAfricanMarketOptimizations();
    const [isVisible, setIsVisible] = useState(!animatePresence && !animated);
    
    // Use token tracking
    const tokenTracking = useTokenTracking('Container');
    
    // Track token usage
    useEffect(() => {
      tokenTracking.trackToken(`container-size-${size}`);
      tokenTracking.trackToken(`intent-${intent}`);
      
      if (typeof p === 'string') tokenTracking.trackToken(`spacing-${p}`);
      if (typeof px === 'string') tokenTracking.trackToken(`spacing-${px}`);
      if (typeof py === 'string') tokenTracking.trackToken(`spacing-${py}`);
      if (typeof pt === 'string') tokenTracking.trackToken(`spacing-${pt}`);
      if (typeof pb === 'string') tokenTracking.trackToken(`spacing-${pb}`);
      if (typeof pl === 'string') tokenTracking.trackToken(`spacing-${pl}`);
      if (typeof pr === 'string') tokenTracking.trackToken(`spacing-${pr}`);
    }, [size, intent, p, px, py, pt, pb, pl, pr, tokenTracking]);
    
    // Make container visible after animation delay
    useEffect(() => {
      if (animatePresence || animated) {
        const timeout = setTimeout(() => {
          setIsVisible(true);
        }, animationDelay);
        
        return () => clearTimeout(timeout);
      }
    }, [animatePresence, animated, animationDelay]);
    
    // Apply network-aware animation delay
    const networkAnimationDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Apply network-aware animation duration
    const networkAnimationDuration = useNetworkAware({
      highQuality: animationSpeed * 0.3,
      mediumQuality: animationSpeed * 0.25,
      lowQuality: animationSpeed * 0.2,
      poorQuality: animationSpeed * 0.15,
      dataSaverMode: animationSpeed * 0.1
    });
    
    // Determine if we should optimize based on network
    const shouldOptimize = networkAware && (isDataSaver || quality === 'poor' || quality === 'low');
    const isRuralSouthAfrican = saSensitive && saMarket.isRural;
    
    // Map container sizes to semantic values with South African market optimizations
    const getContainerSize = (): number | string => {
      if (fluid) return '100%';
      
      // Use normal sizes or optimized sizes based on network/data saver
      // Additional optimization for rural South African connections
      const shouldOptimizeSize = shouldOptimize || isRuralSouthAfrican;
      
      // Apply more aggressive optimization for rural South African connections
      if (isRuralSouthAfrican && saMarket.shouldReduceDataUsage) {
        tokenTracking.trackToken('sa-optimize-container-size');
        
        // For rural South African connections, reduce sizes even more aggressively
        switch (size) {
          case 'xs': 
          case 'sm': 
          case 'md': 
          case 'lg': 
          case 'xl': return 'var(--container-size-xs, 576px)'; // Use smallest size for all 
          case 'fluid': return '100%';
          default: return 'var(--container-size-xs, 576px)';
        }
      }
      
      // Standard network-aware size optimization
      switch (size) {
        case 'xs': return 'var(--container-size-xs, 576px)'; // Mobile focused
        case 'sm': return 'var(--container-size-sm, 768px)'; // Small tablets
        case 'md': 
          // For poor network, use smaller container to reduce layout calculations
          return shouldOptimizeSize ? 
            'var(--container-size-sm, 768px)' : // Optimize by using smaller container
            'var(--container-size-md, 992px)';   // Normal size for good connections
        case 'lg': 
          // For poor network, reduce to medium size
          return shouldOptimizeSize ? 
            'var(--container-size-md, 992px)' :   // Optimize by using smaller container
            'var(--container-size-lg, 1200px)';   // Normal size for good connections
        case 'xl': 
          // For poor network, reduce to large size
          return shouldOptimizeSize ? 
            'var(--container-size-lg, 1200px)' :  // Optimize by using smaller container
            'var(--container-size-xl, 1400px)';   // Normal size for good connections
        case 'fluid': return '100%';
        default: return 'var(--container-size-md, 992px)';
      }
    };
    
    // Apply responsive padding using token helpers with network-aware optimizations
    const getDefaultPadding = (): string => {
      // For poor connections/data saver, use more compact padding
      const shouldOptimizePadding = shouldOptimize;
      
      // Apply even more aggressive padding optimization for rural South African connections
      if (isRuralSouthAfrican && saMarket.shouldReduceDataUsage) {
        tokenTracking.trackToken('sa-optimize-container-padding');
        return getSpacingValue('xs'); // Use minimum padding for all sizes
      }
      
      if (shouldOptimizePadding) {
        tokenTracking.trackToken('network-optimize-padding');
        return size === 'xs' || size === 'sm' ? getSpacingValue('sm') : getSpacingValue('md');
      }
      
      // Default to horizontal padding based on container size
      return size === 'xs' || size === 'sm' ? getSpacingValue('md') : getSpacingValue('lg');
    };
    
    // Get properly mapped spacing values with network optimization
    const paddingLeft = pl ? getSpacingValue(pl) : 
                       px ? getSpacingValue(px) : 
                       p ? getSpacingValue(p) : 
                       getDefaultPadding();
                       
    const paddingRight = pr ? getSpacingValue(pr) : 
                        px ? getSpacingValue(px) : 
                        p ? getSpacingValue(p) : 
                        getDefaultPadding();
                        
    const paddingTop = pt ? getSpacingValue(pt) : 
                      py ? getSpacingValue(py) : 
                      p ? getSpacingValue(p) : 
                      undefined;
                      
    const paddingBottom = pb ? getSpacingValue(pb) : 
                         py ? getSpacingValue(py) : 
                         p ? getSpacingValue(p) : 
                         undefined;
    
    // Build class name with intent and South African market optimization hints
    const combinedClassName = `flx-container flx-container-${size} container-${intent} ${
      saSensitive ? 'sa-optimized' : ''
    } ${
      priority ? `priority-${priority}` : ''
    } ${className}`.trim();
    
    // Determine animation style based on network conditions
    let animationStyle: React.CSSProperties = {};
    
    if ((animatePresence || animated) && !shouldOptimize) {
      // Choose appropriate animation based on type and add performance optimizations
      if (animationType === 'scale' || animationType === 'fade') {
        animationStyle = {
          opacity: isVisible ? 1 : 0,
          transform: animationType === 'scale' ? `scale(${isVisible ? 1 : 0.95})` : undefined,
          animation: isVisible ? 
            `${animationType === 'scale' ? 'fadeInScale' : 'fadeIn'} ${networkAnimationDuration}s ease-out forwards` : 
            undefined,
          animationDelay: `${networkAnimationDelay}s`,
          // Add performance optimization hint for browsers
          willChange: 'opacity, transform'
        };
      }
    } else if ((animatePresence || animated) && shouldOptimize) {
      // Use simpler animation for poor connections or data saver mode
      animationStyle = {
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? `saOptimizedFade ${networkAnimationDuration}s ease-out forwards` : undefined,
        animationDelay: `${networkAnimationDelay}s`,
      };
    }
    
    // For rural South African connections with high priority content, skip animations entirely
    if (isRuralSouthAfrican && saMarket.shouldReduceMotion && priority === 'critical') {
      animationStyle = {
        opacity: 1,
        transform: 'none'
      };
      tokenTracking.trackToken('sa-skip-animation');
    }
    
    // Styles for container with optimization for poor connections
    const containerStyles: React.CSSProperties = {
      textAlign: centered ? 'center' : undefined,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      ...animationStyle,
      ...style
    };
    
    // Additional data attributes for monitoring and debugging
    const dataAttributes = {
      'data-network-quality': quality,
      'data-sa-optimized': saSensitive ? 'true' : undefined,
      'data-priority': priority,
      'data-animated': (animatePresence || animated) ? 'true' : undefined,
      'data-intent': intent
    };
    
    return (
      <MantineContainer
        ref={ref}
        size={getContainerSize()}
        className={combinedClassName}
        style={containerStyles}
        {...dataAttributes}
        {...props}
      >
        {children}
      </MantineContainer>
    );
  }
);

Container.displayName = 'Container';