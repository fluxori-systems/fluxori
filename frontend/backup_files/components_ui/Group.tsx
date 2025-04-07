import { Group as MantineGroup, GroupProps as MantineGroupProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface GroupProps extends MantineGroupProps {
  // Legacy prop support
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  position?: 'left' | 'center' | 'right' | 'apart';
}

export const Group = forwardRef<HTMLDivElement, GroupProps>(
  ({ spacing, position, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const gap = spacing !== undefined ? spacing : props.gap;
    const justify = position ? mapPositionToJustify(position) : props.justify;
    
    return <MantineGroup ref={ref} {...props} gap={gap} justify={justify} />;
  }
);

// Helper to map legacy position to justify
function mapPositionToJustify(position: string): string {
  switch (position) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'apart': return 'space-between';
    default: return position;
  }
}

Group.displayName = 'Group';