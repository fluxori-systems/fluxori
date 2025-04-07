import React, { ReactNode } from 'react';
import { Box, BoxProps } from '@mantine/core';
import { useGSAPAnimation } from './useGSAPAnimation';
import { DURATION } from '../constants';

export interface GSAPFadeInProps extends BoxProps {
  /** Child elements to animate */
  children: ReactNode;
  /** Duration of the animation */
  duration?: keyof typeof DURATION | number;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Starting Y position (for slide up effect) */
  fromY?: number;
  /** Starting opacity */
  fromOpacity?: number;
  /** Whether animation is enabled */
  enabled?: boolean;
  /** Whether to play on mount */
  playOnMount?: boolean;
}

/**
 * Component that animates children with GSAP fade in and optional slide up
 */
export function GSAPFadeIn({
  children,
  duration = 'NORMAL',
  delay = 0,
  fromY = 20,
  fromOpacity = 0,
  enabled = true,
  playOnMount = true,
  style,
  ...props
}: GSAPFadeInProps) {
  const { ref } = useGSAPAnimation<HTMLDivElement>(
    {
      duration,
      delay,
      from: enabled ? {
        opacity: fromOpacity,
        y: fromY,
      } : undefined,
      to: enabled ? {
        opacity: 1,
        y: 0,
      } : undefined,
      runOnMount: playOnMount && enabled,
    },
    [enabled, playOnMount]
  );

  return (
    <Box
      ref={ref}
      style={{
        ...style,
        // If animations are disabled, ensure content is visible
        opacity: enabled ? undefined : 1,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}