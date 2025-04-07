import React, { ReactNode, useEffect, useState } from 'react';
import { Box, BoxProps } from '@mantine/core';
import { useGSAPAnimation } from './useGSAPAnimation';
import { DURATION } from '../constants';

export interface GSAPRevealProps extends BoxProps {
  /** Child elements to reveal */
  children: ReactNode;
  /** Whether the element is revealed */
  isRevealed: boolean;
  /** Duration of the animation */
  duration?: keyof typeof DURATION | number;
  /** Animation effect to use */
  effect?: 'fade' | 'slide' | 'scale' | 'rotate';
  /** Easing function to use */
  ease?: 'power1.out' | 'power2.out' | 'power3.out' | 'power4.out' | 'back.out';
  /** Whether animation is enabled */
  enabled?: boolean;
}

/**
 * Component that reveals its children with a GSAP animation
 * when isRevealed changes from false to true
 */
export function GSAPReveal({
  children,
  isRevealed,
  duration = 'NORMAL',
  effect = 'fade',
  ease = 'power2.out',
  enabled = true,
  style,
  ...props
}: GSAPRevealProps) {
  const [initialRender, setInitialRender] = useState(true);

  // Set initial animation properties based on effect
  const getFromProps = () => {
    switch (effect) {
      case 'fade':
        return { opacity: 0 };
      case 'slide':
        return { opacity: 0, y: 30 };
      case 'scale':
        return { opacity: 0, scale: 0.8 };
      case 'rotate':
        return { opacity: 0, rotation: -5, y: 20 };
      default:
        return { opacity: 0 };
    }
  };

  // Animation target properties
  const getToProps = () => {
    switch (effect) {
      case 'fade':
        return { opacity: 1 };
      case 'slide':
        return { opacity: 1, y: 0 };
      case 'scale':
        return { opacity: 1, scale: 1 };
      case 'rotate':
        return { opacity: 1, rotation: 0, y: 0 };
      default:
        return { opacity: 1 };
    }
  };

  // Use our animation hook
  const { ref, play, reverse } = useGSAPAnimation<HTMLDivElement>(
    {
      duration,
      ease,
      from: enabled ? getFromProps() : undefined,
      to: enabled ? getToProps() : undefined,
      runOnMount: false,
    },
    [effect, enabled]
  );

  // Play or reverse animation when isRevealed changes
  useEffect(() => {
    // Skip animation on first render
    if (initialRender) {
      setInitialRender(false);
      if (isRevealed) {
        // If initially revealed, set to final state without animation
        // The useGSAPAnimation will handle this for reduced motion preference
      }
      return;
    }

    if (enabled) {
      if (isRevealed) {
        play();
      } else {
        reverse();
      }
    }
  }, [isRevealed, enabled, initialRender]);

  return (
    <Box
      ref={ref}
      style={{
        ...style,
        // If animations are disabled, ensure content visibility follows isRevealed
        opacity: enabled ? undefined : isRevealed ? 1 : 0,
        // Prevent interaction when hidden
        pointerEvents: isRevealed ? undefined : 'none', 
      }}
      {...props}
    >
      {children}
    </Box>
  );
}