/**
 * cooking-units — turn the units recipes are written in into units you can add up.
 *
 * Normalize multilingual unit names to canonical English, parse the fractions recipes use,
 * convert between compatible units and add quantities up. No dependencies, no I/O, no state.
 */
export { DE, EN, ES, FR, LANGUAGE_ALIASES, LANGUAGES, NL, UNIT_ALIASES } from './aliases.js';
export { formatAmount, parseAmount } from './amount.js';
export { areCompatible, bestDisplayUnit, convertUnit, lookupUnit, sumQuantities } from './conversion.js';
export { aliasesOf, localizeUnit, normalizeUnit } from './normalize.js';
export type { Language, LanguageAliases, Quantity, SummedQuantity, UnitInfo } from './types.js';
