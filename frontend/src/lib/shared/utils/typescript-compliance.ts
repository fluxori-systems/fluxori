'use client';

import { IAnimationService } from '../services/animation-service.interface';
import { IConnectionService } from '../services/connection-service.interface';
import { AnimationParams, AnimationStrategyConfig } from '../types/motion-types';

/**
 * Type guard to check if an object implements IAnimationService
 * @param obj Object to check
 * @returns True if object implements IAnimationService
 */
export function isAnimationService(obj: any): obj is IAnimationService {
  // Check if object has all required methods
  return (
    obj &&
    typeof obj.animateComponent === 'function' &&
    typeof obj.getAnimationStrategy === 'function' &&
    typeof obj.shouldReduceMotion === 'function' &&
    typeof obj.getMotionMode === 'function'
  );
}

/**
 * Type guard to check if an object implements IConnectionService
 * @param obj Object to check
 * @returns True if object implements IConnectionService
 */
export function isConnectionService(obj: any): obj is IConnectionService {
  // Check if object has all required methods
  return (
    obj &&
    typeof obj.getConnectionQuality === 'function' &&
    typeof obj.subscribeToConnectionChanges === 'function' &&
    typeof obj.isDataSaverEnabled === 'function' &&
    typeof obj.isConnectionMetered === 'function'
  );
}

/**
 * Type guard to check if an object implements AnimationParams
 * @param obj Object to check
 * @returns True if object implements AnimationParams
 */
export function isAnimationParams(obj: any): obj is AnimationParams {
  // Check if object has all required properties
  return (
    obj &&
    typeof obj.enabled === 'boolean' &&
    typeof obj.durationMultiplier === 'number' &&
    typeof obj.useSimpleEasings === 'boolean' &&
    typeof obj.reduceComplexity === 'boolean' &&
    typeof obj.maxActiveAnimations === 'number' &&
    typeof obj.disableStaggering === 'boolean' &&
    typeof obj.scaleMultiplier === 'number'
  );
}

/**
 * Utility type to make only selected properties required
 * Useful for enforcing TypeScript compliance where some props are optional
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Network-aware component props
 * Common props for components that adapt to network conditions
 */
export interface NetworkAwareProps {
  /** Enable network-aware optimizations */
  networkAware?: boolean;
  
  /** Animation speed multiplier */
  animationSpeed?: number;
  
  /** Animation delay in ms */
  animationDelay?: number;
  
  /** Whether to use animations at all */
  animated?: boolean;
}

/**
 * Type guard to check if a component has NetworkAwareProps
 * @param props Component props to check
 * @returns True if props implement NetworkAwareProps
 */
export function hasNetworkAwareProps(props: any): props is NetworkAwareProps {
  return (
    props &&
    (props.networkAware === undefined || typeof props.networkAware === 'boolean') &&
    (props.animationSpeed === undefined || typeof props.animationSpeed === 'number') &&
    (props.animationDelay === undefined || typeof props.animationDelay === 'number') &&
    (props.animated === undefined || typeof props.animated === 'boolean')
  );
}