import '@testing-library/jest-dom';

// Vitest specific typings
declare module 'vitest' {
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

  interface AsymmetricMatchersContaining extends Assertion {}
}

// Jest compatibility (for existing code)
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveStyle(style: Record<string, any>): R;
  }
}

// Testing library exports
declare module '@testing-library/jest-dom/matchers' {
  export default function(expect: any): void;
  
  export interface TestingLibraryMatchers<R, T> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: any): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveStyle(style: Record<string, any>): R;
  }
}