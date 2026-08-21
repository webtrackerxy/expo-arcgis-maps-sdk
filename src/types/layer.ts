/**
 * Non-feature operational layers. Each is reconciled by `id` and drawn beneath
 * the graphics overlay. Feature service layers stay in
 * {@link import('./map').ArcgisMapSource.featureLayers} (they support
 * query/edit); these are display-only raster/tile/OGC layers.
 */

import type { ArcgisColor } from './color';
import type { GeographicPoint } from './common';
import type { ArcgisRenderer } from './renderer';

/** Fields common to every layer. */
type LayerBase = {
  /** Stable, caller-assigned id; unique within `layers`. */
  id: string;
  /** Whether the layer is drawn. Defaults to `true`. */
  visible?: boolean;
  /** Layer opacity in `[0, 1]`. Defaults to `1`. */
  opacity?: number;
};

/** An ArcGIS tiled map service (`.../MapServer`). */
export type TiledLayerSource = LayerBase & { type: 'tiled'; url: string };

/**
 * A generic web tile layer from a URL template using `{level}`/`{col}`/`{row}`
 * (and optional `{subDomain}`) placeholders.
 */
export type WebTiledLayerSource = LayerBase & {
  type: 'webTiled';
  /** Tile URL template, e.g. `https://{subDomain}.tile.osm.org/{level}/{col}/{row}.png`. */
  urlTemplate: string;
  /** Sub-domains substituted into `{subDomain}`. */
  subDomains?: string[];
};

/** The built-in OpenStreetMap tile layer. */
export type OpenStreetMapLayerSource = LayerBase & { type: 'openStreetMap' };

/** An ArcGIS vector tile layer from a vector tile style (`.../VectorTileServer`). */
export type VectorTiledLayerSource = LayerBase & { type: 'vectorTiled'; url: string };

/** A KML/KMZ layer from a remote URL. */
export type KmlLayerSource = LayerBase & {
  type: 'kml';
  /** URL to a `.kml` or `.kmz` document. */
  url: string;
  /**
   * Opacity, `0`–`1`, applied to every **ground overlay** in the KML document
   * once it loads (a KML ground overlay is a georeferenced image draped on the
   * map). Omit to keep each overlay's authored opacity.
   */
  groundOverlayOpacity?: number;
};

/** Playback action for a KML tour. See {@link ArcgisMapViewRef.controlKmlTour}. */
export type KmlTourAction = 'play' | 'pause' | 'reset';

/** Options for {@link ArcgisMapViewRef.controlKmlTour}. */
export type KmlTourOptions = {
  /** Id of the {@link KmlLayerSource} layer whose tour is controlled. */
  layerId: string;
  /** `play` starts/resumes, `pause` halts, `reset` returns to the start. */
  action: KmlTourAction;
};

/**
 * A hillshade raster renderer — shades a raster (typically elevation) by a
 * simulated light source. See {@link RasterLayerSource.hillshade}.
 */
export type HillshadeRasterRenderer = {
  /** Sun altitude above the horizon, 0–90 degrees. Defaults to `45`. */
  altitudeDegrees?: number;
  /** Sun azimuth, 0–360 degrees clockwise from north. Defaults to `315`. */
  azimuthDegrees?: number;
  /** Vertical exaggeration factor. Defaults to `1`. */
  zFactor?: number;
};

/**
 * A stretch raster renderer — enhances contrast by mapping pixel values across
 * the display range. See {@link RasterLayerSource.stretch}.
 */
export type StretchRasterRenderer =
  | { type: 'minMax'; min: number; max: number }
  | { type: 'percentClip'; minPercent: number; maxPercent: number }
  | { type: 'standardDeviation'; factor: number };

/**
 * An RGB raster renderer — displays a multi-band (e.g. multispectral or colour)
 * raster by mapping three bands to red/green/blue and stretching them across the
 * display range. See {@link RasterLayerSource.rgb}.
 */
