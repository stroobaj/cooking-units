# Contributing

The most useful contribution is **a language**, or a missing form in a language that is already
here. You do not need to know the codebase to add one.

## Adding or extending a language

1. Open [`src/aliases.ts`](src/aliases.ts).
2. Find the table for your language, or copy one and rename it.
3. Map a canonical English unit to the ways your language writes it, **most idiomatic first** —
   the first entry is what `localizeUnit` returns for that language.
4. If the language is new, add it to `LANGUAGE_ALIASES` and to the `Language` type.
5. Add a case or two to `test/normalize.test.ts`.
6. Run `npm test`.

```ts
export const IT: LanguageAliases = {
  tbsp: ['cucchiaio', 'cucchiai'],
  tsp: ['cucchiaino', 'cucchiaini'],
  clove: ['spicchio', 'spicchi'],
};
```

### Rules the tests enforce

- **Lowercase and trimmed.** Lookups normalize input before matching, so a form with a capital
  will never be found.
- **No collisions.** One written form maps to exactly one canonical unit, across all languages. If
  your language spells something the way another language spells something else, the test fails
  and we decide case by case.
- **No self-aliases.** Do not list `tbsp` as an alias of `tbsp`.
- **Include the unaccented spelling** when people commonly type it that way — `pincée` and
  `pincee` are both in the French table for exactly this reason.

## Adding a conversion group

Harder to get right, so open an issue first. Two rules:

- **No volume ↔ weight**, ever. It needs per-ingredient density and does not belong here.
- Units in a group are listed **smallest to largest**, with factors relative to the first entry.

## Running things

Development uses the newest toolchain and needs **Node 22.12 or later**. That only applies to
working on the package. What it ships runs on Node 18+.

```bash
npm install
npm test               # vitest
npm run check          # tsc --noEmit
npm run build          # tsc twice: dist/esm and dist/cjs
npm run lint:package   # publint + are-the-types-wrong, on the packed tarball
```

To check that older TypeScript versions can still use the build, see [compat/](compat/README.md).
CI runs those checks on every pull request.

### Why there is no bundler

The build is plain `tsc`, run once for ESM and once for CommonJS. A zero-dependency package with a
single entry point gets nothing from bundling, and a bundler is one more thing that has to support
each new TypeScript major. tsup, for one, broke on TypeScript 7 because it vendors a plugin pinned
to TypeScript 5.

`test/aliases.test.ts` pins the inverted language tables to `test/original-aliases.json`, a
snapshot of the flat map this package was extracted from. If you are **adding** forms it will
still pass. If it fails, you changed how an existing unit normalizes — which may be a fix, but
update the fixture in the same commit and say why in the PR.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat:`, `fix:`, `docs:`,
`test:`, `chore:`. A new language is a `feat:`.
