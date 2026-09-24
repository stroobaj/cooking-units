import { describe, expect, it } from 'vitest';

import pkg from '../package.json' with { type: 'json' };
import { buildTestVectors, buildUnitData, toJson, UNITS_SCHEMA } from '../scripts/export-data.mjs';
import type { UnitData } from '../scripts/export-data.mjs';
import { LANGUAGE_ALIASES, LANGUAGES, UNIT_ALIASES } from '../src/aliases.js';
import { parseAmount, UNICODE_FRACTIONS } from '../src/amount.js';
import { bestDisplayUnit, lookupUnit, UNIT_GROUPS } from '../src/conversion.js';
import { formatUnit, UNIT_DISPLAY } from '../src/format.js';
import { aliasesOf, localizeUnit } from '../src/normalize.js';
import type { Language } from '../src/types.js';
import vectors from './vectors.json' with { type: 'json' };

/**
 * data/units.json is generated at build time. These tests build it from src the same way, read it
 * back as JSON text, and rebuild every lookup the functions do from that text alone — the way a
 * port would. If any of it disagrees with src, the export has lost something.
 */
const tables = { LANGUAGES, LANGUAGE_ALIASES, UNIT_GROUPS, UNIT_DISPLAY, UNICODE_FRACTIONS };
const data = JSON.parse(toJson(buildUnitData(pkg.version, tables))) as UnitData;
const languages = data.languages;
const units = Object.keys(data.units);

/** The flat alias map, rebuilt from the per-language tables: the first language to claim a form wins. */
function aliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const language of languages) {
    for (const [unit, forms] of Object.entries(data.aliases[language]!)) {
      for (const form of forms) if (!map.has(form)) map.set(form, unit);
    }
  }
  return map;
}

describe('data/units.json', () => {
  it('carries the schema and the package version', () => {
    expect(data.schema).toBe(UNITS_SCHEMA);
    expect(data.version).toBe(pkg.version);
    expect(Object.keys(data)).toEqual([
      'schema', 'version', 'languages', 'units', 'conversionGroups', 'aliases', 'display', 'unicodeFractions',
    ]);
  });

  it('survives JSON unchanged', () => {
    expect(data).toStrictEqual(JSON.parse(JSON.stringify(buildUnitData(pkg.version, tables))));
  });

  it('rebuilds the alias map, in the same order', () => {
    expect([...aliasMap()]).toEqual(Object.entries(UNIT_ALIASES));
  });

  it('lists every canonical unit, with what lookupUnit returns for it', () => {
    const mentioned = [
      ...UNIT_GROUPS.flatMap((group) => [...group.keys()]),
      ...Object.values(LANGUAGE_ALIASES).flatMap(Object.keys),
      ...Object.values(UNIT_DISPLAY).flatMap(Object.keys),
    ];
    expect(new Set(units)).toEqual(new Set(mentioned));
    for (const unit of units) expect(data.units[unit], unit).toEqual(lookupUnit(unit) ?? null);
  });

  it('keeps the conversion groups in order, smallest unit first', () => {
    data.conversionGroups.forEach((group, index) => {
      for (const { unit, factor } of group) expect(lookupUnit(unit)).toEqual({ group: index, factor });
      const factors = group.map(({ factor }) => factor);
      expect(factors).toEqual([...factors].sort((a, b) => a - b));
    });
    expect(data.conversionGroups).toHaveLength(UNIT_GROUPS.length);
  });

  it('picks the same display unit as bestDisplayUnit', () => {
    const amounts = [0, 0.0005, 0.5, 1, 3, 16, 150, 999, 1000, 2500, 1e6];
    data.conversionGroups.forEach((group, index) => {
      for (const amount of amounts) {
        const fit = [...group].reverse().find(({ factor }) => amount / factor >= 1) ?? group[0]!;
        expect(bestDisplayUnit(amount, index)).toEqual({ amount: amount / fit.factor, unit: fit.unit });
      }
    });
  });

  it('localizes every unit in every language the way localizeUnit does', () => {
    for (const language of languages) {
      for (const unit of units) {
        const localized = language === 'en' ? unit : (data.aliases[language]![unit]?.[0] ?? unit);
        expect(localized, `${unit} (${language})`).toBe(localizeUnit(unit, language));
      }
    }
  });

  it('gives the aliases aliasesOf gives, in the same order', () => {
    const map = [...aliasMap()];
    for (const unit of units) {
      expect(map.filter(([, canonical]) => canonical === unit).map(([form]) => form)).toEqual(aliasesOf(unit));
    }
  });

  it('formats every unit in every language the way formatUnit does', () => {
    for (const language of languages as Language[]) {
      for (const unit of units) {
        for (const amount of [1, 1.5, 2]) {
          const forms = data.display[language]?.[unit];
          const plural = language === 'fr' ? amount >= 2 : amount > 1;
          const expected = forms === null ? undefined : forms ? (plural ? forms.other : forms.one) : localizeUnit(unit, language);
          expect(formatUnit(unit, language, amount), `${unit} (${language}, ${amount})`).toBe(expected);
        }
      }
    }
  });

  it('parses every unicode fraction, alone and after a whole number', () => {
    for (const [glyph, value] of Object.entries(data.unicodeFractions)) {
      expect(parseAmount(glyph)).toBe(value);
      expect(parseAmount(`2${glyph}`)).toBe(2 + value);
      expect(parseAmount(`2 ${glyph}`)).toBe(2 + value);
    }
  });
});

describe('data/test-vectors.json', () => {
  it('is test/vectors.json with the package version added', () => {
    const shipped = JSON.parse(toJson(buildTestVectors(pkg.version, vectors)));
    expect(shipped).toStrictEqual({ ...vectors, version: pkg.version });
    expect(Object.keys(shipped)).toEqual(['schema', 'version', 'functions']);
  });
});

describe('toJson', () => {
  it('writes invisible characters as escapes', () => {
    expect(toJson(' el﻿ càs')).toBe('"\\u00a0el\\ufeff ca\\u0300s"\n');
  });

  it('refuses a number JSON cannot hold, rather than writing null', () => {
    expect(() => toJson({ amount: Number.NaN })).toThrow();
  });
});
