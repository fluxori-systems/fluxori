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
  // Extend Vitest interface with Jest-DOM matchers
  namespace Vi {
    interface Assertion<T = any> {
      // DOM Testing Library assertions
      toBeInTheDocument(): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
      toBeEmpty(): T;
      toBeEmptyDOMElement(): T;
      toBeInvalid(): T;
      toBeRequired(): T;
      toBeValid(): T;
      toBeVisible(): T;
      toContainElement(element: HTMLElement | null): T;
      toContainHTML(htmlText: string): T;
      toHaveAccessibleDescription(description?: string | RegExp): T;
      toHaveAccessibleName(name?: string | RegExp): T;
      toHaveAttribute(attr: string, value?: any): T;
      toHaveClass(...classNames: string[]): T;
      toHaveFocus(): T;
      toHaveFormValues(expectedValues: Record<string, any>): T;
      toHaveStyle(css: string | Record<string, any>): T;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): T;
      toHaveValue(value?: string | string[] | number): T;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T;
      toBeChecked(): T;
      toBePartiallyChecked(): T;
      toHaveErrorMessage(text?: string | RegExp): T;
    }
  }
}

// Extend Vitest with missing mock functionality needed for compatibility
declare module 'vitest' {
  // Add missing methods to MockInstance without redefining the type parameters
  interface MockInstance {
    mockReturnValue<T>(value: T): this;
    mockReturnValueOnce<T>(value: T): this;
    mockResolvedValue<T>(value: T): this; 
    mockResolvedValueOnce<T>(value: T): this;
    mockRejectedValue(value: unknown): this;
    mockRejectedValueOnce(value: unknown): this;
    mockImplementation<T, Y extends any[]>(fn: (...args: Y) => T): this;
    mockImplementationOnce<T, Y extends any[]>(fn: (...args: Y) => T): this;
    mockReturnThis(): this;
    mockName(name: string): this;
    getMockName(): string;
  }

  // Add missing methods to Vi type
  interface Vi {
    restoreAllMocks(): void;
    clearAllMocks(): void;
    resetAllMocks(): void;
    importActual<T>(path: string): Promise<T>;
  }
}

export {};