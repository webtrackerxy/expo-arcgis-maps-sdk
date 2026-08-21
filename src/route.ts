import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type {
  ClosestFacilityOptions,
  ClosestFacilityResult,
  ClosestFacilityRoute,
  FacilityServiceArea,
  RouteResult,
  ServiceAreaOptions,
  ServiceAreaResult,
  SolveRouteOptions,
} from './types/route';
import { validateArcgisGeometry, validateGeographicPoint } from './validation';

/**
 * Solve the best driving route through `stops` (in order) using the ArcGIS
 * World Routing Service, optionally avoiding polygon barriers.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first (the
 * service is billed against your API key).
 *
 * @param stops At least two locations, visited in order.
 * @param options Optional polygon barriers to route around.
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   fewer than two stops, `E_NATIVE_FAILURE` when no route is found).
 */
export async function solveRoute(
  stops: GeographicPoint[],
  options: SolveRouteOptions = {}
): Promise<RouteResult> {
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'solveRoute requires at least two stops.');
  }
  const validated = stops.map(validateGeographicPoint);
  const barriers = (options.polygonBarriers ?? []).map((geometry) => {
    const g = validateArcgisGeometry(geometry);
    if (g.type !== 'polygon') {
      throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'solveRoute barriers must be polygons.');
    }
    return g;
  });
  try {
    return await ExpoArcgisMapsSdkModule.solveRoute(validated, barriers);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Find the facility nearest an incident and the route to it, using the ArcGIS
 * World Closest Facility Service.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function findClosestFacility(
  options: ClosestFacilityOptions
): Promise<ClosestFacilityResult> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findClosestFacility requires options.');
  }
  const incident = validateGeographicPoint(options.incident);
  if (!Array.isArray(options.facilities) || options.facilities.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findClosestFacility requires facilities.');
  }
  const facilities = options.facilities.map(validateGeographicPoint);
  try {
    return await ExpoArcgisMapsSdkModule.findClosestFacility(incident, facilities);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Solve a route through `stops` using a local transportation network dataset in
 * a mobile geodatabase (offline routing — no network). The geodatabase must
 * contain a network dataset with the given name.
 *
 * @param geodatabasePath Absolute path to the `.geodatabase` with the network.
 * @param networkName The transportation network dataset name (e.g. `Streets_ND`).
 * @param stops At least two locations, visited in order.
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function solveRouteInNetwork(
  geodatabasePath: string,
  networkName: string,
  stops: GeographicPoint[]
): Promise<RouteResult> {
  if (typeof geodatabasePath !== 'string' || geodatabasePath.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'solveRouteInNetwork requires a geodatabasePath.'
    );
  }
  if (typeof networkName !== 'string' || networkName.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'solveRouteInNetwork requires a networkName.');
  }
  if (!Array.isArray(stops) || stops.length < 2) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'solveRouteInNetwork requires at least two stops.'
    );
  }
  const validated = stops.map(validateGeographicPoint);
  try {
    return await ExpoArcgisMapsSdkModule.solveRouteInNetwork(
      geodatabasePath,
      networkName,
      validated
    );
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Find, for each incident, its nearest facility and the route to it, using the
 * ArcGIS World Closest Facility Service. Incidents with no reachable facility
 * are omitted from the result.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function findClosestFacilities(
  incidents: GeographicPoint[],
  facilities: GeographicPoint[]
): Promise<ClosestFacilityRoute[]> {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findClosestFacilities requires incidents.');
  }
  if (!Array.isArray(facilities) || facilities.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findClosestFacilities requires facilities.');
  }
  const validatedIncidents = incidents.map(validateGeographicPoint);
  const validatedFacilities = facilities.map(validateGeographicPoint);
  try {
    return await ExpoArcgisMapsSdkModule.findClosestFacilities(
      validatedIncidents,
      validatedFacilities
    );
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Compute drive-time service-area polygons around a facility, using the ArcGIS
 * World Service Area Service.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function findServiceArea(options: ServiceAreaOptions): Promise<ServiceAreaResult> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findServiceArea requires options.');
  }
  const facility = validateGeographicPoint(options.facility);
  if (
    !Array.isArray(options.breaksMinutes) ||
    options.breaksMinutes.length === 0 ||
    options.breaksMinutes.some((b) => typeof b !== 'number' || !Number.isFinite(b) || b <= 0)
  ) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'findServiceArea requires positive "breaksMinutes".'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.findServiceArea(facility, options.breaksMinutes);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Compute drive-time service-area polygons around each of several facilities,
 * using the ArcGIS World Service Area Service. Each result groups the polygons
 * for one facility.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function findServiceAreas(
  facilities: GeographicPoint[],
  breaksMinutes: number[]
): Promise<FacilityServiceArea[]> {
  if (!Array.isArray(facilities) || facilities.length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'findServiceAreas requires facilities.');
  }
  if (
    !Array.isArray(breaksMinutes) ||
    breaksMinutes.length === 0 ||
    breaksMinutes.some((b) => typeof b !== 'number' || !Number.isFinite(b) || b <= 0)
  ) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'findServiceAreas requires positive "breaksMinutes".'
    );
  }
  const validated = facilities.map(validateGeographicPoint);
  try {
    return await ExpoArcgisMapsSdkModule.findServiceAreas(validated, breaksMinutes);
  } catch (error) {
    throw toArcgisError(error);
  }
}
