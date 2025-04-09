/**
 * Vitest Configuration
 * 
 * This configuration file sets up Vitest as the primary testing framework
 * with proper TypeScript support and respecting module boundaries.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/config/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/testing/**/*',
        'src/types/**/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../../src'),
      '@testing': resolve(__dirname, '../'),
    },
  },
});