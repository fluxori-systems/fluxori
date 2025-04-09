'use client';

import { forwardRef, ReactNode, ForwardRefExoticComponent, RefAttributes, useRef, useEffect } from 'react';
import { Grid as MantineGrid } from '@mantine/core';
import { useTokenTracking } from '../../design-system/utils/token-analysis';

// Import from shared modules to avoid circular dependencies
import { useCombinedRefs } from '../../shared/utils/ref-utils';
import { useComponentAnimation } from '../hooks/useComponentAnimation';
import { useConnectionQuality, useNetworkAware } from '../hooks/useConnection';

// Define token intent variants for Grid
export type GridIntent = 'default' | 'content' | 'layout' | 'dashboard' | 'gallery';

export interface GridProps {
  /** Grid content */
  children?: ReactNode;
  
  /** Gap between columns (modern prop) */
  gutter?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy spacing prop (mapped to gutter) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Number of columns in grid */
  columns?: number;
  
  /** Purpose/intent of the grid for semantic styling */
  intent?: GridIntent;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Whether to animate children appearance */
  animatePresence?: boolean;
  
  /** Animation delay in ms */
  animationDelay?: number;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Horizontal alignment */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  
  /** Vertical alignment */
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
  
  /** Other props */
  [key: string]: any;
}

// Type for responsive column sizing
interface ColSpan {
  span?: number;
  offset?: number;
  order?: number;
}

export interface ColProps {
  /** Column content */
  children?: ReactNode;
  
  /** Base column span (0-12) */
  span?: number | ColSpan | { base: number | ColSpan } & {
    [key in 'xs' | 'sm' | 'md' | 'lg' | 'xl']?: number | ColSpan;
  };
  
  /** Legacy md size */
  md?: number | ColSpan;
  
  /** Legacy lg size */
  lg?: number | ColSpan;
  
  /** Legacy sm size */
  sm?: number | ColSpan;
  
  /** Legacy xs size */
  xs?: number | ColSpan;
  
  /** Legacy xl size */
  xl?: number | ColSpan;
  
  /** Column offset */
  offset?: number;
  
  /** Column order */
  order?: number;
  
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Whether to animate content appearance */
  animatePresence?: boolean;
  
