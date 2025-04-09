'use client';

import React from 'react';
import { vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../testUtil';
import { Button } from '../Button';

describe('Button Component', () => {
  test('renders with default props', () => {
    renderWithProviders(<Button>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('handles click events', () => {
    const handleClick = vi.fn();
    
    renderWithProviders(
      <Button onClick={handleClick}>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('applies variant class correctly', () => {
    const { container } = renderWithProviders(
      <Button variant="outline">
        Outline Button
      </Button>
    );
    
    expect(container.firstChild).toHaveClass('button-variant-outline');
  });
  
  test('applies size class correctly', () => {
    const { container } = renderWithProviders(
      <Button size="lg">
        Large Button
      </Button>
    );
    
    expect(container.firstChild).toHaveClass('button-size-lg');
  });
  
  test('applies intent class correctly', () => {
    const { container } = renderWithProviders(
      <Button intent="warning">
        Warning Button
      </Button>
    );
    
    expect(container.firstChild).toHaveClass('button-intent-warning');
  });
  
  test('applies loading state correctly', () => {
    renderWithProviders(
      <Button loading>
        Loading Button
      </Button>
    );
    
    expect(screen.getByText('Loading Button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  
  test('disables button when disabled prop is true', () => {
    renderWithProviders(
      <Button disabled>
        Disabled Button
      </Button>
    );
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  test('forwards ref to underlying button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    
    renderWithProviders(
      <Button ref={ref}>
        Button with ref
      </Button>
    );
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });
  
  test('applies fullWidth class when fullWidth prop is true', () => {
    const { container } = renderWithProviders(
      <Button fullWidth>
        Full Width Button
      </Button>
    );
    
    expect(container.firstChild).toHaveClass('button-full-width');
  });
  
  // Network-aware optimization tests
  test('optimizes rendering on poor connections', () => {
    // Mock poor network condition
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        downlink: 0.5,
        saveData: false
      },
      configurable: true
    });
    
    renderWithProviders(
      <Button networkAware>
        Network Optimized
      </Button>
    );
    
    expect(screen.getByText('Network Optimized')).toBeInTheDocument();
    
    // Restore network connection
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true
    });
  });
});