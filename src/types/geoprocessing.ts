import type { GeographicPoint } from './common';
import type { ArcgisGeometry } from './geometry';
import type { Job } from './job';

/**
 * A named input bound to a geoprocessing task's parameter. The `name` must match
 * a parameter name the service declares.
 */
export type GeoprocessingInput =
  | { name: string; type: 'string'; value: string }
  | { name: string; type: 'double'; value: number }
  | { name: string; type: 'point'; point: GeographicPoint };

/** Options for {@link import('../geoprocessing').startGeoprocessingJob}. */
export type GeoprocessingJobOptions = {
  /** URL to a geoprocessing task (`.../GPServer/<task-name>`). */
  serviceUrl: string;
  /** Named inputs bound to the task's parameters. */
  inputs: GeoprocessingInput[];
};

/** Result of a geoprocessing job. */
export type GeoprocessingJobResult = {
  /**
   * URL of the result map-image layer, when the service produces one (e.g. a
   * hotspot-analysis raster). Add it to a map with a `mapImage` layer source.
   */
  mapImageUrl?: string;
  /**
   * Result geometries (WGS 84) from the task's feature outputs (e.g. a viewshed
   * polygon). Empty when the task returns no features. Draw them as graphics.
   */
  features: ArcgisGeometry[];
};

/** A running geoprocessing {@link Job}. */
export type GeoprocessingJob = Job<GeoprocessingJobResult>;
