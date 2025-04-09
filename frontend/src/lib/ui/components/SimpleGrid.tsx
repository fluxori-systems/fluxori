'use client';

import React, { forwardRef, useRef, useCallback } from 'react';
import { SimpleGrid as MantineSimpleGrid, MantineTheme } from '@mantine/core';
import { useCombinedRefs } from '../utils/use-combined-refs';
import { BaseComponentProps, Spacing, AnimatableComponentProps } from '../types';
import { useTokenTracking } from '../../design-system/utils/token-analysis';
import { useMantineTheme } from '@mantine/core';
import { useNetworkAware, useConnectionQuality } from '../hooks/useConnection';
import { useSouthAfricanMarketOptimizations } from '../../shared/hooks/useSouthAfricanMarketOptimizations';
import { SpacingScale } from '../../design-system/types/tokens';
import { getSpacingFromMantine } from '../../design-system/utils/mantine-theme-adapter';

export interface SimpleGridProps extends BaseComponentProps, AnimatableComponentProps {
  /** Number of columns */
  cols: number;
  
  /** Gap between elements */
  spacing?: Spacing;
  
  /** Responsive breakpoints for cols */
  breakpoints?: Array<{ maxWidth: number; cols: number; spacing?: Spacing }>;
  
  /** Minimum column width that will be used to determine how many columns should be rendered */
  minChildWidth?: number | string;
  
  /** Vertically align content */
  verticalSpacing?: Spacing;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** South African market optimizations */
  saSensitive?: boolean;
  
