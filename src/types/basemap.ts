/**
 * Basemap styles.
 *
 * These map to ArcGIS "basemap styles" and are exposed as a documented string
 * union rather than raw native enums. The set below is the v0.1 supported subset
 * and is intentionally small; more styles are added only once verified on both
 * platforms.
 */

/**
 * Supported ArcGIS basemap styles for v0.1.
 *
 * Requires a valid ArcGIS API key configured via `configureArcgis`; these
 * styles are served from ArcGIS and are not available offline.
 */
export type BasemapStyle =
  | 'arcGISStreets'
  | 'arcGISTopographic'
  | 'arcGISNavigation'
  | 'arcGISStreetsNight'
  | 'arcGISDarkGray'
  | 'arcGISLightGray'
  | 'arcGISImagery'
  | 'arcGISImageryStandard'
  | 'arcGISOceans'
  | 'arcGISTerrain';

/** All supported basemap styles, for runtime validation and tests. */
export const BASEMAP_STYLES: readonly BasemapStyle[] = [
  'arcGISStreets',
  'arcGISTopographic',
  'arcGISNavigation',
  'arcGISStreetsNight',
  'arcGISDarkGray',
  'arcGISLightGray',
  'arcGISImagery',
  'arcGISImageryStandard',
  'arcGISOceans',
  'arcGISTerrain',
];

/** Type guard for {@link BasemapStyle}. */
export function isBasemapStyle(value: unknown): value is BasemapStyle {
  return typeof value === 'string' && (BASEMAP_STYLES as readonly string[]).includes(value);
}

/**
 * A country "worldview" — the disputed-boundary rendering used by the basemap.
 * Both platforms support this exact set.
 */
export type BasemapWorldview =
  | 'china'
  | 'india'
  | 'israel'
  | 'japan'
  | 'morocco'
  | 'pakistan'
  | 'southKorea'
  | 'unitedArabEmirates'
  | 'unitedStatesOfAmerica';

/** All supported worldviews, for runtime validation. */
export const BASEMAP_WORLDVIEWS: readonly BasemapWorldview[] = [
  'china',
  'india',
  'israel',
  'japan',
  'morocco',
  'pakistan',
  'southKorea',
  'unitedArabEmirates',
  'unitedStatesOfAmerica',
];

/**
 * Parameters that tune how a {@link BasemapStyle} renders. Applied only when the
 * map uses a `basemap` style (ignored for `webMapItemId`).
 *
 * Note: label-language strategy is intentionally omitted — it is not exposed by
 * the ArcGIS Maps SDK for Swift 300.0 `BasemapStyleParameters`, so keeping the
 * common API to `worldview` preserves cross-platform parity.
 */
export type BasemapStyleParameters = {
  /** Country worldview for disputed boundaries. Omit for the style default. */
  worldview?: BasemapWorldview;
};

/**
 * A basemap style advertised by the ArcGIS basemap-styles service, returned by
 * {@link import('../getBasemapStyles').getBasemapStyles}. Use `styleName` to
 * match against the {@link BasemapStyle} union when applying a selection.
 */
export type BasemapStyleInfo = {
  /** The service style path, e.g. `arcgis/streets`. */
  styleName: string;
  /** Human-readable style name, e.g. `Streets`. */
  name: string;
  /** URL to a preview thumbnail, when the service provides one. */
  thumbnailUri?: string;
};
