'use client';

import { Text as MantineText } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

// Define font weight type
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface TextProps {
  /** Text content */
  children?: ReactNode;
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Font size */
  fz?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Legacy size property (mapped to fz) */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
  
  /** Font weight */
  fw?: FontWeight;
  
  /** Legacy weight property (mapped to fw) */
  weight?: FontWeight;
  
  /** Text alignment */
  ta?: 'left' | 'center' | 'right' | 'justify';
  
  /** Legacy align property (mapped to ta) */
  align?: 'left' | 'center' | 'right' | 'justify';
  
  /** Text color */
  c?: string;
  
  /** Legacy color property (mapped to c) */
  color?: string;
  
  /** Truncate text with ellipsis */
  truncate?: boolean | 'start' | 'end';
  
  /** Line clamp */
  lineClamp?: number;
  
  /** Inline or block element */
  inline?: boolean;
  
  /** Inherit font properties */
  inherit?: boolean;
  
  /** Gradient configuration */
  gradient?: { from: string; to: string; deg?: number };
  
  /** Render as span instead of p */
  span?: boolean;
  
  /** Component to render as */
  component?: React.ElementType;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Text component that properly supports ReactNode children and legacy prop names
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    children, 
    weight, 
    fw: fwProp, 
    align, 
    ta: taProp, 
    size, 
    fz: fzProp, 
    color, 
    c: cProp, 
    ...props 
  }, ref) => {
    // Map legacy props to Mantine v7 props
    const fw = weight !== undefined ? weight : fwProp;
    const ta = align !== undefined ? align : taProp;
    const fz = size !== undefined ? size : fzProp;
    const c = color !== undefined ? color : cProp;
    
    return (
      <MantineText 
        ref={ref} 
        fw={fw} 
        ta={ta}
        fz={fz}
        c={c}
        {...props}
      >
        {children}
      </MantineText>
    );
  }
);

Text.displayName = 'Text';