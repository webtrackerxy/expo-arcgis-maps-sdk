import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';

/** The updated feature, from {@link updateFeatureAttributes}. */
export type UpdateFeatureResult = {
  /** The object id of the updated feature. */
  objectId: number;
};

/**
 * Update the attributes of a feature in a feature service layer and apply the
 * edit to the service. Combine with
 * {@link import('./types/view').ArcgisMapViewRef.queryRelatedFeatures} to edit a
 * feature's related records (query the related feature, then update it by its
 * related table URL + object id).
 *
 * Requires an editable layer and appropriate credentials.
 *
 * @param serviceUrl The feature service layer URL (a spatial layer or a related
 *   table).
 * @param objectId The object id of the feature to update.
 * @param attributes Field name → new value. `null` clears a field.
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad input, `E_AUTHENTICATION_FAILED` when editing is not permitted).
 */
export async function updateFeatureAttributes(
  serviceUrl: string,
  objectId: number,
  attributes: Record<string, string | number | boolean | null>
): Promise<UpdateFeatureResult> {
  if (typeof serviceUrl !== 'string' || serviceUrl.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'updateFeatureAttributes requires a non-empty serviceUrl.'
    );
  }
  if (!Number.isInteger(objectId)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'updateFeatureAttributes requires an integer objectId.'
    );
  }
  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'updateFeatureAttributes requires an attributes object.'
    );
  }
  if (Object.keys(attributes).length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'updateFeatureAttributes requires at least one attribute.'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.updateFeatureAttributes({
      serviceUrl,
      objectId,
      attributes,
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}
