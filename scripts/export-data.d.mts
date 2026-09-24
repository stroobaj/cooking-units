// Types for export-data.mjs, so test/data.test.ts can import its builders. docs/data-format.md
// describes each field.
import type { Language, LanguageAliases, UnitForms, UnitInfo } from '../src/types.js';

export declare const UNITS_SCHEMA: number;

/** The shape of data/units.json. */
export interface UnitData {
  schema: number;
  version: string;
  languages: Language[];
  units: Record<string, UnitInfo | null>;
  conversionGroups: { unit: string; factor: number }[][];
  aliases: Record<string, Record<string, string[]>>;
  display: Record<string, Record<string, UnitForms | null>>;
  unicodeFractions: Record<string, number>;
}

/** The tables buildUnitData reads, as src/ and dist/esm/ export them. */
export interface SourceTables {
  LANGUAGES: readonly Language[];
  LANGUAGE_ALIASES: Readonly<Record<Language, LanguageAliases>>;
  UNIT_GROUPS: ReadonlyArray<ReadonlyMap<string, number>>;
  UNIT_DISPLAY: Partial<Record<Language, Record<string, UnitForms | null>>>;
  UNICODE_FRACTIONS: Readonly<Record<string, number>>;
}

export declare function buildUnitData(version: string, tables: SourceTables): UnitData;

export declare function buildTestVectors<T extends { schema: number }>(
  version: string,
  source: T,
): T & { version: string };

export declare function toJson(value: unknown): string;
