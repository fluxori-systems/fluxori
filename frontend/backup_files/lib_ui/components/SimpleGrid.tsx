import { SimpleGrid as MantineSimpleGrid, SimpleGridProps as MantineSimpleGridProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface BreakpointObject {
  maxWidth: string | number;
  cols: number;
}

export interface SimpleGridProps extends MantineSimpleGridProps {
  // Legacy prop support
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  breakpoints?: BreakpointObject[];
}

export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ spacing, breakpoints, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const gap = spacing !== undefined ? spacing : props.gap;
    
    // Create responsive object for breakpoints if needed
    const responsiveProps = breakpoints 
      ? { breakpoints: breakpoints.map(bp => ({ ...bp })) } 
      : {};
    
    return <MantineSimpleGrid ref={ref} {...props} {...responsiveProps} gap={gap} />;
  }
);

SimpleGrid.displayName = 'SimpleGrid';