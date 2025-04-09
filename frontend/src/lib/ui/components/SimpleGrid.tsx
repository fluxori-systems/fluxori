'use client';

import { SimpleGrid as MantineSimpleGrid } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface SimpleGridProps {
  /** Grid content */
  children?: ReactNode;
  
  /** Number of columns */
  cols: number;
  
  /** Gap between elements */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * SimpleGrid component with proper TypeScript typing
 */
export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ children, ...props }, ref) => {
    return (
      <MantineSimpleGrid 
        ref={ref}
        {...props}
      >
        {children}
      </MantineSimpleGrid>
    );
  }
);

SimpleGrid.displayName = 'SimpleGrid';