import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { 
  useAnimationService, 
  useConnectionQuality, 
  useMotionMode, 
  useReducedMotion 
} from '../hooks/useServices';
import { MotionProvider } from '../context/MotionContext';

// Mock connection quality
vi.mock('../services/connection-service.impl', () => ({
  defaultConnectionService: {
    getConnectionQuality: vi.fn().mockReturnValue({
      quality: 'medium',
      isDataSaver: false,
      isMetered: false,
    }),
    subscribeToConnectionChanges: vi.fn().mockImplementation((callback: (data: { quality: string; isDataSaver: boolean; isMetered: boolean }) => void) => {
      // Call callback immediately with default values
      callback({
        quality: 'medium',
        isDataSaver: false,
        isMetered: false,
      });
      // Return unsubscribe function
      return vi.fn();
    }),
    setMotionMode: vi.fn(),
  },
  ConnectionServiceImpl: vi.fn().mockImplementation(() => ({
    getConnectionQuality: vi.fn().mockReturnValue({
      quality: 'medium',
      isDataSaver: false,
      isMetered: false,
    }),
    subscribeToConnectionChanges: vi.fn().mockImplementation((callback: (data: { quality: string; isDataSaver: boolean; isMetered: boolean }) => void) => {
      // Call callback immediately with default values
      callback({
        quality: 'medium',
        isDataSaver: false,
        isMetered: false,
      });
      // Return unsubscribe function
      return vi.fn();
    }),
    setMotionMode: vi.fn(),
  })),
}));

// Mock animation service
vi.mock('../services/animation-service.impl', () => ({
  defaultAnimationService: {
    getMotionMode: vi.fn().mockReturnValue('full'),
    shouldReduceMotion: vi.fn().mockReturnValue(false),
    setMotionMode: vi.fn(),
    getAnimationStrategy: vi.fn().mockReturnValue({
      enabled: true,
      durationMultiplier: 1.0,
      useSimpleEasings: false,
      reduceComplexity: false,
      maxActiveAnimations: Infinity,
      disableStaggering: false,
      scaleMultiplier: 1.0,
    }),
    animateComponent: vi.fn(),
  },
  AnimationServiceImpl: vi.fn().mockImplementation(() => ({
    getMotionMode: vi.fn().mockReturnValue('full'),
    shouldReduceMotion: vi.fn().mockReturnValue(false),
    setMotionMode: vi.fn(),
    getAnimationStrategy: vi.fn().mockReturnValue({
      enabled: true,
      durationMultiplier: 1.0,
      useSimpleEasings: false,
      reduceComplexity: false,
      maxActiveAnimations: Infinity,
      disableStaggering: false,
      scaleMultiplier: 1.0,
    }),
    animateComponent: vi.fn(),
  })),
}));

// Create wrapper for testing hooks
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <MotionProvider>
    {children}
  </MotionProvider>
);

describe('Service Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should provide animation service', () => {
    const { result } = renderHook(() => useAnimationService(), {
      wrapper: TestWrapper
    });
    
    expect(result.current).toBeDefined();
    expect(result.current.getMotionMode).toBeDefined();
    expect(result.current.shouldReduceMotion).toBeDefined();
    expect(result.current.getAnimationStrategy).toBeDefined();
  });
  
  it('should provide connection quality', () => {
    const { result } = renderHook(() => useConnectionQuality(), {
      wrapper: TestWrapper
    });
    
    expect(result.current).toBeDefined();
    expect(result.current.quality).toBe('medium');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.isMetered).toBe(false);
  });
  
  it('should provide motion mode and update function', () => {
    const { result } = renderHook(() => useMotionMode(), {
      wrapper: TestWrapper
    });
    
    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current)).toBe(true);
    
    const [motionMode, setMotionMode] = result.current;
    
    expect(typeof motionMode).toBe('string');
    expect(motionMode).toBe('full');
    expect(typeof setMotionMode).toBe('function');
  });
  
  it('should provide reduced motion preference', () => {
    const { result } = renderHook(() => useReducedMotion(), {
      wrapper: TestWrapper
    });
    
    expect(typeof result.current).toBe('boolean');
    expect(result.current).toBe(false);
  });
  
  it('should update motion mode when set function is called', () => {
    // Mock implementation to update motion mode
    const mockSetMotionMode = vi.fn();
    // @ts-ignore - useState mock is properly typed in our custom react-test.d.ts but TypeScript still complains
    vi.spyOn(React, 'useState').mockImplementation((initialValue: any) => [initialValue, mockSetMotionMode]);
    
    const { result } = renderHook(() => useMotionMode(), {
      wrapper: TestWrapper
    });
    
    const [, setMotionMode] = result.current;
    
    // Call set function
    act(() => {
      setMotionMode('reduced');
    });
    
    // Should call state update function
    expect(mockSetMotionMode).toHaveBeenCalledWith('reduced');
  });
});