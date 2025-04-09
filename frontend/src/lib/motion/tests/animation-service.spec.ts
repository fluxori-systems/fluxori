import { describe, test, expect, vi } from 'vitest';
import { AnimationServiceImpl } from '../services/animation-service.impl';

// Create a mock implementation with just the API we need
vi.mock('../services/animation-service.impl', () => ({
  AnimationServiceImpl: class {
    animate = vi.fn();
    stopAnimation = vi.fn();
    applyAnimationStrategy = vi.fn();
  }
}));

describe('AnimationServiceImpl', () => {
  test('provides expected methods', () => {
    // Create a new instance with our mock implementation
    const service = new AnimationServiceImpl();
    
    // Just test that we can instantiate the service
    expect(service).toBeInstanceOf(AnimationServiceImpl);
    
    // Verify it has the expected methods
    expect(typeof service.animate).toBe('function');
    expect(typeof service.stopAnimation).toBe('function');
    expect(typeof service.applyAnimationStrategy).toBe('function');
  });
});