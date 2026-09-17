# cooking-units

[![npm](https://img.shields.io/npm/v/cooking-units.svg)](https://www.npmjs.com/package/cooking-units)
[![CI](https://github.com/stroobaj/cooking-units/actions/workflows/ci.yml/badge.svg)](https://github.com/stroobaj/cooking-units/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![types](https://img.shields.io/badge/types-included-blue)](dist/index.d.ts)

Turn `2 el`, `càs` and `1½ cups` into units you can add up.

A Dutch blog says `2 el`. A French one says `càs`. A German one says `1 Prise`. If you import
recipes, build shopping lists, or feed recipe text to a model, you have to reconcile all of it
before you can sum anything.

This package does that one job: normalize written units to a canonical form, parse the fractions
recipes use, convert between compatible units, and add quantities up.

**Zero dependencies. No I/O, no state, no config.** ESM and CJS, with types.

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
| `LANGUAGE_ALIASES`, `EN`/`NL`/`FR`/`DE`/`ES` | The per-language tables |
| `LANGUAGES` | The language codes with a vocabulary |

Types: `Language`, `LanguageAliases`, `Quantity`, `SummedQuantity`, `UnitInfo`.

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
