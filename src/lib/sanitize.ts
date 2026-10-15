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

const MAX_URL_LENGTH = 2000;

/**
 * Validates an image/file link typed by an admin.
 * - '' (or only spaces) -> '' (no link, that is allowed)
 * - a valid https:// URL without credentials -> the normalized URL
 * - anything else (http://, javascript:, data:, garbage, too long) -> null
 */
export function normalizeHttpsUrl(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  if (raw.length > MAX_URL_LENGTH) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Builds a safe CSS `url("...")` value from a validated https URL.
 * Characters that could end the url() token early (quotes, parentheses, backslash, spaces)
 * are percent-encoded. Returns undefined when the link is missing or invalid.
 */
export function toCssImageUrl(input: string | null | undefined): string | undefined {
  const safe = normalizeHttpsUrl(input);
  if (!safe) return undefined;
  const encoded = safe.replace(/["'\\()\s]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
  return `url("${encoded}")`;
}
