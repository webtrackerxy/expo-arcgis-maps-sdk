import type { GeographicPoint } from './common';

/**
 * How the map re-centers as the device location updates.
 *
 * - `off` — the map does not follow the location.
 * - `recenter` — keeps the location on screen, re-centering when it leaves.
 * - `navigation` — locks the location toward the bottom, map rotates to heading.
 * - `compassNavigation` — keeps the location centered, map rotates to heading.
 */
export type LocationAutoPanMode = 'off' | 'recenter' | 'navigation' | 'compassNavigation';

/**
 * Declarative configuration for the device-location display (the "blue dot").
 *
 * Setting `enabled: true` starts the platform location data source, which
 * triggers the OS location-permission prompt. The consuming app is responsible
 * for declaring the location permission/usage strings (see README).
 */
export type LocationDisplayOptions = {
  /** Whether to show and track the device location. */
  enabled: boolean;
  /** How the map follows the location. Defaults to `recenter`. */
  autoPanMode?: LocationAutoPanMode;
  /** Whether to draw the accuracy circle around the location. Defaults to `true`. */
  showAccuracy?: boolean;
  /**
   * Which data source drives the blue dot:
   *
   * - `system` — the OS location service (GPS), the default.
   * - `nmea` — an {@link nmeaSentencesPath} file of NMEA sentences, replayed to
   *   simulate an external GNSS receiver.
   * - `indoors` — the map's indoor positioning (IPS) tables, for blue-dot
   *   positioning inside a building. Requires an IPS-enabled map.
   */
  dataSource?: 'system' | 'nmea' | 'indoors';
  /**
   * Path to a local file of newline-separated NMEA sentences, replayed as the
   * location source. Required when {@link dataSource} is `nmea`.
   */
  nmeaSentencesPath?: string;
};

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onLocationUpdate}.
 * Emitted (throttled) as the device location changes while `locationDisplay` is
 * enabled.
 */
export type LocationUpdateEventPayload = {
  /** Current device position (WGS 84). */
  position: GeographicPoint;
  /** Horizontal accuracy in meters, when available. */
  horizontalAccuracy?: number;
  /** Speed in meters per second, when available. */
  speed?: number;
  /** Course over ground in degrees clockwise from north, when available. */
  course?: number;
};
