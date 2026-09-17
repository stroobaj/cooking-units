/** Moving between written unit forms and canonical English units. */
import { LANGUAGE_ALIASES, UNIT_ALIASES } from './aliases';
import type { Language } from './types';

/**
 * Canonical English form of a written unit.
 *
 * Returns `undefined` for empty input. A unit with no known alias comes back lowercased and
 * trimmed rather than dropped, so unrecognised units survive a round trip instead of being lost.
 *
 * ```ts
 * normalizeUnit('Eetlepels') // 'tbsp'
 * normalizeUnit('  KG ')     // 'kg'
 * normalizeUnit('schmoo')    // 'schmoo'
 * normalizeUnit('')          // undefined
 * ```
 */
export function normalizeUnit(unit: string | undefined | null): string | undefined {
  if (!unit) return undefined;
  const lower = unit.toLowerCase().trim();
  if (!lower) return undefined;
  return UNIT_ALIASES[lower] ?? lower;
}

/**
 * The idiomatic way `language` writes a canonical unit — the reverse of {@link normalizeUnit}.
 *
 * The input is normalized first, so a written form in one language can be rewritten in another.
 * Units a language has no word for (`g`, `ml`, and anything unrecognised) come back unchanged,
 * which is usually right: metric symbols are written the same way everywhere.
 *
 * ```ts
 * localizeUnit('tbsp', 'nl')       // 'el'
 * localizeUnit('tablespoons', 'fr') // 'càs'
 * localizeUnit('tbsp', 'en')       // 'tbsp'
 * localizeUnit('g', 'nl')          // 'g'
 * ```
 */
export function localizeUnit(unit: string | undefined | null, language: Language): string | undefined {
  const canonical = normalizeUnit(unit);
  if (!canonical) return undefined;
  // English is the canonical form itself; its table holds plurals, not preferred spellings.
  if (language === 'en') return canonical;
  return LANGUAGE_ALIASES[language]?.[canonical]?.[0] ?? canonical;
}

/** Every written form this package recognises for a canonical unit, across all languages. */
export function aliasesOf(canonicalUnit: string): string[] {
  return Object.entries(UNIT_ALIASES)
    .filter(([, canonical]) => canonical === canonicalUnit)
    .map(([form]) => form);
}
