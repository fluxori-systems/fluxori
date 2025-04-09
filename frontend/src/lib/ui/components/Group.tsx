'use client';

import { Group as MantineGroup } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

// Define appropriate justify content values for TypeScript safety
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

export interface GroupProps {
  /** Group content */
  children?: ReactNode;
  
  /** Gap between elements (modern prop) */
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy spacing prop (mapped to gap) */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Horizontal content alignment (modern prop) */
  justify?: JustifyContent;
  
  /** Legacy position prop (mapped to justify) */
  position?: 'left' | 'center' | 'right' | 'apart';
  
  /** Vertical alignment */
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
  
  /** Wrap elements */
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Group component with proper TypeScript typing
 * and legacy prop support
 */
export const Group = forwardRef<HTMLDivElement, GroupProps>(
  ({ 
    children, 
    spacing, 
    gap: gapProp, 
    position, 
    justify: justifyProp, 
    ...props 
  }, ref) => {
    // Map legacy props to Mantine v7 props
    const gap = spacing !== undefined ? spacing : gapProp;
    const justify = position !== undefined ? mapPositionToJustify(position) : justifyProp;
    
    return (
      <MantineGroup 
        ref={ref} 
        gap={gap} 
        justify={justify}
        {...props}
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