/**
 * Color as a hex string — `#RRGGBB` or `#RRGGBBAA` (case-insensitive). Kept as a
 * string rather than a native color type so it survives the JS/native boundary;
 * each platform parses it into its own color representation.
 */
export type ArcgisColor = string;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Type guard for a valid {@link ArcgisColor} (`#RRGGBB` or `#RRGGBBAA`). */
export function isArcgisColor(value: unknown): value is ArcgisColor {
  return typeof value === 'string' && HEX_COLOR.test(value);
}
