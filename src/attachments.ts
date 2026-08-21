import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { AttachmentInfo } from './types/attachment';

function requireFeatureRef(fn: string, serviceUrl: string, objectId: number): void {
  if (typeof serviceUrl !== 'string' || serviceUrl.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', `${fn} requires a non-empty serviceUrl.`);
  }
  if (!Number.isInteger(objectId)) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', `${fn} requires an integer objectId.`);
  }
}

/**
 * List the attachments (id, name, content type, size) of a feature in a feature
 * service layer. Binary data is not returned.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function queryFeatureAttachments(
  serviceUrl: string,
  objectId: number
): Promise<AttachmentInfo[]> {
  requireFeatureRef('queryFeatureAttachments', serviceUrl, objectId);
  try {
    return await ExpoArcgisMapsSdkModule.queryFeatureAttachments(serviceUrl, objectId);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Add an attachment to a feature and apply the edit to the service. The
 * attachment bytes are provided as a base64 string.
 *
 * Requires an editable layer and appropriate credentials.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_AUTHENTICATION_FAILED`
 *   when the layer/credentials do not permit editing).
 */
export async function addFeatureAttachment(
  serviceUrl: string,
  objectId: number,
  name: string,
  contentType: string,
  dataBase64: string
): Promise<AttachmentInfo> {
  requireFeatureRef('addFeatureAttachment', serviceUrl, objectId);
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addFeatureAttachment requires a name.');
  }
  if (typeof contentType !== 'string' || contentType.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addFeatureAttachment requires a contentType.');
  }
  if (typeof dataBase64 !== 'string' || dataBase64.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'addFeatureAttachment requires base64 data.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.addFeatureAttachment(
      serviceUrl,
      objectId,
      name,
      contentType,
      dataBase64
    );
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Delete an attachment from a feature and apply the edit to the service.
 *
 * Requires an editable layer and appropriate credentials.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_AUTHENTICATION_FAILED`
 *   when the layer/credentials do not permit editing).
 */
export async function deleteFeatureAttachment(
  serviceUrl: string,
  objectId: number,
  attachmentId: number
): Promise<void> {
  requireFeatureRef('deleteFeatureAttachment', serviceUrl, objectId);
  if (!Number.isInteger(attachmentId)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'deleteFeatureAttachment requires an integer attachmentId.'
    );
  }
  try {
    await ExpoArcgisMapsSdkModule.deleteFeatureAttachment(serviceUrl, objectId, attachmentId);
  } catch (error) {
    throw toArcgisError(error);
  }
}
