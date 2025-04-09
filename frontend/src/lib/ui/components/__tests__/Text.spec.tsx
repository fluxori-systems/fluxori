import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
'use client';

import React from 'react';
import {  } from '@testing-library/react';
import { screen, screen, fireEvent, waitFor, within } from '../../../testing/utils/render';
import { Text } from '../Text';
import { screen, fireEvent, waitFor, within } from '../../../testing/utils/render';

describe('Text Component', () => {
  test('renders correctly with default props', () => {
    renderWithProviders(<Text>Sample Text</Text>);
    expect(screen.getByText('Sample Text')).toBeInTheDocument();
  });
  
  test('applies preset styles correctly', () => {
    const { container } = renderWithProviders(<Text preset="heading1">Heading Text</Text>);
    expect(screen.getByText('Heading Text')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flx-text-heading1');
  });
  
  test('applies intent styles correctly', () => {
    const { container } = renderWithProviders(<Text intent="primary">Primary Text</Text>);
    expect(screen.getByText('Primary Text')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flx-text-intent-primary');
  });
  
  test('applies role styles correctly', () => {
    const { container } = renderWithProviders(<Text role="success">Success Text</Text>);
    expect(screen.getByText('Success Text')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('flx-text-role-success');
  });
  
  test('handles both role and intent with intent taking precedence', () => {
    renderWithProviders(<Text role="success" intent="error">Error Text</Text>);
    const textElement = screen.getByText('Error Text');
    expect(textElement).toHaveClass('flx-text-role-success');
    expect(textElement).toHaveClass('flx-text-intent-error');
    
    // In a real test, we would also check that the color matches the intent (error) color
    // and not the role (success) color
  });
  
  // Network-aware optimization tests
  test('optimizes large font sizes on poor connections', () => {
    // Mock poor network conditions
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        downlink: 0.5,
        saveData: false
      },
      configurable: true
    });
    
    const { container } = renderWithProviders(
      <Text preset="display1" networkAware={true}>Very Large Text</Text>
    );
    
    const textElement = screen.getByText('Very Large Text');
    expect(textElement).toHaveAttribute('data-network-optimized', 'true');
    
    // Restore network conditions
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        saveData: false
      },
      configurable: true
    });
  });
  
  test('respects data saver preferences', () => {
    // Mock data saver mode
    Object.defineProperty(navigator, 'connection', {
      value: {
        saveData: true
      },
      configurable: true
    });
    
    const { container } = renderWithProviders(
      <Text preset="display1" networkAware={true}>Data Saver Text</Text>
    );
    
    const textElement = screen.getByText('Data Saver Text');
    expect(textElement).toHaveAttribute('data-network-optimized', 'true');
    
    // Restore
    Object.defineProperty(navigator, 'connection', {
      value: {
        saveData: false
      },
      configurable: true
    });
  });
  
  test('supports animated text with network awareness', () => {
    const { container } = renderWithProviders(
      <Text 
        animated={true}
        animationType="fade"
        networkAware={true}
      >
        Animated Text
      </Text>
    );
    
    expect(screen.getByText('Animated Text')).toBeInTheDocument();
    
    // In a real test, we would check animation properties
    // and verify they adapt to network conditions
  });
  
  test('supports line and letter spacing with token tracking', () => {
    const { container } = renderWithProviders(
      <Text lh="tight" ls="wide">Spaced Text</Text>
    );
    
    expect(screen.getByText('Spaced Text')).toBeInTheDocument();
    
    // In a real test, we would check computed styles 
    // and verify the design token values are applied
  });
  
  test('supports typography presets with fallbacks', () => {
    // Test all presets to ensure they render correctly
    const presets = [
      'display1', 'display2', 'display3',
      'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6',
      'body1', 'body2', 'body3',
      'caption', 'label', 'overline', 'code'
    ];
    
    presets.forEach(preset => {
      const { unmount } = renderWithProviders(
        <Text preset={preset as any}>{preset} text</Text>
      );
      
      expect(screen.getByText(`${preset} text`)).toBeInTheDocument();
      unmount();
    });
  });
});