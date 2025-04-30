import '@testing-library/jest-dom';

// Extend Vitest's expect with jest-dom matchers
declare global {
  // Custom global test utility types can be added here
  // For example:
  type Nullable<T> = T | null | undefined;
}

export {};

