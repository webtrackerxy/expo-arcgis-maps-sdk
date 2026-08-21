/** Shared constants and types for the example test screens. */

/** Every test screen receives whether ArcGIS has been configured. */
export type ScreenProps = { ready: boolean };

export const LONDON = { latitude: 51.4123, longitude: -0.3007 };

/** Santa Monica Mountains — Esri's canonical public "Trailheads" feature service. */
export const SANTA_MONICA = { latitude: 34.0909, longitude: -118.7051 };
export const TRAILHEADS_URL =
  'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0';

/** Esri's public "Geology for United States" web map (portal item id). */
export const WEB_MAP_ITEM_ID = '92ad152b9da94dee89b9e387dfe21acd';

/**
 * Esri's public "Naperville water network" web map — the canonical sample whose
 * layers are enabled for offline use. Used by the offline-generation screen.
 */
export const OFFLINE_WEB_MAP_ITEM_ID = 'acc027394bc84c2fb04d1ed317aac674';

/** A small area of interest (WGS 84) within Naperville, IL for offline export. */
export const NAPERVILLE_AREA = {
  minLatitude: 41.7654,
  minLongitude: -88.1567,
  maxLatitude: 41.7734,
  maxLongitude: -88.1445,
};

/**
 * Esri's ArcGIS World Basemap (v2) vector tile service. Exportable to a local
 * `.vtpk` package when a valid API key is configured. Used by the
 * download-vector-tiles screen.
 */
export const VECTOR_TILE_SERVICE_URL =
  'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';

/** A very small area of interest (WGS 84) over central London for tile export. */
export const VECTOR_TILE_AREA = {
  minLatitude: 51.505,
  minLongitude: -0.14,
  maxLatitude: 51.52,
  maxLongitude: -0.11,
};

/**
 * Esri's public "USA" map image (dynamic) service. Its sublayers — 0: cities,
 * 1: highways, 2: states, 3: counties — support queries. Used by the
 * map-image-sublayer query screen.
 */
export const USA_MAP_SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

/**
 * Esri's public "Geneva, Switzerland" web scene (portal item) — the same item
 * used by the official `Display web scene from portal item` sample. Used by the
 * display-web-scene screen.
 */
export const WEB_SCENE_ITEM_ID = 'c6f90b19164c4283884361005faea852';

/** Esri's public San Francisco 3D buildings scene layer. */
export const SF_BUILDINGS_SCENE_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer';

/** A camera looking over downtown San Francisco. */
export const SF_CAMERA = {
  latitude: 37.7908,
  longitude: -122.4017,
  altitude: 600,
  heading: 310,
  pitch: 65,
};

/** A camera pulled back and higher over San Francisco. */
export const SF_CAMERA_WIDE = {
  latitude: 37.7749,
  longitude: -122.4194,
  altitude: 3000,
  heading: 0,
  pitch: 55,
};

/** Esri's public, sync-enabled "WildfireSync" sample feature service. */
export const WILDFIRE_SYNC_SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Sync/WildfireSync/FeatureServer';

/** A small area of interest (WGS 84) for the wildfire geodatabase replica. */
export const WILDFIRE_AREA = {
  minLatitude: 40.0,
  minLongitude: -100.5,
  maxLatitude: 40.2,
  maxLongitude: -100.3,
};

/**
 * Esri's public "DamageAssessment" sample point service. It is editable
 * anonymously, but this legacy sample server (sampleserver6) does NOT accept
 * ArcGIS Location Platform API keys — the SDK attaches the configured key to
 * every request, so edits are rejected (HTTP 498) and surface as
 * `E_AUTHENTICATION_FAILED`. To demo a working edit, point this at an editable
 * hosted feature layer in your own ArcGIS account (which your key can edit).
 */
export const EDITABLE_LAYER_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/DamageAssessment/FeatureServer/0';
