"use client";

import { Intent, Radius, Size, Spacing } from "../types";

/**
 * Helper functions to map component props to design system tokens
 * This creates a consistent layer for token consumption across components
 */

/**
 * Maps intent value to a CSS color variable
 */
export function getIntentColor(intent: Intent = "default"): string {
  switch (intent) {
    case "primary":
      return "var(--color-primary-500)";
    case "secondary":
      return "var(--color-secondary-500)";
    case "success":
      return "var(--color-success-base)";
    case "warning":
      return "var(--color-warning-base)";
    case "error":
      return "var(--color-error-base)";
    case "info":
      return "var(--color-info-base)";
    case "neutral":
      return "var(--color-neutral-600)";
    default:
      return "var(--color-primary-500)";
  }
}

/**
 * Maps intent value to a CSS background color variable
 */
export function getIntentBackgroundColor(
  intent: Intent = "default",
  variant: "light" | "filled" | "default" = "default",
): string {
  if (variant === "filled") {
    return getIntentColor(intent);
  }

  if (variant === "light") {
    switch (intent) {
      case "primary":
        return "var(--color-primary-100)";
      case "secondary":
        return "var(--color-secondary-100)";
      case "success":
        return "var(--color-success-light)";
      case "warning":
        return "var(--color-warning-light)";
      case "error":
        return "var(--color-error-light)";
      case "info":
        return "var(--color-info-light)";
      case "neutral":
        return "var(--color-neutral-100)";
      default:
        return "var(--color-primary-100)";
    }
  }

  return "transparent";
}

/**
 * Maps radius value to a CSS radius variable
 */
export function getRadiusValue(radius: Radius = "md"): string {
  switch (radius) {
    case "none":
      return "var(--radius-none)";
    case "xs":
      return "var(--radius-xs)";
    case "sm":
      return "var(--radius-sm)";
    case "md":
      return "var(--radius-md)";
    case "lg":
      return "var(--radius-lg)";
    case "xl":
      return "var(--radius-xl)";
    case "full":
      return "var(--radius-full)";
    default:
      return "var(--radius-md)";
  }
}

/**
 * Maps spacing value to a CSS spacing variable
 */
export function getSpacingValue(spacing: Spacing = "md"): string {
  if (typeof spacing === "number") {
    return `${spacing}px`;
  }

  if (spacing === "auto") {
    return "auto";
  }

  switch (spacing) {
    case "xs":
      return "var(--spacing-xs)";
    case "sm":
      return "var(--spacing-sm)";
    case "md":
      return "var(--spacing-md)";
    case "lg":
      return "var(--spacing-lg)";
    case "xl":
      return "var(--spacing-xl)";
    case "2xl":
      return "var(--spacing-2xl)";
    case "3xl":
      return "var(--spacing-3xl)";
    case "4xl":
      return "var(--spacing-4xl)";
    default:
      return "var(--spacing-md)";
  }
}

/**
 * Maps size value to a font size variable
 */
export function getFontSizeValue(size: Size = "md"): string {
  switch (size) {
    case "xs":
      return "var(--font-size-xs)";
    case "sm":
      return "var(--font-size-sm)";
    case "md":
      return "var(--font-size-md)";
    case "lg":
      return "var(--font-size-lg)";
    case "xl":
      return "var(--font-size-xl)";
    case "2xl":
      return "var(--font-size-2xl)";
    case "3xl":
      return "var(--font-size-3xl)";
    case "4xl":
      return "var(--font-size-4xl)";
    case "5xl":
      return "var(--font-size-5xl)";
    case "6xl":
      return "var(--font-size-6xl)";
    default:
      return "var(--font-size-md)";
  }
}

/**
 * Get a shadow value from the design system
 */
export function getShadowValue(
  size: "none" | "xs" | "sm" | "md" | "lg" | "xl" = "md",
): string {
  switch (size) {
    case "none":
      return "none";
    case "xs":
      return "var(--shadow-xs)";
    case "sm":
      return "var(--shadow-sm)";
    case "md":
      return "var(--shadow-md)";
    case "lg":
      return "var(--shadow-lg)";
    case "xl":
      return "var(--shadow-xl)";
    default:
      return "var(--shadow-md)";
  }
}
