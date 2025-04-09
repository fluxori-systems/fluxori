/**
 * Type declarations for @testing-library/dom
 * Provides types for DOM testing library functions
 */

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

  // Matchers for jest-dom
  interface ExtendedMatchers<R> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeEmpty(): R;
    toBeInvalid(): R;
    toBeRequired(): R;
    toBeValid(): R;
    toBeChecked(): R;
    toHaveAttribute(attr: string, value?: any): R;
    toHaveClass(...classNames: string[]): R;
    toHaveFocus(): R;
    toHaveStyle(css: string | Record<string, any>): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveValue(value: any): R;
    toContainElement(element: HTMLElement | null): R;
    toContainHTML(htmlText: string): R;
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