export type RgbRasterRenderer = {
  /** Contrast stretch applied across the bands. Defaults to a min–max estimate. */
  stretch?: StretchRasterRenderer;
  /** Band indices mapped to red, green, blue. Defaults to `[0, 1, 2]`. */
  bandIndices?: [number, number, number];
};

/**
 * A colormap raster renderer — draws each integer pixel value with a fixed
 * colour: pixel value `i` uses `colors[i]`. Best for classified or discrete
 * rasters. See {@link RasterLayerSource.colormap}.
 */
export type ColormapRasterRenderer = {
  /** Ordered colours; pixel value `i` is drawn with `colors[i]` (non-empty). */
  colors: ArcgisColor[];
};

/**
 * How overlapping rasters in an image service's mosaic dataset are ordered and
 * combined. See {@link RasterLayerSource.mosaicRule}.
 */
export type RasterMosaicRule = {
  /**
   * How the candidate rasters are ordered:
   *
   * - `objectID` — by their object id.
   * - `center` — closest to the display center first.
   * - `northwest` — north-west-most first.
   * - `nadir` — closest to straight-down first.
   * - `viewpoint` — from a nominated viewpoint (with `sortValue`).
   * - `attribute` — by a field (`sortField`, `sortValue`).
   * - `seamline` — cut along the mosaic's seamlines.
   */
  method?: 'objectID' | 'center' | 'northwest' | 'nadir' | 'viewpoint' | 'attribute' | 'seamline';
  /** How overlapping pixels are combined. Defaults to `first`. */
  operation?: 'first' | 'last' | 'min' | 'max' | 'mean' | 'blend' | 'sum';
  /** Sort ascending (vs descending) for `attribute`/`viewpoint`. Defaults to `true`. */
  ascending?: boolean;
  /** Field to order by, for `method: 'attribute'`. */
  sortField?: string;
  /** Reference value the sort is measured from, for `attribute`/`viewpoint`. */
  sortValue?: string;
};

/**
 * A blend raster renderer — blends a source (colour) raster with a hillshade
 * computed from an **elevation** raster, giving the colour raster a 3D shaded
 * relief. See {@link RasterLayerSource.blend}.
 */
export type BlendRasterRenderer = {
  /** Absolute path to a local elevation raster whose hillshade is blended in. */
  elevationPath?: string;
  /** URL to an elevation image service (alternative to {@link elevationPath}). */
  elevationUrl?: string;
  /** Sun altitude above the horizon, 0–90 degrees. Defaults to `45`. */
  altitudeDegrees?: number;
  /** Sun azimuth, 0–360 degrees clockwise from north. Defaults to `315`. */
  azimuthDegrees?: number;
  /** Vertical exaggeration factor. Defaults to `1`. */
  zFactor?: number;
  /**
   * A preset colour ramp applied to the elevation before blending. Omit to
   * blend the hillshade with the base raster's own colours.
   */
  colorRamp?: 'elevation' | 'demScreen' | 'demLight';
};

/**
 * A raster layer from an ArcGIS **image service** (`url`) or a local raster
 * **file** (`path`, e.g. a `.tif`). Provide exactly one.
 *
 * At most one renderer is applied, in this order of precedence: `blend`, `rgb`,
 * `colormap`, `stretch`, `hillshade`.
 */
export type RasterLayerSource = LayerBase & {
  type: 'raster';
  /** URL to an ArcGIS image service (`.../ImageServer`). */
  url?: string;
  /** Absolute path to a local raster file. */
  path?: string;
  /**
   * A raster-function chain (the ArcGIS raster-function JSON) applied to the
   * layer's base raster (`url` or `path`) before rendering — e.g. a hillshade
   * or slope function. The chain's raster variable is bound to the base raster.
   * Omit for no function.
   */
  rasterFunction?: string;
  /**
   * Name of a **server-side rendering rule** to request from an image service
   * (`url`). The service advertises named rules (e.g. `"Hillshade"`,
   * `"Aspect"`); the layer requests that pre-processed image. Only valid with a
   * `url` image service. Omit for the service's default.
   */
  renderingRule?: string;
  /** Apply an RGB (multi-band) renderer to the raster. */
  rgb?: RgbRasterRenderer;
  /** Apply a colormap renderer (value → colour) to the raster. */
  colormap?: ColormapRasterRenderer;
  /** Apply a hillshade renderer to the raster (best for elevation data). */
  hillshade?: HillshadeRasterRenderer;
  /** Apply a contrast stretch renderer to the raster. */
  stretch?: StretchRasterRenderer;
  /** Apply a blend renderer (base colours + hillshade from an elevation raster). */
  blend?: BlendRasterRenderer;
  /**
   * Order/combine overlapping rasters in an image service's mosaic dataset. Only
   * valid with a `url` image service.
   */
  mosaicRule?: RasterMosaicRule;
};

