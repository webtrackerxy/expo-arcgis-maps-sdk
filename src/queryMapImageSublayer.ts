import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { FeatureQueryResult } from './types/query';

/**
 * Query the features of one sublayer of an ArcGIS map image (dynamic map)
 * service by attribute expression. The sublayer must support queries.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first.
 *
 * @param serviceUrl The `MapServer` service URL.
 * @param sublayerId The numeric id of the sublayer to query.
 * @param where An SQL `WHERE` clause; defaults to all features (`1=1`).
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   bad URL/id, `E_UNSUPPORTED` when the sublayer is not queryable).
 */
export async function queryMapImageSublayer(
  serviceUrl: string,
  sublayerId: number,
  where = '1=1'
): Promise<FeatureQueryResult[]> {
  if (typeof serviceUrl !== 'string' || serviceUrl.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'queryMapImageSublayer requires a non-empty serviceUrl.'
    );
  }
  if (!Number.isInteger(sublayerId) || sublayerId < 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'queryMapImageSublayer requires a non-negative integer sublayerId.'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.queryMapImageSublayer(serviceUrl, sublayerId, where);
  } catch (error) {
    throw toArcgisError(error);
  }
}
