'use client';

import { Stack as MantineStack } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface StackProps {
  /** Stack content */
  children?: ReactNode;
  
  /** Gap between elements (modern prop) */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy spacing prop (mapped to gap) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Align items */
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
  
  /** Justify content */
  justify?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Stack component with proper TypeScript typing
 * and legacy spacing prop support
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ 
    children, 
    spacing, 
    gap: gapProp, 
    ...props 
  }, ref) => {
    // Map legacy spacing to Mantine v7 gap
    const gap = spacing !== undefined ? spacing : gapProp;
    
    return (
      <MantineStack 
        ref={ref} 
        gap={gap}
        {...props}
      >
        {children}
      </MantineStack>
    );
  }
);

Stack.displayName = 'Stack';