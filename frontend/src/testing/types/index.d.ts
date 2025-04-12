import '@testing-library/jest-dom';
import { expect } from 'vitest';

/**
 * Global TypeScript definitions for Vitest with Jest-DOM
 * This is the single source of truth for Jest-DOM matchers in Vitest
 */

// Declare matchers on Vitest's expect interface
declare module 'vitest' {
  interface Assertion<T = any> {
    // DOM Testing Library matchers
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toBeEmpty(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toHaveAttribute(attr: string, value?: string | RegExp): T;
    toHaveClass(...classNames: string[]): T;
    toHaveFocus(): T;
    toHaveFormValues(expectedValues: Record<string, any>): T;
    toHaveStyle(css: string | Record<string, any>): T;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): T;
    toHaveValue(value?: string | string[] | number | null): T;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): T;
    toBeChecked(): T;
    toBePartiallyChecked(): T;
    toHaveDescription(text?: string | RegExp): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveErrorMessage(text?: string | RegExp): T;
    // Other common matchers
    toBeEmptyDOMElement(): T;
    toHaveAccessibleDescription(description?: string | RegExp): T;
    toHaveAccessibleName(name?: string | RegExp): T;
  }

  // Also augment the asymmetric matchers
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toBeVisible(): any;
    toBeEmpty(): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
    toBeInvalid(): any;
    toBeRequired(): any;
    toBeValid(): any;
    toHaveAttribute(attr: string, value?: string | RegExp): any;
    toHaveClass(...classNames: string[]): any;
    toHaveFocus(): any;
    toHaveFormValues(expectedValues: Record<string, any>): any;
    toHaveStyle(css: string | Record<string, any>): any;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
    toHaveValue(value?: string | string[] | number | null): any;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): any;
    toBeChecked(): any;
    toBePartiallyChecked(): any;
    toHaveDescription(text?: string | RegExp): any;
    toContainElement(element: HTMLElement | null): any;
    toContainHTML(htmlText: string): any;
    toHaveErrorMessage(text?: string | RegExp): any;
    toBeEmptyDOMElement(): any;
    toHaveAccessibleDescription(description?: string | RegExp): any;
    toHaveAccessibleName(name?: string | RegExp): any;
  }
}