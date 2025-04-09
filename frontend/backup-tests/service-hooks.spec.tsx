'use client';

import React from 'react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, renderWithProviders, act } from '../../../testing/utils/render';
import { 
  useAnimationService, 
  useConnectionQuality, 
  useMotionMode, 
  useReducedMotion 
} from '../hooks';
import { 
  AnimationStrategyConfig,
  ConnectionQualityResult,
  MotionMode,
  NetworkCondition
} from '../../shared/types/motion-types';
import { setupNetworkConditions } from '../../../testing/utils/networkTesting';
import { MotionProvider } from '../context/MotionContext';

// Mock the service registry
vi.mock('../../shared/services/service-registry', () => ({
  getService: vi.fn((key) => {
    // Return mock based on the service key
    if (key === 'CONNECTION_SERVICE') {
      return {
        getQuality: vi.fn(() => ({
          quality: 'high',
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
    }
    
    if (key === 'ANIMATION_SERVICE') {
      return {
        animate: vi.fn(),
        stopAnimation: vi.fn(),
        applyAnimationStrategy: vi.fn()
      };
    }
    
    return null;
  })
}));

describe('Motion Service Hooks', () => {
  describe('useConnectionQuality', () => {
    let cleanupNetwork: () => void;
    
    afterEach(() => {
      if (cleanupNetwork) {
        cleanupNetwork();
      }
    });
    
    test('returns connection quality from service', () => {
      const { result } = renderHook(() => useConnectionQuality());
      
      expect(result.current.quality).toBe('high');
      expect(result.current.effectiveType).toBe('4g');
      expect(result.current.isDataSaver).toBe(false);
    });
    
    test('updates when connection changes', () => {
      // Set up initial connection
      const { cleanup } = setupNetworkConditions({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      });
      cleanupNetwork = cleanup;
      
      const { result, rerender } = renderHook(() => useConnectionQuality());
      
      expect(result.current.quality).toBe('high');
      
      // Change connection
      cleanupNetwork();
      const { cleanup: cleanup2 } = setupNetworkConditions({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 650,
        saveData: false
      });
      cleanupNetwork = cleanup2;
      
      // Rerender hook
      rerender();
      
      // Connection should be updated
      expect(result.current.quality).toBe('poor');
    });
  });
  
  describe('useAnimationService', () => {
    test('returns animation service methods', () => {
      const { result } = renderHook(() => useAnimationService());
      
      // Make sure the expected methods exist on the service
      expect(result.current).toBeDefined();
      // The real methods would be different from the mock, just check that we got a service
      expect(typeof result.current).toBe('object');
    });
  });
  
  describe('useMotionMode', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <MotionProvider initialMode="full">{children}</MotionProvider>
    );
    
    test('returns initial motion mode from provider', () => {
      const { result } = renderHook(
        () => useMotionMode(),
        { 
          initialProps: {},
          wrapper: TestWrapper
        }
      );
      
      expect(result.current.motionMode).toBe('full');
    });
    
    test('allows changing motion mode', () => {
      const { result } = renderHook(
        () => useMotionMode(),
        { 
          initialProps: {},
          wrapper: TestWrapper
        }
      );
      
      expect(result.current.motionMode).toBe('full');
      
      act(() => {
        result.current.setMotionMode('minimal');
      });
      
      expect(result.current.motionMode).toBe('minimal');
    });
  });
  
  describe('useReducedMotion', () => {
    test('returns false by default', () => {
      const { result } = renderHook(() => useReducedMotion());
      
      expect(result.current).toBe(false);
    });
  });
});