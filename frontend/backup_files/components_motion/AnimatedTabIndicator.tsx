import React from 'react';
import { Box, BoxProps } from '@mantine/core';
import { useReducedMotion } from './useReducedMotion';
import { DURATION, EASING } from './constants';

export interface AnimatedTabIndicatorProps extends BoxProps {
  /** The active index (0-based) of the selected tab */
  activeIndex: number;
  /** Total number of tabs */
  totalTabs: number;
  /** Height of the indicator in px, rem, etc. */
  height?: string | number;
  /** Color of the indicator */
  color?: string;
  /** Custom width override, otherwise calculated based on totalTabs */
  width?: string | number;
  /** Whether to use smooth transitions */
  animate?: boolean;
}

/**
 * Animated indicator for tab interfaces that moves smoothly between positions
 * following Fluxori's motion design principles
 */
export function AnimatedTabIndicator({
  activeIndex,
  totalTabs,
  height = '2px',
  color = 'var(--mantine-color-blue-5)',
  width,
  animate = true,
  style,
  ...props
}: AnimatedTabIndicatorProps) {
  const { getDuration } = useReducedMotion();
  const animationDuration = getDuration(DURATION.NORMAL);
  
  // Calculate width per tab
  const tabWidth = width ? width : `${100 / totalTabs}%`;
  
  // Calculate position based on active index
  const indicatorPosition = typeof tabWidth === 'string' && tabWidth.includes('%')
    ? `${(activeIndex * 100) / totalTabs}%`
    : `calc(${activeIndex} * ${tabWidth})`;

  return (
    <Box
      role="presentation"
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height,
        width: tabWidth,
        backgroundColor: color,
        borderRadius: '1px',
        transform: `translateX(${indicatorPosition})`,
        transition: animate ? `transform ${animationDuration}ms cubic-bezier(${EASING.STANDARD.join(', ')})` : 'none',
        ...style,
      }}
      {...props}
    />
  );
}