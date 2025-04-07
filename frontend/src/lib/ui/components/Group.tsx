import { Group as MantineGroup, GroupProps as MantineGroupProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import type { MantineSpacing } from '@mantine/core';

// Define appropriate justify content values for TypeScript safety
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

export interface GroupProps extends Omit<MantineGroupProps, 'spacing'> {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Legacy prop support with proper typing
  spacing?: MantineSpacing;
  position?: 'left' | 'center' | 'right' | 'apart';
}

/**
 * Group component that supports both modern Mantine v7 props and legacy position/spacing props
 */
export const Group = forwardRef<HTMLDivElement, GroupProps>(
  ({ children, spacing, position, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const gap = spacing !== undefined ? spacing : props.gap;
    const justify = position ? mapPositionToJustify(position) : props.justify;
    
    return (
      <MantineGroup 
        ref={ref} 
        {...props} 
        gap={gap} 
        justify={justify as JustifyContent}
      >
        {children}
      </MantineGroup>
    );
  }
);

// Helper to map legacy position to justify
function mapPositionToJustify(position: string): JustifyContent {
  switch (position) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'apart': return 'space-between';
    case 'center': return 'center';
    default: return 'flex-start';
  }
}

Group.displayName = 'Group';