/** A language whose unit vocabulary this package knows. */
export type Language = 'en' | 'nl' | 'fr' | 'de' | 'es';

/**
 * Canonical unit → the ways that language writes it, most idiomatic first.
 * The first entry is what {@link localizeUnit} returns for that language.
 */
export type LanguageAliases = Record<string, readonly string[]>;

/** Where a unit sits in the conversion tables. */
export interface UnitInfo {
  /** Index of the conversion group. Units sharing a group can be summed. */
  group: number;
  /** Factor relative to the group's base unit. */
  factor: number;
}

/** An amount paired with a unit. Either may be absent, as in "a pinch of salt". */
export interface Quantity {
  /** Numeric amount, or a string this package parses ("1½", "1 1/2", "0.5"). */
  amount: string | number | null | undefined;
  /** Unit as written. Normalized before use. */
  unit: string | null | undefined;
}

/** One summed group of compatible quantities. */
export interface SummedQuantity {
  /** Summed amount, expressed in `unit`. */
  amount: number;
  /** Best display unit for the summed amount, or null when the inputs had no unit. */
  unit: string | null;
  /**
   * How many inputs in this group carried no usable amount ("a pinch of salt", "to taste").
   * They contribute nothing to `amount`; a shopping list usually renders them as "+ more".
   */
  unmeasured: number;
}
