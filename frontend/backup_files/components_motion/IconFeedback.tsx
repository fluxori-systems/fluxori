import React, { useState, useEffect } from 'react';
import { Box, keyframes } from '@mantine/core';
import { useReducedMotion } from './useReducedMotion';
import { DURATION, EASING } from './constants';

export interface IconFeedbackProps {
  /**
   * The icon component to animate (should be a Tabler icon or similar)
   * Example: <IconCheck size="1.5rem" />
   */
  icon: React.ReactNode;
  /** Size of the effect area around the icon (padding) */
  effectSize?: number | string;
  /** Main color for the feedback effect */
  color?: string;
  /** Controls when to trigger the feedback animation */
  active?: boolean;
  /** What animation type to use */
  effect?: 'pulse' | 'bounce' | 'ring' | 'pop';
  /** Children to render alongside the icon */
  children?: React.ReactNode;
  /** Additional style props */
  style?: React.CSSProperties;
  /** Additional class names */
  className?: string;
}

/**
 * Animated icon feedback component that provides visual confirmation
 * following the motion design principles
 */
export function IconFeedback({
  icon,
  effectSize = '3.5rem',
  color = 'var(--mantine-color-blue-5)',
  active = false,
  effect = 'pulse',
  children,
  style,
  className,
}: IconFeedbackProps) {
  const { getAnimationSettings } = useReducedMotion();
  const animation = getAnimationSettings('FAST');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle animation triggering
  useEffect(() => {
    if (active && animation.enabled) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, animation.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, animation.duration, animation.enabled]);

  // Define keyframes based on effect type
  const getKeyframes = () => {
    switch (effect) {
      case 'pulse':
        return keyframes({
          '0%': { transform: 'scale(0.95)', boxShadow: `0 0 0 0 ${color}40` },
          '70%': { transform: 'scale(1)', boxShadow: `0 0 0 10px ${color}00` },
          '100%': { transform: 'scale(0.95)', boxShadow: `0 0 0 0 ${color}00` }
        });
      case 'bounce':
        return keyframes({
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '60%': { transform: 'translateY(-4px)' }
        });
      case 'ring':
        return keyframes({
          '0%': { boxShadow: `0 0 0 0 ${color}70` },
          '70%': { boxShadow: `0 0 0 10px ${color}00` },
          '100%': { boxShadow: `0 0 0 0 ${color}00` }
        });
      case 'pop':
        return keyframes({
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        });
      default:
        return keyframes({
          '0%': { opacity: 0.7 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.7 }
        });
    }
  };

  const animationKeyframes = getKeyframes();

  return (
    <Box
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: effectSize,
        height: effectSize,
        borderRadius: '50%',
        animation: isAnimating
          ? `${animationKeyframes} ${animation.duration}ms ${EASING.STANDARD.join(', ')}`
          : 'none',
        color,
        ...style,
      }}
    >
      {icon}
      {children}
    </Box>
  );
}