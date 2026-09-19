import { describe, expect, it } from 'vitest';

import { LANGUAGES, LANGUAGE_ALIASES, UNIT_ALIASES } from '../src/aliases.js';
import originalAliases from './original-aliases.json' with { type: 'json' };

/**
 * The flat alias map was hand-written before the tables were split per language. This pins every
 * entry of that map, so extending a language table can add written forms but never quietly change
 * how an existing one normalizes.
 */
describe('alias tables', () => {
  it('keep every entry of the original flat map', () => {
    expect(UNIT_ALIASES).toMatchObject(originalAliases);
  });

  it('never map one written form to two canonical units', () => {
    const seen = new Map<string, string>();
    for (const [language, table] of Object.entries(LANGUAGE_ALIASES)) {
      for (const [canonical, forms] of Object.entries(table)) {
        for (const form of forms) {
          const previous = seen.get(form);
          expect(previous ?? canonical, `"${form}" (${language}) collides`).toBe(canonical);
          seen.set(form, canonical);
        }
      }
    }
  });

  it('never list a canonical unit as its own alias', () => {
    for (const [canonical, written] of Object.entries(UNIT_ALIASES)) {
      expect(canonical, `"${canonical}" maps to itself`).not.toBe(written);
    }
  });

  it('keeps every written form lowercase and trimmed, so lookups hit', () => {
    for (const form of Object.keys(UNIT_ALIASES)) {
      expect(form).toBe(form.toLowerCase().trim());
    }
  });

  it('exposes one table per language', () => {
    expect(LANGUAGES).toEqual(['en', 'nl', 'fr', 'de', 'es']);
  });
});
