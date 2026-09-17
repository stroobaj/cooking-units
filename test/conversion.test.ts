import { describe, expect, it } from 'vitest';

import { areCompatible, bestDisplayUnit, convertUnit, lookupUnit, sumQuantities } from '../src/conversion';

describe('lookupUnit', () => {
  it('puts summable units in the same group', () => {
    expect(lookupUnit('g')!.group).toBe(lookupUnit('kg')!.group);
    expect(lookupUnit('tsp')!.group).toBe(lookupUnit('tbsp')!.group);
    expect(lookupUnit('g')!.group).not.toBe(lookupUnit('ml')!.group);
  });

  it('returns factors relative to the base unit', () => {
    expect(lookupUnit('kg')!.factor).toBe(1000);
    expect(lookupUnit('tbsp')!.factor).toBe(3);
  });

  it('returns undefined for countable, unknown or empty units', () => {
    expect(lookupUnit('piece')).toBeUndefined();
    expect(lookupUnit(null)).toBeUndefined();
    expect(lookupUnit('')).toBeUndefined();
  });
});

describe('areCompatible', () => {
  it('normalizes before comparing, so written forms work', () => {
    expect(areCompatible('eetlepels', 'tsp')).toBe(true);
    expect(areCompatible('g', 'kg')).toBe(true);
  });

  it('refuses to mix weight with volume', () => {
    expect(areCompatible('g', 'ml')).toBe(false);
  });

  it('is false when either unit is countable or missing', () => {
    expect(areCompatible('piece', 'piece')).toBe(false);
    expect(areCompatible('g', null)).toBe(false);
  });
});

describe('convertUnit', () => {
  it('converts within a group', () => {
    expect(convertUnit(1500, 'g', 'kg')).toBe(1.5);
    expect(convertUnit(1, 'tbsp', 'tsp')).toBe(3);
    expect(convertUnit('1½', 'l', 'ml')).toBe(1500);
  });

  it('accepts written forms on both sides', () => {
    expect(convertUnit(2, 'eetlepels', 'tsp')).toBe(6);
  });

  it('returns undefined across incompatible groups', () => {
    expect(convertUnit(1, 'g', 'ml')).toBeUndefined();
    expect(convertUnit(1, 'piece', 'g')).toBeUndefined();
  });

  it('returns undefined for an unparseable amount', () => {
    expect(convertUnit('a pinch', 'g', 'kg')).toBeUndefined();
  });
});

describe('bestDisplayUnit', () => {
  it('picks the largest unit that leaves the amount at or above 1', () => {
    expect(bestDisplayUnit(1500, lookupUnit('g')!.group)).toEqual({ amount: 1.5, unit: 'kg' });
    expect(bestDisplayUnit(250, lookupUnit('g')!.group)).toEqual({ amount: 250, unit: 'g' });
  });

  it('falls back to the base unit for tiny amounts', () => {
    expect(bestDisplayUnit(0.5, lookupUnit('ml')!.group)).toEqual({ amount: 0.5, unit: 'ml' });
  });
});

describe('sumQuantities', () => {
  it('sums compatible units and reports the best display unit', () => {
    expect(sumQuantities([
      { amount: '500', unit: 'g' },
      { amount: '1', unit: 'kg' },
    ])).toEqual([{ amount: 1.5, unit: 'kg', unmeasured: 0 }]);
  });

  it('merges across languages', () => {
    expect(sumQuantities([
      { amount: '1', unit: 'eetlepel' },
      { amount: '1', unit: 'cucharada' },
      { amount: '3', unit: 'tsp' },
    ])).toEqual([{ amount: 3, unit: 'tbsp', unmeasured: 0 }]);
  });

  it('keeps incompatible units apart, in first-seen order', () => {
    expect(sumQuantities([
      { amount: '2', unit: 'stuks' },
      { amount: '100', unit: 'g' },
      { amount: '1', unit: 'piece' },
    ])).toEqual([
      { amount: 3, unit: 'piece', unmeasured: 0 },
      { amount: 100, unit: 'g', unmeasured: 0 },
    ]);
  });

  it('counts unmeasured uses instead of dropping them', () => {
    expect(sumQuantities([
      { amount: '5', unit: 'g' },
      { amount: 'to taste', unit: 'g' },
    ])).toEqual([{ amount: 5, unit: 'g', unmeasured: 1 }]);
  });

  it('groups unitless quantities together under a null unit', () => {
    expect(sumQuantities([
      { amount: '2', unit: null },
      { amount: null, unit: null },
    ])).toEqual([{ amount: 2, unit: null, unmeasured: 1 }]);
  });

  it('returns an empty array for no input', () => {
    expect(sumQuantities([])).toEqual([]);
  });

  it('does not mix weight into volume', () => {
    const result = sumQuantities([
      { amount: '100', unit: 'g' },
      { amount: '100', unit: 'ml' },
    ]);
    expect(result).toHaveLength(2);
  });
});
