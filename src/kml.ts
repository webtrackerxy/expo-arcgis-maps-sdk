import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { CreateKmlFileOptions, CreateKmlFileResult, KmlInfo } from './types/kml';
import { validateCreateKmlFileOptions } from './validation';

/**
 * List the contents of a KML/KMZ document without adding it to a map — its node
 * tree (names, kinds, visibility), flattened depth-first. Provide exactly one of
 * `url` (remote `.kml`/`.kmz`) or `path` (local file).
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   missing/ambiguous source, `E_NATIVE_FAILURE` if the document can't be read).
 */
export async function getKmlInfo(source: { url?: string; path?: string }): Promise<KmlInfo> {
  const url = source?.url?.trim();
  const path = source?.path?.trim();
  if ((!url && !path) || (url && path)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'getKmlInfo requires exactly one of "url" or "path".'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.getKmlInfo({ url: url ?? null, path: path ?? null });
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Author a KML/KMZ file from point placemarks and/or a multi-track, and save it
 * to `path`. Returns the written path; load it afterwards with a `kml` layer
 * source.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   invalid options, `E_NATIVE_FAILURE` if the file can't be written).
 */
export async function createKmlFile(options: CreateKmlFileOptions): Promise<CreateKmlFileResult> {
  const validated = validateCreateKmlFileOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.createKmlFile(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}
