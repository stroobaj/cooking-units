/** Scaling the amounts recipes use to another number of servings. */
import { DECIMAL_COMMA_DIGITS, parseAmount, UNICODE_FRACTIONS } from './amount.js';
import { lookupUnit } from './conversion.js';
import { normalizeUnit } from './normalize.js';

/**
 * How {@link scaleAmount} rounds a scaled amount, by the kind of unit it is in.
 *
 * - `decimalUnits` — the metric units, written as decimals rounded to a step that suits the size.
 * - `fractions.measured` — every other unit in a conversion group (spoons, cups, imperial units).
 * - `fractions.counted` — units in no group (`piece`, `clove`, `pinch`), unknown units and no unit.
 *
 * Each fraction kind lists the fractions an amount below 1 is rounded to, and the ones that may
 * follow a whole number. Every fraction is a key's value in {@link UNICODE_FRACTIONS}.
 *
 * Not exported from the package entry point. Exported from this module for
 * `scripts/export-data.mjs`, which writes it to `data/units.json` as `scaling`.
 */
export const SCALING = {
  decimalUnits: ['mg', 'g', 'kg', 'ml', 'cl', 'dl', 'l'],
  fractions: {
    measured: { belowOne: [1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4], afterWhole: [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4] },
    counted: { belowOne: [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4], afterWhole: [1 / 2] },
  },
} as const;

type Fractions = { readonly belowOne: readonly number[]; readonly afterWhole: readonly number[] };

const DECIMAL_UNITS: ReadonlySet<string> = new Set(SCALING.decimalUnits);

const GLYPH_OF = new Map(Object.entries(UNICODE_FRACTIONS).map(([glyph, value]) => [value, glyph]));

const GLYPHS = Object.keys(UNICODE_FRACTIONS).join('');

/**
 * One amount: a whole number with a unicode fraction, a unicode fraction, a slash fraction with or
 * without a whole number, or a decimal. A decimal comma takes one or two digits, so `1,5` is one and a
 * half while `1,000` is not an amount.
 */
const AMOUNT = `\\d+\\s*[${GLYPHS}]|[${GLYPHS}]|(?:\\d+\\s+)?\\d+/\\d+|\\d+(?:\\.\\d+|,${DECIMAL_COMMA_DIGITS})?|\\.\\d+`;

/** An amount or a range of two, then optionally words: "2", "2-3", "1½ – 2", "2 large". */
const SCALABLE = new RegExp(`^(${AMOUNT})(?:(\\s*[-–]\\s*)(${AMOUNT}))?(?:\\s+(\\p{L}[\\s\\S]*))?$`, 'u');

/**
 * Scale an amount as recipes write it by `factor`, and write it back the way a cook would read it.
 *
 * `factor` is usually the servings wanted over the servings the recipe is written for. The unit
 * decides how the result is rounded (see {@link SCALING}); written forms such as `el` or `kopjes`
 * work, and the unit itself never changes, so 1000 g stays grams.
 *
 * - Metric units are decimals: two places below 1, one below 10, whole below 100, and steps of 5
 *   from there. 500 g × ⅔ is `335`.
 * - Spoons, cups and imperial units round to ⅛ … ¾ below 1, and to ¼, ⅓, ½, ⅔ or ¾ after a whole
 *   number. 1 tsp × ⅓ is `⅓`.
 * - Counted units and amounts without a unit round to ¼ … ¾ below 1, and to halves above. 2 eggs × ⅔
 *   is `1½`.
 *
 * A scaled amount above 0 is never written as `0`. A range scales both ends ("2-3" × 2 is `4-6`), and
 * collapses to one amount when both ends round the same. Words after the amount stay ("2 large" × 2
 * is `4 large`). What this writes, `parseAmount` reads back (a range as its lower bound).
 *
 * The amount comes back exactly as given when there is nothing to scale: a text amount such as "a
 * pinch" or "about 2", a `factor` of 1, or a factor that is not a positive finite number. A caller
 * can tell that it was left alone by comparing the result with the input.
 *
 * ```ts
 * scaleAmount('200', 1.5, 'g')     // '300'
 * scaleAmount('1', 1 / 3, 'kopje') // '⅓'
 * scaleAmount('2-3', 2)            // '4-6'
 * scaleAmount('to taste', 2)       // 'to taste'
 * ```
 */
export function scaleAmount(
  amount: string | null | undefined,
  factor: number,
  unit?: string | null,
): string | undefined {
  if (amount == null) return undefined;
  if (factor === 1 || !(factor > 0) || factor === Infinity) return amount;

  const match = SCALABLE.exec(amount.trim());
  if (!match) return amount;
  const [, low, separator, high, words] = match;

  const lowValue = valueOf(low!);
  const highValue = high === undefined ? undefined : valueOf(high);
  if (Number.isNaN(lowValue) || (highValue !== undefined && Number.isNaN(highValue))) return amount;

  const write = writerFor(unit);
  let scaled = write(lowValue * factor);
  if (highValue !== undefined) {
    const top = write(highValue * factor);
    if (top !== scaled) scaled += separator + top;
  }
  return words === undefined ? scaled : `${scaled} ${words}`;
}

/** One amount's value; NaN for a slash fraction over 0. */
function valueOf(token: string): number {
  const slash = token.match(/\/(\d+)$/);
  if (slash && Number(slash[1]) === 0) return NaN;
  return parseAmount(token);
}

function writerFor(unit: string | null | undefined): (value: number) => string {
  const canonical = normalizeUnit(unit);
  if (canonical !== undefined && DECIMAL_UNITS.has(canonical)) return writeDecimal;
  const fractions = canonical !== undefined && lookupUnit(canonical) ? SCALING.fractions.measured : SCALING.fractions.counted;
  return (value) => writeFraction(value, fractions);
}

function writeDecimal(value: number): string {
  if (value === 0) return '0';
  const rounded =
    value >= 100 ? Math.round(value / 5) * 5
    : value >= 10 ? Math.round(value)
    : value >= 1 ? Math.round(value * 10) / 10
    : Math.round(value * 100) / 100;
  return String(rounded > 0 ? rounded : 0.01);
}

/** The nearest whole number and fraction; on a tie the larger. Below 1 never rounds under the smallest fraction. */
function writeFraction(value: number, fractions: Fractions): string {
  if (value === 0) return '0';
  let whole = Math.floor(value);
  const rest = value - whole;
  const candidates = whole === 0 ? [...fractions.belowOne, 1] : [0, ...fractions.afterWhole, 1];

  let nearest = candidates[0]!;
  for (const candidate of candidates) {
    if (Math.abs(rest - candidate) <= Math.abs(rest - nearest)) nearest = candidate;
  }

  if (nearest === 1) {
    whole += 1;
    nearest = 0;
  }
  return `${whole > 0 ? whole : ''}${nearest > 0 ? GLYPH_OF.get(nearest)! : ''}`;
}
