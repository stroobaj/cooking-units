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
6. Optionally, add a display table to `UNIT_DISPLAY` in [`src/format.ts`](src/format.ts): the
   singular and plural `formatUnit` writes, or `null` where the language writes no unit. Each
   form must also be in the alias table, and a test checks that.
7. Run `npm test`.

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

The build is plain `tsc`, run once for ESM and once for CommonJS, one output file per source file.
That is on purpose. It is not about skipping a build step:

- **It makes user bundles smaller.** Bundlers drop whole modules a user never imports, so
  `parseAmount` on its own costs about 0.4 kB gzipped. Bundled into a single file, the same import
  costs about 1.3 kB, because top-level code such as building the alias map can't be proven unused.
- **Minifying a library gains nothing.** Users' bundlers minify their whole app anyway. What a
  minified library does cost is readable stack traces.
- **The package has no runtime dependencies to inline.** Only `devDependencies` (TypeScript,
  vitest, the package linters), which npm never installs for users.
- **Fewer tools to break on a new TypeScript.** tsup broke on TypeScript 7 because it vendors a
  plugin pinned to TypeScript 5.

Tree-shaking depends on `"sideEffects": false`, which bundlers read from the nearest
`package.json`. `scripts/stamp-dist.mjs` repeats it in `dist/esm` and `dist/cjs` for that reason,
and CI fails if importing `parseAmount` pulls in the alias table.

`test/aliases.test.ts` pins the inverted language tables to `test/original-aliases.json`, a
snapshot of the flat map this package was extracted from. If you are **adding** forms it will
still pass. If it fails, you changed how an existing unit normalizes — which may be a fix, but
update the fixture in the same commit and say why in the PR.

## Releasing

Releases are built and staged by GitHub Actions, never from a laptop. There is no npm token: npm
trusts `.github/workflows/release.yml` in this repo directly (trusted publishing), and every version
gets a provenance attestation linking it to the commit and the run that built it. The workflow can
only *stage* a version; a maintainer approves it with 2FA before it is public.

1. Bump the version and update `CHANGELOG.md` in a commit on `main`:
   ```bash
   npm version minor --no-git-tag-version   # or patch / major
   ```
2. Push, and wait for CI to pass.
3. On GitHub, draft a new release with tag `vX.Y.Z` targeting `main`, and publish it.
   Mark it as a pre-release to publish under the `next` dist-tag instead of `latest`.
4. When the workflow is green, approve the staged version with 2FA: npmjs.com → Staged Packages,
   or `npm stage list cooking-units` and `npm stage approve <id>`.

The release workflow runs the full CI matrix on the tagged commit, checks that the tag matches
`package.json`, then publishes. Only `v*` tags can deploy to the `npm` environment it runs in.

Renaming `release.yml` breaks publishing until the trusted publisher on npmjs.com is updated to
the new filename.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat:`, `fix:`, `docs:`,
`test:`, `chore:`. A new language is a `feat:`.
