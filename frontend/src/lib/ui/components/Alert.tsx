"use client";

import { forwardRef, useState, useEffect, useRef } from "react";

import { Alert as MantineAlert } from "@mantine/core";

import { Text } from "./Text";
import { useTokenTracking } from "../../design-system/utils/token-analysis";
import { useMotion, TransitionFade, useConnectionQuality } from "../../motion";
import { useComponentAnimation } from "../hooks/useComponentAnimation";
import { BaseComponentProps, Intent, Radius } from "../types";
import {
  getRadiusValue,
  getIntentColor,
  getIntentBackgroundColor,
} from "../utils/token-helpers";
import { useCombinedRefs } from "../utils/use-combined-refs";

/**
 * Alert types for different contexts
 */
export type AlertVariant = "default" | "filled" | "light" | "outline";

/**
 * Alert colors
 */
export type AlertColor =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "primary"
  | "secondary"
  | "neutral";

/**
 * Semantic intent/purpose for the alert
 */
export type AlertIntent =
  | "default"
  | "notification"
  | "system"
  | "feedback"
  | "action-required";

export interface AlertProps extends BaseComponentProps {
  /** Alert title */
  title?: React.ReactNode;

  /** Alert variant */
  variant?: AlertVariant;

  /** Alert color/severity */
  color?: AlertColor;

  /** Semantic intent/purpose of the alert */
  intent?: AlertIntent;

  /** Alert icon */
  icon?: React.ReactNode;

  /** Allow closing the alert */
  withCloseButton?: boolean;

  /** Alert radius */
  radius?: Radius;

  /** Alert padding */
  p?: string | number;

  /** Alert margin */
  m?: string | number;

  /** On close handler */
  onClose?: () => void;

  /** Close automatically after ms */
  autoClose?: number;

  /** Enable network-aware optimizations */
  networkAware?: boolean;

  /** Component to render as */
  component?: React.ElementType;
}

