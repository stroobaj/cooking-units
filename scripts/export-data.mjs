/**
 * Write the package's data and test vectors as JSON, so a port to another language can use the same
 * tables and prove it behaves the same. Run by `npm run build`, after tsc:
 *
 * - data/units.json — every table the functions read, taken from the built code in dist/esm.
 * - data/test-vectors.json — test/vectors.json, stamped with the package version.
 *
 * They go in data/, not dist/data/, so the path in the tarball is the same as the subpath users import
 * (`cooking-units/data/units.json`). That also makes it resolve under `node10` module resolution,
 * which ignores `exports`.
 *
 * Both are generated: change src/ or test/vectors.json, never the output. docs/data-format.md
 * describes the format. The builders are exported so test/data.test.ts can check them against src.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Bump when a field changes meaning or is removed. Adding a field is not a schema change. */
export const UNITS_SCHEMA = 1;

/**
 * The tables behind every public function, in a fixed order: the order of the source tables, which
 * `aliasesOf` and `bestDisplayUnit` depend on.
 */
export function buildUnitData(version, { LANGUAGES, LANGUAGE_ALIASES, UNIT_GROUPS, UNIT_DISPLAY, UNICODE_FRACTIONS }) {
  // Every canonical unit: the convertible ones in group order, then the countable ones as the
  // language tables first mention them. `null` is what lookupUnit returns for a countable unit.
  const units = {};
  UNIT_GROUPS.forEach((group, index) => {
    for (const [unit, factor] of group) units[unit] = { group: index, factor };
  });
  const tables = [...LANGUAGES.map((language) => LANGUAGE_ALIASES[language]), ...Object.values(UNIT_DISPLAY)];
  for (const table of tables) {
    for (const unit of Object.keys(table)) if (!(unit in units)) units[unit] = null;
  }

  return {
    schema: UNITS_SCHEMA,
    version,
    languages: [...LANGUAGES],
    units,
    conversionGroups: UNIT_GROUPS.map((group) => [...group].map(([unit, factor]) => ({ unit, factor }))),
    aliases: Object.fromEntries(
      LANGUAGES.map((language) => [
        language,
        Object.fromEntries(Object.entries(LANGUAGE_ALIASES[language]).map(([unit, forms]) => [unit, [...forms]])),
      ]),
    ),
    display: Object.fromEntries(
      Object.entries(UNIT_DISPLAY).map(([language, table]) => [
        language,
        Object.fromEntries(
          Object.entries(table).map(([unit, forms]) => [unit, forms && { one: forms.one, other: forms.other }]),
        ),
      ]),
    ),
    unicodeFractions: { ...UNICODE_FRACTIONS },
  };
}

/** The hand-written vectors, with the version they were shipped in added after `schema`. */
export function buildTestVectors(version, { schema, ...rest }) {
  return { schema, version, ...rest };
}

const WIDTH = 100;

/**
 * JSON with a fixed layout: anything that fits in {@link WIDTH} columns goes on one line. Characters
 * that are invisible or look like a space in an editor (no-break spaces, U+FEFF, combining marks)
 * are written as `\uXXXX` escapes, so a vector about whitespace can be read.
 */
export function toJson(value) {
  return `${print(value, '', 0)}\n`;
}

function print(value, indent, lead) {
  const flat = inline(value);
  if (value === null || typeof value !== 'object' || lead + flat.length <= WIDTH) return flat;
  const inner = `${indent}  `;
  const lines = Array.isArray(value)
    ? value.map((item) => `${inner}${print(item, inner, inner.length)}`)
    : Object.entries(value).map(([key, item]) => {
        const head = `${inner}${string(key)}: `;
        return `${head}${print(item, inner, head.length)}`;
      });
  if (lines.length === 0) return flat;
  const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
  return `${open}\n${lines.join(',\n')}\n${indent}${close}`;
}

function inline(value) {
  if (Array.isArray(value)) return `[${value.map(inline).join(', ')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => `${string(key)}: ${inline(item)}`);
    return entries.length === 0 ? '{}' : `{ ${entries.join(', ')} }`;
  }
  if (typeof value === 'string') return string(value);
  // JSON has no NaN or Infinity: JSON.stringify would silently write null.
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`Not representable in JSON: ${value}`);
  return JSON.stringify(value);
}

const INVISIBLE = /(?! )[\p{Z}\p{Cf}\p{M}]/gu;

function string(text) {
  return JSON.stringify(text).replace(INVISIBLE, (match) =>
    [...Array(match.length).keys()].map((i) => `\\u${match.charCodeAt(i).toString(16).padStart(4, '0')}`).join(''),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = new URL('../', import.meta.url);
  const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
  const { version } = read('package.json');
  const modules = await Promise.all(
    ['aliases', 'amount', 'conversion', 'format'].map((name) => import(new URL(`dist/esm/${name}.js`, root).href)),
  );

  mkdirSync(new URL('data/', root), { recursive: true });
  writeFileSync(new URL('data/units.json', root), toJson(buildUnitData(version, Object.assign({}, ...modules))));
  writeFileSync(new URL('data/test-vectors.json', root), toJson(buildTestVectors(version, read('test/vectors.json'))));
}
