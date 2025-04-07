import { SimpleGrid as MantineSimpleGrid, SimpleGridProps as MantineSimpleGridProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { MantineSpacing } from '@mantine/core';

// Properly typed breakpoint object
export interface BreakpointObject {
  maxWidth: string | number;
  cols: number;
  spacing?: MantineSpacing;
}

export interface SimpleGridProps extends Omit<MantineSimpleGridProps, 'spacing'> {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Legacy prop support
  spacing?: MantineSpacing;
  breakpoints?: BreakpointObject[];
}

/**
 * SimpleGrid component with proper type safety for breakpoints and spacing
 */
export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ children, spacing, breakpoints, ...props }, ref) => {
    // In Mantine v7, verticalSpacing is used instead of spacing/gap
    const gridProps = { ...props };
    
    if (spacing !== undefined) {
      // Apply spacing to the appropriate prop
      (gridProps as any).verticalSpacing = spacing;
      (gridProps as any).horizontalSpacing = spacing;
    }
    
    // Create responsive object for breakpoints if needed
    const responsiveProps = breakpoints 
      ? { breakpoints: breakpoints.map(bp => ({ ...bp })) } 
      : {};
    
    return (
      <MantineSimpleGrid 
        ref={ref} 
        {...gridProps} 
        {...responsiveProps} 
      >
        {children}
      </MantineSimpleGrid>
    );
  }
);

SimpleGrid.displayName = 'SimpleGrid';