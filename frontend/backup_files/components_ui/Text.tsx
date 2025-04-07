import { Text as MantineText, TextProps as MantineTextProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface TextProps extends MantineTextProps {
  // Legacy prop support
  weight?: number | string;
  fw?: number | string; // fontWeight shorthand
  ta?: 'left' | 'center' | 'right'; // textAlign shorthand
  fs?: string | number; // fontSize shorthand
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ weight, fw, ta, fs, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const fontWeight = weight || fw || props.fw;
    const textAlign = ta || props.ta;
    const fontSize = fs || props.fs;
    
    return (
      <MantineText 
        ref={ref} 
        {...props} 
        fw={fontWeight} 
        ta={textAlign} 
        size={fontSize || props.size}
      />
    );
  }
);

Text.displayName = 'Text';