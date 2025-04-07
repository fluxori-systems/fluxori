import { Grid as MantineGrid, GridProps as MantineGridProps, GridColProps } from '@mantine/core';
import { forwardRef, ReactNode, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { MantineSpacing } from '@mantine/core';

export interface GridProps extends Omit<MantineGridProps, 'spacing'> {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Legacy prop support
  spacing?: MantineSpacing;
}

export interface ColProps extends GridColProps {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Responsive props with proper typing
  md?: number | { span?: number; offset?: number; order?: number };
  lg?: number | { span?: number; offset?: number; order?: number };
  sm?: number | { span?: number; offset?: number; order?: number };
  xs?: number | { span?: number; offset?: number; order?: number };
}

// Define the type for Grid component with Col static property
export interface GridComponent extends ForwardRefExoticComponent<GridProps & RefAttributes<HTMLDivElement>> {
  Col: ForwardRefExoticComponent<ColProps & RefAttributes<HTMLDivElement>>;
}

/**
 * Grid component with properly typed Col subcomponent
 */
const GridWithoutCol = forwardRef<HTMLDivElement, GridProps>(
  ({ children, spacing, ...props }, ref) => {
    // Don't use props.gap since it doesn't exist in MantineGridProps
    // Instead, properly handle spacing and ignore gap
    const gridProps = { ...props };
    
    if (spacing !== undefined) {
      // In Mantine v7, 'gutter' is used instead of 'gap'
      (gridProps as any).gutter = spacing;
    }
    
    return (
      <MantineGrid 
        ref={ref} 
        {...gridProps}
      >
        {children}
      </MantineGrid>
    );
  }
);

// Col subcomponent
const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ children, md, lg, sm, xs, ...props }, ref) => {
    const colSpanProps = {
      ...(md !== undefined ? { md } : {}),
      ...(lg !== undefined ? { lg } : {}),
      ...(sm !== undefined ? { sm } : {}),
      ...(xs !== undefined ? { xs } : {}),
    };
    
    return (
      <MantineGrid.Col 
        ref={ref} 
        {...colSpanProps} 
        {...props}
      >
        {children}
      </MantineGrid.Col>
    );
  }
);

Col.displayName = 'Grid.Col';
GridWithoutCol.displayName = 'Grid';

// Create the final Grid component with Col attached as a static property
export const Grid = GridWithoutCol as GridComponent;
Grid.Col = Col;