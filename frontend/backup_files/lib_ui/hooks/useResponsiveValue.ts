import { useMediaQuery } from './useMediaQuery';
import { breakpoints } from '../theme';

type BreakpointValues<T> = {
  base: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

/**
 * Hook to get a value based on the screen size
 * 
 * @param values Object with values for different breakpoints
 * @returns The value for the current screen size
 * 
 * @example
 * const fontSize = useResponsiveValue({ base: 14, md: 16, xl: 18 });
 */
export function useResponsiveValue<T>(values: BreakpointValues<T>): T {
  const isXs = useMediaQuery('xs');
  const isSm = useMediaQuery('sm');
  const isMd = useMediaQuery('md');
  const isLg = useMediaQuery('lg');
  const isXl = useMediaQuery('xl');

  if (isXs && values.xs !== undefined) {
    return values.xs;
  }

  if (isSm && values.sm !== undefined) {
    return values.sm;
  }

  if (isMd && values.md !== undefined) {
    return values.md;
  }

  if (isLg && values.lg !== undefined) {
    return values.lg;
  }

  if (isXl && values.xl !== undefined) {
    return values.xl;
  }

  return values.base;
}