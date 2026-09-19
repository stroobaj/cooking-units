# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-19

### Added

- `formatUnit` — write a unit for display next to an amount: singular or plural per language, and
  nothing where the language leaves the unit out (French `piece`). Display tables for English,
  Dutch and French in `UNIT_DISPLAY`; other languages fall back to `localizeUnit`.
- Dutch forms: `kopje`, `doos`, `krop`, `vel`, `druppel`, `scheutje`, `klontje`, and the plurals of
  units that only had a singular (`blikken`, `flessen`, `potten`, `snufjes`, …).
- French forms: `tasse`, `pièce`, `pot`, `bouteille`, `branche`, `tête`, `goutte`, `trait`, and the
  plurals of `boîte`, `pincée` and `poignée`.

### Changed

- `localizeUnit('piece', 'fr')` returns `pièce` instead of `piece`.

## [0.1.0] - 2026-09-17

First release. Extracted from the RecipeHub API, where this code ran in production against real
imported recipes.

### Added

- `normalizeUnit` — 147 written forms across English, Dutch, French, German and Spanish, mapped to
  canonical English units.
- `localizeUnit` — the reverse direction, writing a canonical unit the way a language does.
- `parseAmount` / `formatAmount` — unicode fractions (`1½`), slash fractions (`1 1/2`), plain
  numbers.
- `convertUnit`, `areCompatible`, `lookupUnit`, `bestDisplayUnit` — conversion within compatible
  unit groups.
- `sumQuantities` — add up quantities across languages and units, counting unmeasured uses rather
  than dropping them.
- Per-language alias tables (`EN`, `NL`, `FR`, `DE`, `ES`) as the source of truth, with the flat
  `UNIT_ALIASES` map derived from them.
- ESM and CommonJS builds with declarations for each. Works on Node 18+ and TypeScript 4.7+, both
  verified in CI against the packed tarball.

[Unreleased]: https://github.com/stroobaj/cooking-units/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/stroobaj/cooking-units/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/stroobaj/cooking-units/releases/tag/v0.1.0
