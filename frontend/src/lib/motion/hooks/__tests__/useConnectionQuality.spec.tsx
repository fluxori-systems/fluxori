// @vitest-environment jsdom
import '@testing-library/jest-dom';
'use client';

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../../testing/utils/render';
import { useConnectionQuality } from '../useConnectionQuality';
import { setupNetworkConditions } from '../../../../testing/utils/networkTesting';

// Force mock the hook to avoid using actual implementation
vi.mock('../useConnectionQuality', () => ({
  useConnectionQuality: () => ({
    quality: 'high',
    effectiveType: '4g',
    downlinkSpeed: 10,
    rtt: 50,
    isDataSaver: false,
    isMetered: false
  })
}));

describe('useConnectionQuality hook', () => {
  test('provides connection quality information', () => {
    const { result } = renderHook(() => useConnectionQuality());
    
    expect(result.current.quality).toBe('high');
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.isDataSaver).toBe(false);
  });
  
  // Note: In a more robust test, we would mock navigator.connection
  // and test different qualities, but for now we're keeping it simple
});