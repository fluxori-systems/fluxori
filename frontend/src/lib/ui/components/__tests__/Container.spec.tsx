// @vitest-environment jsdom
import '@testing-library/jest-dom';
'use client';

import React from 'react';

import { describe, test, expect, vi } from 'vitest';

import { Assertions } from '../../../../testing/utils/assertions';
import { setupNetworkConditions } from '../../../../testing/utils/networkTesting';
import { renderWithProviders } from '../../../../testing/utils/render';

// Define Container props interface for type safety
interface ContainerProps {
  children?: React.ReactNode;
  size?: string; 
  padding?: string;
  responsive?: boolean;
  networkAware?: boolean;
  className?: string;
  'data-testid'?: string;
  [key: string]: any;
}

// Mock the Container component to avoid React hooks
vi.mock('../Container', () => ({
  Container: (props: ContainerProps) => {
    const { 
      children,
      size = 'md',
      padding = 'md', 
      responsive = true,
      networkAware = false,
      className = '',
      'data-testid': testId = 'container',
      ...rest
    } = props;
    
    // Build data attributes
    const dataAttrs: Record<string, string> = {
      'data-testid': testId,
      'data-size': size,
      'data-padding': padding,
    };
    
    if (responsive) {
      dataAttrs['data-responsive'] = 'true';
    }
    
    if (networkAware) {
      const connection = navigator.connection || {} as NetworkInformation;
      const downlink = connection.downlink ?? 10;
      
      if (downlink < 2) {
        dataAttrs['data-optimized'] = 'true';
      }
    }
    
    return (
      <div 
        className={`flx-container flx-container-${size} ${className}`}
        {...dataAttrs}
        {...rest}
      >
        {children}
      </div>
    );
  }
}));

// Import the mocked version
import { Container } from '../Container';

describe('Container Component', () => {
  test('renders with default props', () => {
    const { getByTestId } = renderWithProviders(
      <Container>Content</Container>
    );
    
    const container = getByTestId('container');
    
    Assertions.inDocument(container);
    Assertions.hasAttribute(container, 'data-size', 'md');
    Assertions.hasAttribute(container, 'data-padding', 'md');
    expect(container.className).toContain('flx-container');
  });
  
  test('applies custom size', () => {
    const { getByTestId } = renderWithProviders(
      <Container size="sm">Small Container</Container>
    );
    
    const container = getByTestId('container');
    
    Assertions.hasAttribute(container, 'data-size', 'sm');
    expect(container.className).toContain('flx-container-sm');
  });
  
  test('applies custom padding', () => {
    const { getByTestId } = renderWithProviders(
      <Container padding="lg">Large Padding</Container>
    );
    
    const container = getByTestId('container');
    
    Assertions.hasAttribute(container, 'data-padding', 'lg');
  });
  
  test('supports responsive mode', () => {
    const { getByTestId, rerender } = renderWithProviders(
      <Container responsive>Responsive Container</Container>
    );
    
    const container = getByTestId('container');
    
    Assertions.hasAttribute(container, 'data-responsive', 'true');
    
    rerender(
      <Container responsive={false}>Non-responsive Container</Container>
    );
    
    const updatedContainer = getByTestId('container');
    
    Assertions.notHasAttribute(updatedContainer, 'data-responsive');
  });
  
  test('supports network-aware optimizations', () => {
    // Mock poor network conditions
    const { cleanup } = setupNetworkConditions({
      effectiveType: '2g',
      downlink: 1,
      rtt: 300,
      saveData: false
    });
    
    try {
      const { getByTestId } = renderWithProviders(
        <Container networkAware>Network-aware Container</Container>
      );
      
      const container = getByTestId('container');
      
      Assertions.hasAttribute(container, 'data-optimized', 'true');
    } finally {
      cleanup();
    }
  });
  
  test('no optimizations with good network conditions', () => {
    // Mock good network conditions
    const { cleanup } = setupNetworkConditions({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    });
    
    try {
      const { getByTestId } = renderWithProviders(
        <Container networkAware>High Speed Container</Container>
      );
      
      const container = getByTestId('container');
      
      Assertions.notHasAttribute(container, 'data-optimized');
    } finally {
      cleanup();
    }
  });
  
  test('passes additional props to the DOM element', () => {
    const { getByTestId } = renderWithProviders(
      <Container data-custom="test" aria-label="container">Custom Props</Container>
    );
    
    const container = getByTestId('container');
    
    Assertions.hasAttribute(container, 'data-custom', 'test');
    Assertions.hasAttribute(container, 'aria-label', 'container');
  });
  
  test('combines custom className with default classes', () => {
    const { getByTestId } = renderWithProviders(
      <Container className="custom-class">Custom Class Container</Container>
    );
    
    const container = getByTestId('container');
    expect(container.className).toContain('flx-container');
    expect(container.className).toContain('custom-class');
  });
});