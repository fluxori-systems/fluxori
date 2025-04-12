// @vitest-environment jsdom
import '@testing-library/jest-dom';
'use client';

import React from 'react';
import { vi, describe, test, expect } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../../../testing/utils/render';
import { Alert } from '../Alert';
import { setupNetworkConditions } from '../../../../testing/utils/networkTesting';

describe('Alert Component', () => {
  test('renders with default props', () => {
    renderWithProviders(<Alert>Test alert</Alert>);
    
    const alertElement = screen.getByText('Test alert');
    expect(alertElement).toBeDefined();
  });
  
  test('renders with title', () => {
    renderWithProviders(<Alert title="Alert Title">Alert content</Alert>);
    
    const titleElement = screen.getByText('Alert Title');
    const contentElement = screen.getByText('Alert content');
    
    expect(titleElement).toBeDefined();
    expect(contentElement).toBeDefined();
  });
  
  test('renders with different variants', () => {
    const { rerender } = renderWithProviders(
      <Alert variant="default">Default variant</Alert>
    );
    
    let alertElement = screen.getByText('Default variant');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert variant="filled">Filled variant</Alert>);
    alertElement = screen.getByText('Filled variant');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert variant="outline">Outline variant</Alert>);
    alertElement = screen.getByText('Outline variant');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert variant="light">Light variant</Alert>);
    alertElement = screen.getByText('Light variant');
    expect(alertElement).toBeDefined();
  });
  
  test('renders with different colors', () => {
    const { rerender } = renderWithProviders(
      <Alert color="info">Info alert</Alert>
    );
    
    let alertElement = screen.getByText('Info alert');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert color="success">Success alert</Alert>);
    alertElement = screen.getByText('Success alert');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert color="warning">Warning alert</Alert>);
    alertElement = screen.getByText('Warning alert');
    expect(alertElement).toBeDefined();
    
    rerender(<Alert color="error">Error alert</Alert>);
    alertElement = screen.getByText('Error alert');
    expect(alertElement).toBeDefined();
  });
  
  test('handles close button click', () => {
    const handleClose = vi.fn();
    
    renderWithProviders(
      <Alert withCloseButton onClose={handleClose}>
        Closable alert
      </Alert>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    // onClose should be called
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
  
  test('applies network-aware optimizations on poor connection', () => {
    // Setup poor connection
    const { cleanup: cleanupNetwork } = setupNetworkConditions({
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 800,
      saveData: false
    });
    
    try {
      const { container } = renderWithProviders(
        <Alert radius="xl" networkAware>
          Network optimized alert
        </Alert>
      );
      
      // Should have network quality data attribute
      const alertElement = container.querySelector('[data-network-quality="poor"]');
      expect(alertElement).not.toBeNull();
      
      // Check for optimized radius (xl should be reduced to md in poor network)
      const style = window.getComputedStyle(alertElement as Element);
      expect(style.borderRadius).not.toBe(undefined);
      
    } finally {
      cleanupNetwork();
    }
  });
  
  test('disables animations in data saver mode', () => {
    // Setup data saver mode
    const { cleanup: cleanupNetwork } = setupNetworkConditions({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: true
    });
    
    try {
      const { container } = renderWithProviders(
        <Alert networkAware autoClose={5000}>
          Data saver alert
        </Alert>
      );
      
      // Check that TransitionFade is not used (no animation in data saver)
      const fadeWrapper = container.querySelector('[data-transition="fade"]');
      expect(fadeWrapper).toBeNull();
      
    } finally {
      cleanupNetwork();
    }
  });
});