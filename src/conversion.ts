/**
 * Converting and summing amounts.
 *
 * Units are grouped by what can legitimately be added together. Nothing here converts between
 * volume and weight: that needs the density of the specific ingredient, which is a different
 * problem and a different package.
 */
import { parseAmount } from './amount.js';
import { normalizeUnit } from './normalize.js';
import type { Quantity, SummedQuantity, UnitInfo } from './types.js';

/**
 * Units that can be summed, with each one's factor relative to its group's base unit.
 * Listed smallest to largest — {@link bestDisplayUnit} walks them backwards.
 *
 * Not exported from the package entry point: `lookupUnit` is the API. Exported from this module for
 * `scripts/export-data.mjs`, which writes it to `data/units.json` as `conversionGroups`.
 */
export const UNIT_GROUPS: ReadonlyArray<ReadonlyMap<string, number>> = [
  // Metric volume, base ml
  new Map([['ml', 1], ['cl', 10], ['dl', 100], ['l', 1000]]),
  // Metric weight, base g
  new Map([['mg', 0.001], ['g', 1], ['kg', 1000]]),
  // Imperial weight, base oz
  new Map([['oz', 1], ['lb', 16]]),
  // Imperial volume, base cup. `fl oz` is deliberately absent: it collides with `oz` by weight
  // in written recipes often enough that folding them together does more harm than good.
  new Map([['cup', 1], ['pint', 2], ['quart', 4]]),
  // Cooking spoons, base tsp
  new Map([['tsp', 1], ['tbsp', 3]]),
];

const UNIT_LOOKUP = new Map<string, UnitInfo>();
UNIT_GROUPS.forEach((group, index) => {
  for (const [unit, factor] of group) UNIT_LOOKUP.set(unit, { group: index, factor });
});

/**
 * Conversion info for a canonical unit, or `undefined` when it cannot be converted.
 *
 * Countable units — `piece`, `clove`, `pinch` — have no conversion info by design. Two units are
 * summable when both return info and their `group` matches.
 */
export function lookupUnit(unit: string | null | undefined): UnitInfo | undefined {
  return unit ? UNIT_LOOKUP.get(unit) : undefined;
}

/** True when both units exist in the same conversion group. */
export function areCompatible(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = lookupUnit(normalizeUnit(a));
  const right = lookupUnit(normalizeUnit(b));
  return left !== undefined && right !== undefined && left.group === right.group;
}

/**
 * Convert an amount between two compatible units, or `undefined` when they are not compatible.
 *
 * Both units are normalized first, so written forms work: `convertUnit(2, 'eetlepels', 'tsp')`.
 */
export function convertUnit(
  amount: string | number | null | undefined,
  from: string | null | undefined,
  to: string | null | undefined,
): number | undefined {
  const value = parseAmount(amount);
  if (Number.isNaN(value)) return undefined;

  const source = lookupUnit(normalizeUnit(from));
  const target = lookupUnit(normalizeUnit(to));
  if (!source || !target || source.group !== target.group) return undefined;

  return (value * source.factor) / target.factor;
}

/**
 * The largest unit in a group that leaves the amount at 1 or above, so 1500 g reads as 1.5 kg
 * and 250 g stays 250 g. An amount too small for every unit is given in the group's smallest one.
 *
 * `baseAmount` is expressed in the group's base unit. Most callers want {@link sumQuantities}
 * instead, which does this as its last step.
 */
export function bestDisplayUnit(baseAmount: number, groupIndex: number): { amount: number; unit: string } {
  const entries = [...(UNIT_GROUPS[groupIndex] ?? new Map<string, number>()).entries()];
  if (entries.length === 0) return { amount: baseAmount, unit: '' };

  for (let i = entries.length - 1; i >= 0; i--) {
    const [unit, factor] = entries[i]!;
    const converted = baseAmount / factor;
    if (converted >= 1) return { amount: converted, unit };
  }
  const [smallest, factor] = entries[0]!;
  return { amount: baseAmount / factor, unit: smallest };
}

/**
 * Add up quantities, merging everything that can legitimately be merged.
 *
 * Compatible units are summed and reported in the best display unit for the total, so
 * `500 g + 1 kg` becomes `1.5 kg`. Units that cannot convert — `piece`, `clove`, and anything
 * unrecognised — are summed only with their own kind. Quantities with no usable amount are
 * counted in `unmeasured` rather than dropped, so "salt to taste" still shows up.
 *
 * Groups come back in the order they first appear in the input. An input list with nothing
 * usable in it returns an empty array.
 *
 * ```ts
 * sumQuantities([
 *   { amount: '500', unit: 'g' },
 *   { amount: '1', unit: 'kg' },
 *   { amount: '2', unit: 'stuks' },
 *   { amount: null, unit: null },
 * ])
 * // [ { amount: 1.5, unit: 'kg', unmeasured: 0 },
 * //   { amount: 2, unit: 'piece', unmeasured: 0 },
 * //   { amount: 0, unit: null, unmeasured: 1 } ]
 * ```
 */
export function sumQuantities(quantities: readonly Quantity[]): SummedQuantity[] {
  interface Bucket {
    /** Group index when convertible, otherwise undefined. */
    group?: number;
    /** Running total, in the group's base unit when convertible. */
    total: number;
    unit: string | null;
    unmeasured: number;
  }

  const buckets = new Map<string, Bucket>();

  for (const quantity of quantities) {
    const unit = normalizeUnit(quantity.unit) ?? null;
    const info = lookupUnit(unit);
    const key = info ? `group:${info.group}` : `unit:${unit ?? ''}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { group: info?.group, total: 0, unit, unmeasured: 0 };
      buckets.set(key, bucket);
    }

    const value = parseAmount(quantity.amount);
    if (Number.isNaN(value)) {
      bucket.unmeasured++;
      continue;
    }
    bucket.total += info ? value * info.factor : value;
  }

  return [...buckets.values()].map(({ group, total, unit, unmeasured }) => {
    if (group === undefined) return { amount: total, unit, unmeasured };
    const display = bestDisplayUnit(total, group);
    return { amount: display.amount, unit: display.unit, unmeasured };
  });
}
