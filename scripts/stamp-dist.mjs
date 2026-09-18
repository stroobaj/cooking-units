/**
 * Tell Node how to read each build. dist/esm and dist/cjs both contain plain .js files, so each
 * one needs its own package.json to say which module system those files are in.
 */
import { writeFileSync } from 'node:fs';

for (const [dir, type] of [['esm', 'module'], ['cjs', 'commonjs']]) {
  writeFileSync(new URL(`../dist/${dir}/package.json`, import.meta.url), `{"type":"${type}"}\n`);
}
