/** Serializable DTOs for the augmented-reality `ArcgisArView`. */

import type { StyleProp, ViewStyle } from 'react-native';

import type { ArcgisError } from '../errors';
import type { GeographicPoint } from './common';
import type { MapErrorEventPayload, MapLoadEventPayload, SingleTapEventPayload } from './events';
import type { ArcgisSceneSource, Camera } from './scene';

/**
 * Which augmented-reality experience {@link ArcgisArView} renders:
 *
 * - `worldScale` — the scene overlaid on the live camera at 1:1 real-world
 *   scale, anchored to the device's location (walk-around AR).
 * - `tabletop` — the scene rendered as a small model anchored to a detected
 *   real-world surface (a table), viewed from any angle.
 * - `flyover` — a virtual fly-through driven by device motion, with the live
 *   camera feed as a backdrop (no real-world anchoring).
 */
export type ArViewMode = 'worldScale' | 'tabletop' | 'flyover';

/**
 * World-scale positioning strategy (`worldScale` only):
 *
 * - `world` — anchor to the device's own motion tracking (ARKit/ARCore world
 *   tracking). Works anywhere; drifts over distance.
 * - `geo` — anchor to geospatial/VPS data where available for higher accuracy,
 *   falling back to world tracking when it is not.
 *
 * `preferGeoTracking`-style auto-selection is intentionally not exposed because
 * it has no Android equivalent; see `docs/augmented-reality.md`.
 */
export type ArTrackingMode = 'world' | 'geo';

/**
 * AR session tracking lifecycle, delivered (throttled to meaningful changes) via
 * {@link ArcgisArViewProps.onTrackingStateChange}:
 *
 * - `initializing` — the AR session is starting / still detecting the world.
 * - `tracking` — tracking is stable; the scene is correctly positioned.
 * - `paused` — tracking is temporarily interrupted (e.g. app backgrounded).
 * - `unavailable` — AR is not available on this device (see {@link isArSupported}).
 */
export type ArTrackingState = 'initializing' | 'tracking' | 'paused' | 'unavailable';

/**
 * Why AR tracking is limited, delivered alongside {@link ArTrackingState} on
 * {@link ArcgisArViewProps.onTrackingStateChange}. Present while tracking is
 * `initializing` (or otherwise limited); omitted once tracking is stable.
 *
 * - `initializing` — the session is still starting up.
 * - `detectingPlanes` — waiting to detect a real-world surface (tabletop).
 * - `insufficientFeatures` — too few visual features to track (blank/low-texture
 *   scene) — move to a more textured, well-lit area.
 * - `excessiveMotion` — the device is moving too fast; slow down.
 * - `insufficientLight` — the scene is too dark.
 * - `relocalizing` — recovering tracking after an interruption.
 * - `unknown` — a limitation the SDK could not classify.
 *
 * **Platform difference:** iOS (ARKit) reports the full set above. Android's
 * ArcGIS toolkit only surfaces coarse initialization status, so on Android the
 * reason is limited to `initializing` / `detectingPlanes` / `unknown`; the
 * finer ARCore reasons are not exposed. See `docs/augmented-reality.md`.
 */
export type ArTrackingReason =
  | 'initializing'
  | 'detectingPlanes'
  | 'insufficientFeatures'
  | 'excessiveMotion'
  | 'insufficientLight'
  | 'relocalizing'
  | 'unknown';

/** Wraps a native-event payload the way Expo delivers it to JS handlers. */
type NativeEvent<T> = { nativeEvent: T };

/**
 * Props for the augmented-reality {@link import('../ArcgisArView').ArcgisArView}.
 *
 * The scene content is declared exactly like {@link ArcgisSceneView} via
 * {@link scene}; the AR-specific props below select and configure the AR mode.
 * Props that do not apply to the active {@link mode} are ignored.
 */
export type ArcgisArViewProps = {
  /** The declarative scene to display in AR. Reconciled like the 3D scene view. */
  scene: ArcgisSceneSource;
  /** Which AR experience to render. */
  mode: ArViewMode;
  /**
   * World-scale positioning strategy. Only applies when `mode` is `worldScale`.
   * Defaults to `world`.
   */
  trackingMode?: ArTrackingMode;
  /**
   * The real-world geographic point the scene model is pinned to. **Required**
   * when `mode` is `tabletop`; ignored otherwise.
   */
  anchor?: GeographicPoint;
  /**
   * Scene metres travelled per real-world metre the device moves — magnifies
   * motion so a table-sized model can be explored on foot. Applies to `tabletop`
   * and `flyover`. Defaults to `1`. Must be > 0.
   */
  translationFactor?: number;
  /**
   * The camera position the fly-through starts from. **Required** when `mode` is
   * `flyover`; ignored otherwise. `altitude` is metres above the ground.
   */
  initialCamera?: Camera;
  /**
   * Clip the scene to this many metres around the camera — improves performance
   * and reduces distant-content occlusion glitches. Omit for no clipping. Must
   * be > 0.
   */
  clippingDistanceMeters?: number;
  /**
   * Show the toolkit's calibration control so the user can nudge the scene's
   * heading and elevation to line up with the real world. Only applies when
   * `mode` is `worldScale`. Defaults to `true`.
   */
  calibrationVisible?: boolean;
  /** Standard React Native view style. */
  style?: StyleProp<ViewStyle>;
  /** Fired once the scene has loaded successfully. */
  onSceneLoad?: (event: NativeEvent<MapLoadEventPayload>) => void;
  /** Fired when the scene or a required resource fails to load. */
  onSceneError?: (event: NativeEvent<MapErrorEventPayload>) => void;
  /**
   * Fired on a single tap, with the screen location and (when the tap hit the
   * scene) the corresponding geographic point — e.g. to place a collected
   * feature at the tapped location.
   */
  onSingleTap?: (event: NativeEvent<SingleTapEventPayload>) => void;
  /**
   * Fired (throttled) when the AR tracking state changes. When tracking is
   * limited (e.g. `initializing`), `reason` explains why — see
   * {@link ArTrackingReason}; it is omitted once tracking is stable.
   */
  onTrackingStateChange?: (
    event: NativeEvent<{ state: ArTrackingState; reason?: ArTrackingReason }>
  ) => void;
  /**
   * Fired when AR cannot run — e.g. the device lacks ARKit/ARCore
   * (`E_UNSUPPORTED`) or camera permission was denied (`E_NATIVE_FAILURE`).
   */
  onArError?: (event: NativeEvent<ArcgisError>) => void;
};

/** Imperative handle for {@link ArcgisArView}. */
export type ArcgisArViewRef = {
  /**
   * The camera's current position in the AR scene (its geographic location and
   * orientation). Resolves with the latest {@link Camera}; rejects with an
   * {@link ArcgisError} if AR is not yet tracking.
   */
  getCurrentCamera: () => Promise<Camera>;
};

/** Result of {@link import('../arSupport').isArSupported}. */
export type ArSupport = {
  /** Whether this device can run AR (ARKit on iOS / ARCore on Android). */
  supported: boolean;
  /**
   * When `supported` is `false`, a short machine-readable reason such as
   * `unsupportedDevice`, `needsUpdate`, or `unknown`. Omitted when supported.
   */
  reason?: string;
};

// Re-exported so consumers can type error handlers without reaching into events.
export type { ArcgisError };
