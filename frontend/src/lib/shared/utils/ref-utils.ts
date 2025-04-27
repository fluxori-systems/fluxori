"use client";

import { Ref, MutableRefObject, RefCallback, useCallback, useRef } from "react";

/**
 * Type guard to check if a ref is a callback ref
 * @param ref The ref to check
 * @returns True if the ref is a callback ref
 */
export function isRefCallback<T>(ref: Ref<T>): ref is RefCallback<T> {
  return typeof ref === "function";
}

/**
 * Type guard to check if a ref is a mutable ref object
 * @param ref The ref to check
 * @returns True if the ref is a mutable ref object
 */
export function isMutableRefObject<T>(ref: Ref<T>): ref is MutableRefObject<T> {
  return ref !== null && typeof ref === "object" && "current" in ref;
}

/**
 * Creates a callback ref that updates multiple refs
 * @param refs Refs to combine
 * @returns A single callback ref that updates all provided refs
 */
export function useCombinedRefs<T>(...refs: Ref<T>[]): RefCallback<T> {
  return useCallback(
    (element: T) => {
      refs.forEach((ref) => {
        if (isRefCallback(ref)) {
          ref(element);
        } else if (isMutableRefObject(ref)) {
          ref.current = element;
        }
      });
    },
    [refs],
  );
}

/**
 * Create a forwarded ref that maintains local access to the ref value
 * This is useful for components that need to both forward a ref and use it internally
 *
 * @param forwardedRef The ref passed from the parent component
 * @returns A tuple with a local mutable ref and a combined ref callback
 */
export function createForwardedRef<T>(
  forwardedRef: Ref<T> | null,
): [MutableRefObject<T | null>, RefCallback<T>] {
  const localRef = useRef<T | null>(null);

  const combinedRef = useCallback(
    (element: T) => {
      localRef.current = element;

      if (forwardedRef) {
        if (isRefCallback(forwardedRef)) {
          forwardedRef(element);
        } else if (isMutableRefObject(forwardedRef)) {
          forwardedRef.current = element;
        }
      }
    },
    [forwardedRef],
  );

  return [localRef, combinedRef];
}

/**
 * Set multiple refs with the same value
 * @param value The value to set
 * @param refs The refs to update
 */
export function setRefs<T>(value: T, ...refs: Ref<T>[]): void {
  refs.forEach((ref) => {
    if (isRefCallback(ref)) {
      ref(value);
    } else if (isMutableRefObject(ref)) {
      ref.current = value;
    }
  });
}
