import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { ConfigureArcgisOptions } from './types/config';
import { validateConfigureOptions } from './validation';

/**
 * Configure global ArcGIS state for the app.
 *
 * Call once, before mounting an {@link import('./ArcgisMapView').ArcgisMapView}.
 * Configuration is process-global on both platforms.
 *
 * @param options Global configuration; see {@link ConfigureArcgisOptions}.
 * @throws An {@link import('./errors').ArcgisError} with code
 *   `E_INVALID_ARGUMENT` for bad input, or `E_NATIVE_FAILURE` /
 *   `E_UNSUPPORTED` if the native layer rejects.
 *
 * @example
 * ```ts
 * await configureArcgis({ apiKey: process.env.EXPO_PUBLIC_ARCGIS_API_KEY! });
 * ```
 */
export async function configureArcgis(options: ConfigureArcgisOptions): Promise<void> {
  // Validation throws a stable E_INVALID_ARGUMENT before touching native.
  const validated = validateConfigureOptions(options);
  try {
    await ExpoArcgisMapsSdkModule.configure(validated);
  } catch (error) {
    // Normalize any native rejection into the stable error contract. Never let
    // raw native exception text become the public error.
    throw toArcgisError(error, 'E_NATIVE_FAILURE');
  }
}
