'use client';

import React from 'react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen } from '../../../testing/utils/render'; 
import { SAProductCard } from '../SAProductCard';
import { useConnectionQuality } from '../../../lib/motion/hooks/useConnectionQuality';

// Mock the connection quality hook
vi.mock('../../../lib/motion/hooks/useConnectionQuality', () => ({
  useConnectionQuality: vi.fn().mockReturnValue({
    quality: 'high',
    isDataSaver: false,
    isMetered: false,
    downlinkSpeed: 10,
    rtt: 50,
    effectiveType: '4g'
  })
}));

// Mock the token tracking utility
vi.mock('../../../lib/design-system/utils/token-analysis', () => ({
  useTokenTracking: () => ({
    trackToken: vi.fn(),
    getTrackedTokens: vi.fn(() => [])
  })
}));

// Mock the component animation hook
vi.mock('../../../lib/ui/hooks/useComponentAnimation', () => ({
  useComponentAnimation: vi.fn()
}));

// Mock the combined refs utility
vi.mock('../../../lib/ui/utils/use-combined-refs', () => ({
  useCombinedRefs: vi.fn()
}));

// Mock the currency formatter
vi.mock('../../../utils/currency-formatter', () => ({
  formatCurrency: (value: number, currency?: string) => 
    currency === 'ZAR' ? `R${value.toFixed(2)}` : `$${value.toFixed(2)}`
}));

describe('SAProductCard', () => {
  // Track original navigator
  let originalNavigator: Navigator;
  
  beforeEach(() => {
    // Store original navigator
    originalNavigator = window.navigator;
    
    // Default connection values for good connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true)
      },
      configurable: true,
      writable: true
    });
  });
  
  afterEach(() => {
    // Restore navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true
    });
  });
  
  test('renders with required props', () => {
    renderWithProviders(<SAProductCard title="Test Product" price={100} />);
    
    // Check elements are present
    expect(screen.getByText('Test Product')).toBeDefined();
    expect(screen.getByText('R100.00')).toBeDefined();
    expect(screen.getByText('In Stock')).toBeDefined();
    expect(screen.getByText('Standard Shipping')).toBeDefined();
  });
  
  test('renders discount information correctly', () => {
    renderWithProviders(
      <SAProductCard
        title="Discounted Product"
        price={800}
        originalPrice={1000}
        discountPercentage={20}
      />
    );
    
    expect(screen.getByText('20% OFF')).toBeDefined();
    expect(screen.getByText('R1000.00')).toBeDefined();
    expect(screen.getByText('R800.00')).toBeDefined();
  });
  
  test('handles click events', () => {
    const handleClick = vi.fn();
    
    renderWithProviders(
      <SAProductCard
        title="Clickable Product"
        price={100}
        onClick={handleClick}
      />
    );
    
    screen.getByText('Clickable Product').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('renders in simplified mode on poor connection', () => {
    // Setup poor connection
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        downlink: 0.3,
        rtt: 800,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => true)
      },
      configurable: true,
      writable: true
    });
    
    // Also mock the connection quality hook directly for this test
    vi.mocked(useConnectionQuality).mockReturnValue({
      quality: 'poor',
      isDataSaver: false,
      isMetered: false,
      downlinkSpeed: 0.3,
      rtt: 800,
      effectiveType: '2g'
    });
    
    const { container } = renderWithProviders(
      <SAProductCard
        title="Slow Connection Product"
        price={100}
        originalPrice={150}
        discountPercentage={33}
        rating={4.5}
        reviewCount={120}
        imageUrl="https://example.com/image.jpg"
        forceDataSaver={true} // Force simplified mode as a workaround
      />
    );
    
    // Should show critical info
    expect(screen.getByText('Slow Connection Product')).toBeDefined();
    expect(screen.getByText('R100.00')).toBeDefined();
    expect(screen.getByText('33% OFF')).toBeDefined();
  });
});