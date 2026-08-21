import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { FeatureQueryResult, TimeExtentQueryOptions } from './types/query';

/**
 * Query a time-aware feature service layer for the features whose time falls
 * within a time extent (`startTime`–`endTime`, epoch milliseconds), optionally
 * combined with a `WHERE` clause. Returns each matching feature's attributes and
 * a representative location.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_NATIVE_FAILURE` if the query fails).
 */
export async function queryFeaturesInTimeExtent(
  options: TimeExtentQueryOptions
): Promise<FeatureQueryResult[]> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'queryFeaturesInTimeExtent requires options.');
  }
  const serviceUrl = options.serviceUrl?.trim();
  if (!serviceUrl) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'queryFeaturesInTimeExtent requires a "serviceUrl".'
    );
  }
  if (!Number.isFinite(options.startTime) || !Number.isFinite(options.endTime)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'queryFeaturesInTimeExtent requires numeric "startTime" and "endTime" (epoch ms).'
    );
  }
  if (options.endTime < options.startTime) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'queryFeaturesInTimeExtent endTime must be >= startTime.'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.queryFeaturesInTimeExtent({
      serviceUrl,
      startTime: options.startTime,
      endTime: options.endTime,
      whereClause: options.whereClause ?? null,
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}
