import { vi } from 'vitest';

// Extend Vi with custom helper methods
declare global {
  namespace Vi {
    interface Assertion<T = any> {
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

  // Add custom type-safe mock creators to vi object
  interface ViMethods {
    createMock<T extends (...args: any[]) => any>(
      implementation?: T
    ): MockInstance<ReturnType<T>>;
    
    createCallbackMock<T extends (...args: any[]) => any>(
      returnValue?: ReturnType<T>
    ): MockInstance<ReturnType<T>>;
    
    createEventHandlerMock(): MockInstance<void>;
    
    createConnectionMock(config?: Partial<NetworkInformation>): NetworkInformation;
  }
}

// Fix Network Information API
interface NetworkInformation {
  readonly downlink: number;
  readonly effectiveType: string;
  readonly rtt: number;
  readonly saveData: boolean;
  addEventListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListener, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: Event): boolean;
}

// Extend Navigator with connection
interface Navigator {
  connection?: NetworkInformation;
}