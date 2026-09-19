/**
 * Writing a unit for people to read.
 *
 * The alias tables in `aliases.ts` exist to recognise what people type, so they hold every
 * spelling and no grammar. Display needs the opposite: one form per unit, in the right number,
 * and sometimes nothing at all. These tables hold that, per language.
 */
import { parseAmount } from './amount.js';
import { localizeUnit, normalizeUnit } from './normalize.js';
import type { Language, UnitForms } from './types.js';

/** Abbreviations and symbols read the same in the singular and the plural. */
const same = (form: string): UnitForms => ({ one: form, other: form });

const EN_DISPLAY: Record<string, UnitForms | null> = {
  tbsp: same('tbsp'),
  tsp: same('tsp'),
  lb: same('lb'),
  cup: { one: 'cup', other: 'cups' },
  piece: { one: 'piece', other: 'pieces' },
  slice: { one: 'slice', other: 'slices' },
  clove: { one: 'clove', other: 'cloves' },
  bunch: { one: 'bunch', other: 'bunches' },
  sprig: { one: 'sprig', other: 'sprigs' },
  stalk: { one: 'stalk', other: 'stalks' },
  leaf: { one: 'leaf', other: 'leaves' },
  can: { one: 'can', other: 'cans' },
  jar: { one: 'jar', other: 'jars' },
  bottle: { one: 'bottle', other: 'bottles' },
  packet: { one: 'packet', other: 'packets' },
  bag: { one: 'bag', other: 'bags' },
  box: { one: 'box', other: 'boxes' },
  handful: { one: 'handful', other: 'handfuls' },
  head: { one: 'head', other: 'heads' },
  sheet: { one: 'sheet', other: 'sheets' },
  pinch: { one: 'pinch', other: 'pinches' },
  drop: { one: 'drop', other: 'drops' },
  dash: { one: 'dash', other: 'dashes' },
  cube: { one: 'cube', other: 'cubes' },
  knob: { one: 'knob', other: 'knobs' },
  pint: { one: 'pint', other: 'pints' },
  quart: { one: 'quart', other: 'quarts' },
  stick: { one: 'stick', other: 'sticks' },
};

const NL_DISPLAY: Record<string, UnitForms | null> = {
  tbsp: same('el'),
  tsp: same('tl'),
  cup: { one: 'kopje', other: 'kopjes' },
  piece: { one: 'stuk', other: 'stuks' },
  slice: { one: 'plakje', other: 'plakjes' },
  clove: { one: 'teentje', other: 'teentjes' },
  bunch: { one: 'bosje', other: 'bosjes' },
  sprig: { one: 'takje', other: 'takjes' },
  stalk: { one: 'stengel', other: 'stengels' },
  leaf: { one: 'blaadje', other: 'blaadjes' },
  can: { one: 'blik', other: 'blikken' },
  jar: { one: 'pot', other: 'potten' },
  bottle: { one: 'fles', other: 'flessen' },
  packet: { one: 'pak', other: 'pakken' },
  bag: { one: 'zakje', other: 'zakjes' },
  box: { one: 'doos', other: 'dozen' },
  handful: { one: 'handje', other: 'handjes' },
  head: { one: 'krop', other: 'kroppen' },
  sheet: { one: 'vel', other: 'vellen' },
  pinch: { one: 'snufje', other: 'snufjes' },
  drop: { one: 'druppel', other: 'druppels' },
  dash: { one: 'scheutje', other: 'scheutjes' },
  cube: { one: 'blokje', other: 'blokjes' },
  knob: { one: 'klontje', other: 'klontjes' },
};

const FR_DISPLAY: Record<string, UnitForms | null> = {
  tbsp: same('càs'),
  tsp: same('càc'),
  // French counts the thing itself: "2 oignons", not "2 pièces oignons".
  piece: null,
  cup: { one: 'tasse', other: 'tasses' },
  slice: { one: 'tranche', other: 'tranches' },
  clove: { one: 'gousse', other: 'gousses' },
  bunch: { one: 'botte', other: 'bottes' },
  sprig: { one: 'brin', other: 'brins' },
  stalk: { one: 'branche', other: 'branches' },
  leaf: { one: 'feuille', other: 'feuilles' },
  can: { one: 'boîte', other: 'boîtes' },
  jar: { one: 'pot', other: 'pots' },
  bottle: { one: 'bouteille', other: 'bouteilles' },
  packet: { one: 'sachet', other: 'sachets' },
  handful: { one: 'poignée', other: 'poignées' },
  head: { one: 'tête', other: 'têtes' },
  pinch: { one: 'pincée', other: 'pincées' },
  drop: { one: 'goutte', other: 'gouttes' },
  dash: { one: 'trait', other: 'traits' },
  cube: { one: 'cube', other: 'cubes' },
};

/**
 * Display forms per language. `null` means the language writes no unit there. A unit missing from
 * a table falls back to {@link localizeUnit}, so a language without a display table still reads
 * its own vocabulary, only without plurals.
 */
export const UNIT_DISPLAY: Partial<Record<Language, Record<string, UnitForms | null>>> = {
  en: EN_DISPLAY,
  nl: NL_DISPLAY,
  fr: FR_DISPLAY,
};

/**
 * How `language` writes a unit next to an amount: the right form, in the right number.
 *
 * The unit is normalized first, so any written form works. Returns `undefined` when there is
 * nothing to write — no unit, or a language that leaves it out (French `piece`). An unrecognised
 * unit comes back as written, lowercased, like {@link normalizeUnit}.
 *
 * The plural follows the amount: above one in most languages, from two in French. A range uses
 * its upper bound, and an amount that is not a number ("a few") reads as singular.
 *
 * ```ts
 * formatUnit('piece', 'nl', 1)    // 'stuk'
 * formatUnit('piece', 'nl', 3)    // 'stuks'
 * formatUnit('piece', 'fr', 3)    // undefined
 * formatUnit('clove', 'fr', '1½') // 'gousse'
 * formatUnit('tbsp', 'nl', 2)     // 'el'
 * formatUnit('cups', 'en', '1-2') // 'cups'
 * ```
 */
export function formatUnit(
  unit: string | undefined | null,
  language: Language,
  amount?: string | number | null,
): string | undefined {
  const canonical = normalizeUnit(unit);
  if (!canonical) return undefined;
  const forms = UNIT_DISPLAY[language]?.[canonical];
  if (forms === null) return undefined;
  if (forms === undefined) return localizeUnit(canonical, language);
  return isPlural(amount, language) ? forms.other : forms.one;
}

function isPlural(amount: string | number | null | undefined, language: Language): boolean {
  const upper = typeof amount === 'string' ? amount.split(/\s*[-–]\s*/).pop() : amount;
  const value = parseAmount(upper);
  if (Number.isNaN(value)) return false;
  return language === 'fr' ? value >= 2 : value > 1;
}
