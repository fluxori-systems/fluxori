/**
 * Type augmentations for testing-library/react
 * This provides proper typing for React Testing Library functions
 */

/// <reference types="@testing-library/react" />
/// <reference types="@testing-library/jest-dom" />

// Augment the expect interface with custom matchers
declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toHaveAttribute(attr: string, value?: string): void;
      toHaveClass(className: string): void;
      toHaveTextContent(text: string): void;
      toBeVisible(): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toBeChecked(): void;
      toBeEmpty(): void;
      toHaveFocus(): void;
      toHaveStyle(css: Record<string, any>): void;
      toHaveValue(value: any): void;
    }
  }
}

export {};