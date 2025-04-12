/**
 * Custom type-safe assertion utilities for tests
 * This file provides type-safe wrappers around Jest DOM matcher functions
 */

import { expect } from 'vitest';

/**
 * Assert that an element is in the document
 */
export function assertInDocument(element: HTMLElement): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.toBeInTheDocument();
}

/**
 * Assert that an element has an attribute
 */
export function assertHasAttribute(
  element: HTMLElement, 
  attr: string, 
  value?: string
): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.toHaveAttribute(attr, value);
}

/**
 * Assert that an element does not have an attribute
 */
export function assertNotHasAttribute(
  element: HTMLElement, 
  attr: string
): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.not.toHaveAttribute(attr);
}

/**
 * Assert that an element is disabled
 */
export function assertDisabled(element: HTMLElement): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.toBeDisabled();
}

/**
 * Assert that an element is not disabled
 */
export function assertNotDisabled(element: HTMLElement): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.not.toBeDisabled();
}

/**
 * Assert that an element has text content
 */
export function assertHasTextContent(
  element: HTMLElement, 
  text: string | RegExp
): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.toHaveTextContent(text);
}

/**
 * Assert that an element has a class
 */
export function assertHasClass(
  element: HTMLElement, 
  className: string
): void {
  // We need to cast this since TypeScript doesn't know about the jest-dom matchers
  const assertion = expect(element) as any;
  assertion.toHaveClass(className);
}

/**
 * Test utilities with type-safe assertions
 */
export const Assertions = {
  inDocument: assertInDocument,
  hasAttribute: assertHasAttribute,
  notHasAttribute: assertNotHasAttribute,
  isDisabled: assertDisabled,
  isNotDisabled: assertNotDisabled,
  hasTextContent: assertHasTextContent,
  hasClass: assertHasClass,
};