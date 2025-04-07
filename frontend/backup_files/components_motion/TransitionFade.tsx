import React, { useEffect, useState } from 'react';
import { Box, BoxProps } from '@mantine/core';
import { useReducedMotion } from './useReducedMotion';
import { DURATION, EASING } from './constants';

export interface TransitionFadeProps extends BoxProps {
  /** Whether the component is currently visible */
  show: boolean;
  /** Duration key from DURATION or custom value in ms */
  duration?: keyof typeof DURATION | number;
  /** Keep in DOM after animation completes */
  keepMounted?: boolean;
  /** Custom transform for entry animation */
  transformFrom?: string;
}

/**
 * Animated transition component that fades and optionally transforms elements
 * with respect to reduced motion preferences
 */
export function TransitionFade({
  show,
  duration = 'NORMAL',
  keepMounted = false,
  transformFrom = '',
  style,
  children,
  ...props
}: TransitionFadeProps) {
  const { getDuration } = useReducedMotion();
  const [mounted, setMounted] = useState(show);
  
  // Get animation duration value (either from preset or custom)
  const durationValue = typeof duration === 'string' 
    ? getDuration(DURATION[duration])
    : getDuration(duration);
  
  // Handle mounting/unmounting based on show prop
  useEffect(() => {
    if (show) setMounted(true);
    else if (!keepMounted) {
      const timer = setTimeout(() => setMounted(false), durationValue);
      return () => clearTimeout(timer);
    }
  }, [show, keepMounted, durationValue]);

  // Don't render if not mounted
  if (!mounted) return null;

  // CSS transitions with proper easing
  const transitions = [
    `opacity ${durationValue}ms cubic-bezier(${EASING.STANDARD.join(', ')})`,
    transformFrom ? `transform ${durationValue}ms cubic-bezier(${EASING.STANDARD.join(', ')})` : '',
  ].filter(Boolean).join(', ');

  return (
    <Box
      style={{
        opacity: show ? 1 : 0,
        transition: transitions,
        transform: show || !transformFrom ? 'none' : transformFrom,
        ...style,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}