import { describe, expect, it } from 'vitest';

import { formatAmount, parseAmount } from '../src/amount.js';

describe('parseAmount', () => {
  it.each([
    ['2', 2],
    ['0.5', 0.5],
    [' 250 ', 250],
    ['½', 0.5],
    ['1½', 1.5],
    ['2 ¼', 2.25],
    ['⅓', 1 / 3],
    ['1/4', 0.25],
    ['1 1/2', 1.5],
    ['3/4', 0.75],
  ])('parses %p as %p', (input, expected) => {
    expect(parseAmount(input)).toBeCloseTo(expected);
  });

  it('passes a number straight through', () => {
    expect(parseAmount(2.5)).toBe(2.5);
  });

  it('returns NaN for a text amount', () => {
    expect(parseAmount('a pinch')).toBeNaN();
  });

  it.each([null, undefined])('returns NaN for %p', (input) => {
    expect(parseAmount(input)).toBeNaN();
  });

  it('does not divide by zero', () => {
    expect(parseAmount('1/0')).toBe(1);
  });
});

describe('formatAmount', () => {
  it('keeps whole numbers whole', () => {
    expect(formatAmount(3)).toBe('3');
    expect(formatAmount(3, 2)).toBe('3');
  });

  it('fixes fractional values to the given decimals', () => {
    expect(formatAmount(1 / 3, 2)).toBe('0.33');
    expect(formatAmount(1.25, 1)).toBe('1.3');
  });

  it('defaults to two decimals', () => {
    expect(formatAmount(1 / 3)).toBe('0.33');
  });
});
