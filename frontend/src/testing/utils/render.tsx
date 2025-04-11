/**
 * Render utilities for testing React components
 *
 * This file provides properly typed render functions for testing
 * React components with the necessary context providers.
 */

import React, { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import * as rtl from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all needed TestingLibrary exports to make them centrally available
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor
} from '@testing-library/react';

// Import type augmentations
import '../types/testing-library';
import '../types/testing';

// Context providers
import { ThemeProvider } from '../../lib/design-system/theme/ThemeContext';
import { MotionProvider } from '../../lib/motion/context/MotionContext';

// Simplified mock ServiceProvider that doesn't try to register services
function ServiceProvider({ children }: { children: ReactNode }): ReactElement {
  return <>{children}</>;
}

// JSDOM doesn't handle computed styles well, let's patch it
Object.defineProperty(window, 'getComputedStyle', {
  value: (el: Element) => {
    return {
      getPropertyValue: (prop: string) => {
        // Look for inline styles first
        if (el.hasAttribute('style')) {
          const styleAttr = el.getAttribute('style') || '';
          const match = styleAttr.match(new RegExp(`${prop}:\\s*([^;]+)`));
          if (match) return match[1].trim();
        }
        
        // Return mock values for common properties
        if (prop === 'border-radius') return '4px';
        if (prop.startsWith('--radius-')) return '4px';
        return '';
      },
      borderRadius: '4px' // Directly expose common properties
    };
  }
});

/**
 * All Providers wrapper component
 * 
 * This component wraps the component under test with all necessary
 * context providers to ensure proper component rendering.
 */
function AllProviders({ children }: { children: ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <MotionProvider>
        <ServiceProvider>
          {children}
        </ServiceProvider>
      </MotionProvider>
    </ThemeProvider>
  );
}

/**
 * Custom render function with all providers
 *
 * This function wraps the standard render function with our
 * custom providers for a consistent testing environment.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<rtl.RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Custom render function with specific providers
 *
 * This function lets you specify which providers to include
 * for more targeted testing of components.
 */
export function renderWithSpecificProviders(
  ui: ReactElement,
  { 
    withTheme = true,
    withMotion = true,
    ...options 
  }: { 
    withTheme?: boolean;
    withMotion?: boolean;
  } & Omit<rtl.RenderOptions, 'wrapper'>
) {
  // Create a custom wrapper based on requested providers
  function CustomProviders({ children }: { children: ReactNode }) {
    let content = <>{children}</>;
    
    // Wrap with motion provider if requested
    if (withMotion) {
      content = <MotionProvider>{content}</MotionProvider>;
    }
    
    // Wrap with theme provider if requested
    if (withTheme) {
      content = <ThemeProvider>{content}</ThemeProvider>;
    }
    
    return content;
  }
  
  return render(ui, { wrapper: CustomProviders, ...options });
}

/**
 * Helper for rendering hooks with proper TypeScript typing
 */
export function renderHook<Result, Props extends Record<string, any> = Record<string, any>>(
  callback: (props: Props) => Result,
  options?: { 
    initialProps?: Props,
    wrapper?: React.ComponentType<{children: React.ReactNode}>
  }
) {
  const result = { current: null as unknown as Result };
  
  const TestComponent = (props: Props) => {
    result.current = callback(props);
    return null;
  };
  
  const initialProps = (options?.initialProps || {}) as Props;
  
  // Use specified wrapper or default to AllProviders
  const WrapperComponent = options?.wrapper || AllProviders;
  
  const { rerender, unmount } = render(
    <TestComponent {...initialProps} />,
    { wrapper: WrapperComponent }
  );
  
  return {
    result,
    rerender: (props: Props = initialProps) => 
      rerender(<TestComponent {...props} />),
    unmount
  };
}

// Export all testing-library functions for consumer convenience
export { 
  render, 
  screen, 
  fireEvent, 
  waitFor
};