  /** Content priority */
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * SimpleGrid component with proper TypeScript typing and design token integration
 * Implements dependency inversion pattern to avoid circular dependencies
 * Includes South African market-specific optimizations
 */
export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ 
    children, 
    spacing, 
    verticalSpacing, 
    networkAware: isNetworkAware = false,
    saSensitive: isSaSensitive = false,
    priority: contentPriority = 'medium',
    animated: isAnimated = false,
    animationDelay: delay = 0,
    animationSpeed: speed = 1,
    ...props 
  }, ref) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, gridRef);
    const tokenTracking = useTokenTracking('SimpleGrid');
    const theme = useMantineTheme();
    const connectionQuality = useConnectionQuality();
    const saMarket = useSouthAfricanMarketOptimizations();
    
    // Track token usage
    if (typeof spacing === 'string' && spacing !== 'auto') {
      tokenTracking.trackToken(`spacing-${spacing}`);
    }
    
    if (typeof verticalSpacing === 'string' && verticalSpacing !== 'auto') {
      tokenTracking.trackToken(`spacing-${verticalSpacing}`);
    }
    
    // Use network-aware optimizations
    const { quality, isDataSaver } = connectionQuality;
    const shouldSimplify = isNetworkAware && (quality === 'poor' || quality === 'low' || isDataSaver);
    
    // Apply network-aware animation delay if animation is enabled
    const networkAnimationDelay = useNetworkAware({
      highQuality: delay / 1000,
      mediumQuality: (delay * 0.8) / 1000,
      lowQuality: (delay * 0.5) / 1000,
      poorQuality: (delay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Convert string spacing to design tokens with optimization for poor connections
    let spacingValue = spacing;
    if (typeof spacing === 'string' && spacing !== 'auto') {
      // Get base spacing value
      const baseSpacing = getSpacingFromMantine(theme, spacing as keyof SpacingScale, undefined);
      
      // Apply optimization for poor connections
      if (shouldSimplify && isSaSensitive) {
        // Use simplified spacing for poor network conditions
        // This reduces layout complexity for better performance
        spacingValue = typeof baseSpacing === 'number' 
          ? Math.max(4, Math.floor(baseSpacing * 0.75)) // 25% reduction with 4px minimum
          : baseSpacing;
        
        // Track SA optimization
        tokenTracking.trackToken('sa-optimize-spacing');
      } else {
        spacingValue = baseSpacing;
      }
    }
    
    // Apply the same pattern for vertical spacing
    let verticalSpacingValue = verticalSpacing;
    if (typeof verticalSpacing === 'string' && verticalSpacing !== 'auto') {
      const baseVerticalSpacing = getSpacingFromMantine(theme, verticalSpacing as keyof SpacingScale, undefined);
      
      if (shouldSimplify && isSaSensitive) {
        verticalSpacingValue = typeof baseVerticalSpacing === 'number'
          ? Math.max(4, Math.floor(baseVerticalSpacing * 0.75))
          : baseVerticalSpacing;
        
        // Track SA optimization
        tokenTracking.trackToken('sa-optimize-vspacing');
      } else {
        verticalSpacingValue = baseVerticalSpacing;
      }
    }
    
    // Process responsive breakpoints to use design tokens with SA market optimizations
    let processedBreakpoints = props.breakpoints;
    if (props.breakpoints) {
      processedBreakpoints = props.breakpoints.map((breakpoint: { maxWidth: number; cols: number; spacing?: Spacing }) => {
        if (typeof breakpoint.spacing === 'string' && breakpoint.spacing !== 'auto') {
          const baseBreakpointSpacing = getSpacingFromMantine(theme, breakpoint.spacing as keyof SpacingScale, undefined);
          
          // Apply South African market optimizations for breakpoints
          if (shouldSimplify && isSaSensitive && saMarket.isRural) {
            // For rural South African connections, optimize layout further
            // This significantly reduces layout complexity
            const optimizedSpacing = typeof baseBreakpointSpacing === 'number'
              ? Math.max(4, Math.floor(baseBreakpointSpacing * 0.6)) // 40% reduction with 4px minimum
              : baseBreakpointSpacing;
            
            return {
              ...breakpoint,
              spacing: optimizedSpacing
            };
          }
          
          return {
            ...breakpoint,
            spacing: baseBreakpointSpacing
          };
        }
        return breakpoint;
      });
      
      // For rural South African connections, reduce complexity by limiting breakpoints
      if (saMarket.isRural && isSaSensitive && shouldSimplify && processedBreakpoints.length > 2) {
        // Only keep the smallest and largest breakpoints for rural connections
        processedBreakpoints = [
          processedBreakpoints[0],
          processedBreakpoints[processedBreakpoints.length - 1]
        ];
        tokenTracking.trackToken('sa-optimize-breakpoints');
      }
    }
    
    // For poor network conditions, potentially reduce columns to improve performance
    let optimizedCols = props.cols;
    if (shouldSimplify && isSaSensitive && saMarket.isRural && props.cols > 3) {
      // Cap maximum columns in rural areas for better performance
      optimizedCols = Math.min(3, props.cols);
      tokenTracking.trackToken('sa-optimize-columns');
    }
    
    // Create custom animation style for entry animation
    const animationStyle = isAnimated ? {
      opacity: 0,
      transform: 'translateY(10px)',
      animation: `fadeIn ${speed * 0.3}s ease-out forwards`,
      animationDelay: `${networkAnimationDelay}s`,
    } : {};
    
    // Add data attributes for monitoring and debugging
    const dataAttributes = {
      'data-sa-optimized': isSaSensitive && shouldSimplify ? 'true' : undefined,
      'data-priority': contentPriority,
      'data-network-quality': quality,
    };
    
    // Filter out our custom props that don't belong in the Mantine component
    const filteredProps = { ...props };
    
    // Remove custom props to avoid prop conflicts with Mantine
    delete filteredProps.saSensitive;
    delete filteredProps.networkAware;
    delete filteredProps.priority;
    delete filteredProps.animated;
    delete filteredProps.animationDelay;
    delete filteredProps.animationSpeed;
    
    // Explicitly use only the Mantine-compatible props
    const mantineProps: any = {
      ref: combinedRef,
      spacing: spacingValue,
      verticalSpacing: verticalSpacingValue,
      cols: optimizedCols,
      style: {
        ...props.style,
        ...animationStyle
      },
      ...dataAttributes,
      ...filteredProps
    };
    
    // Only add breakpoints if they exist to avoid TypeScript error
    if (processedBreakpoints && processedBreakpoints.length > 0) {
      mantineProps.breakpoints = processedBreakpoints;
    }
    
    return (
      <MantineSimpleGrid {...mantineProps}>
        {children}
      </MantineSimpleGrid>
    );
  }
);

SimpleGrid.displayName = 'SimpleGrid';