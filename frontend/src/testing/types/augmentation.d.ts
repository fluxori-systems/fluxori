/* eslint-disable @typescript-eslint/no-unused-vars */

// This file provides proper type augmentations for testing libraries

import '@testing-library/jest-dom';
import type { Assertion } from 'vitest';

// Declare the matchers for Vitest
declare module 'vitest' {
  interface Assertion<T = any> {
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
    toBeEmptyDOMElement(): T;
    toHaveAccessibleDescription(description?: string | RegExp): T;
    toHaveAccessibleName(name?: string | RegExp): T;
  }
}

// Declare the matchers for Jest
declare global {
  namespace jest {
    interface Matchers<R, T = {}> {
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
      toBeEmptyDOMElement(): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toHaveAccessibleName(name?: string | RegExp): R;
    }
  }
}