'use client';

import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Grid, ColSpan } from '../../components/Grid';
import { useConnectionQuality } from '../../hooks/useConnection';
import { useTokenTracking } from '../../../design-system/utils/token-analysis';
import { useSouthAfricanMarketOptimizations } from '../../../shared/hooks/useSouthAfricanMarketOptimizations';
import { useCombinedRefs } from '../../../shared/utils/ref-utils';
import { Layout, DashboardDensity } from '../../../design-system/types/dashboard';

export interface DashboardGridProps {
  /** Children to render */
  children?: React.ReactNode;
  
  /** Grid columns (default: 12) */
  columns?: number;
  
  /** Grid rows (auto by default) */
  rows?: number;
  
  /** Gap between grid items */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  /** Whether to show grid lines (for development) */
  showGridLines?: boolean;
  
  /** Layout for different breakpoints */
  layout?: {
    lg?: Layout[];
    md?: Layout[];
    sm?: Layout[];
    xs?: Layout[];
  };
  
  /** Data density for the dashboard (affects spacing) */
  density?: DashboardDensity;
  
  /** Whether to enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Whether items can be dragged (requires layout manager) */
  draggable?: boolean;
  
  /** Whether items can be resized (requires layout manager) */
  resizable?: boolean;
  
  /** Callback when layout changes */
  onLayoutChange?: (layout: Layout[]) => void;
  
  /** Whether to animate grid item entrance */
  animateEntrance?: boolean;
  
  /** Additional class name */
  className?: string;
  
  /** Additional style object */
  style?: React.CSSProperties;
}

// Col component for the grid
// More relaxed span type that matches Grid.ColProps
export interface DashboardGridColProps {
  /** Children to render */
  children?: React.ReactNode;
  
  /** Column span (1-12 or responsive object) */
  span?: number | ColSpan | Record<string, number | ColSpan>;
  
  /** Additional class name */
  className?: string;
  
  /** Additional style object */
  style?: React.CSSProperties;
}

// Define the type for DashboardGrid component with Col static property
export interface DashboardGridComponent extends React.ForwardRefExoticComponent<DashboardGridProps & React.RefAttributes<HTMLDivElement>> {
  Col: React.ForwardRefExoticComponent<DashboardGridColProps & React.RefAttributes<HTMLDivElement>>;
}

/**
 * DashboardGrid component provides a responsive grid layout for dashboard cards.
 * Optimized for South African market conditions with network-aware adjustments
 * and appropriate data density controls.
 */
const DashboardGridBase = forwardRef<HTMLDivElement, DashboardGridProps>(
  ({ 
    children, 
    columns = 12, 
    rows,
    gap = 'md',
    showGridLines = false,
    layout,
    density = 'comfortable',
    networkAware = true,
    draggable = false,
    resizable = false,
    onLayoutChange,
    animateEntrance = true,
    className = '',
    style
  }, ref) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRefs(ref, gridRef);
    const tokenTracking = useTokenTracking('DashboardGrid');
    const { quality, isDataSaver } = useConnectionQuality();
    const { shouldReduceMotion, shouldUsePlaceholders } = useSouthAfricanMarketOptimizations();
    const [activeBreakpoint, setActiveBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');

    // Map density to specific gap values
    const getDensityGap = () => {
      // For data saver mode, always use the most compact layout
      if (isDataSaver) {
        return 'xs';
      }
      
      // For poor or low quality connections, reduce gap size
      if (networkAware && (quality === 'poor' || quality === 'low')) {
        return 'xs';
      }
      
      // Otherwise use density setting
      return density === 'compact' ? 'sm' : 'md';
    };
    
    // Track token usage
    useEffect(() => {
      tokenTracking.trackToken(`grid-columns-${columns}`);
      tokenTracking.trackToken(`grid-gap-${gap}`);
      tokenTracking.trackToken(`grid-density-${density}`);
    }, [columns, gap, density, tokenTracking]);
    
    // Determine active breakpoint based on window width
    useEffect(() => {
      if (typeof window === 'undefined') return;
      
      const handleResize = () => {
        const width = window.innerWidth;
        
        if (width >= 1200) {
          setActiveBreakpoint('xl');
        } else if (width >= 992) {
          setActiveBreakpoint('lg');
        } else if (width >= 768) {
          setActiveBreakpoint('md');
        } else if (width >= 576) {
          setActiveBreakpoint('sm');
        } else {
          setActiveBreakpoint('xs');
        }
      };
      
      // Initial check
      handleResize();
      
      // Listen for window resize
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Apply density settings to grid
    const effectiveGap = getDensityGap();
    
    // Simplified grid for poor connections or data saver mode
    if (networkAware && (quality === 'poor' || isDataSaver) && shouldUsePlaceholders) {
      // Use a simpler layout for very poor connections
      return (
        <div 
          ref={combinedRef}
          className={`dashboard-grid dashboard-grid-simplified ${className}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            ...style
          }}
          data-density={density}
          data-network-quality={quality}
        >
          {children}
        </div>
      );
    }
    
    // Standard grid layout
    return (
      <Grid
        ref={combinedRef}
        columns={columns}
        gutter={effectiveGap}
        className={`dashboard-grid ${showGridLines ? 'dashboard-grid-lines' : ''} ${className}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: rows ? `repeat(${rows}, 1fr)` : 'auto',
          gap: typeof effectiveGap === 'string' ? `var(--spacing-${effectiveGap})` : `${effectiveGap}px`,
          ...style
        }}
        networkAware={networkAware}
        animatePresence={animateEntrance && !shouldReduceMotion}
        animationDelay={50}
        data-density={density}
        data-network-quality={quality}
        data-breakpoint={activeBreakpoint}
        data-is-data-saver={isDataSaver ? 'true' : 'false'}
      >
        {children}
      </Grid>
    );
  }
);

DashboardGridBase.displayName = 'DashboardGrid';

/**
 * Grid Column component for the dashboard grid
 */
const Col = forwardRef<HTMLDivElement, DashboardGridColProps>(
  ({ children, span, className = '', style }, ref) => {
    return (
      <Grid.Col 
        ref={ref}
        span={span}
        className={`dashboard-grid-col ${className}`}
        style={style}
      >
        {children}
      </Grid.Col>
    );
  }
);

Col.displayName = 'DashboardGrid.Col';

// Create the final DashboardGrid component with Col attached
export const DashboardGrid = Object.assign(DashboardGridBase, { Col }) as DashboardGridComponent;