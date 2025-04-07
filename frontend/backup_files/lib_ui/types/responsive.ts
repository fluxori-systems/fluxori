/**
 * Types for responsive design
 */

/**
 * Breakpoint keys that can be used throughout the application
 */
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Responsive value that can be different at each breakpoint
 * 
 * @example
 * // Define different column counts for different screen sizes
 * const cols: ResponsiveValue<number> = {
 *   base: 1,
 *   md: 2,
 *   lg: 3,
 * };
 */
export type ResponsiveValue<T> = {
  base: T;
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

/**
 * Utility type to make all properties in a type responsive
 * 
 * @example
 * interface Spacing {
 *   padding: number;
 *   margin: number;
 * }
 * 
 * type ResponsiveSpacing = ResponsiveProps<Spacing>;
 * 
 * // Now you can do:
 * const spacing: ResponsiveSpacing = {
 *   padding: { base: 8, md: 16 },
 *   margin: { base: 4, md: 8 },
 * };
 */
export type ResponsiveProps<T> = {
  [K in keyof T]: ResponsiveValue<T[K]>;
};