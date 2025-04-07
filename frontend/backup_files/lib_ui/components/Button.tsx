import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import { ReactNode, forwardRef } from 'react';

export interface ButtonProps extends Omit<MantineButtonProps, 'leftSection' | 'rightSection'> {
  // Legacy prop support
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  onClick?: () => void | Promise<void>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ leftIcon, rightIcon, ...props }, ref) => {
    // Map legacy props to Mantine v7 props
    const leftSection = leftIcon || props.leftSection;
    const rightSection = rightIcon || props.rightSection;
    
    return (
      <MantineButton 
        ref={ref} 
        {...props} 
        leftSection={leftSection} 
        rightSection={rightSection} 
      />
    );
  }
);

Button.displayName = 'Button';