import type { GeographicPoint } from './common';

/**
 * A camera position for a 2D map.
 *
 * A viewpoint is defined by a `center` plus exactly one of `scale` or
 * `rotation`-only adjustments. For v0.1 the supported form is a center point
 * with an optional map `scale` and optional `rotation`.
 *
 * `scale` is the map scale denominator (e.g. `50_000` for 1:50,000). Larger
 * values zoom out. When omitted on an initial viewpoint, the native default for
 * the basemap is used.
 *
 * `rotation` is in degrees clockwise from north, `0` meaning north-up.
 */
export type Viewpoint = {
  /** The location the viewpoint is centered on. */
  center: GeographicPoint;
  /** Map scale denominator (1:`scale`). Larger is more zoomed out. */
  scale?: number;
  /** Rotation in degrees clockwise from north. Defaults to `0` (north-up). */
  rotation?: number;
};

/**
 * Options controlling an animated viewpoint transition triggered via the
 * imperative ref.
 */
export type ViewpointAnimationOptions = {
  /**
   * Animation duration in milliseconds. `0` (the default) applies the change
   * immediately with no animation. Negative values are rejected with
   * `E_INVALID_ARGUMENT`.
   */
  durationMs?: number;
};
