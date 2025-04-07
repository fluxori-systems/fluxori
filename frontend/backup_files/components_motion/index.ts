/**
 * Motion system components and utilities
 * Implements the motion design guidelines in README.md
 */

// Constants
export * from './constants';

// Hooks
export * from './useReducedMotion';

// Basic animation components
export * from './AIProcessingIndicator';
export * from './TransitionFade';
export * from './StreamingText';
export * from './IconFeedback';
export * from './AnimatedTabIndicator';

// GSAP-powered advanced animations
export * from './gsap';

// Re-export motion utilities from libraries
// This centralizes motion imports and makes it easier
// to switch animation libraries in the future
// Mantine v7 no longer exports keyframes directly
// We need to create our own keyframes implementation or use CSS
// export { keyframes } from '@mantine/core';