import { describe, expect, it } from 'vitest';

import * as api from '../src/index.js';
import vectors from './vectors.json' with { type: 'json' };

/**
 * Runs test/vectors.json against this implementation. The same file ships in the package as
 * `data/test-vectors.json`, so a port to another language is checked against the same cases.
 * docs/data-format.md describes the format.
 */

interface Case {
  args: unknown[];
  expected: unknown;
  note?: string;
}

const functions = (vectors as { functions: Record<string, { params: string[]; cases: Case[] }> }).functions;
const exported = api as unknown as Record<string, unknown>;

/** JSON has no NaN or Infinity, so the vectors write them as `{ "number": "NaN" }`. */
function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value);
    const [first] = entries;
    if (entries.length === 1 && first?.[0] === 'number' && typeof first[1] === 'string') return Number(first[1]);
    return Object.fromEntries(entries.map(([key, item]) => [key, decode(item)]));
  }
  return value;
}

/** A vector's `null` stands for both null and undefined, which these functions treat alike. */
function withUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(withUndefined);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withUndefined(v)]));
  return value;
}

function containsNull(value: unknown): boolean {
  if (value === null) return true;
  return typeof value === 'object' && Object.values(value as object).some(containsNull);
}

/** What a function returns, the way a vector writes it: `undefined` becomes `null`. */
function asVector(value: unknown): unknown {
  return value === undefined ? null : value;
}

describe('test vectors', () => {
  it('cover every exported function', () => {
    const exportedFunctions = Object.keys(exported).filter((name) => typeof exported[name] === 'function');
    expect(Object.keys(functions).sort()).toEqual(exportedFunctions.sort());
  });

  for (const [name, { params, cases }] of Object.entries(functions)) {
    describe(name, () => {
      const fn = exported[name] as (...args: unknown[]) => unknown;

      it.each(cases.map((vector) => [JSON.stringify(vector.args), vector] as const))('%s', (_, vector) => {
        expect(vector.args.length).toBeLessThanOrEqual(params.length);
        const args = decode(vector.args) as unknown[];
        const expected = decode(vector.expected);

        expect(asVector(fn(...args)), vector.note).toStrictEqual(expected);
        if (containsNull(vector.args)) {
          expect(asVector(fn(...(withUndefined(args) as unknown[]))), `${vector.note ?? ''} (undefined)`).toStrictEqual(expected);
        }
      });
    });
  }
});
