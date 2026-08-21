import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';

/**
 * Descriptive metadata read from a local shapefile's sidecar info, via
 * {@link getShapefileInfo}. All string fields default to an empty string and
 * `tags` to an empty array when the shapefile carries no metadata.
 */
export type ShapefileInfo = {
  /** Free-text credits/attribution. */
  credits: string;
  /** Long description. */
  description: string;
  /** Short summary. */
  summary: string;
  /** Keyword tags. */
  tags: string[];
  /** Copyright text. */
  copyrightText: string;
};

/**
 * Read a local shapefile's descriptive metadata (credits, description, summary,
 * tags, copyright) from its sidecar info, without adding it to a map. `path` is
 * a filesystem path to a `.shp`.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   missing path, `E_NATIVE_FAILURE` if the shapefile can't be read).
 */
export async function getShapefileInfo(path: string): Promise<ShapefileInfo> {
  if (typeof path !== 'string' || path.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'getShapefileInfo requires a non-empty "path".');
  }
  try {
    return await ExpoArcgisMapsSdkModule.getShapefileInfo(path);
  } catch (error) {
    throw toArcgisError(error);
  }
}