/** A feature layer from a local shapefile (`.shp`). */
export type ShapefileLayerSource = LayerBase & {
  type: 'shapefile';
  /** Absolute path to a local `.shp` file. */
  path: string;
  /**
   * Override symbology for the shapefile's features. Omit to use the layer's
   * default renderer. See {@link ArcgisRenderer}.
   */
  renderer?: ArcgisRenderer;
};

/** A feature layer from a feature table in a local GeoPackage (`.gpkg`). */
export type GeoPackageLayerSource = LayerBase & {
  type: 'geoPackage';
  /** Absolute path to a local `.gpkg` file. */
  path: string;
  /** Which feature table in the package to show, by index. Defaults to `0`. */
  tableIndex?: number;
};

/** Visibility of one annotation sublayer, by its name. */
export type AnnotationSublayerVisibility = {
  /** The annotation sublayer's name (e.g. `"Open"` / `"Closed"`). */
  name: string;
  /** Whether that sublayer is shown. */
  visible: boolean;
};

/** A map annotation layer from a feature service annotation sublayer. */
export type AnnotationLayerSource = LayerBase & {
  type: 'annotation';
  /** URL to a feature service annotation sublayer (`.../FeatureServer/N`). */
  url: string;
  /**
   * Per-sublayer visibility by annotation sublayer **name** (an annotation layer
   * often has scale-ranged sublayers like `"Open"` / `"Closed"`). Applied after
   * the layer loads; unlisted sublayers keep their default visibility.
   */
  sublayerVisibility?: AnnotationSublayerVisibility[];
};

/**
 * A dynamic entity layer that shows real-time observations streaming from an
 * ArcGIS **stream service**, with each moving entity's latest position and a
 * short track trail.
 */
/**
 * A custom dynamic-entity feed replayed from a local file, for a
 * {@link DynamicEntityLayerSource} that has no live stream service. The file is
 * newline-delimited JSON (JSONL): each line is a flat object of attributes that
 * must include {@link entityIdField}, {@link longitudeField}, and
 * {@link latitudeField}. Field types are inferred from the first observation
 * (numbers become floating-point fields, everything else text).
 */
export type CustomDynamicEntityFeed = {
  /** Local filesystem path (not a `file://` URI) to the JSONL observations file. */
  observationsPath: string;
  /** Attribute field uniquely identifying each entity/track (e.g. `"MMSI"`). */
  entityIdField: string;
  /** Attribute field holding each observation's longitude (WGS 84). */
  longitudeField: string;
  /** Attribute field holding each observation's latitude (WGS 84). */
  latitudeField: string;
  /** Replay rate in observations per second. Defaults to `10`. Must be > 0. */
  observationsPerSecond?: number;
};

/**
 * A dynamic-entity layer. Provide either {@link url} (a live ArcGIS stream
 * service) or {@link customFeed} (a local file replayed as a custom data
 * source) — exactly one.
 */
export type DynamicEntityLayerSource = LayerBase & {
  type: 'dynamicEntity';
  /** URL to an ArcGIS stream service (`.../StreamServer`). Omit when using `customFeed`. */
  url?: string;
  /** A custom feed replayed from a local file. Omit when using `url`. */
  customFeed?: CustomDynamicEntityFeed;
};

