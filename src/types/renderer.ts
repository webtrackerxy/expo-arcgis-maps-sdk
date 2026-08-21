import type { ArcgisSymbol } from './symbol';

/**
 * How features/graphics are symbolized. Mirrors the ArcGIS renderer family
 * available identically on iOS and Android.
 *
 * A renderer applied to a feature layer or graphics overlay overrides any
 * per-graphic symbol.
 */

/** One symbol for every feature. */
export type SimpleRenderer = {
  type: 'simple';
  symbol: ArcgisSymbol;
};

/**
 * An alternate symbol shown only within a map-scale range. Used with
 * {@link UniqueValueClass.alternateSymbols} to display different symbols as the
 * user zooms. Scales are map denominators, so a smaller number is more
 * zoomed-in: the symbol shows when `maxScale <= currentScale <= minScale`.
 */
export type ScaledSymbol = {
  symbol: ArcgisSymbol;
  /** Zoomed-out limit (largest scale denominator). Omit for no lower-zoom limit. */
  minScale?: number;
  /** Zoomed-in limit (smallest scale denominator). Omit for no upper-zoom limit. */
  maxScale?: number;
};

/** A symbol chosen by matching a feature's field value(s). */
export type UniqueValueClass = {
  /**
   * The attribute value(s) this class matches, one per {@link UniqueValueRenderer.fields}
   * entry. Strings match string fields; numbers match numeric fields.
   */
  values: (string | number)[];
  symbol: ArcgisSymbol;
  /** Optional legend label. */
  label?: string;
  /**
   * Alternate symbols shown at different map-scale ranges. When set, ArcGIS draws
   * the alternate whose scale range contains the current scale, falling back to
   * the primary `symbol` outside every range. Each symbol is realized as a
   * multilayer symbol so its scale range can be applied.
   */
  alternateSymbols?: ScaledSymbol[];
};

/** Symbolize by unique attribute value(s). */
export type UniqueValueRenderer = {
  type: 'uniqueValue';
  /** Field name(s) whose combined value selects a class. */
  fields: string[];
  /** The value → symbol classes. */
  uniqueValues: UniqueValueClass[];
  /** Symbol for features matching no class. */
  defaultSymbol?: ArcgisSymbol;
};

/** A symbol for a numeric range `(minValue, maxValue]`. */
export type ClassBreak = {
  /**
   * Lower bound (exclusive). Defaults to negative infinity for the first break,
   * i.e. an open lower end.
   */
  minValue?: number;
  /** Upper bound (inclusive). */
  maxValue: number;
  symbol: ArcgisSymbol;
  /** Optional legend label. */
  label?: string;
};

/** Symbolize by numeric ranges of a field. */
export type ClassBreaksRenderer = {
  type: 'classBreaks';
  /** Numeric field the breaks are evaluated against. */
  field: string;
  /** The ranges, in ascending order. */
  classBreaks: ClassBreak[];
  /** Symbol for values outside every break. */
  defaultSymbol?: ArcgisSymbol;
};

/**
 * Symbolize features with a dictionary symbol style (e.g. military MIL-STD-2525
 * or a custom style). The style is loaded from an ArcGIS portal item
 * (`portalItemId`) **or** a local `.stylx` dictionary style file (`stylxPath`) —
 * provide exactly one. The layer's attribute fields must match those the
 * dictionary style expects.
 */
export type DictionaryRenderer = {
  type: 'dictionary';
  /** ArcGIS portal item id of the dictionary symbol style. Provide this or `stylxPath`. */
  portalItemId?: string;
  /**
   * Local filesystem path to a `.stylx` dictionary style file. Provide this or
   * `portalItemId`.
   */
  stylxPath?: string;
};

/** A renderer usable on a feature layer or graphics overlay. */
export type ArcgisRenderer =
  SimpleRenderer | UniqueValueRenderer | ClassBreaksRenderer | DictionaryRenderer;