  /** Animation delay in ms */
  animationDelay?: number;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

// Define the type for Grid component with Col static property
export interface GridComponent extends ForwardRefExoticComponent<GridProps & RefAttributes<HTMLDivElement>> {
  Col: ForwardRefExoticComponent<ColProps & RefAttributes<HTMLDivElement>>;
}

/**
 * Grid component with proper TypeScript typing, design token integration, and network-aware optimizations.
 * 
 * Features:
 * - Modern Mantine v7 support with legacy prop mapping
 * - Intent-based styling variants
 * - Token usage tracking for design system analysis
 * - Network-aware optimizations for South African market
 * - Responsive grid simplification for poor connections
 */
const GridBase = forwardRef<HTMLDivElement, GridProps>(
  ({ 
    children, 
    spacing, 
    gutter: gutterProp,
    intent = 'default',
    networkAware = true, 
    animatePresence = false,
    animationDelay = 0,
    className = '',
    columns = 12,
    style,
    ...props 
  }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const connectionQuality = useConnectionQuality();
    const { isDataSaver, quality } = connectionQuality;
    
    // Map legacy spacing to Mantine v7 gutter
    const gutter = spacing !== undefined ? spacing : gutterProp;
    
    // Use token tracking to record which tokens are used
    const tokenTracking = useTokenTracking('Grid');
    
    // Track token usage
    useEffect(() => {
      if (typeof gutter === 'string') {
        tokenTracking.trackToken(`spacing-${gutter}`);
      }
      tokenTracking.trackToken(`intent-${intent}`);
      tokenTracking.trackToken(`grid-columns-${columns}`);
    }, [gutter, intent, columns, tokenTracking]);
    
    // Use network-aware animation delay
    const networkAnimationDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Apply entrance animation if requested
    useComponentAnimation({
      ref: innerRef,
      enabled: animatePresence,
      mode: 'appear', // Used for entrance effect
      isActive: animatePresence,
      networkAware,
      properties: {
        opacity: 1,
        y: 0,
        delay: networkAware ? networkAnimationDelay : animationDelay / 1000
      }
    });
    
    // Build class name with intent
    const combinedClassName = `${className} grid-${intent}`.trim();
    
    // Apply network-aware optimizations for data saver mode or poor connections
    if (networkAware && (isDataSaver || quality === 'poor')) {
      // Use optimized gutter values for poor connections
      // Reduce spacing to optimize rendering and improve performance
      let optimizedGutter = gutter;
      
      if (typeof gutter === 'string') {
        switch (gutter) {
          case 'xl':
            optimizedGutter = 'lg'; // Reduce from xl to lg
            tokenTracking.trackToken('network-optimize-spacing');
            break;
          case 'lg':
            optimizedGutter = 'md'; // Reduce from lg to md
            tokenTracking.trackToken('network-optimize-spacing');
            break;
          default:
            // Keep other gap values as is
            break;
        }
      }
      
      return (
        <MantineGrid 
          ref={useCombinedRefs(forwardedRef, innerRef)} 
          gutter={optimizedGutter}
          columns={columns}
          className={`${combinedClassName} grid-network-optimized`}
          style={{
            ...style,
            // Ensure opacity is 1 to prevent visibility issues without animation
            opacity: 1
          }}
          {...props}
        >
          {children}
        </MantineGrid>
      );
    }
    
    // Default rendering with normal gutter values
    return (
      <MantineGrid 
        ref={useCombinedRefs(forwardedRef, innerRef)} 
        gutter={gutter}
        columns={columns}
        className={combinedClassName}
        style={style}
        {...props}
      >
        {children}
      </MantineGrid>
    );
  }
);

/**
 * Grid.Col component with network-aware optimizations and animations
 */
const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ 
    children, 
    span: spanProp, 
    md, 
    lg, 
    sm, 
    xs, 
    xl,
    networkAware = true,
    animatePresence = false,
    animationDelay = 0,
    className = '',
    style,
    ...props 
  }, forwardedRef) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const connectionQuality = useConnectionQuality();
    const { quality, isDataSaver } = connectionQuality;
    
    // Handle legacy responsive props by converting to modern span format
    const span = spanProp || convertLegacySpanProps({ md, lg, sm, xs, xl });
    
    // Use token tracking
    const tokenTracking = useTokenTracking('Grid.Col');
    
    // Track spans for design system analysis
    useEffect(() => {
      if (typeof span === 'number') {
        tokenTracking.trackToken(`grid-col-span-${span}`);
      }
    }, [span, tokenTracking]);
    
    // Use network-aware animation delay
    const networkAnimationDelay = useNetworkAware({
      highQuality: animationDelay / 1000,
      mediumQuality: (animationDelay * 0.8) / 1000,
      lowQuality: (animationDelay * 0.5) / 1000,
      poorQuality: (animationDelay * 0.3) / 1000,
      dataSaverMode: 0 // No animation delay in data saver mode
    });
    
    // Apply entrance animation if requested
    useComponentAnimation({
      ref: innerRef,
      enabled: animatePresence,
      mode: 'appear', // Used for entrance effect
      isActive: animatePresence,
      networkAware,
      properties: {
        opacity: 1,
        y: 0,
        delay: networkAware ? networkAnimationDelay : animationDelay / 1000
      }
    });
    
    // Apply network-aware optimizations
    if (networkAware && (isDataSaver || quality === 'poor')) {
      // For poor connections, simplify responsive behavior by collapsing to fewer breakpoints
      // This improves rendering performance on weak devices
      
      // If we have a complex responsive span, simplify it for performance
      if (typeof span === 'object' && !('span' in span)) {
        tokenTracking.trackToken('network-optimize-responsive');
        
        // Simplified responsive behavior - use fewer breakpoints
        const optimizedSpan = {
          // Use xs and md only to simplify layout calculations
          xs: span.xs || span.sm || 12, // Default to full width on mobile
          md: span.md || span.lg || span.xl // Take the largest size for desktop
        };
        
        return (
          <MantineGrid.Col
            ref={useCombinedRefs(forwardedRef, innerRef)}
            span={optimizedSpan}
            className={`${className} grid-col-network-optimized`}
            style={{
              ...style,
              opacity: 1 // Ensure visibility
            }}
            {...props}
          >
            {children}
          </MantineGrid.Col>
        );
      }
    }
    
    // Default rendering with normal behavior
    return (
      <MantineGrid.Col 
        ref={useCombinedRefs(forwardedRef, innerRef)}
        span={span}
        className={className}
        style={style}
        {...props}
      >
        {children}
      </MantineGrid.Col>
    );
  }
);

// Helper function to convert legacy responsive props to new format
function convertLegacySpanProps({ md, lg, sm, xs, xl }: {
  md?: number | ColSpan;
  lg?: number | ColSpan;
  sm?: number | ColSpan;
  xs?: number | ColSpan;
  xl?: number | ColSpan;
}) {
  // Only create responsive object if there are legacy props
  if (!md && !lg && !sm && !xs && !xl) {
    return undefined;
  }
  
  return {
    ...(xs !== undefined ? { xs } : {}),
    ...(sm !== undefined ? { sm } : {}),
    ...(md !== undefined ? { md } : {}),
    ...(lg !== undefined ? { lg } : {}),
    ...(xl !== undefined ? { xl } : {}),
  };
}

Col.displayName = 'Grid.Col';
GridBase.displayName = 'Grid';

// Create the final Grid component with Col attached as a static property
export const Grid = Object.assign(GridBase, { Col }) as GridComponent;