'use client';

import { RefObject, useEffect, useState, useCallback } from 'react';
import { 
  IAnimationService,
  ComponentAnimationConfig
} from '../../shared/services/animation-service.interface';
import { 
  AnimationMode,
  MotionMode
} from '../../shared/types/motion-types';
import { SERVICE_KEYS } from '../../shared/services/service-registry';
import { useService } from '../../shared/providers/service-provider';

/**
 * Safely get the animation service, either from context or a fallback
 * @returns Animation service
 */
function getAnimationService(): IAnimationService {
  try {
    // Try to get from context - this will be defined if the ServiceProvider is used
    return useService<IAnimationService>(SERVICE_KEYS.ANIMATION_SERVICE);
  } catch (error) {
    // If we're not in a ServiceProvider, try to import the default implementation
    try {
      // Dynamic import to avoid circular dependencies
      const { defaultAnimationService } = require('../../motion/services/animation-service.impl');
      return defaultAnimationService;
    } catch (e) {
      // If all else fails, throw a meaningful error
      throw new Error(
        'Animation service not available. Make sure to either use ServiceProvider ' +
        'or import the implementation directly.'
      );
    }
  }
}

/**
 * Custom hook for component animations using dependency inversion
 * This implementation avoids direct circular dependencies by accessing
 * the animation service through the service registry
 * 
 * @param config Animation configuration
 */
export function useComponentAnimation({
  ref,
  enabled = true,
  mode,
  isActive = false,
  properties = {},
  networkAware = true,
  durationMultiplier = 1.0
}: ComponentAnimationConfig): void {
  // Get animation service through dependency inversion
  const animationService = getAnimationService();

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // Get cleanup function from service
    const cleanup = animationService.animateComponent({
      ref,
      enabled,
      mode,
      isActive,
      properties,
      networkAware,
      durationMultiplier
    });

    // Return cleanup function
    return cleanup;
  }, [
    ref, enabled, mode, isActive, 
    networkAware, durationMultiplier,
    // We need to stringify properties to properly track changes
    // since it's an object that would otherwise never trigger a dependency change
    JSON.stringify(properties)
  ]);
}

/**
 * Hook to check if animations should be reduced
 */
export function useReducedMotion(): boolean {
  const animationService = getAnimationService();
  const [reduced, setReduced] = useState<boolean>(() => 
    animationService.shouldReduceMotion()
  );
  
  // For server-side rendering safety
  useEffect(() => {
    setReduced(animationService.shouldReduceMotion());
  }, [animationService]);
  
  return reduced;
}

/**
 * Hook to get current motion mode
 */
export function useMotionMode(): MotionMode {
  const animationService = getAnimationService();
  return animationService.getMotionMode() as MotionMode;
}

/**
 * Specialized hook for hover animations
 * Automatically manages hover state and provides handlers
 * 
 * @param ref Reference to the DOM element
 * @param options Animation options
 */
export function useHoverAnimation(
  ref: RefObject<HTMLElement>,
  options: Omit<ComponentAnimationConfig, 'ref' | 'mode' | 'isActive'> & { 
    enabled?: boolean 
  } = {}
): [
  () => void, 
  () => void
] {
  const {
    enabled = true,
    properties = {},
    networkAware = true,
    durationMultiplier = 1.0
  } = options;
  
  const [isHovering, setIsHovering] = useState(false);
  
  // Get animation service
  const animationService = getAnimationService();
  
  // Use effect to apply animations when hover state changes
  useEffect(() => {
    if (!ref.current || !enabled) return;
    
    const cleanup = animationService.animateComponent({
      ref,
      enabled,
      mode: 'hover',
      isActive: isHovering,
      properties,
      networkAware,
      durationMultiplier
    });
    
    return cleanup;
  }, [
    ref, enabled, isHovering, networkAware, 
    durationMultiplier, JSON.stringify(properties)
  ]);
  
  // Memoized handlers to avoid recreating functions
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);
  
  return [handleMouseEnter, handleMouseLeave];
}

/**
 * Hook for focus animations
 * @param ref Element reference
 * @param options Animation options
 */
export function useFocusAnimation(
  ref: RefObject<HTMLElement>,
  options: Omit<ComponentAnimationConfig, 'ref' | 'mode' | 'isActive'> = {}
): [() => void, () => void] {
  const [isFocused, setIsFocused] = useState(false);
  
  // Apply focus animation using the component animation hook
  useComponentAnimation({
    ref,
    mode: 'focus',
    isActive: isFocused,
    ...options
  });
  
  // Memoized handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  
  return [handleFocus, handleBlur];
}