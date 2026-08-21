import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import { isBasemapStyle } from './types/basemap';
import type { CreateAndSaveMapOptions, CreateAndSaveMapResult } from './types/portal';

/**
 * Create a new map with the given basemap and save it as a web map item in the
 * signed-in user's ArcGIS portal. Returns the new item id.
 *
 * Requires an authenticated named user (call
 * {@link import('./auth').authenticate} first) with content-creation
 * privileges; an API key alone cannot create portal content.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_AUTHENTICATION_FAILED` when not signed in / not permitted).
 */
export async function createAndSaveMap(
  options: CreateAndSaveMapOptions
): Promise<CreateAndSaveMapResult> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'createAndSaveMap requires options.');
  }
  if (typeof options.title !== 'string' || options.title.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'createAndSaveMap requires a non-empty title.');
  }
  if (!isBasemapStyle(options.basemap)) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'createAndSaveMap requires a valid basemap.');
  }
  if (options.tags !== undefined && !Array.isArray(options.tags)) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'createAndSaveMap tags must be an array.');
  }
  const normalized: CreateAndSaveMapOptions = {
    title: options.title,
    basemap: options.basemap,
    description: options.description ?? '',
    tags: options.tags ?? [],
  };
  try {
    return await ExpoArcgisMapsSdkModule.createAndSaveMap(normalized);
  } catch (error) {
    throw toArcgisError(error);
  }
}
