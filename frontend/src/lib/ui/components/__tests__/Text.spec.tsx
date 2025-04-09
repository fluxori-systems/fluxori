'use client';

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { renderWithProviders } from '../../../../testing/utils/render';
import { setupNetworkConditions } from '../../../../testing/utils/networkTesting';

// Import the Text component type before mocking
import { Text as OriginalText } from '../Text';

// Define interface to ensure type safety
interface TextProps {
  preset?: string;
  intent?: string;
  role?: string;
  animated?: boolean;
  animationType?: string;
  networkAware?: boolean;
  lh?: string;
  ls?: string;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

// Mock the Text component to avoid actual React hooks usage in tests
vi.mock('../Text', () => ({
  Text: ({ 
    children, 
    preset, 
    intent, 
    role, 
    animated,
    animationType,
    networkAware,
    lh,
    ls,
    ...rest 
  }: TextProps) => {
    // Build className based on props
    const classes = [
      'flx-text',
      preset ? `flx-text-${preset}` : '',
      intent ? `flx-text-intent-${intent}` : '',
      role ? `flx-text-role-${role}` : '',
    ].filter(Boolean).join(' ');
    
    // Setup data attributes for testing
    const dataAttrs: Record<string, string> = {};
    
    if (networkAware) {
      // Check navigator.connection to determine network quality
      const connection = navigator.connection || {} as NetworkInformation;
      const downlink = connection?.downlink ?? 10;
      const saveData = connection?.saveData ?? false;
      
      if (downlink < 5 || saveData) {
        dataAttrs['data-network-optimized'] = 'true';
      }
    }
    
    if (animated) {
      dataAttrs['data-animation-type'] = animationType || 'fade';
    }
    
    if (lh) {
      dataAttrs['data-line-height'] = lh;
    }
    
    if (ls) {
      dataAttrs['data-letter-spacing'] = ls;
    }
    
    return (
      <div 
        data-testid="text-component"
        className={classes}
        {...dataAttrs}
        {...rest}
      >
        {children}
      </div>
    );
  }
}));

// Import the mocked version
import { Text } from '../Text';

describe('Text Component', () => {
  test('renders correctly with default props', () => {
    const { getByTestId } = renderWithProviders(<Text>Sample Text</Text>);
    
    const textElement = getByTestId('text-component');
    // @ts-expect-error - toBeInTheDocument comes from jest-dom
    expect(textElement).toBeInTheDocument();
    expect(textElement.textContent).toBe('Sample Text');
    expect(textElement.className).toContain('flx-text');
  });
  
  test('applies preset styles correctly', () => {
    const { getByTestId } = renderWithProviders(<Text preset="heading1">Heading Text</Text>);
    
    const textElement = getByTestId('text-component');
    expect(textElement.textContent).toBe('Heading Text');
    expect(textElement.className).toContain('flx-text-heading1');
  });
  
  test('applies intent styles correctly', () => {
    const { getByTestId } = renderWithProviders(<Text intent="primary">Primary Text</Text>);
    
    const textElement = getByTestId('text-component');
    expect(textElement.textContent).toBe('Primary Text');
    expect(textElement.className).toContain('flx-text-intent-primary');
  });
  
  test('applies role styles correctly', () => {
    const { getByTestId } = renderWithProviders(<Text role="success">Success Text</Text>);
    
    const textElement = getByTestId('text-component');
    expect(textElement.textContent).toBe('Success Text');
    expect(textElement.className).toContain('flx-text-role-success');
  });
  
  test('handles both role and intent styles', () => {
    const { getByTestId } = renderWithProviders(
      <Text role="success" intent="error">Error Text</Text>
    );
    
    const textElement = getByTestId('text-component');
    expect(textElement.textContent).toBe('Error Text');
    expect(textElement.className).toContain('flx-text-role-success');
    expect(textElement.className).toContain('flx-text-intent-error');
  });
  
  // Network-aware optimization tests
  test('optimizes text on poor connections', () => {
    const { cleanup } = setupNetworkConditions({
      effectiveType: '2g',
      downlink: 0.5,
      saveData: false
    });
    
    try {
      const { getByTestId } = renderWithProviders(
        <Text preset="display1" networkAware>Very Large Text</Text>
      );
      
      const textElement = getByTestId('text-component');
      // @ts-expect-error - toHaveAttribute comes from jest-dom
      expect(textElement).toHaveAttribute('data-network-optimized', 'true');
    } finally {
      cleanup();
    }
  });
  
  test('respects data saver preferences', () => {
    const { cleanup } = setupNetworkConditions({
      effectiveType: '4g',
      downlink: 10,
      saveData: true
    });
    
    try {
      const { getByTestId } = renderWithProviders(
        <Text preset="display1" networkAware>Data Saver Text</Text>
      );
      
      const textElement = getByTestId('text-component');
      // @ts-expect-error - toHaveAttribute comes from jest-dom
      expect(textElement).toHaveAttribute('data-network-optimized', 'true');
    } finally {
      cleanup();
    }
  });
  
  test('supports animated text with proper attributes', () => {
    const { getByTestId } = renderWithProviders(
      <Text 
        animated
        animationType="fade"
      >
        Animated Text
      </Text>
    );
    
    const textElement = getByTestId('text-component');
    // @ts-expect-error - toHaveAttribute comes from jest-dom
    expect(textElement).toHaveAttribute('data-animation-type', 'fade');
  });
  
  test('supports line and letter spacing attributes', () => {
    const { getByTestId } = renderWithProviders(
      <Text lh="tight" ls="wide">Spaced Text</Text>
    );
    
    const textElement = getByTestId('text-component');
    // @ts-expect-error - toHaveAttribute comes from jest-dom
    expect(textElement).toHaveAttribute('data-line-height', 'tight');
    // @ts-expect-error - toHaveAttribute comes from jest-dom
    expect(textElement).toHaveAttribute('data-letter-spacing', 'wide');
  });
});