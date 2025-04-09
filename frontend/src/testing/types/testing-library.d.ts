// Type declarations for Testing Library

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveStyle(style: Record<string, any>): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
    }
  }

  namespace Vi {
    interface Assertion<T = any> {
      toBeInTheDocument(): T;
      toHaveAttribute(attr: string, value?: string): T;
      toBeVisible(): T;
      toHaveTextContent(text: string | RegExp): T;
      toHaveStyle(style: Record<string, any>): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
    }
  }
}

declare module '@testing-library/react' {
  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment | Array<HTMLElement | DocumentFragment>, maxLength?: number) => void;
    rerender: (ui: React.ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
    findByText: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByText: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByText: (id: string, options?: any) => HTMLElement;
    getAllByText: (id: string, options?: any) => HTMLElement[];
    queryByText: (id: string, options?: any) => HTMLElement | null;
    queryAllByText: (id: string, options?: any) => HTMLElement[];
    findByRole: (role: string, options?: any) => Promise<HTMLElement>;
    findAllByRole: (role: string, options?: any) => Promise<HTMLElement[]>;
    getByRole: (role: string, options?: any) => HTMLElement;
    getAllByRole: (role: string, options?: any) => HTMLElement[];
    queryByRole: (role: string, options?: any) => HTMLElement | null;
    queryAllByRole: (role: string, options?: any) => HTMLElement[];
    findByLabelText: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByLabelText: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByLabelText: (id: string, options?: any) => HTMLElement;
    getAllByLabelText: (id: string, options?: any) => HTMLElement[];
    queryByLabelText: (id: string, options?: any) => HTMLElement | null;
    queryAllByLabelText: (id: string, options?: any) => HTMLElement[];
    findByPlaceholderText: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByPlaceholderText: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByPlaceholderText: (id: string, options?: any) => HTMLElement;
    getAllByPlaceholderText: (id: string, options?: any) => HTMLElement[];
    queryByPlaceholderText: (id: string, options?: any) => HTMLElement | null;
    queryAllByPlaceholderText: (id: string, options?: any) => HTMLElement[];
    findByDisplayValue: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByDisplayValue: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByDisplayValue: (id: string, options?: any) => HTMLElement;
    getAllByDisplayValue: (id: string, options?: any) => HTMLElement[];
    queryByDisplayValue: (id: string, options?: any) => HTMLElement | null;
    queryAllByDisplayValue: (id: string, options?: any) => HTMLElement[];
    findByAltText: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByAltText: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByAltText: (id: string, options?: any) => HTMLElement;
    getAllByAltText: (id: string, options?: any) => HTMLElement[];
    queryByAltText: (id: string, options?: any) => HTMLElement | null;
    queryAllByAltText: (id: string, options?: any) => HTMLElement[];
    findByTitle: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByTitle: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByTitle: (id: string, options?: any) => HTMLElement;
    getAllByTitle: (id: string, options?: any) => HTMLElement[];
    queryByTitle: (id: string, options?: any) => HTMLElement | null;
    queryAllByTitle: (id: string, options?: any) => HTMLElement[];
    findByTestId: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByTestId: (id: string, options?: any) => Promise<HTMLElement[]>;
    getByTestId: (id: string, options?: any) => HTMLElement;
    getAllByTestId: (id: string, options?: any) => HTMLElement[];
    queryByTestId: (id: string, options?: any) => HTMLElement | null;
    queryAllByTestId: (id: string, options?: any) => HTMLElement[];
  }

  // Add screen, fireEvent, and waitFor exports
  export const screen: {
    getByText: (text: string, options?: any) => HTMLElement;
    queryByText: (text: string, options?: any) => HTMLElement | null;
    getAllByText: (text: string, options?: any) => HTMLElement[];
    queryAllByText: (text: string, options?: any) => HTMLElement[];
    getByRole: (role: string, options?: any) => HTMLElement;
    queryByRole: (role: string, options?: any) => HTMLElement | null;
    getAllByRole: (role: string, options?: any) => HTMLElement[];
    queryAllByRole: (role: string, options?: any) => HTMLElement[];
    getByLabelText: (text: string, options?: any) => HTMLElement;
    queryByLabelText: (text: string, options?: any) => HTMLElement | null;
    getAllByLabelText: (text: string, options?: any) => HTMLElement[];
    queryAllByLabelText: (text: string, options?: any) => HTMLElement[];
    getByPlaceholderText: (text: string, options?: any) => HTMLElement;
    queryByPlaceholderText: (text: string, options?: any) => HTMLElement | null;
    getAllByPlaceholderText: (text: string, options?: any) => HTMLElement[];
    queryAllByPlaceholderText: (text: string, options?: any) => HTMLElement[];
    getByDisplayValue: (value: string, options?: any) => HTMLElement;
    queryByDisplayValue: (value: string, options?: any) => HTMLElement | null;
    getAllByDisplayValue: (value: string, options?: any) => HTMLElement[];
    queryAllByDisplayValue: (value: string, options?: any) => HTMLElement[];
    getByAltText: (text: string, options?: any) => HTMLElement;
    queryByAltText: (text: string, options?: any) => HTMLElement | null;
    getAllByAltText: (text: string, options?: any) => HTMLElement[];
    queryAllByAltText: (text: string, options?: any) => HTMLElement[];
    getByTitle: (text: string, options?: any) => HTMLElement;
    queryByTitle: (text: string, options?: any) => HTMLElement | null;
    getAllByTitle: (text: string, options?: any) => HTMLElement[];
    queryAllByTitle: (text: string, options?: any) => HTMLElement[];
    getByTestId: (id: string, options?: any) => HTMLElement;
    queryByTestId: (id: string, options?: any) => HTMLElement | null;
    getAllByTestId: (id: string, options?: any) => HTMLElement[];
    queryAllByTestId: (id: string, options?: any) => HTMLElement[];
    findByText: (text: string, options?: any) => Promise<HTMLElement>;
    findAllByText: (text: string, options?: any) => Promise<HTMLElement[]>;
    findByRole: (role: string, options?: any) => Promise<HTMLElement>;
    findAllByRole: (role: string, options?: any) => Promise<HTMLElement[]>;
    findByLabelText: (text: string, options?: any) => Promise<HTMLElement>;
    findAllByLabelText: (text: string, options?: any) => Promise<HTMLElement[]>;
    findByPlaceholderText: (text: string, options?: any) => Promise<HTMLElement>;
    findAllByPlaceholderText: (text: string, options?: any) => Promise<HTMLElement[]>;
    findByDisplayValue: (value: string, options?: any) => Promise<HTMLElement>;
    findAllByDisplayValue: (value: string, options?: any) => Promise<HTMLElement[]>;
    findByAltText: (text: string, options?: any) => Promise<HTMLElement>;
    findAllByAltText: (text: string, options?: any) => Promise<HTMLElement[]>;
    findByTitle: (text: string, options?: any) => Promise<HTMLElement>;
    findAllByTitle: (text: string, options?: any) => Promise<HTMLElement[]>;
    findByTestId: (id: string, options?: any) => Promise<HTMLElement>;
    findAllByTestId: (id: string, options?: any) => Promise<HTMLElement[]>;
    debug: (baseElement?: Element | HTMLDocument) => void;
  };

  export const fireEvent: {
    (element: Document | Element | Window, event: Event): boolean;
    copy: (element: Element, options?: {}) => boolean;
    cut: (element: Element, options?: {}) => boolean;
    paste: (element: Element, options?: {}) => boolean;
    compositionEnd: (element: Element, options?: {}) => boolean;
    compositionStart: (element: Element, options?: {}) => boolean;
    compositionUpdate: (element: Element, options?: {}) => boolean;
    keyDown: (element: Element, options?: {}) => boolean;
    keyPress: (element: Element, options?: {}) => boolean;
    keyUp: (element: Element, options?: {}) => boolean;
    focus: (element: Element, options?: {}) => boolean;
    blur: (element: Element, options?: {}) => boolean;
    change: (element: Element, options?: {}) => boolean;
    input: (element: Element, options?: {}) => boolean;
    invalid: (element: Element, options?: {}) => boolean;
    submit: (element: Element, options?: {}) => boolean;
    click: (element: Element, options?: {}) => boolean;
    contextMenu: (element: Element, options?: {}) => boolean;
    dblClick: (element: Element, options?: {}) => boolean;
    drag: (element: Element, options?: {}) => boolean;
    dragEnd: (element: Element, options?: {}) => boolean;
    dragEnter: (element: Element, options?: {}) => boolean;
    dragExit: (element: Element, options?: {}) => boolean;
    dragLeave: (element: Element, options?: {}) => boolean;
    dragOver: (element: Element, options?: {}) => boolean;
    dragStart: (element: Element, options?: {}) => boolean;
    drop: (element: Element, options?: {}) => boolean;
    mouseDown: (element: Element, options?: {}) => boolean;
    mouseEnter: (element: Element, options?: {}) => boolean;
    mouseLeave: (element: Element, options?: {}) => boolean;
    mouseMove: (element: Element, options?: {}) => boolean;
    mouseOut: (element: Element, options?: {}) => boolean;
    mouseOver: (element: Element, options?: {}) => boolean;
    mouseUp: (element: Element, options?: {}) => boolean;
    scroll: (element: Element, options?: {}) => boolean;
    wheel: (element: Element, options?: {}) => boolean;
    abort: (element: Element, options?: {}) => boolean;
    canPlay: (element: Element, options?: {}) => boolean;
    canPlayThrough: (element: Element, options?: {}) => boolean;
    durationChange: (element: Element, options?: {}) => boolean;
    emptied: (element: Element, options?: {}) => boolean;
    encrypted: (element: Element, options?: {}) => boolean;
    ended: (element: Element, options?: {}) => boolean;
    loadedData: (element: Element, options?: {}) => boolean;
    loadedMetadata: (element: Element, options?: {}) => boolean;
    loadStart: (element: Element, options?: {}) => boolean;
    pause: (element: Element, options?: {}) => boolean;
    play: (element: Element, options?: {}) => boolean;
    playing: (element: Element, options?: {}) => boolean;
    progress: (element: Element, options?: {}) => boolean;
    rateChange: (element: Element, options?: {}) => boolean;
    seeked: (element: Element, options?: {}) => boolean;
    seeking: (element: Element, options?: {}) => boolean;
    stalled: (element: Element, options?: {}) => boolean;
    suspend: (element: Element, options?: {}) => boolean;
    timeUpdate: (element: Element, options?: {}) => boolean;
    volumeChange: (element: Element, options?: {}) => boolean;
    waiting: (element: Element, options?: {}) => boolean;
    load: (element: Element, options?: {}) => boolean;
    error: (element: Element, options?: {}) => boolean;
    animationStart: (element: Element, options?: {}) => boolean;
    animationEnd: (element: Element, options?: {}) => boolean;
    animationIteration: (element: Element, options?: {}) => boolean;
    transitionEnd: (element: Element, options?: {}) => boolean;
    doubleClick: (element: Element, options?: {}) => boolean;
    pointerOver: (element: Element, options?: {}) => boolean;
    pointerEnter: (element: Element, options?: {}) => boolean;
    pointerDown: (element: Element, options?: {}) => boolean;
    pointerMove: (element: Element, options?: {}) => boolean;
    pointerUp: (element: Element, options?: {}) => boolean;
    pointerCancel: (element: Element, options?: {}) => boolean;
    pointerOut: (element: Element, options?: {}) => boolean;
    pointerLeave: (element: Element, options?: {}) => boolean;
    gotPointerCapture: (element: Element, options?: {}) => boolean;
    lostPointerCapture: (element: Element, options?: {}) => boolean;
    select: (element: Element, options?: {}) => boolean;
    touchStart: (element: Element, options?: {}) => boolean;
    touchMove: (element: Element, options?: {}) => boolean;
    touchEnd: (element: Element, options?: {}) => boolean;
    touchCancel: (element: Element, options?: {}) => boolean;
  };

  export const waitFor: <T>(callback: () => T | Promise<T>, options?: {
    container?: HTMLElement;
    timeout?: number;
    interval?: number;
    onTimeout?: (error: Error) => Error;
    mutationObserverOptions?: MutationObserverInit;
  }) => Promise<T>;

  export const waitForElementToBeRemoved: <T>(callback: () => T | Promise<T>, options?: {
    container?: HTMLElement;
    timeout?: number;
    interval?: number;
    onTimeout?: (error: Error) => Error;
    mutationObserverOptions?: MutationObserverInit;
  }) => Promise<void>;

  export function within(element: HTMLElement): typeof screen;
}
