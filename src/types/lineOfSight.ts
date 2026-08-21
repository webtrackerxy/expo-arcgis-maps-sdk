import type { GeographicPoint } from './common';
import type { ArcgisGeometry } from './geometry';

/** Options for {@link import('../lineOfSight').computeLineOfSight}. */
export type ComputeLineOfSightOptions = {
  /** Observer location (WGS 84); `altitude` is the eye height above the surface. */
  observer: GeographicPoint;
  /** Target location (WGS 84); `altitude` is the height above the surface. */
  target: GeographicPoint;
  /**
   * Local filesystem path to an elevation raster (a DEM, e.g. a `.tif`) the
   * line of sight is computed against.
   */
  elevationRasterPath: string;
};

/** Result of {@link import('../lineOfSight').computeLineOfSight}. */
export type LineOfSightResult = {
  /** The visible portion of the sight line (a polyline), if any. */
  visibleLine?: ArcgisGeometry;
  /** The obstructed portion of the sight line (a polyline), if any. */
  obstructedLine?: ArcgisGeometry;
  /**
   * Fraction of the target that is visible from the observer: `1` fully
   * visible, `0` fully obstructed.
   */
  targetVisibility: number;
};
