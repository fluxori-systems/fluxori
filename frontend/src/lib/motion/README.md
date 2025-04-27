# Fluxori Motion Framework

A comprehensive animation framework for Fluxori that provides consistent, purposeful animations throughout the application while considering accessibility, performance, and bandwidth constraints.

## Business Animations

The framework includes integration points for GSAP Business license animations. These premium features are currently commented out and will need to be activated with a valid GSAP Business license before use.

Business animation features include:

- SplitText for advanced text animations
- DrawSVG for path drawing animations
- MorphSVG for shape morphing
- Flip for smooth layout transitions
- Physics animations
- Custom easing functions
- Text scrambling effects

## Features

- **Fully TypeScript Compatible**: Complete type safety with strict typing
- **Accessibility-First**: Respects user preferences for reduced motion
- **Performance Optimized**: Designed for efficient rendering and low impact on main thread
- **South African Market Ready**: Contains optimizations for bandwidth-constrained environments
- **Flexible Animation System**: Simple API for common animations with GSAP power underneath
- **Comprehensive AI Animation Patterns**: Specialized components for AI interactions
- **Theme Integration**: Works seamlessly with the Design System

## Core Components

### Animation Hooks

- `useGSAPAnimation`: Primary hook for element animations
- `useReducedMotion`: Hook to respect user reduced motion preferences
- `useConnectionQuality`: Hook to adapt animations based on connection quality

### AI-Specific Components

- `AIProcessingIndicator`: Shows when AI is thinking or processing
- `StreamingText`: Animates text appearance like real-time generation
- `IconFeedback`: Visual feedback based on AI confidence levels

### Transition Components

- `TransitionFade`: Smooth transitions between content states
- `AnimatedTabIndicator`: Animated indicator for tab interfaces

## Usage

### Basic Animation

```tsx
"use client";

import { useRef, useEffect } from "react";
import { useGSAPAnimation } from "@/lib/motion";

export function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);
  const animation = useGSAPAnimation(elementRef);

  useEffect(() => {
    // Animate on mount
    animation.fadeIn({ duration: 0.4 });
  }, [animation]);

  return (
    <div ref={elementRef} style={{ opacity: 0 }}>
      Content to animate
    </div>
  );
}
```

### AI Processing

```tsx
import { AIProcessingIndicator } from "@/lib/motion";

export function AIComponent({ isThinking }) {
  return (
    <div>
      <AIProcessingIndicator
        state={isThinking ? "thinking" : "idle"}
        size={40}
      />
      {isThinking ? "AI is thinking..." : "Ask a question"}
    </div>
  );
}
```

## Respecting User Preferences

The motion framework automatically respects user preferences:

1. Detects and honors `prefers-reduced-motion` setting
2. Adapts to connection quality (especially for South African users)
3. Provides manual override with `motionMode` setting ('full', 'reduced', 'minimal')

## Architecture

The framework follows a layered approach:

1. **Core Layer**: MotionContext, tokens, and utilities
2. **Animation Layer**: GSAP integration and hooks
3. **Component Layer**: Ready-to-use animation components
4. **Integration Layer**: Connection to the design system

## Performance Considerations

- Automatic cleanup of animations on unmount
- Staggered animations for related elements
- Performance monitoring for development
- Bandwidth-aware adjustments
- Power-efficient animation options

## South African Market Optimizations

- Automatic detection of connection quality
- Simplified animations for bandwidth-constrained connections
- Reduced animation complexity for slower devices
- Default to simpler animations in data conservation mode
