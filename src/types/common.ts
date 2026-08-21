/**
 * Core serializable value types shared across the public API.
 *
 * Everything in this module must survive the JavaScript/native boundary as
 * plain JSON: strings, numbers, booleans, arrays and plain objects only. Native
 * ArcGIS types (`AGSPoint`, `Point`, `UIColor`, `Color`, …) must never appear
 * here — see CLAUDE.md "Public API rules".
 */

/**
 * A spatial reference identified by its well-known ID (WKID).
 *
 * Defaults are applied natively when omitted:
 * - Geographic coordinates default to WGS 84 (`wkid: 4326`).
 * - Map scale / screen operations use the map's own spatial reference.
 *
 * `latestWkid` is optional and only relevant for a small number of references
 * whose authoritative WKID changed; when unsure, provide `wkid` alone.
 */
export type SpatialReference = {
  /** Well-known ID, e.g. `4326` (WGS 84) or `102100`/`3857` (Web Mercator). */
  wkid: number;
  /** Optional newer authoritative WKID, when it differs from `wkid`. */
  latestWkid?: number;
};

/** WGS 84 geographic spatial reference. Used as the default for lat/long input. */
export const WGS84: SpatialReference = { wkid: 4326 };

/**
 * A geographic location.
 *
 * `latitude`/`longitude` are in decimal degrees and interpreted in
 * `spatialReference` when provided, otherwise WGS 84 ({@link WGS84}).
 * `altitude`, when present, is in meters.
 */
export type GeographicPoint = {
  /** Decimal degrees. Interpreted in `spatialReference` or WGS 84. */
  latitude: number;
  /** Decimal degrees. Interpreted in `spatialReference` or WGS 84. */
  longitude: number;
  /** Meters above the reference surface. Optional. */
  altitude?: number;
  /** Spatial reference for the coordinates. Defaults to WGS 84 when omitted. */
  spatialReference?: SpatialReference;
};

/**
 * A point in the map view's coordinate space, in device-independent points,
 * with the origin at the top-left of the view.
 */
export type ScreenPoint = {
  /** Horizontal offset from the view's left edge, in points. */
  x: number;
  /** Vertical offset from the view's top edge, in points. */
  y: number;
};
