import { Stack as MantineStack, StackProps as MantineStackProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface StackProps extends MantineStackProps {
  // Legacy prop support
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ spacing, ...props }, ref) => {
    // Map legacy spacing to Mantine v7 gap
    const gap = spacing !== undefined ? spacing : props.gap;
    
    return <MantineStack ref={ref} {...props} gap={gap} />;
  }
);

Stack.displayName = 'Stack';