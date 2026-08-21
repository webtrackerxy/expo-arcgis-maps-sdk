import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { BasemapStyleInfo } from './types/basemap';

/**
 * List the basemap styles advertised by the ArcGIS basemap-styles service, for
 * building a dynamic basemap gallery. Each entry's `styleName` (e.g.
 * `arcgis/streets`) can be matched against the {@link BasemapStyle} union to
 * apply a selection via the `map.basemap` prop.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first.
 *
 * @throws An {@link import('./errors').ArcgisError}
 *   (`E_NATIVE_FAILURE`/`E_AUTHENTICATION_FAILED` on service error).
 */
export async function getBasemapStyles(): Promise<BasemapStyleInfo[]> {
  try {
    return await ExpoArcgisMapsSdkModule.getBasemapStyles();
  } catch (error) {
    throw toArcgisError(error);
  }
}
