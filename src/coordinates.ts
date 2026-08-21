import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type { CoordinateFormats } from './types/coordinates';
import { validateGeographicPoint } from './validation';

/**
 * Format a geographic point in several coordinate notations (decimal degrees,
 * DMS, USNG, MGRS, UTM) using the native ArcGIS `CoordinateFormatter`.
 *
 * Purely computational — no network or API key required.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   malformed point).
 */
export async function formatCoordinates(point: GeographicPoint): Promise<CoordinateFormats> {
  const validated = validateGeographicPoint(point);
  try {
    return await ExpoArcgisMapsSdkModule.formatCoordinates(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}
