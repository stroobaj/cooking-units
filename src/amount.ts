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
 * Parse an amount as recipes write it.
 *
 * Handles plain numbers, unicode fractions (`½`), a whole number with a unicode fraction (`1½`,
 * `2 ¼`) and slash fractions (`1/4`, `1 1/2`). Returns `NaN` for text amounts such as
 * "a pinch" — check with `Number.isNaN` rather than assuming a number came back.
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
      const wholeNumber = whole.length > 0 ? parseFloat(whole) : 0;
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

  return parseFloat(trimmed);
}

/**
 * Format an amount for display: whole numbers stay whole, everything else is fixed to `decimals`.
 *
 * Keeps "3" from rendering as "3.00".
 */
export function formatAmount(value: number, decimals = 2): string {
  return value % 1 === 0 ? value.toString() : value.toFixed(decimals);
}
