/** Serializable DTOs for offline-map generation. */

import type { Job } from './job';

/**
 * A geographic bounding box (WGS 84 degrees) describing the area to take
 * offline. `min`/`max` are inclusive corners.
 */
export type GeographicEnvelope = {
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
};

/** Options for {@link import('../offline').startOfflineMapJob}. */
export type OfflineMapJobOptions = {
  /** ArcGIS portal item id of the web map to take offline. */
  webMapItemId: string;
  /** The area of interest to download. */
  areaOfInterest: GeographicEnvelope;
  /**
   * Smallest (most zoomed-out) scale denominator to include, e.g. `500000`.
   * Defaults to the web map's offline settings when omitted.
   */
  minScale?: number;
  /**
   * Largest (most zoomed-in) scale denominator to include, e.g. `5000`.
   * Defaults to the web map's offline settings when omitted.
   */
  maxScale?: number;
  /**
   * Absolute path to a local basemap file (`.tpk`/`.tpkx`/`.vtpk`) to use
   * instead of downloading the web map's basemap. When set, only the operational
   * layers are taken offline, keeping the job small and letting a pre-provisioned
   * basemap supply the tiles.
   */
  localBasemapPath?: string;
};

/** The result of a successful offline-map job. */
export type OfflineMapResult = {
  /** Absolute filesystem path to the generated mobile map package directory. */
  path: string;
  /**
   * Non-fatal messages for layers/tables that could not be fully taken offline.
   * Empty when every layer succeeded.
   */
  layerErrors: string[];
};

/**
 * A handle to a running offline-map job. Returned by
 * {@link import('../offline').startOfflineMapJob}; the underlying native job is
 * keyed by {@link Job.id}.
 */
export type OfflineMapJob = Job<OfflineMapResult>;

/** Options for {@link import('../offline').startExportVectorTilesJob}. */
export type ExportVectorTilesOptions = {
  /** URL of an ArcGIS vector tile service (`.../VectorTileServer`). */
  serviceUrl: string;
  /** The area to export. */
  area: GeographicEnvelope;
  /**
   * Smallest (most zoomed-in) scale denominator to include, e.g. `50000`.
   * Limits the export size; omit to use the service's full range (can be large).
   */
  maxScale?: number;
};

/** The result of a successful export-vector-tiles job. */
export type ExportVectorTilesResult = {
  /** Absolute filesystem path to the generated `.vtpk` vector tile package. */
  path: string;
};

/** A handle to a running export-vector-tiles job. */
export type ExportVectorTilesJob = Job<ExportVectorTilesResult>;
