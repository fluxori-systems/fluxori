/**
 * Type definitions for Mantine UI components
 * This file extends Mantine's component types to ensure type safety with the properties
 * used in our design system.
 */

import '@mantine/core';

declare module '@mantine/core' {
  // Define a better interface for SimpleGrid breakpoints
  export interface SimpleGridBreakpoint {
    maxWidth: number;
    cols: number;
    spacing?: string | number;
  }
  // Text component
  interface TextProps {
    c?: string; // color shorthand (replaces color)
    fw?: number | string; // font weight shorthand (replaces weight)
    ta?: 'left' | 'center' | 'right' | 'justify'; // text align shorthand (replaces align)
  }

  // Group component
  interface GroupProps {
    gap?: string | number; // gap between items (replaces spacing)
    justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'; // horizontal alignment (replaces position)
  }

  // Stack component
  interface StackProps {
    gap?: string | number; // gap between items (replaces spacing)
    ta?: 'left' | 'center' | 'right' | 'justify'; // text alignment (replaces align)
  }

  // Button component
  interface ButtonProps {
    leftSection?: React.ReactNode; // left icon (replaces leftIcon)
    rightSection?: React.ReactNode; // right icon (replaces rightIcon)
  }

  // Grid component
  interface GridColProps {
    span?: number | { base: number; xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  }

  // Stepper component
  interface StepperProps {
    // breakpoint is removed in newer versions
    allowNextStepsSelect?: boolean;
  }
  
  // SimpleGrid component
  interface SimpleGridProps {
    // Columns
    cols?: number;
    
    // Spacing props
    spacing?: string | number;
    verticalSpacing?: string | number;
    
    // Responsive breakpoints
    breakpoints?: SimpleGridBreakpoint[];
    
    // For data attributes
    'data-sa-optimized'?: string;
    'data-priority'?: string;
    'data-network-quality'?: string;
    
    // Additional props for compatibility with our components
    style?: React.CSSProperties;
  }
  
  // Menu component
  interface MenuProps extends React.ComponentPropsWithRef<'div'> {
    // Menu open state
    opened?: boolean;
    
    // Open state change handler
    onChange?: (opened: boolean) => void;
    
    // Close menu when item is clicked
    closeOnItemClick?: boolean;
    
    // Menu open/close delays
    openDelay?: number;
    closeDelay?: number;
    
    // Positioning props
    position?: string;
    
    // Additional props for refs and nested components
    children?: React.ReactNode;
  }
  
  // Menu.Item component
  interface MenuItemProps extends React.ComponentPropsWithRef<'button'> {
    // Left and right sections (replacing icons in v6)
    leftSection?: React.ReactNode;
    rightSection?: React.ReactNode;
    
    // Text color 
    c?: string;
    
    // Item states
    disabled?: boolean;
    
    // Click handler
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    
    // Component to render as
    component?: React.ElementType;
  }
}