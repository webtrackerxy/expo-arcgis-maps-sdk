import type { BasemapStyle, BasemapStyleParameters } from './basemap';
import type { ClusteringOptions } from './cluster';
import type { ArcgisColor } from './color';
import type { GraphicSource } from './graphics';
import type { LabelDefinition } from './label';
import type { ArcgisLayerSource } from './layer';
import type { GeographicEnvelope } from './offline';
import type { ArcgisRenderer } from './renderer';
import type { Viewpoint } from './viewpoint';

/**
 * A feature service layer to display on the map.
 *
 * Large feature datasets stay native: only the service URL and display metadata
 * cross the boundary, never the feature contents themselves (see CLAUDE.md
 * "Performance").
 */
export type FeatureLayerSource = {
  /**
   * Stable, caller-assigned identifier. Used to reconcile layers across prop
   * updates (add / update / remove) without rebuilding the map. Must be unique
   * within a single `map`.
   */
  id: string;
  /**
   * URL to an ArcGIS Feature Service layer, e.g.
   * `https://services.arcgis.com/.../FeatureServer/0`.
   */
  url: string;
  /** Whether the layer is drawn. Defaults to `true`. */
  visible?: boolean;
  /** Layer opacity in `[0, 1]`. Defaults to `1`. */
  opacity?: number;
  /**
   * How to symbolize the layer's features. Overrides the service's default
   * renderer. Omit to use the service default. See {@link ArcgisRenderer}.
   */
  renderer?: ArcgisRenderer;
  /**
   * SQL-92 `WHERE` clause that limits which features the layer displays and
   * queries (e.g. `"POP2007 > 1000000"`). Omit to show all features.
   */
  definitionExpression?: string;
  /**
   * Text labels drawn for the layer's features. Providing a non-empty array
   * enables labeling; omit or pass `[]` to disable. See {@link LabelDefinition}.
   */
  labels?: LabelDefinition[];
  /**
   * Cluster nearby points into aggregated symbols. Omit to disable. See
   * {@link ClusteringOptions}.
   */
  clustering?: ClusteringOptions;
  /**
   * How the layer fetches features from its service. `onInteractionCache`
   * (default) fetches and caches as you navigate; `onInteractionNoCache` always
   * refetches; `manualCache` only fetches when explicitly populated.
   */
  featureRequestMode?: 'onInteractionCache' | 'onInteractionNoCache' | 'manualCache';
  /**
   * Shift this layer's temporal data by a fixed offset so it can be compared
   * against another time period on the same map (e.g. overlay data from ten
   * years ago onto the current extent). Omit for no offset. The `value` may be
   * negative to shift into the past.
   */
  timeOffset?: TimeOffset;
  /**
   * How the layer renders its features. `static` renders to a cached image
   * (best for many, rarely-changing features); `dynamic` re-renders every frame
   * (best for smoothly moving/rotating features); `automatic` (default) lets the
   * SDK choose. Takes effect when the layer next loads.
   */
  renderingMode?: 'automatic' | 'static' | 'dynamic';
};

/** Units for a {@link TimeOffset}. */
export type TimeUnit =
  | 'centuries'
  | 'decades'
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

/** A signed duration used to shift a layer's time — see {@link FeatureLayerSource.timeOffset}. */
export type TimeOffset = {
  /** Magnitude of the offset in `unit`; may be negative to shift into the past. */
  value: number;
  /** The time unit of `value`. */
  unit: TimeUnit;
};

/**
 * The declarative source of a map.
 *
 * A map is defined **either** by a `basemap` style (optionally with feature
 * layers) **or** by a `webMapItemId` referencing a portal web map. Providing
 * both is rejected with `E_INVALID_ARGUMENT`.
 *
 * This object is the source of truth for durable map state; one-time actions
 * (animate, identify, export) go through the imperative ref instead.
 */
/**
 * A location-driven geotrigger: a fence built by buffering the map's graphics,
 * monitored against the device location. Fires `onGeotriggerNotification`.
 */
export type MapGeotrigger = {
  /** Stable id, echoed in the notification event's `geotriggerId`. */
  id: string;
  /** Distance (metres) the fence is grown around each graphic. Defaults to `0`. */
  bufferMeters?: number;
  /**
   * Which crossings fire: `enter`, `exit`, or `enterOrExit` (default). See
   * {@link import('./events').GeotriggerNotificationEventPayload}.
   */
  ruleType?: 'enter' | 'exit' | 'enterOrExit';
};

/**
 * A basemap built from a single tiled or vector-tiled base layer, instead of a
 * named {@link BasemapStyle}. Use this to show a tiled map service as the
 * basemap, or a vector tile layer with a custom style from a portal item.
 * Provide either {@link url} or {@link itemId}.
 */
