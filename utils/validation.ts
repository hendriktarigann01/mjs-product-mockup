/**
 * Form validation utilities
 */

import type { WilayahValue } from "@/types/checkout";

/**
 * Validate if address is complete (required for shipping)
 */
export function isAddressComplete(
  wilayah: WilayahValue,
  address: string,
): boolean {
  return !!(
    wilayah.provinsiId &&
    wilayah.kabupatenId &&
    wilayah.kecamatanId &&
    address
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  return phone.length >= 10 && phone.length <= 15;
}

/**
 * Validate required field
 */
export function isFieldRequired(value: string): boolean {
  return value.trim().length > 0;
}
