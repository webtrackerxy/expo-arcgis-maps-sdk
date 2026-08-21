import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { AddPortalItemOptions, AddPortalItemResult } from './types/portal';

/**
 * Add a new feature-collection item to the signed-in user's ArcGIS portal from
 * a JSON content string. Returns the new item id.
 *
 * Requires an authenticated named user (call
 * {@link import('./auth').authenticate} first) with content-creation
 * privileges; an API key alone cannot add portal content.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options, `E_AUTHENTICATION_FAILED` when not signed in / not permitted).
 */
export async function addPortalItem(options: AddPortalItemOptions): Promise<AddPortalItemResult> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addPortalItem requires options.');
  }
  if (typeof options.title !== 'string' || options.title.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addPortalItem requires a non-empty title.');
  }
  if (typeof options.json !== 'string' || options.json.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addPortalItem requires a non-empty json.');
  }
  const normalized: AddPortalItemOptions = {
    title: options.title,
    json: options.json,
    description: options.description ?? '',
  };
  try {
    return await ExpoArcgisMapsSdkModule.addPortalItem(normalized);
  } catch (error) {
    throw toArcgisError(error);
  }
}
