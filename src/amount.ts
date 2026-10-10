/** Parsing and formatting the amounts recipes use. */

/**
 * Single-character fractions, as they appear in recipes copied from the web.
 *
 * Not exported from the package entry point. Exported from this module for
 * `scripts/export-data.mjs`, which writes it to `data/units.json` as `unicodeFractions`.
 */
export const UNICODE_FRACTIONS: Readonly<Record<string, number>> = {
  '¼': 0.25, '½': 0.5, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

/**
 * The digits after a decimal comma: one or two, not followed by a third. `1,5` and `0,75` are
 * decimals; `1,000` is not, since it may be a thousands separator.
 *
 * Not exported from the package entry point. Exported from this module for `scale.ts`, whose
 * stricter amount grammar reads the same decimal comma.
 */
export const DECIMAL_COMMA_DIGITS = '\\d{1,2}(?!\\d)';

const LEADING_DECIMAL_COMMA = new RegExp(`^(\\s*[+-]?\\d+),(${DECIMAL_COMMA_DIGITS})`);

/** The number at the start of `text`, as `parseFloat` reads it once a decimal comma is a point. */
function readNumber(text: string): number {
  return parseFloat(text.replace(LEADING_DECIMAL_COMMA, '$1.$2'));
}

/**
 * Parse an amount as recipes write it.
 *
 * Handles plain numbers, decimal commas (`1,5`), unicode fractions (`½`), a whole number with a
 * unicode fraction (`1½`, `2 ¼`) and slash fractions (`1/4`, `1 1/2`). Text after the number is
 * ignored, so a range reads as its lower bound. Returns `NaN` for text amounts such as "a pinch" —
 * check with `Number.isNaN` rather than assuming a number came back.
 */
export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (value == null) return NaN;

  const trimmed = value.trim();

  // A fraction on its own: "½"
  if (Object.hasOwn(UNICODE_FRACTIONS, trimmed)) return UNICODE_FRACTIONS[trimmed]!;

  // A whole number and a fraction: "1½", "2 ¼"
  for (const [glyph, fraction] of Object.entries(UNICODE_FRACTIONS)) {
    if (trimmed.endsWith(glyph)) {
      const whole = trimmed.slice(0, -glyph.length).trim();
      const wholeNumber = whole.length > 0 ? readNumber(whole) : 0;
      if (!Number.isNaN(wholeNumber)) return wholeNumber + fraction;
    }
  }

  // A slash fraction, with or without a whole number: "1/4", "1 1/2"
  const slash = trimmed.match(/^(\d+)?\s*(\d+)\/(\d+)$/);
  if (slash) {
    const whole = slash[1] ? parseInt(slash[1], 10) : 0;
    const numerator = parseInt(slash[2]!, 10);
    const denominator = parseInt(slash[3]!, 10);
    if (denominator !== 0) return whole + numerator / denominator;
  }

  return readNumber(trimmed);
}

/**
 * Format an amount for display: whole numbers stay whole, everything else is fixed to `decimals`.
 *
 * Keeps "3" from rendering as "3.00".
 */
export function formatAmount(value: number, decimals = 2): string {
  return value % 1 === 0 ? value.toString() : value.toFixed(decimals);
}