/**
 * Enhanced Alert component with network-aware optimizations and design token integration
 *
 * Features:
 * - Design token-based styling
 * - Network-aware animations and optimizations
 * - Semantic intent support
 * - Automatic adjustments for poor connections
 * - Token usage tracking
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      children,
      title,
      variant = "light",
      color = "info",
      intent = "default",
      icon,
      withCloseButton = false,
      radius = "md",
      className = "",
      onClose,
      autoClose,
      networkAware = true,
      ...props
    },
    forwardedRef,
  ) => {
    const [visible, setVisible] = useState(true);
    const [showShake, setShowShake] = useState(
      color === "error" || color === "warning",
    );
    const alertRef = useRef<HTMLDivElement | null>(null);
    const ref = useCombinedRefs(alertRef, forwardedRef);
    const { motionMode } = useMotion();
    const { quality, isDataSaver } = useConnectionQuality();

    // Use token tracking to record which tokens are used
    const tokenTracking = useTokenTracking("Alert");

    // Track token usage
    useEffect(() => {
      tokenTracking.trackToken(`alert-color-${color}`);
      tokenTracking.trackToken(`alert-variant-${variant}`);
      tokenTracking.trackToken(`alert-intent-${intent}`);
      tokenTracking.trackToken(`radius-${radius}`);
    }, [color, variant, intent, radius, tokenTracking]);

    // Determine if we should use animations based on motion mode and network conditions
    const shouldDisableAnimations =
      motionMode === "minimal" ||
      (networkAware && (isDataSaver || quality === "poor"));

    const useAnimation = !shouldDisableAnimations;

    // If on poor connection, we still want to show shake animation for error alerts
    // as they are important for user feedback, but we'll reduce the intensity
    const useShakeAnimation = color === "error" && showShake;

    // Apply shake animation for error and warning alerts when they appear
    useComponentAnimation({
      ref: alertRef,
      enabled: useShakeAnimation,
      mode: "shake",
      isActive: showShake,
      networkAware,
      // Error alerts are important, so we keep the animation even on poor connections
      // but we track that we're using a critical animation on a poor connection
      properties: shouldDisableAnimations
        ? {
            x: -2, // Reduced shake for poor connections
            repeat: 2, // Fewer repetitions
            duration: 0.05, // Faster
          }
        : undefined,
    });

    // If using critical animations on poor connections, track it
    useEffect(() => {
      if (useShakeAnimation && shouldDisableAnimations) {
        tokenTracking.trackToken("network-critical-animation");
      }
    }, [useShakeAnimation, shouldDisableAnimations, tokenTracking]);

    // Clear shake animation after it runs once
    useEffect(() => {
      if (showShake) {
        const timer = setTimeout(
          () => {
            setShowShake(false);
          },
          shouldDisableAnimations ? 250 : 500,
        ); // Shorter time on poor connections
        return () => clearTimeout(timer);
      }
    }, [showShake, shouldDisableAnimations]);

    // Map AlertColor type to Intent type to use our token helpers
    const mapColorToIntent = (alertColor: AlertColor): Intent => {
      switch (alertColor) {
        case "info":
          return "info";
        case "success":
          return "success";
        case "warning":
          return "warning";
        case "error":
          return "error";
        case "primary":
          return "primary";
        case "secondary":
          return "secondary";
        case "neutral":
          return "neutral";
        default:
          return "info";
      }
    };

    // Map variant to token helper variant
    const mapVariant = (
      alertVariant: AlertVariant,
    ): "light" | "filled" | "default" => {
      if (alertVariant === "filled") return "filled";
      if (alertVariant === "light") return "light";
      return "default";
    };

    // Get color using our token helpers
    const styleIntent = mapColorToIntent(color);
    const colorValue = getIntentColor(styleIntent);
    const backgroundColorValue = getIntentBackgroundColor(
      styleIntent,
      mapVariant(variant),
    );

    // Get text color based on variant
    const textColor = variant === "filled" ? "white" : colorValue;

    // Auto close effect - adjust timing for network conditions
    useEffect(() => {
      if (autoClose && autoClose > 0) {
        // Give more time on poor connections
        const adjustedAutoClose =
          shouldDisableAnimations && networkAware ? autoClose * 1.5 : autoClose;

        const timer = setTimeout(() => {
          handleClose();
        }, adjustedAutoClose);

        return () => clearTimeout(timer);
      }
    }, [autoClose, shouldDisableAnimations, networkAware]);

    // Handle closing
    const handleClose = () => {
      setVisible(false);

      // Call onClose after animation completes
      if (onClose) {
        if (useAnimation) {
          setTimeout(onClose, shouldDisableAnimations ? 100 : 300);
        } else {
          onClose();
        }
      }
    };

    // Apply network-aware optimizations for radius and styling
    const getOptimizedRadius = (): Radius => {
      if (networkAware && (isDataSaver || quality === "poor")) {
        // Simplify radius on poor connections - reduces paint complexity
        tokenTracking.trackToken("network-optimize-radius");
        if (radius === "xl" || radius === "lg") return "md";
        if (radius === "xs") return "sm";
      }
      return radius;
    };

    // Custom styles with network optimizations
    const alertStyles: React.CSSProperties = {
      backgroundColor: backgroundColorValue,
      borderColor: variant === "outline" ? colorValue : undefined,
      borderRadius: getRadiusValue(getOptimizedRadius()),
      // If on poor connection, reduce box shadow or other expensive visual effects
      boxShadow:
        networkAware && (isDataSaver || quality === "poor")
          ? "none"
          : undefined,
      ...props.style,
    };

    // Build class name with intent and network quality
    const combinedClassName =
      `flx-alert flx-alert-${color} flx-alert-${variant} alert-intent-${intent} ${className}`.trim();

    // Alert content with network-aware Text components
    const alertContent = (
      <MantineAlert
        ref={ref}
        variant={variant}
        color={color}
        icon={icon}
        withCloseButton={withCloseButton}
        className={combinedClassName}
        style={alertStyles}
        onClose={handleClose}
        // Add data attribute for network quality
        data-network-quality={quality}
        title={
          title && (
            <Text
              fw={600}
              size="sm"
              c={textColor}
              className="flx-alert-title"
              networkAware={networkAware}
            >
              {title}
            </Text>
          )
        }
        {...props}
      >
        {typeof children === "string" ? (
          <Text size="sm" c={textColor} networkAware={networkAware}>
            {children}
          </Text>
        ) : (
          children
        )}
      </MantineAlert>
    );

    // Render with or without animation based on network conditions
    if (!visible) return null;

    // Use TransitionFade only if animations are enabled
    return useAnimation ? (
      <TransitionFade duration={shouldDisableAnimations ? 0.15 : 0.3}>
        {alertContent}
      </TransitionFade>
    ) : (
      alertContent
    );
  },
);

Alert.displayName = "Alert";
