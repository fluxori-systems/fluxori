/**
 * Global TypeScript declarations for testing environment
 */

// NetworkInformation API
interface NetworkInformation {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: string;
  readonly onchange?: EventListener;
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: Event): boolean;
}

// Extend Navigator
interface Navigator {
  connection?: NetworkInformation;
}

// Extend Vitest's Assertions
declare namespace Vi {
  interface Assertion {
    // DOM Testing Library assertions
    toBeInTheDocument(): Assertion;
    toBeDisabled(): Assertion;
    toBeEnabled(): Assertion;
    toBeEmpty(): Assertion;
    toBeEmptyDOMElement(): Assertion;
    toBeInvalid(): Assertion;
    toBeRequired(): Assertion;
    toBeValid(): Assertion;
    toBeVisible(): Assertion;
    toContainElement(element: HTMLElement | null): Assertion;
    toContainHTML(htmlText: string): Assertion;
    toHaveAccessibleDescription(description?: string | RegExp): Assertion;
    toHaveAccessibleName(name?: string | RegExp): Assertion;
    toHaveAttribute(attr: string, value?: any): Assertion;
    toHaveClass(...classNames: string[]): Assertion;
    toHaveFocus(): Assertion;
    toHaveFormValues(expectedValues: Record<string, any>): Assertion;
    toHaveStyle(css: string | Record<string, any>): Assertion;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): Assertion;
    toHaveValue(value?: string | string[] | number): Assertion;
    toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): Assertion;
    toBeChecked(): Assertion;
    toBePartiallyChecked(): Assertion;
    toHaveErrorMessage(text?: string | RegExp): Assertion;
  }
}

// Extend MockInstance
declare module 'vitest' {
  interface MockInstance<T = any> {
    mockReturnValue<U>(value: U): MockInstance<T>;
    mockReturnValueOnce<U>(value: U): MockInstance<T>;
    mockResolvedValue<U>(value: U): MockInstance<T>;
    mockResolvedValueOnce<U>(value: U): MockInstance<T>;
    mockRejectedValue(value: unknown): MockInstance<T>;
    mockRejectedValueOnce(value: unknown): MockInstance<T>;
    mockImplementation<U extends any[], V>(fn: (...args: U) => V): MockInstance<T>;
    mockImplementationOnce<U extends any[], V>(fn: (...args: U) => V): MockInstance<T>;
    mockReturnThis(): MockInstance<T>;
    mockName(name: string): MockInstance<T>;
    getMockName(): string;
  }
}