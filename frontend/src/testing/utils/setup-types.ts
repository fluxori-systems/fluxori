/**
 * Testing Type Setup
 *
 * This file ensures all TypeScript type definitions for testing are properly loaded.
 * It should be imported in vitest.setup.ts and can be imported in any test file.
 */

// Import type augmentations
import "../augmentations/testing-library";
import "../augmentations/vitest";
import "../augmentations/navigator";

// Import actual testing libraries for proper type registration
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/vitest";

// Create a helper function that can be called to ensure types are loaded
export function setupTestingTypes() {
  // This is a no-op function that just ensures the types get loaded
  // and gives us a clear place to add code if needed in the future
  return true;
}

// For types to be automatically loaded
setupTestingTypes();
