/**
 * Render utilities for testing React components
 *
 * This file provides properly typed render functions for testing
 * React components with the necessary context providers.
 */

import React, { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import type { RenderOptions } from '@testing-library/react';

// Import from testing-library with renamed exports to avoid type conflicts
import {
  render as testingLibraryRender,
  screen as testingLibraryScreen,
  fireEvent as testingLibraryFireEvent,
  waitFor as testingLibraryWaitFor
} from '@testing-library/react';

// Import type augmentations
import '../augmentations/vitest';

// Context providers
import { ThemeProvider } from '../../lib/design-system/theme/ThemeContext';
import { MotionProvider } from '../../lib/motion/context/MotionContext';

/**
 * Custom within function that provides proper typing for element queries
 */
export function within(element: HTMLElement) {
  return {
    getByText: (text: string | RegExp) => {
      const nodes = Array.from(element.querySelectorAll('*'));
      const found = nodes.find(n => n.textContent && 
        (typeof text === 'string' 
          ? n.textContent.includes(text)
          : text.test(n.textContent)
        )
      );
      if (!found) throw new Error(`Unable to find text: ${text}`);
      return found as HTMLElement;
    },
    queryByText: (text: string | RegExp) => {
      const nodes = Array.from(element.querySelectorAll('*'));
      const found = nodes.find(n => n.textContent && 
        (typeof text === 'string' 
          ? n.textContent.includes(text)
          : text.test(n.textContent)
        )
      );
      return found as HTMLElement || null;
    },
    getByAttribute: (attribute: string, value: string) => {
      const selector = `[${attribute}="${value}"]`;
      const found = element.querySelector(selector);
      if (!found) throw new Error(`Unable to find element with attribute ${attribute}="${value}"`);
      return found as HTMLElement;
    },
    queryByAttribute: (attribute: string, value: string) => {
      const selector = `[${attribute}="${value}"]`;
      return element.querySelector(selector) as HTMLElement || null;
    }
  };
}

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
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return testingLibraryRender(ui, { wrapper: AllProviders, ...options });
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
  } & Omit<RenderOptions, 'wrapper'>
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
  
  return testingLibraryRender(ui, { wrapper: CustomProviders, ...options });
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
  let result: { current: Result } = { current: null as any };
  
  const TestComponent = (props: Props) => {
    result.current = callback(props);
    return null;
  };
  
  const initialProps = (options?.initialProps || {}) as Props;
  
  // Use specified wrapper or default to AllProviders
  const WrapperComponent = options?.wrapper || AllProviders;
  
  const { rerender, unmount } = testingLibraryRender(
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

// Extend the screen object with our additional query methods
const extendedScreen = {
  ...testingLibraryScreen,
  getByAttribute: (attribute: string, value: string) => {
    const selector = `[${attribute}="${value}"]`;
    const found = document.querySelector(selector);
    if (!found) throw new Error(`Unable to find element with attribute ${attribute}="${value}"`);
    return found as HTMLElement;
  },
  queryByAttribute: (attribute: string, value: string) => {
    const selector = `[${attribute}="${value}"]`;
    return document.querySelector(selector) as HTMLElement || null;
  }
};

// Re-export our enhanced versions of the testing library functions
export {
  extendedScreen as screen,
  testingLibraryFireEvent as fireEvent,
  testingLibraryWaitFor as waitFor,
  act,
  testingLibraryRender as render
};