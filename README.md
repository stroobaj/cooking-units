# cooking-units

[![npm](https://img.shields.io/npm/v/cooking-units.svg)](https://www.npmjs.com/package/cooking-units)
[![CI](https://github.com/stroobaj/cooking-units/actions/workflows/ci.yml/badge.svg)](https://github.com/stroobaj/cooking-units/actions/workflows/ci.yml)
[![runtime dependencies](https://img.shields.io/badge/runtime_dependencies-0-brightgreen)](package.json)
[![types](https://img.shields.io/badge/types-included-blue)](dist/index.d.ts)

Turn `2 el`, `càs` and `1½ cups` into units you can add up.

A Dutch blog says `2 el`. A French one says `càs`. A German one says `1 Prise`. If you import
recipes, build shopping lists, or feed recipe text to a model, you have to reconcile all of it
before you can sum anything.

This package does that one job: normalize written units to a canonical form, parse the fractions
recipes use, convert between compatible units, and add quantities up.

**Installs nothing else. No I/O, no state, no config.** ESM and CJS, with types. Tree-shakes:
`parseAmount` on its own adds about 0.4 kB gzipped to your bundle, and the whole package about 2 kB.

```bash
npm install cooking-units
```

```ts
import { normalizeUnit, sumQuantities } from 'cooking-units';

normalizeUnit('Eetlepels'); // 'tbsp'
normalizeUnit('càs');       // 'tbsp'
normalizeUnit('cucharada'); // 'tbsp'

sumQuantities([
  { amount: '500', unit: 'g' },
  { amount: '1', unit: 'kg' },
]);
// [{ amount: 1.5, unit: 'kg', unmeasured: 0 }]
```

## Why this exists

Most unit libraries are built for engineering: they know that a joule is a newton-metre, and they
have never heard of a `snufje`. Recipe parsers, meanwhile, are almost always English-only.

This package covers the gap in the middle:

- **147 written forms across 5 languages** — English, Dutch, French, German, Spanish
- **Units recipes use and physics does not** — `clove`, `sprig`, `pinch`, `knob`, `handful`
- **Both directions** — normalize `eetlepels` → `tbsp`, and write `tbsp` back out as `el` for a
  Dutch reader
- **The fractions recipes are written with** — `1½`, `2 ¼`, `1 1/2`, `¾`
- **Honest about what cannot be added** — it will not convert grams to millilitres, because that
  needs the density of the specific ingredient

## API

### `normalizeUnit(unit)`

Canonical English form of a written unit. Unrecognised units come back lowercased and trimmed
rather than dropped, so nothing is silently lost.

```ts
normalizeUnit('  Theelepel  '); // 'tsp'
normalizeUnit('Stück');         // 'piece'
normalizeUnit('KG');            // 'kg'
normalizeUnit('schmoo');        // 'schmoo'
normalizeUnit('');              // undefined
```

### `localizeUnit(unit, language)`

The reverse: write a canonical unit the way a language does. The input is normalized first, so
you can go from any language to any other. Metric symbols pass through unchanged, which is
correct — `g` is `g` everywhere.

```ts
localizeUnit('tbsp', 'nl');        // 'el'
localizeUnit('tablespoons', 'fr'); // 'càs'
localizeUnit('clove', 'de');       // 'zehe'
localizeUnit('g', 'nl');           // 'g'
```

### `formatUnit(unit, language, amount?)`

Write a unit for people to read, next to an amount. Where `localizeUnit` gives the dictionary
form, this gives the one a recipe would print: the plural where the amount needs it, and nothing
at all where the language leaves the unit out.

```ts
formatUnit('piece', 'nl', 1);    // 'stuk'
formatUnit('piece', 'nl', 3);    // 'stuks'
formatUnit('piece', 'fr', 3);    // undefined — "3 oignons", not "3 pièces oignons"
formatUnit('clove', 'fr', '1½'); // 'gousse' — French stays singular below two
formatUnit('cup', 'en', '1-2');  // 'cups' — a range uses its upper bound
formatUnit('tbsp', 'nl', 2);     // 'el'
```

Display tables exist for English, Dutch and French (`UNIT_DISPLAY`). Other languages fall back to
`localizeUnit`: their own words, without plurals. Every display form normalizes back to its unit,
so text a user edits and saves again still reads as the same unit.

### `parseAmount(value)`

Parse an amount as recipes write it. Returns `NaN` for text amounts like "a pinch" — check with
`Number.isNaN`.

```ts
parseAmount('1½');    // 1.5
parseAmount('2 ¼');   // 2.25
parseAmount('1 1/2'); // 1.5
parseAmount('⅓');     // 0.3333333333333333
parseAmount('to taste'); // NaN
```

### `convertUnit(amount, from, to)`

Convert between compatible units, or `undefined` when they are not compatible. Both units are
normalized, so written forms work directly.

```ts
convertUnit(1500, 'g', 'kg');       // 1.5
convertUnit(2, 'eetlepels', 'tsp'); // 6
convertUnit('1½', 'l', 'ml');       // 1500
convertUnit(1, 'g', 'ml');          // undefined — weight is not volume
```

### `sumQuantities(quantities)`

The one that does the real work. Adds up a list of quantities, merges everything that can
legitimately be merged, and reports each total in the best display unit for its size.

Quantities with no usable amount are counted rather than dropped, so "salt to taste" still
appears on your list.

```ts
sumQuantities([
  { amount: '1', unit: 'eetlepel' },  // Dutch
  { amount: '1', unit: 'cucharada' }, // Spanish
  { amount: '3', unit: 'tsp' },       // English
  { amount: '2', unit: 'stuks' },
  { amount: null, unit: 'snufje' },
]);
// [
//   { amount: 3, unit: 'tbsp',  unmeasured: 0 },  // merged across three languages
//   { amount: 2, unit: 'piece', unmeasured: 0 },
//   { amount: 0, unit: 'pinch', unmeasured: 1 },
// ]
```

### Also exported

| Export | What it is |
| --- | --- |
| `areCompatible(a, b)` | Whether two units can be summed |
| `lookupUnit(unit)` | `{ group, factor }` for a canonical unit, or `undefined` |
| `bestDisplayUnit(baseAmount, group)` | Largest unit leaving the amount at or above 1 |
| `formatAmount(value, decimals?)` | Whole numbers stay whole, the rest get fixed decimals |
| `aliasesOf(unit)` | Every written form recognised for a canonical unit |
| `UNIT_ALIASES` | The full flat map, written form → canonical |
| `UNIT_DISPLAY` | The display tables behind `formatUnit`, per language |
| `LANGUAGE_ALIASES`, `EN`/`NL`/`FR`/`DE`/`ES` | The per-language tables |
| `LANGUAGES` | The language codes with a vocabulary |

Types: `Language`, `LanguageAliases`, `Quantity`, `SummedQuantity`, `UnitForms`, `UnitInfo`.

## What can be summed with what

Units are grouped by what can legitimately be added together:

| Group | Units | Base |
| --- | --- | --- |
| Metric volume | `ml` `cl` `dl` `l` | `ml` |
| Metric weight | `mg` `g` `kg` | `g` |
| Imperial weight | `oz` `lb` | `oz` |
| Imperial volume | `cup` `pint` `quart` | `cup` |
| Cooking spoons | `tsp` `tbsp` | `tsp` |

Countable units — `piece`, `clove`, `pinch`, `sprig`, `leaf`, `can`, and the rest — convert to
nothing and are only ever summed with their own kind.

Two deliberate omissions:

- **No volume ↔ weight.** A cup of flour and a cup of honey do not weigh the same. Converting
  between them needs per-ingredient density, which is a different problem.
- **No `fl oz`.** In written recipes it collides with `oz` by weight often enough that folding
  them together does more harm than leaving `fl oz` unconverted.

## Using the data outside JavaScript

The package also ships its data as JSON, for ports to other languages and for tools that are not
JavaScript:

- **`data/units.json`** — every table the functions read: the canonical units, the conversion groups
  and factors, the alias tables per language, the display forms and the unicode fractions.
- **`data/test-vectors.json`** — inputs and expected outputs for every public function, edge cases
  included. These define correct behaviour: the TypeScript is tested against the same file, so a
  port that passes them all behaves the same.

Both are generated at build time from the code in `src/`, never edited by hand, and versioned with
the package: each carries the `version` it was built for and a `schema` number. Read them from the
npm tarball (`package/data/`), or import them in JavaScript:

```ts
import units from 'cooking-units/data/units.json' with { type: 'json' };
```

[docs/data-format.md](docs/data-format.md) describes every field, how the functions use them, and
what a port has to match exactly: number precision, whitespace and ordering.

## Compatibility

Built with the newest toolchain, shipped for older ones. Every claim here is checked in CI
against the packed tarball, the same file npm users download:

| | Works with | How CI checks it |
| --- | --- | --- |
| Node | 18 and later | `require()` and `import` on Node 18, 20, 22 and 24, with no dev tooling installed |
| TypeScript | 4.7 and later | Compiles a CommonJS and an ESM project on TypeScript 4.7, 5.0 and latest, `skipLibCheck` off |
| Module systems | ESM and CommonJS | Separate builds, each with its own declarations |
| Resolution | `node10`, `node16`, `nodenext`, `bundler` | [are-the-types-wrong](https://github.com/arethetypeswrong/arethetypeswrong.github.io) and [publint](https://publint.dev) |

## Adding a language

Language tables live in [`src/aliases.ts`](src/aliases.ts), one per language, mapping a canonical
unit to the ways that language writes it — **most idiomatic first**, because the first entry is
what `localizeUnit` returns.

```ts
export const IT: LanguageAliases = {
  tbsp: ['cucchiaio', 'cucchiai'],
  tsp: ['cucchiaino', 'cucchiaini'],
  clove: ['spicchio', 'spicchi'],
};
```

Add the table to `LANGUAGE_ALIASES` and the tests will tell you if a written form collides with
one another language already claims. Contributions in any language are welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Prior art, and when to use something else

If your recipes are in English, you may not need this. Reach for one of these first:

- [`parse-ingredient`](https://www.npmjs.com/package/parse-ingredient) — parses a whole ingredient
  line ("2 cups flour, sifted"), including mixed numbers and vulgar fractions. Overlaps
  `parseAmount` and does more besides.
- [`recipe-ingredient-parser-v3`](https://www.npmjs.com/package/recipe-ingredient-parser-v3) —
  ingredient-line parsing that also combines ingredients. Overlaps `sumQuantities`.
- [`convert-units`](https://www.npmjs.com/package/convert-units) — general-purpose measurement
  conversion. Broader and more rigorous on physical units than this is.

All three are English-only, and that is the whole difference. This package exists because
`eetlepels`, `càs` and `cucharada` are the same unit and nothing else treats them that way. It
also does not parse ingredient lines — pair it with one of the parsers above if you need that.

## License

MIT
