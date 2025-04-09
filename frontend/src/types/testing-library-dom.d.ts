/**
 * Type declarations for @testing-library/dom
 * Provides types for DOM testing library functions
 */

// Jest-dom matchers
interface JestDomMatchers<R = void> {
  toBeInTheDocument(): R;
  toBeVisible(): R;
  toBeEmpty(): R;
  toBeDisabled(): R;
  toBeEnabled(): R;
  toBeInvalid(): R;
  toBeRequired(): R;
  toBeValid(): R;
  toHaveAttribute(attr: string, value?: string | RegExp): R;
  toHaveClass(...classNames: string[]): R;
  toHaveFocus(): R;
  toHaveFormValues(expectedValues: Record<string, any>): R;
  toHaveStyle(css: string | Record<string, any>): R;
  toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
  toHaveValue(value?: string | string[] | number | null): R;
  toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
  toBeChecked(): R;
  toBePartiallyChecked(): R;
  toHaveDescription(text?: string | RegExp): R;
  toContainElement(element: HTMLElement | null): R;
  toContainHTML(htmlText: string): R;
  toHaveErrorMessage(text?: string | RegExp): R;
}

// Extend Vitest
declare module 'vitest' {
  interface Assertion<T = any> extends JestDomMatchers<Assertion<T>> {}
  interface AsymmetricMatchersContaining extends JestDomMatchers<void> {}
}

// Extend Jest for backwards compatibility
declare namespace jest {
  interface Matchers<R> extends JestDomMatchers<R> {}
}

declare module '@testing-library/dom' {
  // Query variants
  type QueryFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => T | null;

  type QueryAllFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => T[];

  type GetFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => T;

  type GetAllFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => T[];

  type FindFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => Promise<T>;

  type FindAllFunction<T extends Element = Element> = (
    container: HTMLElement,
    ...args: any[]
  ) => Promise<T[]>;

  // FireEvent interface
  interface FireEventFunction {
    (element: Element, event: Event): boolean;
    // Event wrappers
    click: (element: Element, options?: {}) => boolean;
    change: (element: Element, options?: {}) => boolean;
    focus: (element: Element, options?: {}) => boolean;
    blur: (element: Element, options?: {}) => boolean;
    keyDown: (element: Element, options?: {}) => boolean;
    keyPress: (element: Element, options?: {}) => boolean;
    keyUp: (element: Element, options?: {}) => boolean;
    mouseDown: (element: Element, options?: {}) => boolean;
    mouseUp: (element: Element, options?: {}) => boolean;
    mouseMove: (element: Element, options?: {}) => boolean;
    mouseEnter: (element: Element, options?: {}) => boolean;
    mouseLeave: (element: Element, options?: {}) => boolean;
    submit: (element: Element, options?: {}) => boolean;
  }

  // Export functions
  export const fireEvent: FireEventFunction;
  
  // Screen object
  export const screen: {
    getByLabelText: GetFunction;
    getAllByLabelText: GetAllFunction;
    queryByLabelText: QueryFunction;
    queryAllByLabelText: QueryAllFunction;
    findByLabelText: FindFunction;
    findAllByLabelText: FindAllFunction;
    
    getByText: GetFunction;
    getAllByText: GetAllFunction;
    queryByText: QueryFunction;
    queryAllByText: QueryAllFunction;
    findByText: FindFunction;
    findAllByText: FindAllFunction;
    
    getByRole: GetFunction;
    getAllByRole: GetAllFunction;
    queryByRole: QueryFunction;
    queryAllByRole: QueryAllFunction;
    findByRole: FindFunction;
    findAllByRole: FindAllFunction;
    
    getByTestId: GetFunction;
    getAllByTestId: GetAllFunction;
    queryByTestId: QueryFunction;
    queryAllByTestId: QueryAllFunction;
    findByTestId: FindFunction;
    findAllByTestId: FindAllFunction;
    
    debug: (element?: Element | HTMLDocument | DocumentFragment) => void;
  };
}