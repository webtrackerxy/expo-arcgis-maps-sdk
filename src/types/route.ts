import type { GeographicPoint } from './common';
import type { ArcgisGeometry, PolygonGeometry } from './geometry';

/**
 * The best route between the given stops, from
 * {@link import('../route').solveRoute}.
 */
export type RouteResult = {
  /** Total route length in meters. */
  distanceMeters: number;
  /** Estimated travel time in minutes. */
  travelTimeMinutes: number;
  /**
   * Ordered polyline vertices (WGS 84) of the route, suitable for drawing as a
   * polyline graphic.
   */
  path: GeographicPoint[];
};

/** Options for {@link import('../route').solveRoute}. */
export type SolveRouteOptions = {
  /**
   * Polygon geometries the route must avoid (roadblocks/closures); the route
   * detours around them.
   */
  polygonBarriers?: ArcgisGeometry[];
};

/** Options for {@link import('../route').findClosestFacility}. */
export type ClosestFacilityOptions = {
  /** The incident location (the search origin). */
  incident: GeographicPoint;
  /** Candidate facilities to find the nearest of. */
  facilities: GeographicPoint[];
};

/**
 * The nearest facility to an incident and the route to it, from
 * {@link import('../route').findClosestFacility}.
 */
export type ClosestFacilityResult = {
  /** Index into the input `facilities` of the closest one. */
  facilityIndex: number;
  /** Route length in meters. */
  distanceMeters: number;
  /** Travel time in minutes. */
  travelTimeMinutes: number;
  /** Route polyline vertices (WGS 84). */
  path: GeographicPoint[];
};

/**
 * One incident's nearest facility and the route to it, from
 * {@link import('../route').findClosestFacilities}.
 */
export type ClosestFacilityRoute = {
  /** Index into the input `incidents` this route starts from. */
  incidentIndex: number;
  /** Index into the input `facilities` of the closest one. */
  facilityIndex: number;
  /** Route length in meters. */
  distanceMeters: number;
  /** Travel time in minutes. */
  travelTimeMinutes: number;
  /** Route polyline vertices (WGS 84). */
  path: GeographicPoint[];
};

/** Options for {@link import('../route').findServiceArea}. */
export type ServiceAreaOptions = {
  /** The facility the service area is measured from. */
  facility: GeographicPoint;
  /**
   * Travel-time cutoffs in minutes, e.g. `[5, 10, 15]`; one drive-time polygon
   * is returned per cutoff.
   */
  breaksMinutes: number[];
};

/**
 * Drive-time areas around a facility, from
 * {@link import('../route').findServiceArea}. Polygons are ordered largest
 * (longest time) first, so drawing them in order layers smaller over larger.
 */
export type ServiceAreaResult = {
  polygons: PolygonGeometry[];
};

/**
 * One facility's drive-time areas, from
 * {@link import('../route').findServiceAreas}.
 */
export type FacilityServiceArea = {
  /** Index into the input `facilities` these polygons surround. */
  facilityIndex: number;
  /**
   * Drive-time polygons for this facility, ordered largest (longest time)
   * first.
   */
  polygons: PolygonGeometry[];
};
