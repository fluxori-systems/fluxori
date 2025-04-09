import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTypedMock } from '../../../testing/mocks/browser-apis';
import { AnimationServiceImpl } from '../services/animation-service.impl';
import { AnimationStrategyConfig, MotionMode, NetworkCondition } from '../../shared/types/motion-types';

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    to: () => ({ kill: createTypedMock() }),
    set: createTypedMock(),
    fromTo: () => ({ kill: createTypedMock() }),
    timeline: createTypedMock().mockReturnValue({
      to: createTypedMock().mockReturnThis(),
      kill: createTypedMock(),
    
    }),
  }
}));

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const mockMatchMedia = createTypedMock((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: createTypedMock(), // deprecated
    removeListener: createTypedMock(), // deprecated
    addEventListener: createTypedMock(),
    removeEventListener: createTypedMock(),
    dispatchEvent: createTypedMock(),
  }));

  // Store original matchMedia
  const originalMatchMedia = global.matchMedia;
  
  // Replace with mock
  Object.defineProperty(global, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
  });
  
  // Return function to restore original matchMedia
  return () => {
    Object.defineProperty(global, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
    });
  };
};

describe('AnimationServiceImpl', () => {
  let animationService: AnimationServiceImpl;
  let resetMatchMedia: () => void;
  
  beforeEach(() => {
    // Create matchMedia mock with reduced motion preference disabled
    resetMatchMedia = createMatchMediaMock(false);
    
    // Create animation service
    animationService = new AnimationServiceImpl();
  });
  
  afterEach(() => {
    // Restore matchMedia
    resetMatchMedia();
    
    // Restore all mocks
    vi.resetAllMocks();
  });
  
  it('should initialize with default motion mode', () => {
    expect(animationService.getMotionMode()).toBe('full');
  });
  
  it('should detect reduced motion preference', () => {
    // Reset matchMedia with reduced motion preference enabled
    resetMatchMedia();
    resetMatchMedia = createMatchMediaMock(true);
    
    // Create new service instance with updated matchMedia
    const newService = new AnimationServiceImpl();
    
    expect(newService.shouldReduceMotion()).toBe(true);
  });
  
  it('should respect motion mode setting', () => {
    // Set to minimal motion mode
    animationService.setMotionMode('minimal');
    
    expect(animationService.getMotionMode()).toBe('minimal');
    
    // Minimal mode should disable animations
    expect(animationService.shouldReduceMotion()).toBe(true);
  });
  
  it('should provide animation strategy for different modes', () => {
    // Test full mode
    const fullStrategy = animationService.getAnimationStrategy({
      animationType: 'hover',
      motionMode: 'full',
      networkCondition: 'fast',
      shouldReduceMotion: false,
    });
    
    expect(fullStrategy.enabled).toBe(true);
    expect(fullStrategy.durationMultiplier).toBeCloseTo(1.0);
    expect(fullStrategy.useSimpleEasings).toBe(false);
    
    // Test reduced mode
    const reducedStrategy = animationService.getAnimationStrategy({
      animationType: 'hover',
      motionMode: 'reduced',
      networkCondition: 'fast',
      shouldReduceMotion: false,
    });
    
    expect(reducedStrategy.enabled).toBe(true);
    expect(reducedStrategy.durationMultiplier).toBeLessThan(1.0);
    expect(reducedStrategy.useSimpleEasings).toBe(true);
    
    // Test minimal mode
    const minimalStrategy = animationService.getAnimationStrategy({
      animationType: 'hover',
      motionMode: 'minimal',
      networkCondition: 'fast',
      shouldReduceMotion: false,
    });
    
    expect(minimalStrategy.enabled).toBe(false);
  });
  
  it('should adjust animation strategy based on network condition', () => {
    // Test fast network
    const fastStrategy = animationService.getAnimationStrategy({
      animationType: 'hover',
      motionMode: 'full',
      networkAware: true,
      networkCondition: 'fast',
      shouldReduceMotion: false,
    });
    
    // Test poor network
    const poorStrategy = animationService.getAnimationStrategy({
      animationType: 'hover',
      motionMode: 'full',
      networkAware: true,
      networkCondition: 'poor',
      shouldReduceMotion: false,
    });
    
    // Poor network should have more aggressive optimizations
    expect(poorStrategy.durationMultiplier).toBeLessThan(fastStrategy.durationMultiplier);
    expect(poorStrategy.useSimpleEasings).toBe(true);
    expect(poorStrategy.reduceComplexity).toBe(true);
    expect(poorStrategy.scaleMultiplier).toBeLessThan(fastStrategy.scaleMultiplier || 1);
  });
  
  it('should ensure error animations are visible even in reduced modes', () => {
    // Test error animation with reduced mode
    const errorStrategy = animationService.getAnimationStrategy({
      animationType: 'error',
      motionMode: 'reduced',
      networkAware: true,
      networkCondition: 'poor',
      shouldReduceMotion: false,
    });
    
    // Error animations should still be enabled
    expect(errorStrategy.enabled).toBe(true);
    
    // Test shake animation with reduced mode
    const shakeStrategy = animationService.getAnimationStrategy({
      animationType: 'shake',
      motionMode: 'reduced',
      networkAware: true,
      networkCondition: 'poor',
      shouldReduceMotion: false,
    });
    
    // Shake animations should still be enabled
    expect(shakeStrategy.enabled).toBe(true);
  });
  
  it('should adjust loading animations to be gentler', () => {
    // Test loading animation
    const loadingStrategy = animationService.getAnimationStrategy({
      animationType: 'loading',
      motionMode: 'full',
      shouldReduceMotion: false,
    });
    
    // Loading animations should be slower
    expect(loadingStrategy.durationMultiplier).toBeGreaterThan(1.0);
  });
  
  it('should create appropriate animation strategies for South African network conditions', () => {
    // Create config for South African network testing
    const getSANetworkStrategy = (network: NetworkCondition) => {
      return animationService.getAnimationStrategy({
        animationType: 'hover',
        motionMode: 'full',
        networkAware: true,
        networkCondition: network,
        shouldReduceMotion: false,
      });
    };
    
    // Test various SA network conditions (from best to worst)
    const fastStrategy = getSANetworkStrategy('fast');
    const mediumStrategy = getSANetworkStrategy('medium');
    const slowStrategy = getSANetworkStrategy('slow');
    const poorStrategy = getSANetworkStrategy('poor');
    
    // Check duration multipliers decrease as network quality decreases
    expect(fastStrategy.durationMultiplier).toBeGreaterThan(mediumStrategy.durationMultiplier);
    expect(mediumStrategy.durationMultiplier).toBeGreaterThan(slowStrategy.durationMultiplier);
    expect(slowStrategy.durationMultiplier).toBeGreaterThan(poorStrategy.durationMultiplier);
    
    // Check scaling multipliers decrease as network quality decreases
    expect(fastStrategy.scaleMultiplier || 1).toBeGreaterThanOrEqual(mediumStrategy.scaleMultiplier || 1);
    expect(mediumStrategy.scaleMultiplier || 1).toBeGreaterThanOrEqual(slowStrategy.scaleMultiplier || 1);
    expect(slowStrategy.scaleMultiplier || 1).toBeGreaterThanOrEqual(poorStrategy.scaleMultiplier || 1);
  });
});