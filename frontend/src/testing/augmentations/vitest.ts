/**
 * Comprehensive type augmentations for Vitest and testing libraries
 * 
 * This file provides proper typing for:
 * - Vitest mocks and assertions
 * - Jest-DOM matchers
 * - Testing Library functionality
 */

/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  // Extend expect to add test matchers
  namespace Vitest {
    interface Assertion {
      toBeInTheDocument(): any;
      toBeDisabled(): any;
      toBeEnabled(): any;
      toBeEmpty(): any;
      toBeEmptyDOMElement(): any;
      toBeInvalid(): any;
      toBeRequired(): any;
      toBeValid(): any;
      toBeVisible(): any;
      toContainElement(element: HTMLElement | null): any;
      toContainHTML(htmlText: string): any;
      toHaveAccessibleDescription(description?: string | RegExp): any;
      toHaveAccessibleName(name?: string | RegExp): any;
      toHaveAttribute(attr: string, value?: any): any;
      toHaveClass(...classNames: string[]): any;
      toHaveFocus(): any;
      toHaveFormValues(expectedValues: Record<string, any>): any;
      toHaveStyle(css: string | Record<string, any>): any;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
      toHaveValue(value?: string | string[] | number): any;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): any;
      toBeChecked(): any;
      toBePartiallyChecked(): any;
      toHaveErrorMessage(text?: string | RegExp): any;
    }
    
    interface AsymmetricMatchersContaining {
      toBeInTheDocument(): any;
      toBeDisabled(): any;
      toBeEnabled(): any;
      toBeEmpty(): any;
      toBeEmptyDOMElement(): any;
      toBeInvalid(): any;
      toBeRequired(): any;
      toBeValid(): any;
      toBeVisible(): any;
      toContainElement(element: HTMLElement | null): any;
      toContainHTML(htmlText: string): any;
      toHaveAccessibleDescription(description?: string | RegExp): any;
      toHaveAccessibleName(name?: string | RegExp): any;
      toHaveAttribute(attr: string, value?: any): any;
      toHaveClass(...classNames: string[]): any;
      toHaveFocus(): any;
      toHaveFormValues(expectedValues: Record<string, any>): any;
      toHaveStyle(css: string | Record<string, any>): any;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
      toHaveValue(value?: string | string[] | number): any;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): any;
      toBeChecked(): any;
      toBePartiallyChecked(): any;
      toHaveErrorMessage(text?: string | RegExp): any;
    }
  }
}

// Extend Vitest functionality without creating type parameter conflicts
declare module 'vitest' {
  // Add missing methods to Vi top-level object
  interface Vi {
    restoreAllMocks(): void;
    clearAllMocks(): void;
    resetAllMocks(): void;
    importActual<T>(path: string): Promise<T>;
  }
}

export {};