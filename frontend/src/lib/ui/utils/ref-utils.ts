'use client';

// Import shared ref utilities
export { 
  useCombinedRefs,
  createForwardedRef,
  setRefs,
  isRefCallback,
  isMutableRefObject
} from '../../shared/utils/ref-utils';

import { Ref, RefCallback, MutableRefObject } from 'react';

/**
 * Creates a type-safe ref merger function (alias for backward compatibility)
 * 
 * @param refs Array of refs to merge
 * @returns A callback ref that updates all provided refs
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (instance: T | null) => {
    refs.forEach(ref => {
      if (!ref) return;
      
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref && 'current' in ref) {
        (ref as MutableRefObject<T | null>).current = instance;
      }
    });
  };
}

/**
 * Creates a type-safe mutable ref from any ref type
 * 
 * @param ref The ref to convert
 * @returns A mutable ref object
 */
export function asMutableRef<T>(ref: Ref<T>): MutableRefObject<T | null> {
  if (typeof ref === 'function') {
    // Create a new mutable ref if we have a callback ref
    const mutableRef: MutableRefObject<T | null> = { current: null };
    // We'll update it when the callback is called
    const originalCallback = ref;
    ref = (instance: T | null) => {
      mutableRef.current = instance;
      originalCallback(instance);
    };
    return mutableRef;
  } else if (ref && 'current' in ref) {
    return ref as MutableRefObject<T | null>;
  }
  
  // Create a new mutable ref if none was provided
  return { current: null };
}