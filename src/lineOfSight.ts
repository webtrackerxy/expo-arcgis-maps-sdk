import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { ComputeLineOfSightOptions, LineOfSightResult } from './types/lineOfSight';
import { validateGeographicPoint } from './validation';

/**
 * Compute the line of sight between an observer and a target against a local
 * elevation raster (a DEM), for display on a 2D map. Returns the visible and
 * obstructed portions of the sight line as polylines (draw them as graphics)
 * plus the fraction of the target that is visible.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_NATIVE_FAILURE` if the elevation raster can't be read or the
 *   analysis fails).
 */
export async function computeLineOfSight(
  options: ComputeLineOfSightOptions
): Promise<LineOfSightResult> {
  if (typeof options !== 'object' || options === null) {
    throw toArcgisError(
      { code: 'E_INVALID_ARGUMENT', message: 'computeLineOfSight requires options.' },
      'E_INVALID_ARGUMENT'
    );
  }
  const observer = validateGeographicPoint(options.observer);
  const target = validateGeographicPoint(options.target);
  const elevationRasterPath = options.elevationRasterPath?.trim();
  if (!elevationRasterPath) {
    throw toArcgisError(
      {
        code: 'E_INVALID_ARGUMENT',
        message: 'computeLineOfSight requires an "elevationRasterPath".',
      },
      'E_INVALID_ARGUMENT'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.computeLineOfSight({
      observer,
      target,
      elevationRasterPath,
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}
