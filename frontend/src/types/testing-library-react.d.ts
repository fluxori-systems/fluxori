/**
 * Type declarations for @testing-library/react
 * Provides types for testing library functions
 */

declare module '@testing-library/react' {
  import { ReactElement } from 'react';

  export interface RenderOptions {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
    container?: HTMLElement;
  }

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment | Array<HTMLElement | DocumentFragment>) => void;
    rerender: (ui: React.ReactElement) => void;
    unmount: () => boolean;
    asFragment: () => DocumentFragment;
  }

  export interface RenderHookResult<Result, Props> {
    result: {
      current: Result;
      error?: Error;
    };
    rerender: (props?: Props) => void;
    unmount: () => void;
  }

  export function render(
    ui: ReactElement,
    options?: RenderOptions
  ): RenderResult;

  export function renderHook<Result, Props = unknown>(
    callback: (props: Props) => Result,
    options?: RenderOptions
  ): RenderHookResult<Result, Props>;

  export function act(callback: () => void | Promise<void>): Promise<void> | void;
}