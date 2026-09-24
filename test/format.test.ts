import { describe, expect, it } from 'vitest';

import { UNIT_DISPLAY } from '../src/format.js';
import { normalizeUnit } from '../src/normalize.js';

// How formatUnit behaves is pinned in test/vectors.json. This checks the display tables themselves.
describe('UNIT_DISPLAY', () => {
  // Display forms end up in text people edit and paste back, so each must be read back as its unit.
  it('only writes forms that normalize back to the same unit', () => {
    const notRecognised = new Set(['dozen']); // Dutch plural of doos, and the English word for twelve.
    for (const [language, table] of Object.entries(UNIT_DISPLAY)) {
      for (const [canonical, forms] of Object.entries(table ?? {})) {
        if (!forms) continue;
        for (const form of [forms.one, forms.other]) {
          if (notRecognised.has(form)) continue;
          expect(normalizeUnit(form), `"${form}" (${language})`).toBe(canonical);
        }
      }
    }
  });
});
