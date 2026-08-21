import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type { GeocodeResult } from './types/geocode';
import { validateGeographicPoint } from './validation';

/**
 * Forward geocode: find candidate locations for an address or place name using
 * the ArcGIS World Geocoding Service.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first (the
 * service is billed against your API key).
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   empty input, `E_NATIVE_FAILURE`/`E_AUTHENTICATION_FAILED` on service error).
 */
export async function geocode(address: string): Promise<GeocodeResult[]> {
  if (typeof address !== 'string' || address.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'geocode requires a non-empty address.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.geocode(address);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Forward geocode against a local, offline locator (a bundled `.loc` locator or
 * a mobile map package's locator) instead of the online service. Works with no
 * network.
 *
 * @param locatorPath Absolute filesystem path to the `.loc` locator.
 * @param address The address or place name to geocode.
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   empty input, `E_NATIVE_FAILURE` when the locator cannot be opened).
 */
export async function geocodeOffline(
  locatorPath: string,
  address: string
): Promise<GeocodeResult[]> {
  if (typeof locatorPath !== 'string' || locatorPath.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'geocodeOffline requires a locator path.');
  }
  if (typeof address !== 'string' || address.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'geocodeOffline requires a non-empty address.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.geocodeOffline(locatorPath, address);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Reverse geocode: find the address nearest to a location using the ArcGIS
 * World Geocoding Service.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function reverseGeocode(point: GeographicPoint): Promise<GeocodeResult[]> {
  const validated = validateGeographicPoint(point);
  try {
    return await ExpoArcgisMapsSdkModule.reverseGeocode(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}