/** A dimension layer from a feature service dimension sublayer. */
export type DimensionLayerSource = LayerBase & {
  type: 'dimension';
  /** URL to a feature service dimension sublayer (`.../FeatureServer/N`). */
  url: string;
};

/**
 * A subtype feature layer — a feature service layer whose subtypes become
 * individually-styleable sublayers.
 */
export type SubtypeFeatureLayerSource = LayerBase & {
  type: 'subtypeFeature';
  /** URL to a feature service layer (`.../FeatureServer/N`). */
  url: string;
};

/**
 * An electronic navigational chart (S-57/ENC) layer, loaded from a local ENC
 * exchange set. The exchange set may contain several cells; they are shown
 * together as one reconciled layer.
 */
export type EncLayerSource = LayerBase & {
  type: 'enc';
  /**
   * Local filesystem path to the ENC exchange set's catalog file (typically a
   * `CATALOG.031`).
   */
  path: string;
  /**
   * Local path to the S-57/S-52 hydrography resources directory the ENC renderer
   * requires (the "hydrography" data the SDK reads symbology and object catalogs
   * from). This sets the process-wide ENC environment the first time an ENC
   * layer loads — provide it on the first ENC layer you show.
   */
  resourcePath?: string;
  /**
   * Optional writable directory where the ENC renderer caches generated SENC
   * data. Defaults to a system temporary directory when omitted.
   */
  sencPath?: string;
};

/** An OGC WMS service. */
export type WmsLayerSource = LayerBase & {
  type: 'wms';
  /** WMS service URL. */
  url: string;
  /** Names of the WMS layers to display. */
  layerNames: string[];
  /**
   * Name of the WMS style to apply to the displayed sublayers (a style the
   * service advertises for those layers). Omit for each layer's default style.
   */
  styleName?: string;
};

/** An OGC WFS feature service, displayed as features. */
export type WfsLayerSource = LayerBase & {
  type: 'wfs';
  /** WFS service URL. */
  url: string;
  /** The WFS feature type (table) name to display. */
  tableName: string;
  /**
   * An OGC WFS `GetFeature` XML request used to populate the layer, instead of
   * the default "all features" query. Lets you filter/limit server-side. When
   * set, `tableName` should match the query's `typeNames`.
   */
  xmlQuery?: string;
};

/** An OGC API - Features collection, displayed as features, with optional CQL2 filtering. */
export type OgcFeatureLayerSource = LayerBase & {
  type: 'ogcFeature';
  /** OGC API - Features service (landing page) URL. */
  url: string;
  /** The collection id within the service to display. */
  collectionId: string;
  /**
   * A CQL2-text filter applied when the collection is loaded, e.g.
   * `"FID < 5000000"`. Omit to load all features.
   */
  cqlFilter?: string;
};

/** An OGC WMTS service. */
export type WmtsLayerSource = LayerBase & {
  type: 'wmts';
  /** WMTS service URL. */
  url: string;
  /** The WMTS layer id to display. */
  layerId: string;
};

/** Visibility override for one sublayer of a map image layer. */
export type MapImageSublayerVisibility = {
  /** The sublayer's numeric id within the map service. */
  sublayerId: number;
  visible: boolean;
};

/** Renderer override for one sublayer of a map image layer. */
export type MapImageSublayerRenderer = {
  /** The sublayer's numeric id within the map service. */
  sublayerId: number;
  /** Symbology to apply to that sublayer, replacing the service default. */
  renderer: ArcgisRenderer;
};

/** An ArcGIS dynamic map image service (`.../MapServer`), with optional sublayer toggles. */
export type MapImageLayerSource = LayerBase & {
  type: 'mapImage';
  url: string;
  /** Per-sublayer visibility overrides, applied once the layer loads. */
  sublayerVisibility?: MapImageSublayerVisibility[];
  /** Per-sublayer renderer overrides, applied once the layer loads. */
  sublayerRenderers?: MapImageSublayerRenderer[];
};

