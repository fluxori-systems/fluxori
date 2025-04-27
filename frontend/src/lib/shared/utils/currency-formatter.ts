/**
 * Format a number into a currency string (ZAR by default)
 * Uses Intl.NumberFormat under the hood and falls back gracefully.
 *
 * @param amount Numeric value to format
 * @param currency Currency code (default "ZAR")
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "ZAR",
): string {
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
