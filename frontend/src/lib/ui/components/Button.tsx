'use client';

import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import { ReactNode, forwardRef } from 'react';

export interface ButtonProps {
  /** Button content */
  children?: ReactNode;
  
  /** The color of the button */
  color?: string;
  
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Button variant */
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'white' | 'default' | 'gradient';
  
  /** Left section content */
  leftSection?: ReactNode;
  
  /** Right section content */
  rightSection?: ReactNode;
  
  /** Legacy prop for left icon (will use leftSection internally) */
  leftIcon?: ReactNode;
  
  /** Legacy prop for right icon (will use rightSection internally) */
  rightIcon?: ReactNode;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Component to render as */
  component?: any;
  
  /** Onclick handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void) | (() => Promise<void>);
  
  /** Additional className */
  className?: string;
  
  /** Additional style */
  style?: React.CSSProperties;
  
  /** Other props */
  [key: string]: any;
}

/**
 * Button component that supports Mantine v7 props
 * with proper TypeScript typing
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    leftIcon, 
    rightIcon, 
    leftSection: leftSectionProp, 
    rightSection: rightSectionProp, 
    ...props 
  }, ref) => {
    // Map legacy props to Mantine v7 props
    const leftSection = leftIcon || leftSectionProp;
    const rightSection = rightIcon || rightSectionProp;
    
    return (
      <MantineButton 
        ref={ref} 
        {...props} 
        leftSection={leftSection} 
        rightSection={rightSection} 
      >
        {children}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';