/**
 * A feature collection from an ArcGIS portal item, shown as a
 * `FeatureCollectionLayer`. The portal item's feature-collection data is drawn
 * client-side (unlike a feature service layer, which streams from a service).
 */
export type FeatureCollectionLayerSource = LayerBase & {
  type: 'featureCollection';
  /** ArcGIS portal item id whose data is a feature collection. */
  portalItemId: string;
};

/** One field (column) of an in-memory feature collection table. */
export type FeatureCollectionField = {
  /** Field name; referenced by {@link FeatureCollectionFeature.attributes} keys. */
  name: string;
  /** Field value type. */
  type: 'text' | 'integer' | 'double';
};

/** One point feature for an in-memory feature collection table. */
export type FeatureCollectionFeature = {
  /** The feature's location (WGS 84). */
  point: GeographicPoint;
  /** Attribute values, keyed by {@link FeatureCollectionField.name}. */
  attributes?: Record<string, string | number>;
};

/**
 * A feature collection layer built from an **in-memory table** you define with
 * `fields` and point `features`, drawn client-side. Useful for showing app-owned
 * data that is not backed by a service. Point geometry only.
 */
export type FeatureCollectionTableLayerSource = LayerBase & {
  type: 'featureCollectionFromTable';
  /** The table schema. */
  fields: FeatureCollectionField[];
  /** The point features to add to the table. */
  features: FeatureCollectionFeature[];
};

/**
 * A feature collection layer populated by **querying a feature service** and
 * copying the matching features into a client-side table. Unlike a feature
 * service layer, the results are a static snapshot held in memory.
 */
export type FeatureCollectionQueryLayerSource = LayerBase & {
  type: 'featureCollectionFromQuery';
  /** URL to an ArcGIS Feature Service layer to query. */
  url: string;
  /** SQL-92 `WHERE` clause selecting features to copy. Defaults to `1=1` (all). */
  where?: string;
};

/** Any operational layer that is not itself a group (a group's children). */
export type ArcgisNonGroupLayerSource =
  | TiledLayerSource
  | WebTiledLayerSource
  | OpenStreetMapLayerSource
  | VectorTiledLayerSource
  | WmsLayerSource
  | WfsLayerSource
  | OgcFeatureLayerSource
  | WmtsLayerSource
  | MapImageLayerSource
  | FeatureCollectionLayerSource
  | FeatureCollectionTableLayerSource
  | FeatureCollectionQueryLayerSource
  | KmlLayerSource
  | RasterLayerSource
  | ShapefileLayerSource
  | GeoPackageLayerSource
  | AnnotationLayerSource
  | DimensionLayerSource
  | SubtypeFeatureLayerSource
  | DynamicEntityLayerSource
  | EncLayerSource;

/**
 * A group layer that shows several sublayers as one unit; toggling the group's
 * `visible` shows/hides them together. Nested groups are not supported.
 */
export type GroupLayerSource = LayerBase & {
  type: 'group';
  /** The sublayers drawn (and toggled) together, in draw order. */
  sublayers: ArcgisNonGroupLayerSource[];
};

/** Any non-feature operational layer. */
export type ArcgisLayerSource = ArcgisNonGroupLayerSource | GroupLayerSource;

/** An OGC service kind that can be browsed with `getServiceLayers`. */
export type BrowsableServiceType = 'wms' | 'wfs' | 'ogcFeature';

/**
 * One layer/table/collection advertised by an OGC service, from
 * {@link import('../getServiceLayers').getServiceLayers}. Use `id` as the
 * `layerNames`/`tableName`/`collectionId` when adding the layer.
 */
export type ServiceLayerInfo = {
  /** The service identifier: WMS layer name, WFS table name, or OGC collection id. */
  id: string;
  /** Human-readable title, when the service provides one (falls back to `id`). */
  title: string;
};

/** Options for {@link import('../getServiceLayers').getServiceLayers}. */
export type GetServiceLayersOptions = {
  /** Which OGC service kind `url` points to. */
  type: BrowsableServiceType;
  /** The service URL to browse. */
  url: string;
};
