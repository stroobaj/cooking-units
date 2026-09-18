/**
 * Tell Node and bundlers how to read each build. dist/esm and dist/cjs both contain plain .js files,
 * so each needs its own package.json saying which module system those files are in.
 *
 * `sideEffects: false` has to be repeated here: bundlers read it from the nearest package.json, which
 * for these files is this one, not the root. Without it, importing one function pulls in every
 * module, because top-level code like building the alias map looks like it has to run.
 */
import { writeFileSync } from 'node:fs';

for (const [dir, type] of [['esm', 'module'], ['cjs', 'commonjs']]) {
  const manifest = { type, sideEffects: false };
  writeFileSync(new URL(`../dist/${dir}/package.json`, import.meta.url), `${JSON.stringify(manifest)}\n`);
}
