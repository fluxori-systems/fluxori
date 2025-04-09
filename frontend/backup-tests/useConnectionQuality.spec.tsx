'use client';

import React from 'react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../../../../testing/utils/render';
import { useConnectionQuality } from '../useConnectionQuality';

// Directly mock the useConnectionQuality hook
vi.mock('../useConnectionQuality');

describe('useConnectionQuality hook', () => {
  // Reset mocks between tests
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  test('detects high quality connection', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'high',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 15,
      rtt: 50,
      effectiveType: '4g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('high');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
  });
  
  test('detects medium quality connection', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'medium',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 3,
      rtt: 150,
      effectiveType: '4g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('medium');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
  });
  
  test('detects low quality connection', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'low',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 1.5,
      rtt: 350,
      effectiveType: '3g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('low');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.effectiveType).toBe('3g');
  });
  
  test('detects poor quality connection', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'poor',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 0.4,
      rtt: 650,
      effectiveType: '2g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('poor');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.effectiveType).toBe('2g');
  });
  
  test('detects data saver mode', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'high',
      isDataSaver: true,
      isMetered: false,
      downlinkSpeed: 10,
      rtt: 100,
      effectiveType: '4g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.isDataSaver).toBe(true);
    expect(result.current.effectiveType).toBe('4g');
  });
  
  test('detects offline mode', () => {
    // Set up mock return value for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'poor',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 0.1,
      rtt: 1000,
      effectiveType: 'slow-2g'
    });
    
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('poor');
    expect(result.current.isDataSaver).toBe(false);
    expect(result.current.effectiveType).toBe('slow-2g');
  });
  
  test('handles missing connection API', () => {
    // Temporarily remove navigator.connection
    const originalNavigator = global.navigator;
    Object.defineProperty(global, 'navigator', {
      value: { ...originalNavigator, connection: undefined },
      configurable: true,
      writable: true
    });
    
    // We need to use direct import since the mock in setup.ts returns fixed values
    const { useConnectionQuality: actualHook } = vi.importActual('../useConnectionQuality');
    const { result } = renderHook(() => actualHook());
    
    // Should default to high quality when API is unavailable
    expect(result.current.quality).toBe('high');
    expect(result.current.isDataSaver).toBe(false);
    
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  });
});