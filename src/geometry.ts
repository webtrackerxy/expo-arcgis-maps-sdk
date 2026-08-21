import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type { GeographicPoint } from './types/common';
import type {
  ArcgisGeometry,
  GeodesicEllipseOptions,
  GeodesicSectorOptions,
  GeometryCombineOperation,
  GeometryRelationships,
  ProjectedPoint,
} from './types/geometry';
import type { GeographicEnvelope } from './types/offline';
import { validateArcgisGeometry, validateGeographicPoint } from './validation';

const COMBINE_OPERATIONS: GeometryCombineOperation[] = [
  'union',
  'intersection',
  'difference',
  'symmetricDifference',
];

function invalid(message: string): never {
  throw new ArcgisSdkError('E_INVALID_ARGUMENT', message);
}

/**
 * The geometry operations below are pure computations on the native
 * `GeometryEngine`; none require configuration or a network connection. Inputs
 * and outputs are WGS 84 {@link ArcgisGeometry} DTOs; multi-part results are
 * returned as their first part.
 */

/**
 * Buffer a geometry by a geodesic distance in meters, returning the buffer
 * polygon.
 */
export async function bufferGeometry(
  geometry: ArcgisGeometry,
  distanceMeters: number
): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  if (
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters <= 0
  ) {
    invalid('bufferGeometry requires a positive "distanceMeters".');
  }
  try {
    return await ExpoArcgisMapsSdkModule.bufferGeometry(validated, distanceMeters);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Buffer a geometry by a planar distance in meters, returning the buffer
 * polygon. The geometry is projected to Web Mercator, buffered in projected
 * meters, and projected back — so the result carries Web Mercator's distance
 * distortion (it grows away from the equator). Compare with
 * {@link bufferGeometry}, whose geodesic buffer is distortion-free; the pair
 * demonstrates why geodesic buffers are preferred at higher latitudes.
 */
export async function planarBufferGeometry(
  geometry: ArcgisGeometry,
  distanceMeters: number
): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  if (
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters <= 0
  ) {
    invalid('planarBufferGeometry requires a positive "distanceMeters".');
  }
  try {
    return await ExpoArcgisMapsSdkModule.planarBufferGeometry(validated, distanceMeters);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Compute the convex hull enclosing one or more geometries. */
export async function convexHull(geometries: ArcgisGeometry[]): Promise<ArcgisGeometry> {
  if (!Array.isArray(geometries) || geometries.length === 0) {
    invalid('convexHull requires a non-empty array of geometries.');
  }
  const validated = geometries.map(validateArcgisGeometry);
  try {
    return await ExpoArcgisMapsSdkModule.convexHull(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Clip a geometry to a geographic bounding box. */
export async function clipGeometry(
  geometry: ArcgisGeometry,
  envelope: GeographicEnvelope
): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  if (typeof envelope !== 'object' || envelope === null) {
    invalid('clipGeometry requires an envelope.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.clipGeometry(validated, envelope);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Cut a geometry with a polyline cutter, returning the resulting pieces. */
export async function cutGeometry(
  geometry: ArcgisGeometry,
  cutter: ArcgisGeometry
): Promise<ArcgisGeometry[]> {
  const validated = validateArcgisGeometry(geometry);
  const validatedCutter = validateArcgisGeometry(cutter);
  if (validatedCutter.type !== 'polyline') {
    invalid('cutGeometry cutter must be a polyline geometry.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.cutGeometry(validated, validatedCutter);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Project a WGS 84 point into another spatial reference (by WKID). */
export async function projectPoint(
  point: GeographicPoint,
  toWkid: number,
  transformationName?: string
): Promise<ProjectedPoint> {
  const validated = validateGeographicPoint(point);
  if (!Number.isInteger(toWkid) || toWkid <= 0) {
    invalid('projectPoint requires a positive integer "toWkid".');
  }
  if (transformationName !== undefined && typeof transformationName !== 'string') {
    invalid('projectPoint transformationName must be a string.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.projectPoint(
      validated,
      toWkid,
      transformationName ?? null
    );
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** A datum transformation available between two spatial references. */
export type TransformationInfo = {
  /** The transformation's name (pass to {@link projectPoint} as `transformationName`). */
  name: string;
  /**
   * `true` if the transformation needs Projection Engine data files that are not
   * installed; it will fall back to a default and be less accurate.
   */
  isMissingProjectionEngineFiles: boolean;
};

/**
 * List the datum transformations available for projecting between two spatial
 * references (by WKID), ordered by suitability. Use a returned `name` with
 * {@link projectPoint} to project with that specific transformation.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function getTransformations(
  fromWkid: number,
  toWkid: number
): Promise<TransformationInfo[]> {
  if (!Number.isInteger(fromWkid) || fromWkid <= 0 || !Number.isInteger(toWkid) || toWkid <= 0) {
    invalid('getTransformations requires positive integer WKIDs.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.getTransformations(fromWkid, toWkid);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Combine two geometries with a set operation (union/intersection/…). */
export async function combineGeometries(
  operation: GeometryCombineOperation,
  a: ArcgisGeometry,
  b: ArcgisGeometry
): Promise<ArcgisGeometry> {
  if (!COMBINE_OPERATIONS.includes(operation)) {
    invalid(`combineGeometries "operation" must be one of ${COMBINE_OPERATIONS.join(', ')}.`);
  }
  const validatedA = validateArcgisGeometry(a);
  const validatedB = validateArcgisGeometry(b);
  try {
    return await ExpoArcgisMapsSdkModule.combineGeometries(operation, validatedA, validatedB);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Evaluate the topological relationships between two geometries. */
export async function geometryRelationships(
  a: ArcgisGeometry,
  b: ArcgisGeometry
): Promise<GeometryRelationships> {
  const validatedA = validateArcgisGeometry(a);
  const validatedB = validateArcgisGeometry(b);
  try {
    return await ExpoArcgisMapsSdkModule.geometryRelationships(validatedA, validatedB);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Compute the geodesic (great-circle) path between two points as a densified
 * polyline, following the curved shortest path over the ellipsoid rather than a
 * straight screen line.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function geodesicPath(
  from: GeographicPoint,
  to: GeographicPoint
): Promise<ArcgisGeometry> {
  const validatedFrom = validateGeographicPoint(from);
  const validatedTo = validateGeographicPoint(to);
  try {
    return await ExpoArcgisMapsSdkModule.geodesicPath(validatedFrom, validatedTo);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Build a geodesic **ellipse** polygon centered on `center`, with the given
 * semi-axis lengths (metres) and optional major-axis direction.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   non-positive axis lengths or a bad center).
 */
export async function geodesicEllipse(options: GeodesicEllipseOptions): Promise<ArcgisGeometry> {
  const validated = validateGeodesicEllipseOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.geodesicEllipse(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Build a geodesic **sector** polygon — a wedge of a geodesic ellipse — from a
 * start direction spanning `sectorAngleDegrees`.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   non-positive axis lengths, a non-finite angle, or a bad center).
 */
export async function geodesicSector(options: GeodesicSectorOptions): Promise<ArcgisGeometry> {
  const base = validateGeodesicEllipseOptions(options);
  if (!Number.isFinite(options.sectorAngleDegrees)) {
    invalid('geodesicSector requires a finite "sectorAngleDegrees".');
  }
  const validated = {
    ...base,
    sectorAngleDegrees: options.sectorAngleDegrees,
    startDirectionDegrees: Number.isFinite(options.startDirectionDegrees)
      ? (options.startDirectionDegrees as number)
      : 0,
  };
  try {
    return await ExpoArcgisMapsSdkModule.geodesicSector(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

function validateGeodesicEllipseOptions(options: GeodesicEllipseOptions): GeodesicEllipseOptions {
  const center = validateGeographicPoint(options.center);
  if (!(options.semiAxis1LengthMeters > 0) || !(options.semiAxis2LengthMeters > 0)) {
    invalid('geodesic ellipse/sector requires positive semi-axis lengths in metres.');
  }
  return {
    center,
    semiAxis1LengthMeters: options.semiAxis1LengthMeters,
    semiAxis2LengthMeters: options.semiAxis2LengthMeters,
    axisDirectionDegrees: Number.isFinite(options.axisDirectionDegrees)
      ? (options.axisDirectionDegrees as number)
      : 0,
  };
}

/**
 * Simplify a geometry so it is topologically valid (fix self-intersections,
 * incorrect ring orientation, duplicate vertices).
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function simplifyGeometry(geometry: ArcgisGeometry): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  try {
    return await ExpoArcgisMapsSdkModule.simplifyGeometry(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Densify a geometry by adding vertices so no segment is longer than
 * `maxSegmentLength`, in the geometry's coordinate units (degrees for WGS 84).
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function densifyGeometry(
  geometry: ArcgisGeometry,
  maxSegmentLength: number
): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  if (!(typeof maxSegmentLength === 'number') || !(maxSegmentLength > 0)) {
    invalid('densifyGeometry requires a positive maxSegmentLength.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.densifyGeometry(validated, maxSegmentLength);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Generalize a geometry (Douglas–Peucker), removing vertices while keeping the
 * shape within `maxDeviation` of the original, in the geometry's coordinate
 * units (degrees for WGS 84).
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function generalizeGeometry(
  geometry: ArcgisGeometry,
  maxDeviation: number
): Promise<ArcgisGeometry> {
  const validated = validateArcgisGeometry(geometry);
  if (!(typeof maxDeviation === 'number') || !(maxDeviation > 0)) {
    invalid('generalizeGeometry requires a positive maxDeviation.');
  }
  try {
    return await ExpoArcgisMapsSdkModule.generalizeGeometry(validated, maxDeviation);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** The vertex of a geometry nearest a point, from {@link nearestVertex}. */
export type NearestVertexResult = {
  /** The nearest vertex location (WGS 84). */
  point: GeographicPoint;
  /** Distance to the vertex, in the geometry's coordinate units. */
  distance: number;
};

/**
 * Find the vertex of a geometry nearest to a point.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function nearestVertex(
  geometry: ArcgisGeometry,
  point: GeographicPoint
): Promise<NearestVertexResult> {
  const validated = validateArcgisGeometry(geometry);
  const validatedPoint = validateGeographicPoint(point);
  try {
    return await ExpoArcgisMapsSdkModule.nearestVertex(validated, validatedPoint);
  } catch (error) {
    throw toArcgisError(error);
  }
}
