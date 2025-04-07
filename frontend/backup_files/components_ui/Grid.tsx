import { Grid as MantineGrid, GridProps as MantineGridProps, GridColProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface GridProps extends MantineGridProps {
  // Legacy prop support
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
}

export interface ColProps extends GridColProps {
  md?: number;
  lg?: number;
  sm?: number;
  xs?: number;
  children?: ReactNode;
}

// Grid component with legacy prop support
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ spacing, ...props }, ref) => {
    // Map legacy spacing to Mantine v7 gap
    const gap = spacing !== undefined ? spacing : props.gap;
    
    return <MantineGrid ref={ref} {...props} gap={gap} />;
  }
);

// Col subcomponent
const Col = forwardRef<HTMLDivElement, ColProps>(
  ({ md, lg, sm, xs, ...props }, ref) => {
    const colSpanProps = {
      ...(md ? { md } : {}),
      ...(lg ? { lg } : {}),
      ...(sm ? { sm } : {}),
      ...(xs ? { xs } : {}),
    };
    
    return <MantineGrid.Col ref={ref} {...colSpanProps} {...props} />;
  }
);

Col.displayName = 'Grid.Col';

// Attach Col component to Grid
Grid.Col = Col;
Grid.displayName = 'Grid';