import type { GeographicPoint } from './common';

/**
 * A geocoding candidate returned by
 * {@link import('../geocode').geocode} / {@link import('../geocode').reverseGeocode}.
 */
export type GeocodeResult = {
  /** Human-readable address / place label. */
  label: string;
  /** Candidate location (WGS 84). */
  location: GeographicPoint;
  /** Match score, `0`–`100` (higher is better), when the service provides it. */
  score?: number;
};
