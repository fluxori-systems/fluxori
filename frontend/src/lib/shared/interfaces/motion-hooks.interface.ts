/**
 * Motion context interface for the Shared module
 * This allows the Shared module to declare interfaces for motion functionality
 * without directly importing from the Motion module.
 */

export interface MotionContextType {
  prefersReducedMotion: boolean;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
  animationComplexity: 'none' | 'minimal' | 'standard' | 'enhanced';
  enableAnimations: () => void;
  disableAnimations: () => void;
  setAnimationComplexity: (complexity: 'none' | 'minimal' | 'standard' | 'enhanced') => void;
}