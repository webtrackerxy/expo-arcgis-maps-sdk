import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type {
  QueryDynamicEntitiesOptions,
  QueryDynamicEntitiesResult,
} from './types/dynamicEntity';

/**
 * Query the current dynamic entities of an ArcGIS **stream service** — a
 * one-shot snapshot of each moving entity's latest attributes and position. The
 * service is connected, queried, and disconnected for the call.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   missing url, `E_NATIVE_FAILURE` if the service can't be reached).
 */
export async function queryDynamicEntities(
  options: QueryDynamicEntitiesOptions
): Promise<QueryDynamicEntitiesResult> {
  const url = options?.url?.trim();
  if (!url) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'queryDynamicEntities requires a "url".');
  }
  const trackIds =
    options.trackIds === undefined
      ? undefined
      : options.trackIds.map((id) => {
          if (typeof id !== 'string' || id.length === 0) {
            throw new ArcgisSdkError(
              'E_INVALID_ARGUMENT',
              'Each trackId must be a non-empty string.'
            );
          }
          return id;
        });
  try {
    return await ExpoArcgisMapsSdkModule.queryDynamicEntities({ url, trackIds: trackIds ?? null });
  } catch (error) {
    throw toArcgisError(error);
  }
}
