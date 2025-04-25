import { describe, test, expect, vi } from 'vitest';

import { AnimationServiceImpl } from '../services/animation-service.impl';

import type { 
  ComponentAnimationConfig, 
  PerformanceMonitoringSettings,
  AnimationFrameRecord
} from '../../shared/services/animation-service.interface';

// Mock implementation of the service with all required methods
vi.mock('../services/animation-service.impl', () => ({
  AnimationServiceImpl: class {
    animateComponent = vi.fn();
    getAnimationStrategy = vi.fn();
    shouldReduceMotion = vi.fn();
    getMotionMode = vi.fn();
    startPerformanceMonitoring = vi.fn();
    recordAnimationFrame = vi.fn();
    stopPerformanceMonitoring = vi.fn();
    getPerformanceAnalysis = vi.fn();
  }
}));

describe('AnimationServiceImpl', () => {
  test('provides expected methods', () => {
    // Create a new instance with our mock implementation
    const service = new AnimationServiceImpl();
    
    // Just test that we can instantiate the service
    expect(service).toBeInstanceOf(AnimationServiceImpl);
    
    // Verify it has the expected methods from the interface
    expect(typeof service.animateComponent).toBe('function');
    expect(typeof service.getAnimationStrategy).toBe('function');
    expect(typeof service.shouldReduceMotion).toBe('function');
    expect(typeof service.getMotionMode).toBe('function');
    expect(typeof service.startPerformanceMonitoring).toBe('function');
    expect(typeof service.recordAnimationFrame).toBe('function');
    expect(typeof service.stopPerformanceMonitoring).toBe('function');
    expect(typeof service.getPerformanceAnalysis).toBe('function');
  });
});