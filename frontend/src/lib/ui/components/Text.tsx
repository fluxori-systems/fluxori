import { Text as MantineText, TextProps as MantineTextProps } from '@mantine/core';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import type { MantineSize } from '@mantine/core';

// Define font weight type since MantineFontWeight isn't exported
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'normal' | 'bold' | 'bolder' | 'lighter';

// Extend the Mantine TextProps to include children and additional properties
export interface TextProps extends Omit<MantineTextProps, 'fw' | 'ta' | 'fs'> {
  // Required prop for proper JSX element typing
  children?: ReactNode;
  
  // Legacy props support, explicitly typed
  weight?: FontWeight;
  fw?: FontWeight;  // fontWeight shorthand
  ta?: 'left' | 'center' | 'right'; // textAlign shorthand
  fs?: MantineSize | number | string; // fontSize shorthand
}

/**
 * Text component that properly supports ReactNode children and legacy prop names
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ children, weight, fw, ta, fs, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const fontWeight = weight || fw;
    const textAlign = ta;
    const fontSize = fs;
    
    return (
      <MantineText 
        ref={ref} 
        {...props} 
        fz={fontSize || props.fz}
        fw={fontWeight} 
        ta={textAlign} 
      >
        {children}
      </MantineText>
    );
  }
);

Text.displayName = 'Text';