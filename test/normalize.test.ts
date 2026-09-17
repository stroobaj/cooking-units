import { describe, expect, it } from 'vitest';

import { aliasesOf, localizeUnit, normalizeUnit } from '../src/normalize';

describe('normalizeUnit', () => {
  it.each([
    ['eetlepels', 'tbsp'],
    ['EL', 'tbsp'],
    ['  Theelepel  ', 'tsp'],
    ['càs', 'tbsp'],
    ['cucharadita', 'tsp'],
    ['Stück', 'piece'],
    ['teentjes', 'clove'],
    ['tablespoons', 'tbsp'],
  ])('maps %p to %p', (input, expected) => {
    expect(normalizeUnit(input)).toBe(expected);
  });

  it('lowercases and trims a unit it has no alias for', () => {
    expect(normalizeUnit('  KG ')).toBe('kg');
  });

  it('keeps an unrecognised unit rather than dropping it', () => {
    expect(normalizeUnit('schmoo')).toBe('schmoo');
  });

  it.each([null, undefined, '', '   '])('returns undefined for %p', (input) => {
    expect(normalizeUnit(input)).toBeUndefined();
  });
});

describe('localizeUnit', () => {
  it('writes a canonical unit the way the language does', () => {
    expect(localizeUnit('tbsp', 'nl')).toBe('el');
    expect(localizeUnit('tsp', 'nl')).toBe('tl');
    expect(localizeUnit('tbsp', 'fr')).toBe('càs');
    expect(localizeUnit('clove', 'de')).toBe('zehe');
    expect(localizeUnit('pinch', 'es')).toBe('pizca');
  });

  it('round-trips a written form from one language into another', () => {
    expect(localizeUnit('eetlepels', 'fr')).toBe('càs');
    expect(localizeUnit('cucharadita', 'nl')).toBe('tl');
  });

  it('returns the canonical form for English', () => {
    expect(localizeUnit('tablespoons', 'en')).toBe('tbsp');
  });

  it('leaves metric symbols alone — they are written the same everywhere', () => {
    expect(localizeUnit('g', 'nl')).toBe('g');
    expect(localizeUnit('ml', 'de')).toBe('ml');
  });

  it('passes through a unit the language has no word for', () => {
    expect(localizeUnit('knob', 'es')).toBe('knob');
  });

  it('returns undefined for empty input', () => {
    expect(localizeUnit(null, 'nl')).toBeUndefined();
  });
});

describe('aliasesOf', () => {
  it('collects every written form across languages', () => {
    const forms = aliasesOf('tbsp');
    expect(forms).toEqual(expect.arrayContaining(['el', 'eetlepel', 'càs', 'cucharada', 'tablespoons']));
  });

  it('returns an empty list for a unit with no aliases', () => {
    expect(aliasesOf('kg')).toEqual([]);
  });
});
