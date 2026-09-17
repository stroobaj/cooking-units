/**
 * Unit vocabulary, one table per language.
 *
 * Each table maps a canonical English unit to the ways that language writes it, most idiomatic
 * first. This shape drives both directions: {@link UNIT_ALIASES} inverts it to normalize any
 * written form to its canonical unit, and `localizeUnit` reads the first entry to write a
 * canonical unit back out in a given language.
 *
 * Adding a language means adding a table here and listing it in {@link LANGUAGE_ALIASES}.
 */
import type { Language, LanguageAliases } from './types';

/** English plurals and spelled-out forms. Canonical units themselves are not repeated here. */
export const EN: LanguageAliases = {
  cup: ['cups'],
  tbsp: ['tablespoon', 'tablespoons'],
  tsp: ['teaspoon', 'teaspoons'],
  piece: ['pieces', 'pcs', 'pc'],
  slice: ['slices'],
  clove: ['cloves'],
  bunch: ['bunches'],
  sprig: ['sprigs'],
  stalk: ['stalks'],
  leaf: ['leaves'],
  can: ['cans'],
  jar: ['jars'],
  bottle: ['bottles'],
  packet: ['packets'],
  bag: ['bags'],
  box: ['boxes'],
  handful: ['handfuls'],
  head: ['heads'],
  sheet: ['sheets'],
  pinch: ['pinches'],
  drop: ['drops'],
  dash: ['dashes'],
  cube: ['cubes'],
  knob: ['knobs'],
  lb: ['lbs'],
  pint: ['pints'],
  quart: ['quarts'],
  stick: ['sticks'],
};

export const NL: LanguageAliases = {
  tbsp: ['el', 'eetlepel', 'eetlepels'],
  // `kl` / `koffielepel` is a coffee spoon: close enough to a teaspoon for recipe purposes.
  tsp: ['tl', 'theelepel', 'theelepels', 'kl', 'koffielepel'],
  piece: ['stuk', 'stuks'],
  pinch: ['snuf', 'snufje'],
  clove: ['teen', 'teentje', 'teentjes'],
  handful: ['handje', 'handjevol'],
  can: ['blik', 'blikje'],
  packet: ['pak'],
  bag: ['zakje'],
  sprig: ['takje', 'takjes'],
  leaf: ['blad', 'bladeren', 'blaadjes'],
  slice: ['plak', 'plakje', 'plakjes', 'schijf', 'schijfje', 'schijfjes'],
  bottle: ['fles'],
  jar: ['pot'],
  bunch: ['bosje'],
  stalk: ['steel', 'stelen', 'stengel', 'stengels'],
  cube: ['blokje', 'blokjes'],
};

export const FR: LanguageAliases = {
  tbsp: ['càs', 'c. à s.'], // cuillère à soupe
  tsp: ['càc', 'c. à c.'], // cuillère à café
  clove: ['gousse', 'gousses'],
  bunch: ['botte', 'bottes'],
  slice: ['tranche', 'tranches'],
  packet: ['sachet', 'sachets'],
  can: ['boîte', 'boite'],
  pinch: ['pincée', 'pincee'],
  handful: ['poignée', 'poignee'],
  sprig: ['brin', 'brins'],
  leaf: ['feuille', 'feuilles'],
};

export const DE: LanguageAliases = {
  piece: ['stück', 'stuck'],
  slice: ['scheibe', 'scheiben'],
  clove: ['zehe', 'zehen'],
  pinch: ['prise'],
  bunch: ['bund'],
  can: ['dose', 'dosen'],
  packet: ['packung'],
  handful: ['handvoll'],
  sprig: ['zweig', 'zweige'],
  leaf: ['blatt', 'blätter', 'blatter'],
  bottle: ['flasche', 'flaschen'],
  jar: ['glas'],
  cube: ['würfel', 'wurfel'],
};

export const ES: LanguageAliases = {
  tbsp: ['cucharada', 'cucharadas'], // cucharada sopera
  tsp: ['cucharadita', 'cucharaditas'],
  clove: ['diente', 'dientes'],
  pinch: ['pizca'],
  bunch: ['manojo', 'manojos'],
  sprig: ['ramita', 'ramitas'],
  leaf: ['hoja', 'hojas'],
  slice: ['rodaja', 'rodajas', 'rebanada', 'rebanadas', 'loncha', 'lonchas'],
  can: ['lata', 'latas'],
  jar: ['bote', 'botes'],
  bottle: ['botella', 'botellas'],
  handful: ['puñado'],
  piece: ['trozo', 'trozos'],
  packet: ['sobre', 'sobres'],
};

/** Every language table, keyed by ISO 639-1 code. */
export const LANGUAGE_ALIASES: Record<Language, LanguageAliases> = { en: EN, nl: NL, fr: FR, de: DE, es: ES };

/** The languages this package has a unit vocabulary for. */
export const LANGUAGES = Object.keys(LANGUAGE_ALIASES) as Language[];

/**
 * Every written form → its canonical unit, inverted from the language tables.
 *
 * No written form may mean two different units, across all languages — a test enforces it, so a
 * collision fails the build rather than silently resolving one way. The `??=` below is only
 * belt and braces for that test.
 */
export const UNIT_ALIASES: Record<string, string> = buildAliasMap();

function buildAliasMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const table of Object.values(LANGUAGE_ALIASES)) {
    for (const [canonical, written] of Object.entries(table)) {
      for (const form of written) {
        map[form] ??= canonical;
      }
    }
  }
  return map;
}
