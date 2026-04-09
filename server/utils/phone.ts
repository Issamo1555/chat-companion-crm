/**
 * Normalizes a phone number by removing all non-digit characters.
 * Example: +33 6 12 34 56 78 -> 33612345678
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
}
