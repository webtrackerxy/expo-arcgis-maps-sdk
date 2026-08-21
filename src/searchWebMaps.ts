import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { WebMapSearchResult } from './types/portal';

/**
 * Search ArcGIS Online for public web maps matching `query`, returning up to a
 * page of results (item id, title, snippet, owner). Feed a result's `itemId`
 * back into {@link ArcgisMapSource.webMapItemId} to open it.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for an
 *   empty query).
 */
export async function searchWebMaps(query: string): Promise<WebMapSearchResult[]> {
  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'searchWebMaps requires a non-empty query.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.searchWebMaps(query);
  } catch (error) {
    throw toArcgisError(error);
  }
}
