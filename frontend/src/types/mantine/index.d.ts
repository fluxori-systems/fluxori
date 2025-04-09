/**
 * Type definitions for Mantine UI components
 * This file extends Mantine's component types to ensure type safety with the properties
 * used in our design system.
 */

import '@mantine/core';

declare module '@mantine/core' {
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
}