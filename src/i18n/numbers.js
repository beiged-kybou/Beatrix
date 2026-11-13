/**
 * File:        src/i18n/numbers.js
 * What it is:  Number helpers for English and Bangla.
 * What it does:
 *   formatNumber(4, 'bn') -> '৪'   (Bangla digits for Bangla text and speech)
 *   parseNumber('১২')     -> 12    (students may type with a Bangla keyboard)
 *   Pure functions, no browser needed.
 * Used by:     lessons/prompt-builder.js, audio/phrase-composer.js, lesson answer box
 * Depends on:  nothing.
 */

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Write a whole number with the digits of the given language. */
export function formatNumber(n, lang) {
  const s = String(n);
  if (lang !== 'bn') return s;
  return s.replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]);
}

/** Turn Bangla digits into ASCII digits; leaves everything else alone. */
export function toAsciiDigits(text) {
  return String(text).replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

/**
 * Read a whole number typed by a student.
 * @returns {number} the number, or NaN if the text is not a whole number
 */
export function parseNumber(text) {
  const clean = toAsciiDigits(text).trim();
  return /^\d+$/.test(clean) ? Number(clean) : NaN;
}
