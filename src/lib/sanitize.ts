/**
 * Text sanitization utilities.
 * Enforces:
 * - Strips ASCII control characters and zero-width characters
 * - Collapses repeated whitespace
 * - Trims edges
 * - Prevents raw HTML injection (react naturally escapes strings when rendered)
 */

// Zero-width spaces, joiners, BOM
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F]/g;
// ASCII control characters except \n and \t
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitizes single-line input (names, search, coupons, phones, reference codes).
 */
export function sanitizeSingleLine(input: string): string {
  if (!input) return '';
  return input
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes multi-line text (descriptions, notes, comments, chapter bodies).
 * Preserves paragraph breaks but limits excessive blank lines to max 2.
 */
export function sanitizeMultiLine(input: string): string {
  if (!input) return '';
  return input
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Validate Egyptian mobile number format: ^01[0125][0-9]{8}$
 */
export function isValidEgyptianPhone(phone: string): boolean {
  return /^01[0125][0-9]{8}$/.test(phone.trim());
}

/**
 * Validate transaction reference: ^[A-Za-z0-9-]{6,30}$
 */
export function isValidTransactionRef(ref: string): boolean {
  return /^[A-Za-z0-9-]{6,30}$/.test(ref.trim());
}
