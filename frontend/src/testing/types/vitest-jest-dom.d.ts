/**
 * Vitest integration with Jest-DOM
 * This file enables proper TypeScript support for Jest-DOM matchers in Vitest
 */

/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
/// <reference path="./jest-dom.d.ts" />

// Import the testing-library extensions
import '@testing-library/jest-dom';