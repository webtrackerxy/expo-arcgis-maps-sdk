import type { ArcgisColor } from './color';

/**
 * Where a label is placed relative to its feature. Line placements (e.g.
 * `lineAboveAlong`) suit line features, point placements (e.g. `pointAboveCenter`)
 * suit points, and `polygonAlwaysHorizontal` suits polygons. When omitted the
 * native default for the geometry type is used.
 */
export type LabelPlacement =
  | 'lineAboveAlong'
  | 'lineBelowAlong'
  | 'lineCenterAlong'
  | 'pointAboveCenter'
  | 'pointBelowCenter'
  | 'pointCenterCenter'
  | 'pointAboveRight'
  | 'polygonAlwaysHorizontal';

/**
 * A text label drawn for a feature layer's features.
 *
 * `expression` is either a **simple** label expression using the ArcGIS
 * `[FIELD]` bracket syntax (e.g. `"[STATE_NAME]"`), or an **Arcade** expression
 * (e.g. `"$feature.STATE_NAME"`) when `arcade` is `true`.
 */
export type LabelDefinition = {
  /** The label expression — `[FIELD]` simple syntax, or Arcade when `arcade`. */
  expression: string;
  /** Treat `expression` as an Arcade expression instead of a simple one. */
  arcade?: boolean;
  /** Text color. Defaults to black. */
  color?: ArcgisColor;
  /** Text size in points. Defaults to a small native value. */
  size?: number;
  /** Halo color drawn behind the text for legibility. */
  haloColor?: ArcgisColor;
  /** Halo width in points. Defaults to `0`. */
  haloWidth?: number;
  /** Where the label sits relative to its feature. See {@link LabelPlacement}. */
  placement?: LabelPlacement;
};
