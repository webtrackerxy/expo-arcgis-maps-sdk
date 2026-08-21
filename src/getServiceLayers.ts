import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { GetServiceLayersOptions, ServiceLayerInfo } from './types/layer';

/**
 * Browse the layers/collections advertised by an OGC service (WMS, WFS, or OGC
 * API - Features), for building a layer picker. Each entry's `id` is what you
 * pass as `layerNames`/`tableName`/`collectionId` when adding the layer.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   missing url, `E_NATIVE_FAILURE`/`E_AUTHENTICATION_FAILED` on service error).
 */
export async function getServiceLayers(
  options: GetServiceLayersOptions
): Promise<ServiceLayerInfo[]> {
  if (
    !options ||
    (options.type !== 'wms' && options.type !== 'wfs' && options.type !== 'ogcFeature')
  ) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'getServiceLayers requires a valid "type".');
  }
  if (typeof options.url !== 'string' || options.url.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'getServiceLayers requires a non-empty "url".');
  }
  try {
    return await ExpoArcgisMapsSdkModule.getServiceLayers(options.type, options.url);
  } catch (error) {
    throw toArcgisError(error);
  }
}
