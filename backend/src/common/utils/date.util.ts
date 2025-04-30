/**
 * Safely convert a Date | Timestamp | undefined to a JS Date.
 * - If it's a Firestore Timestamp, call toDate().
 * - If it's a Date, return as is.
 * - If undefined/null, return new Date().
 */
export function toJSDate(input: any): Date {
  if (!input) return new Date();
  if (typeof input.toDate === 'function') {
    return input.toDate();
  }
  if (input instanceof Date) {
    return input;
  }
  return new Date(input);
}
