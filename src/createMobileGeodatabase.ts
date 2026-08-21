import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { CreateMobileGeodatabaseOptions, MobileGeodatabaseResult } from './types/geodatabase';

const FIELD_TYPES = ['text', 'integer', 'double', 'date'];
const GEOMETRY_TYPES = ['point', 'polyline', 'polygon'];

/**
 * Create a new mobile geodatabase (`.geodatabase`) file with one feature table,
 * add a few sample features, and return the file path. The file is created in
 * the app's cache directory; delete it with
 * {@link import('./deleteOfflineMap').deleteOfflineMap} when done.
 *
 * A fully local operation — no network or API key required.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_NATIVE_FAILURE` on a filesystem/creation error).
 */
export async function createMobileGeodatabase(
  options: CreateMobileGeodatabaseOptions
): Promise<MobileGeodatabaseResult> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'createMobileGeodatabase requires options.');
  }
  if (typeof options.tableName !== 'string' || options.tableName.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'A non-empty "tableName" is required.');
  }
  if (!GEOMETRY_TYPES.includes(options.geometryType)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      `geometryType must be one of ${GEOMETRY_TYPES.join(', ')}.`
    );
  }
  if (!Array.isArray(options.fields) || options.fields.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'At least one field is required.');
  }
  for (const field of options.fields) {
    if (typeof field.name !== 'string' || field.name.trim().length === 0) {
      throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'Each field requires a non-empty "name".');
    }
    if (!FIELD_TYPES.includes(field.type)) {
      throw new ArcgisSdkError(
        'E_INVALID_ARGUMENT',
        `Field "${field.name}" type must be one of ${FIELD_TYPES.join(', ')}.`
      );
    }
  }
  try {
    return await ExpoArcgisMapsSdkModule.createMobileGeodatabase(options);
  } catch (error) {
    throw toArcgisError(error);
  }
}
