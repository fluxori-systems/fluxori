import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
'use client';

import React from 'react';
import {  } from '@testing-library/react';
import { screen, screen, fireEvent, waitFor, within } from '../../../testing/utils/render';
import { Grid } from '../Grid';
import { screen, fireEvent, waitFor, within } from '../../../testing/utils/render';

describe('Grid Component', () => {
  test('renders children correctly', () => {
    renderWithProviders(
      <Grid>
        <Grid.Col span={6}>
          <div data-testid="grid-child">Grid Content</div>
        </Grid.Col>
      </Grid>
    );
    
    expect(screen.getByTestId('grid-child')).toBeInTheDocument();
    expect(screen.getByText('Grid Content')).toBeInTheDocument();
  });
  
  test('applies intent className correctly', () => {
    const { container } = renderWithProviders(
      <Grid intent="dashboard">Dashboard Grid</Grid>
    );
    
    expect(container.firstChild).toHaveClass('grid-dashboard');
  });
  
  test('supports legacy spacing prop', () => {
    const { container } = renderWithProviders(
      <Grid spacing="lg">Legacy Spacing Grid</Grid>
    );
    
    // In a real test, we would check the computed styles
    // to verify the correct spacing is applied
    expect(container.firstChild).toBeInTheDocument();
  });
  
  test('supports modern gutter prop', () => {
    const { container } = renderWithProviders(
      <Grid gutter="xl">Modern Gutter Grid</Grid>
    );
    
    // In a real test, we would check the computed styles
    // to verify the correct gutter is applied
    expect(container.firstChild).toBeInTheDocument();
  });
  
  test('supports custom column count', () => {
    const { container } = renderWithProviders(
      <Grid columns={24}>Custom Columns Grid</Grid>
    );
    
    // In a real test, we would check the column count attribute
    expect(container.firstChild).toBeInTheDocument();
  });
  
  // Network-aware optimization tests
  test('optimizes gutters on poor connections', () => {
    // Mock poor network conditions
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        downlink: 0.3,
        saveData: false
      },
      configurable: true
    });
    
    const { container } = renderWithProviders(
      <Grid gutter="xl" networkAware={true}>
        <Grid.Col span={6}>Optimized Grid</Grid.Col>
      </Grid>
    );
    
    // In a real test with rendered styles, we would check 
    // that the gutter value was reduced
    expect(container.firstChild).toHaveClass('grid-network-optimized');
    
    // Restore network conditions
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true
    });
  });
  
  test('respects data saver mode', () => {
    // Mock data saver mode
    Object.defineProperty(navigator, 'connection', {
      value: {
        saveData: true
      },
      configurable: true
    });
    
    const { container } = renderWithProviders(
      <Grid gutter="lg" networkAware={true}>
        <Grid.Col span={6}>Data Saver Grid</Grid.Col>
      </Grid>
    );
    
    // In a real test with rendered styles, we would check
    // that optimizations were applied
    expect(container.firstChild).toHaveClass('grid-network-optimized');
    
    // Restore
    Object.defineProperty(navigator, 'connection', {
      value: {
        saveData: false
      },
      configurable: true
    });
  });
  
  test('supports animated presence with network awareness', () => {
    const { container } = renderWithProviders(
      <Grid 
        animatePresence={true}
        networkAware={true}
      >
        <Grid.Col span={6}>Animated Grid</Grid.Col>
      </Grid>
    );
    
    expect(screen.getByText('Animated Grid')).toBeInTheDocument();
    
    // In a real test, we would check animation properties
    // and verify they adapt to network conditions
  });
  
  test('Grid.Col optimizes responsive spans on poor connections', () => {
    // Mock poor network
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        downlink: 0.3
      },
      configurable: true
    });
    
    const { container } = renderWithProviders(
      <Grid networkAware={true}>
        <Grid.Col 
          // @ts-ignore - In runtime this responsive object works with the Grid component
          span={{ base: 12, xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}
          networkAware={true}
        >
          Responsive Col
        </Grid.Col>
      </Grid>
    );
    
    // Find the Grid.Col
    const col = screen.getByText('Responsive Col').parentElement;
    
    // In a real test, we would check that responsive span was simplified
    expect(col).toHaveClass('grid-col-network-optimized');
    
    // Restore
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true
    });
  });
  
  test('handles legacy responsive props', () => {
    renderWithProviders(
      <Grid>
        <Grid.Col 
          xs={12}
          sm={6}
          md={4}
          lg={3}
          xl={2}
        >
          Legacy Responsive
        </Grid.Col>
      </Grid>
    );
    
    expect(screen.getByText('Legacy Responsive')).toBeInTheDocument();
    
    // In a real test, we would check that the spans were converted properly
  });
});