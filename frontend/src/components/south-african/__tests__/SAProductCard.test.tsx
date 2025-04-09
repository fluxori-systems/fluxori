'use client';

import React from 'react';
import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react'; 
import { SAProductCard } from '../SAProductCard';
import { renderWithProviders } from '../../../lib/ui/utils/test-utils';

// Mock the currency formatter with proper typing
vi.mock('../../../utils/currency-formatter', () => ({
  formatCurrency: (value: number, currency?: string) => 
    currency === 'ZAR' ? `R${value.toFixed(2)}` : `$${value.toFixed(2)}`
}));

describe('SAProductCard', () => {
  // Type definition for connection mock configuration
  type ConnectionMockConfig = {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };

  // Helper function to mock connection API with proper typing
  const mockConnection = (config: ConnectionMockConfig = {}) => {
    const connectionMock = {
      effectiveType: config.effectiveType || '4g',
      downlink: config.downlink !== undefined ? config.downlink : 10,
      rtt: config.rtt !== undefined ? config.rtt : 50,
      saveData: config.saveData !== undefined ? config.saveData : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    // Store original for cleanup
    const originalNavigator = global.navigator;
    
    // Apply mock with proper typing
    Object.defineProperty(navigator, 'connection', {
      value: connectionMock,
      configurable: true,
      writable: true
    });
    
    // Return cleanup function
    return () => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    };
  };
  
  // Track cleanup function
  let cleanupConnection: () => void;
  
  beforeEach(() => {
    // Mock Navigator Connection API with good connection by default
    cleanupConnection = mockConnection({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    });
  });
  
  afterEach(() => {
    // Restore navigator.connection
    cleanupConnection();
  });
  
  test('renders with required props', () => {
    renderWithProviders(<SAProductCard title="Test Product" price={100} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('R100.00')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
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
    
    expect(screen.getByText('Discounted Product')).toBeInTheDocument();
    expect(screen.getByText('R800.00')).toBeInTheDocument();
    expect(screen.getByText('R1000.00')).toBeInTheDocument();
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });
  
  test('renders different stock statuses correctly', () => {
    const { rerender } = renderWithProviders(
      <SAProductCard title="Out of Stock" price={100} stockStatus="out_of_stock" />
    );
    
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    
    rerender(
      <SAProductCard title="Low Stock" price={100} stockStatus="low_stock" />
    );
    
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });
  
  test('renders shipping information correctly', () => {
    renderWithProviders(
      <SAProductCard
        title="Free Express Shipping"
        price={100}
        shippingMethods={['express']}
        freeShipping={true}
        estimatedDeliveryDays={2}
      />
    );
    
    expect(screen.getByText('Free Express Shipping (2 days)')).toBeInTheDocument();
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
    
    fireEvent.click(screen.getByText('Clickable Product'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('renders in simplified mode on poor connection', () => {
    // Clean up previous connection mock
    cleanupConnection();
    
    // Mock poor connection
    cleanupConnection = mockConnection({
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 800,
      saveData: false
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
      />
    );
    
    // Should render the simplified version
    expect(container.querySelector('[data-simplified="true"]')).toBeInTheDocument();
    
    // Should not render rating stars in simplified mode
    expect(screen.queryByText('★')).not.toBeInTheDocument();
    
    // Should still show critical info like price and discount
    expect(screen.getByText('Slow Connection Product')).toBeInTheDocument();
    expect(screen.getByText('R100.00')).toBeInTheDocument();
    expect(screen.getByText('33% OFF')).toBeInTheDocument();
  });
  
  test('renders in simplified mode when data saver is enabled', () => {
    // Clean up previous connection mock
    cleanupConnection();
    
    // Mock data saver mode
    cleanupConnection = mockConnection({
      effectiveType: '4g', // Good connection
      downlink: 10,
      rtt: 50,
      saveData: true // But data saver enabled
    });
    
    const { container } = renderWithProviders(
      <SAProductCard
        title="Data Saver Product"
        price={100}
      />
    );
    
    // Should render the simplified version
    expect(container.querySelector('[data-simplified="true"]')).toBeInTheDocument();
  });
  
  test('renders in simplified mode when forceDataSaver is true', () => {
    // Clean up previous connection mock
    cleanupConnection();
    
    // Mock good connection
    cleanupConnection = mockConnection({
      effectiveType: '4g',
      downlink: 20,
      rtt: 30,
      saveData: false
    });
    
    const { container } = renderWithProviders(
      <SAProductCard
        title="Forced Simplified Product"
        price={100}
        forceDataSaver={true} // Force simplified view despite good connection
      />
    );
    
    // Should render the simplified version
    expect(container.querySelector('[data-simplified="true"]')).toBeInTheDocument();
  });
  
  test('simplifies shipping text in data saver mode', () => {
    // Clean up previous connection mock
    cleanupConnection();
    
    // Mock data saver mode
    cleanupConnection = mockConnection({ saveData: true });
    
    renderWithProviders(
      <SAProductCard
        title="Simplified Shipping Product"
        price={100}
        shippingMethods={['standard', 'express', 'collection']}
        estimatedDeliveryDays={3}
      />
    );
    
    // Should show simplified shipping text
    expect(screen.getByText('Shipping Available')).toBeInTheDocument();
    
    // Should not show detailed shipping info
    expect(screen.queryByText(/Standard, Express, Collection/)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 days/)).not.toBeInTheDocument();
  });
});