export type BasemapLayerSource = {
  /**
   * The base-layer kind: `tiled` (an ArcGIS tiled map service) or `vectorTiled`
   * (a vector tile layer, e.g. a custom style).
   */
  type: 'tiled' | 'vectorTiled';
  /** Service URL of the tiled / vector-tile layer. Provide this or `itemId`. */
  url?: string;
  /**
   * ArcGIS portal item id of the layer — e.g. a vector tile layer item carrying
   * a custom style. Provide this or `url`.
   */
  itemId?: string;
};

export type ArcgisMapSource = {
  /**
   * Basemap style to display. Mutually exclusive with `webMapItemId` and
   * `basemapLayer`. When none is provided, the map has no basemap and only shows
   * added layers.
   */
  basemap?: BasemapStyle;
  /**
   * A basemap built from a tiled / vector-tiled base layer (see
   * {@link BasemapLayerSource}). Takes precedence over `basemap` when set;
   * ignored for `webMapItemId`.
   */
  basemapLayer?: BasemapLayerSource;
  /**
   * Tune how the `basemap` style renders (label language, worldview). Applied
   * only when `basemap` is a style; ignored for `webMapItemId`. See
   * {@link BasemapStyleParameters}.
   */
  basemapStyleParameters?: BasemapStyleParameters;
  /**
   * ArcGIS portal item ID of a web map to load. Mutually exclusive with
   * `basemap` and `featureLayers` (a web map defines its own layers).
   */
  webMapItemId?: string;
  /**
   * Absolute path to a local mobile map package (`.mmpk`) whose first map is
   * displayed. Mutually exclusive with `basemap` and `webMapItemId` (the package
   * defines its own basemap and layers). Loaded asynchronously.
   */
  mobileMapPackagePath?: string;
  /**
   * WKID of the spatial reference to create the map in. Only applied when the map
   * has **no** `basemap` and no `webMapItemId` (a basemap/web map dictates its
   * own spatial reference); operational layers are then reprojected into this
   * reference. Omit to use the default Web Mercator.
   */
  spatialReferenceWkid?: number;
  /** Viewpoint applied when the map first loads. */
  initialViewpoint?: Viewpoint;
  /**
   * Feature service layers, reconciled by {@link FeatureLayerSource.id}. Not
   * allowed together with `webMapItemId`.
   */
  featureLayers?: FeatureLayerSource[];
  /**
   * Non-feature operational layers (tiled, WMS, WMTS, WFS, vector tiles, …),
   * reconciled by {@link import('./layer').ArcgisLayerSource} `id` and drawn
   * beneath graphics. Not allowed together with `webMapItemId`.
   */
  layers?: ArcgisLayerSource[];
  /**
   * Graphics drawn on a single overlay above all layers, reconciled by
   * {@link GraphicSource.id}.
   */
  graphics?: GraphicSource[];
  /**
   * A renderer applied to the graphics overlay, symbolizing every graphic and
   * overriding their individual `symbol`s. Omit to use each graphic's own symbol.
   */
  graphicsRenderer?: ArcgisRenderer;
  /**
   * For a **floor-aware** map (one with a floor manager), the level to show, by
   * its `levelNumber`. Every level with a different number is hidden. Omit to
   * leave the map's default floor visibility. Typically used with a
   * `webMapItemId` referencing a floor-aware web map.
   */
  floorLevel?: number;
  /**
   * Location-driven geotriggers: fences grown around the map's graphics that the
   * device location is monitored against, emitting `onGeotriggerNotification`
   * when the location enters/exits a fence. Requires `locationDisplay.enabled`.
   */
  geotriggers?: MapGeotrigger[];
  /**
   * Smallest (most zoomed-**out**) scale denominator the map can display, e.g.
   * `10_000_000`. A larger number is more zoomed out, so this is the *upper*
   * bound on the scale value. Omit (or `0`) for no minimum. Must be positive and,
   * when both are set, `>= maxScale`. Ignored when `webMapItemId` is used (a web
   * map defines its own constraints).
   */
  minScale?: number;
  /**
   * Largest (most zoomed-**in**) scale denominator the map can display, e.g.
   * `1_000`. A smaller number is more zoomed in, so this is the *lower* bound on
   * the scale value. Omit (or `0`) for no maximum. Must be positive and, when
   * both are set, `<= minScale`. Ignored when `webMapItemId` is used.
   */
  maxScale?: number;
  /**
   * Scale denominator at which symbols and labels are drawn at their configured
   * size; they scale proportionally as the map zooms away from it. Omit (or `0`)
   * to disable reference-scale behaviour. Must be positive. Ignored when
   * `webMapItemId` is used.
   */
  referenceScale?: number;
  /**
   * Geographic bounding box (WGS 84 degrees) the map may be panned/zoomed within;
   * the user cannot navigate outside it. Omit for no limit. Ignored when
   * `webMapItemId` is used.
   */
  maxExtent?: GeographicEnvelope;
  /**
   * Solid color drawn behind the map, visible wherever the basemap and layers do
   * not cover the view (e.g. beyond the data or while tiles load). A hex string
   * (`#RRGGBB` or `#RRGGBBAA`). Ignored when `webMapItemId` is used.
   */
  backgroundColor?: ArcgisColor;
};
