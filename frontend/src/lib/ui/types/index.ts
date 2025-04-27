"use client";

/**
 * Common types for UI components in the Fluxori design system
 */

import { ReactNode, CSSProperties } from "react";

/**
 * Standard intent types for UI components
 * Used to convey semantic meaning through color and styling
 */
export type Intent =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "default";

/**
 * Standard size types
 */
export type Size =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl";

/**
 * Standard radius types mapped to design system tokens
 */
export type Radius = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "full";

/**
 * Animation types for components that support animations
 */
export type AnimationType =
  | "none"
  | "scale"
  | "fade"
  | "slide"
  | "ripple"
  | "bounce"
  | "pulse"
  | "hover"
  | "shadow"
  | "tilt";

/**
 * Standard spacing types (based on design system tokens)
 */
export type Spacing =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "auto"
  | number;

/**
 * Base props shared by all UI components
 */
export interface BaseComponentProps {
  /** Additional className to apply */
  className?: string;

  /** Additional inline styles */
  style?: CSSProperties;

  /** ID attribute */
  id?: string;

  /** Children elements */
  children?: ReactNode;

  /** DOM data attributes */
  [key: `data-${string}`]: string | number | boolean;

  /** ARIA attributes */
  [key: `aria-${string}`]: string | number | boolean;

  /** Any other props will be passed directly to the underlying element */
  [key: string]: any;
}

/**
 * Base props for components that support animation
 */
export interface AnimatableComponentProps {
  /** Whether animation is enabled */
  animated?: boolean;

  /** Animation type to apply */
  animationType?: AnimationType;

  /** Animation delay in milliseconds */
  animationDelay?: number;

  /** Animation duration multiplier (1.0 = normal speed) */
  animationSpeed?: number;
}

/**
 * Type for responsive props that can be different at different breakpoints
 */
export type ResponsiveValue<T> =
  | T
  | {
      base?: T;
      xs?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
      "2xl"?: T;
    };

/**
 * Type for directional spacing (margin/padding)
 */
export interface DirectionalSpacing {
  /** All sides */
  all?: Spacing;

  /** Horizontal (left and right) */
  x?: Spacing;

  /** Vertical (top and bottom) */
  y?: Spacing;

  /** Top */
  top?: Spacing;

  /** Right */
  right?: Spacing;

  /** Bottom */
  bottom?: Spacing;

  /** Left */
  left?: Spacing;
}

/**
 * Type for a11y/accessibility props
 */
export interface A11yProps {
  /** Element role */
  role?: string;

  /** Whether the element is currently disabled */
  disabled?: boolean;

  /** The element should have a label for screen readers */
  "aria-label"?: string;

  /** The ID of an element that labels this element */
  "aria-labelledby"?: string;

  /** The ID of an element that describes this element */
  "aria-describedby"?: string;

  /** Whether the element is expanded */
  "aria-expanded"?: boolean;

  /** Whether the element is currently pressed */
  "aria-pressed"?: boolean;

  /** Whether the element is currently checked */
  "aria-checked"?: boolean;

  /** Whether the element is required */
  "aria-required"?: boolean;

  /** Whether the element is invalid */
  "aria-invalid"?: boolean;
}
