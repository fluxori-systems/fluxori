"use client";

import React, { useRef, useEffect } from "react";

import { gsap } from "gsap";

import { useMotion } from "../context/MotionContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  aiAnimations,
  ConfidenceLevel,
  complexityPresets,
} from "../utils/motion-tokens";

export interface IconFeedbackProps {
  /** Icon component or element to animate */
  icon: React.ReactNode;
  /** Confidence level for animation style */
  confidence: ConfidenceLevel;
  /** Size of the icon container */
  size?: number;
  /** Whether the animation should play */
  isActive?: boolean;
  /** Color for the icon container */
  color?: string;
  /** Class name for custom styling */
  className?: string;
  /** Callback after animation completes */
  onComplete?: () => void;
}

/**
 * Animated icon component with confidence-based animation
 * Used to provide visual feedback about AI confidence levels
 */
export function IconFeedback({
  icon,
  confidence = "medium",
  size = 32,
  isActive = true,
  color = "var(--color-primary-500)",
  className = "",
  onComplete,
}: IconFeedbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { motionMode } = useMotion();
  const shouldReduceMotion = useReducedMotion();
  const complexity = complexityPresets[motionMode];

  // Clean up GSAP animations
  const cleanupAnimations = () => {
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current);
    }
  };

  // Apply animation based on confidence level
  useEffect(() => {
    if (shouldReduceMotion || !isActive) {
      cleanupAnimations();
      return;
    }

    // Get the DOM element
    const element = containerRef.current;
    if (!element) return;

    // Clean up previous animations
    cleanupAnimations();

    // Get animation configuration based on confidence level
    const config = aiAnimations.confidence[confidence];

    // Apply duration scaling based on complexity settings
    const duration = config.duration * complexity.reduceDuration;
    const ease = complexity.useSimpleEasings ? "power1.out" : config.ease;

    // Different animations based on confidence level
    switch (confidence) {
      case "high":
        // Smooth scale animation for high confidence
        gsap.fromTo(
          element,
          { scale: 0.9, opacity: 0.7 },
          {
            scale: 1,
            opacity: 1,
            duration,
            ease,
            onComplete: onComplete,
          },
        );
        break;

      case "medium":
        // Slight bounce for medium confidence
        gsap.fromTo(
          element,
          { scale: 0.8, opacity: 0.5 },
          {
            scale: 1,
            opacity: 1,
            duration,
            ease: complexity.useSimpleEasings ? "power2.out" : "back.out(1.2)",
            onComplete: onComplete,
          },
        );
        break;

      case "low":
        // Wiggle for low confidence
        const timeline = gsap.timeline({
          onComplete: onComplete,
        });

        timeline
          .fromTo(
            element,
            { scale: 0.8, opacity: 0.5, rotation: -3 },
            {
              scale: 1,
              opacity: 0.9,
              rotation: 3,
              duration: duration / 2,
              ease: "power1.inOut",
            },
          )
          .to(element, {
            rotation: 0,
            duration: duration / 2,
            ease: "power1.out",
          });
        break;

      case "verifying":
        // Pulsing for verification
        gsap.fromTo(
          element,
          { scale: 0.9, opacity: 0.6 },
          {
            scale: 1.05,
            opacity: 1,
            duration: duration / 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
            onComplete: onComplete,
          },
        );
        break;

      case "processing":
        // Continuous pulse for processing
        gsap.fromTo(
          element,
          { scale: 0.95, opacity: 0.8 },
          {
            scale: 1.05,
            opacity: 1,
            duration: duration / 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
        break;
    }

    // Clean up on unmount or confidence change
    return cleanupAnimations;
  }, [
    confidence,
    isActive,
    shouldReduceMotion,
    motionMode,
    complexity,
    onComplete,
  ]);

  return (
    <div
      ref={containerRef}
      className={`icon-feedback ${className}`}
      style={{
        width: size,
        height: size,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "50%",
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        color: color,
        // Apply instant styling for reduced motion
        opacity: shouldReduceMotion ? 1 : 0.5,
        transform: shouldReduceMotion ? "scale(1)" : "scale(0.9)",
      }}
    >
      {icon}
    </div>
  );
}
