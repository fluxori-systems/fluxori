/**
 * React Testing Utility
 * This file provides utilities for testing React components
 */

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock Theme Context
export const ThemeContext = React.createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// Mock Motion Context
export const MotionContext = React.createContext({
  motionMode: 'full',
  setMotionMode: (_mode: string) => {},
  animationService: {
    getMotionMode: () => 'full',
    shouldReduceMotion: () => false,
    getAnimationStrategy: () => ({
      enabled: true,
      durationMultiplier: 1,
      useSimpleEasings: false,
      reduceComplexity: false,
      maxActiveAnimations: Infinity,
      disableStaggering: false,
      scaleMultiplier: 1,
    }),
    animateComponent: () => () => {},
  },
  connectionQuality: {
    quality: 'high',
    isDataSaver: false,
    isMetered: false,
  },
});

// Provider wrapper for tests
export function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
      <MotionContext.Provider
        value={{
          motionMode: 'full',
          setMotionMode: () => {},
          animationService: {
            getMotionMode: () => 'full',
            shouldReduceMotion: () => false,
            getAnimationStrategy: () => ({
              enabled: true,
              durationMultiplier: 1,
              useSimpleEasings: false,
              reduceComplexity: false,
              maxActiveAnimations: Infinity,
              disableStaggering: false,
              scaleMultiplier: 1,
            }),
            animateComponent: () => () => {},
          },
          connectionQuality: {
            quality: 'high',
            isDataSaver: false,
            isMetered: false,
          },
        }}
      >
        {children}
      </MotionContext.Provider>
    </ThemeContext.Provider>
  );
}

// Custom render with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library/react
export * from '@testing-library/react';