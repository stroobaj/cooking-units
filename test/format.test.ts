import { describe, expect, it } from 'vitest';

import { formatUnit, UNIT_DISPLAY } from '../src/format.js';
import { normalizeUnit } from '../src/normalize.js';

describe('formatUnit', () => {
  it('writes the singular for one and the plural above it', () => {
    expect(formatUnit('piece', 'nl', 1)).toBe('stuk');
    expect(formatUnit('piece', 'nl', 3)).toBe('stuks');
    expect(formatUnit('clove', 'en', '2')).toBe('cloves');
    expect(formatUnit('pinch', 'fr', 2)).toBe('pincées');
  });

  it('keeps abbreviations the same in both numbers', () => {
    expect(formatUnit('tbsp', 'nl', 2)).toBe('el');
    expect(formatUnit('tsp', 'fr', 3)).toBe('càc');
    expect(formatUnit('tbsp', 'en', 4)).toBe('tbsp');
  });

  it('follows French, where one and a half is still singular', () => {
    expect(formatUnit('clove', 'fr', '1½')).toBe('gousse');
    expect(formatUnit('clove', 'nl', '1½')).toBe('teentjes');
  });

  it('reads a fraction below one as singular', () => {
    expect(formatUnit('cup', 'en', '½')).toBe('cup');
  });

  it('uses the upper bound of a range', () => {
    expect(formatUnit('cup', 'en', '1-2')).toBe('cups');
    expect(formatUnit('clove', 'nl', '1 – 2')).toBe('teentjes');
  });

  it('reads an amount that is not a number, or no amount, as singular', () => {
    expect(formatUnit('pinch', 'nl', 'a few')).toBe('snufje');
    expect(formatUnit('pinch', 'nl')).toBe('snufje');
  });

  it('writes nothing where the language leaves the unit out', () => {
    expect(formatUnit('piece', 'fr', 3)).toBeUndefined();
    expect(formatUnit('pièces', 'fr', 3)).toBeUndefined();
  });

  it('normalizes the input first, so any written form works', () => {
    expect(formatUnit('eetlepels', 'en', 2)).toBe('tbsp');
    expect(formatUnit('Stück', 'nl', 2)).toBe('stuks');
  });

  it('leaves metric symbols alone', () => {
    expect(formatUnit('g', 'nl', 200)).toBe('g');
    expect(formatUnit('ml', 'fr', 2)).toBe('ml');
  });

  it('falls back to the language vocabulary where there is no display table', () => {
    expect(formatUnit('clove', 'de', 2)).toBe('zehe');
  });

  it('keeps an unrecognised unit as written', () => {
    expect(formatUnit('schmoo', 'nl', 2)).toBe('schmoo');
  });

  it.each([null, undefined, ''])('returns undefined for %p', (input) => {
    expect(formatUnit(input, 'nl', 2)).toBeUndefined();
  });

  // Display forms end up in text people edit and paste back, so each must be read back as its unit.
  it('only writes forms that normalize back to the same unit', () => {
    const notRecognised = new Set(['dozen']); // Dutch plural of doos, and the English word for twelve.
    for (const [language, table] of Object.entries(UNIT_DISPLAY)) {
      for (const [canonical, forms] of Object.entries(table ?? {})) {
        if (!forms) continue;
        for (const form of [forms.one, forms.other]) {
          if (notRecognised.has(form)) continue;
          expect(normalizeUnit(form), `"${form}" (${language})`).toBe(canonical);
        }
      }
    }
  });
});
