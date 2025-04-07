import React from 'react';
import { Box, BoxProps, keyframes } from '@mantine/core';
import { AI_ANIMATION, EASING } from './constants';
import { useReducedMotion } from './useReducedMotion';

export interface AIProcessingIndicatorProps extends BoxProps {
  /** Shows whether AI is actively processing */
  isProcessing?: boolean;
  /** Confidence level from 0 to 1 */
  confidence?: number;
  /** Size of the indicator in px, rem, etc. */
  size?: number | string;
  /** Controls animation speed */
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Animated component that indicates AI processing state
 * with subtle pulsing animation that respects reduced motion preferences
 */
export function AIProcessingIndicator({
  isProcessing = false,
  confidence = 1,
  size = '2rem',
  speed = 'normal',
  className,
  ...props
}: AIProcessingIndicatorProps) {
  const { getAnimationSettings, prefersReducedMotion } = useReducedMotion();
  const animation = getAnimationSettings('SLOW');
  
  // Calculate animation speed multiplier
  const speedMultiplier = speed === 'fast' ? 0.7 : speed === 'slow' ? 1.5 : 1;
  const finalDuration = animation.duration * speedMultiplier;

  // Calculate opacity based on confidence
  let opacity = 1;
  if (confidence >= 0.8) {
    opacity = AI_ANIMATION.CONFIDENCE_INDICATORS.HIGH.OPACITY;
  } else if (confidence >= 0.5) {
    opacity = AI_ANIMATION.CONFIDENCE_INDICATORS.MEDIUM.OPACITY;
  } else {
    opacity = AI_ANIMATION.CONFIDENCE_INDICATORS.LOW.OPACITY;
  }

  // Define pulse animation keyframes
  const pulse = keyframes({
    '0%': { transform: 'scale(1)' },
    '50%': { transform: `scale(${AI_ANIMATION.PROCESSING_PULSE.PATTERN[1]})` },
    '100%': { transform: 'scale(1)' },
  });

  return (
    <Box
      component="span"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--mantine-color-blue-5)',
        opacity: isProcessing ? opacity : 0.5,
        transition: 'opacity 0.2s ease',
        animation: isProcessing && animation.enabled
          ? `${pulse} ${finalDuration}ms ${EASING.EASE_IN_OUT.join(', ')} infinite`
          : 'none',
      }}
      aria-hidden="true"
      {...props}
    />
  );
}