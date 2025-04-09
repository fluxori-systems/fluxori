'use client';

import { Grid as MantineGrid } from '@mantine/core';
import { forwardRef, ReactNode, ForwardRefExoticComponent, RefAttributes } from 'react';

export interface GridProps {
  /** Grid content */
  children?: ReactNode;
  
  /** Gap between columns (modern prop) */
  gutter?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy spacing prop (mapped to gutter) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Number of columns in grid */
  columns?: number;
  
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
 * Grid component with properly typed Col subcomponent
 */
const GridBase = forwardRef<HTMLDivElement, GridProps>(
  ({ 
    children, 
    spacing, 
    gutter: gutterProp, 
    ...props 
  }, ref) => {
    // Map legacy spacing to Mantine v7 gutter
    const gutter = spacing !== undefined ? spacing : gutterProp;
    
    return (
      <MantineGrid 
        ref={ref} 
        gutter={gutter}
        {...props}
      >
        {children}
      </MantineGrid>
    );
  }
);

// Col subcomponent that handles legacy props
const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ 
    children, 
    span: spanProp, 
    md, 
    lg, 
    sm, 
    xs, 
    xl, 
    ...props 
  }, ref) => {
    // Handle legacy responsive props by converting to modern span format
    const span = spanProp || convertLegacySpanProps({ md, lg, sm, xs, xl });
    
    return (
      <MantineGrid.Col 
        ref={ref} 
        span={span}
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