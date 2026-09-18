# Consumer compatibility fixtures

The package is built with the newest TypeScript, but what it ships has to work for people on older
setups. CI installs the packed tarball into each folder, compiles `use.ts` with an older TypeScript,
and runs the result.

- `cjs/` — a CommonJS project with default module resolution (`node10` before TypeScript 7), the
  shape of most NestJS and older Node codebases.
- `esm/` — an ES module project with `nodenext` resolution.

To run one locally:

```bash
npm run build && npm pack
compat/run.sh esm 4.7 cooking-units-0.1.0.tgz
```
