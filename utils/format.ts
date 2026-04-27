/**
 * Utility functions for formatting
 */

/**
 * Format number as Indonesian Rupiah (Rp)
 * @example formatRp(98000) => "Rp 98.000,00"
 */
export function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")},00`;
}

/**
 * Format price for display
 * Includes optional IDR suffix
 */
export function formatPrice(amount: number, withCurrency = false): string {
  const formatted = formatRp(amount);
  return withCurrency ? `${formatted} IDR` : formatted;
}
