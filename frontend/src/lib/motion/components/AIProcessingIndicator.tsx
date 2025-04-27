"use client";

import React, { useRef, useEffect } from "react";

import { gsap } from "gsap";

import { useMotion } from "../context/MotionContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { aiAnimations, complexityPresets } from "../utils/motion-tokens";

export interface AIProcessingIndicatorProps {
  /** Type of processing state to display */
  state: "thinking" | "processing" | "analyzing" | "idle";
  /** Size of the indicator in pixels */
  size?: number;
  /** Primary color for the indicator */
  color?: string;
  /** Secondary color for the indicator */
  secondaryColor?: string;
  /** Class name for custom styling */
  className?: string;
}

/**
 * AI-specific processing indicator component
 *
 * Displays different animations based on the AI's current state
 */
export function AIProcessingIndicator({
  state = "idle",
  size = 32,
  color = "var(--color-primary-500)",
  secondaryColor = "var(--color-neutral-200)",
  className = "",
}: AIProcessingIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const { motionMode } = useMotion();
  const shouldReduceMotion = useReducedMotion();
  const complexity = complexityPresets[motionMode];

  // Cleanup function for GSAP animations
  const cleanupAnimations = () => {
    if (containerRef.current) {
      gsap.killTweensOf(containerRef.current);
    }

    dotsRef.current.forEach((dot) => {
      gsap.killTweensOf(dot);
    });
  };

  // Handle animation based on state
  useEffect(() => {
    if (shouldReduceMotion || state === "idle") {
      cleanupAnimations();
      return;
    }

    // Kill any existing animations
    cleanupAnimations();

    // Get animation configuration based on state
    let config;
    switch (state) {
      case "thinking":
        config = aiAnimations.thinking;
        break;
      case "processing":
      case "analyzing":
        config = aiAnimations.processing;
        break;
      default:
        return;
    }

    // Apply duration scaling based on complexity settings
    const duration = config.duration * complexity.reduceDuration;

    // Different animations based on state
    if (state === "thinking") {
      // Thinking animation - pulsing dots
      dotsRef.current.forEach((dot, index) => {
        gsap.to(dot, {
          scale: 1.5,
          opacity: 1,
          duration: duration / 3,
          ease: complexity.useSimpleEasings ? "power1.inOut" : config.ease,
          repeat: -1,
          yoyo: true,
          delay: index * (complexity.disableStaggering ? 0.05 : 0.15),
        });
      });
    } else if (state === "processing" || state === "analyzing") {
      // Processing animation - circular motion
      gsap.to(containerRef.current, {
        rotation: 360,
        duration: duration,
        ease: complexity.useSimpleEasings ? "none" : "linear",
        repeat: -1,
      });

      dotsRef.current.forEach((dot, index) => {
        gsap.to(dot, {
          scale: index === 0 ? 1.5 : 1,
          opacity: index === 0 ? 1 : 0.6,
          duration: duration / 2,
          ease: complexity.useSimpleEasings ? "power1.inOut" : config.ease,
          repeat: -1,
          yoyo: true,
          delay: index * (complexity.disableStaggering ? 0.05 : 0.2),
        });
      });
    }

    // Cleanup on unmount or state change
    return cleanupAnimations;
  }, [state, shouldReduceMotion, motionMode, complexity]);

  // Render the component - three dots for the indicator
  return (
    <div
      className={`ai-processing-indicator ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      ref={containerRef}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) dotsRef.current[index] = el;
          }}
          style={{
            width: size / 5,
            height: size / 5,
            borderRadius: "50%",
            backgroundColor: index === 0 ? color : secondaryColor,
            position: "absolute",
            opacity: index === 0 ? 0.9 : 0.6,
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${index * 120}deg) translate(${size / 3}px, 0)`,
          }}
        />
      ))}
    </div>
  );
}
