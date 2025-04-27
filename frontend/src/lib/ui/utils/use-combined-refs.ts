"use client";

import { useCallback, MutableRefObject, Ref } from "react";

/**
 * Combines multiple refs into one.
 * Useful for components that need to forward refs while also using refs internally.
 *
 * @param refs Refs to combine
 * @returns A callback ref that updates all provided refs
 */
export function useCombinedRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): Ref<T> {
  return useCallback(
    (element: T) => {
      // Update all the refs with the element
      refs.forEach((ref) => {
        if (!ref) return;

        // Handle callback-style refs
        if (typeof ref === "function") {
          ref(element);
          return;
        }

        // Handle object-style refs
        if ("current" in ref) {
          (ref as MutableRefObject<T>).current = element;
        }
      });
    },
    [refs],
  );
}
