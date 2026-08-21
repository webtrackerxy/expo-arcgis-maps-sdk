import type { GeographicPoint } from './common';

/**
 * Serializable geometries for graphics.
 *
 * v0.1 supports single-part geometries: one point, one polyline path, one
 * polygon ring. Multi-part geometries are a later addition. Coordinates are
 * {@link GeographicPoint}s (WGS 84 unless a `spatialReference` is set).
 */

export type PointGeometry = {
  type: 'point';
  point: GeographicPoint;
};

export type PolylineGeometry = {
  type: 'polyline';
  /** Ordered vertices of a single path (>= 2 points). */
  path: GeographicPoint[];
};

export type PolygonGeometry = {
  type: 'polygon';
  /** Ordered vertices of a single ring (>= 3 points); auto-closed natively. */
  ring: GeographicPoint[];
};

/** A geometry usable as a graphic's shape. */
export type ArcgisGeometry = PointGeometry | PolylineGeometry | PolygonGeometry;

/** Options for {@link import('../geometry').geodesicEllipse}. */
export type GeodesicEllipseOptions = {
  /** Ellipse center (WGS 84). */
  center: GeographicPoint;
  /** Length of the first semi-axis, in metres. */
  semiAxis1LengthMeters: number;
  /** Length of the second semi-axis, in metres. */
  semiAxis2LengthMeters: number;
  /** Rotation of the major axis, in degrees clockwise from north. Defaults to `0`. */
  axisDirectionDegrees?: number;
};

/** Options for {@link import('../geometry').geodesicSector}. */
export type GeodesicSectorOptions = GeodesicEllipseOptions & {
  /** Angular extent of the sector, in degrees. */
  sectorAngleDegrees: number;
  /** Direction of the sector's start edge, in degrees clockwise from north. Defaults to `0`. */
  startDirectionDegrees?: number;
};

/** A two-geometry combine operation for {@link import('../geometry').combineGeometries}. */
export type GeometryCombineOperation =
  'union' | 'intersection' | 'difference' | 'symmetricDifference';

/**
 * The set of topological relationships between two geometries, from
 * {@link import('../geometry').geometryRelationships}.
 */
export type GeometryRelationships = {
  contains: boolean;
  within: boolean;
  crosses: boolean;
  disjoint: boolean;
  intersects: boolean;
  overlaps: boolean;
  touches: boolean;
};

/** A point projected to a target spatial reference, from {@link import('../geometry').projectPoint}. */
export type ProjectedPoint = {
  /** X coordinate in the target spatial reference's units. */
  x: number;
  /** Y coordinate in the target spatial reference's units. */
  y: number;
  /** The target spatial reference WKID. */
  wkid: number;
};
