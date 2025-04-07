import { Stack as MantineStack, StackProps as MantineStackProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { MantineSpacing } from '@mantine/core';

export interface StackProps extends Omit<MantineStackProps, 'spacing'> {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Legacy prop support
  spacing?: MantineSpacing;
}

/**
 * Stack component that supports both modern Mantine v7 props and legacy spacing prop
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ children, spacing, ...props }, ref) => {
    // Map legacy spacing to Mantine v7 gap
    const gap = spacing !== undefined ? spacing : props.gap;
    
    return (
      <MantineStack 
        ref={ref} 
        {...props} 
        gap={gap}
      >
        {children}
      </MantineStack>
    );
  }
);

Stack.displayName = 'Stack';