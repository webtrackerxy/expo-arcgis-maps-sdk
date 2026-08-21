import type { ArcgisError } from '../errors';
import type { GeographicPoint, ScreenPoint } from './common';

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onMapLoad}. Emitted
 * once the map and its basemap have finished loading successfully.
 */
export type MapLoadEventPayload = {
  /**
   * The map's spatial reference WKID after loading, useful for interpreting
   * subsequent map points.
   */
  spatialReferenceWkid: number;
};

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onMapError}. Carries a
 * stable {@link ArcgisError}; raw native exception text is never surfaced here.
 */
export type MapErrorEventPayload = ArcgisError;

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onSingleTap}.
 *
 * `mapPoint` is the tapped location in the map's spatial reference; `screenPoint`
 * is the tap location within the view. Use `screenPoint` when calling
 * `identify`.
 */
export type SingleTapEventPayload = {
  /** Tapped location in map coordinates. */
  mapPoint: GeographicPoint;
  /** Tapped location in view coordinates. */
  screenPoint: ScreenPoint;
};

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onViewpointChange}.
 *
 * Viewpoint changes are high frequency; the native side throttles these and
 * emits only meaningful changes rather than every render frame (see CLAUDE.md
 * "Threading").
 */
export type ViewpointChangeEventPayload = {
  /** New viewpoint center in map coordinates. */
  center: GeographicPoint;
  /** New map scale denominator (1:`scale`). */
  scale: number;
  /** New rotation in degrees clockwise from north. */
  rotation: number;
};

/** Whether the map view is actively drawing or has settled. */
export type DrawStatus = 'inProgress' | 'completed';

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onDrawStatusChange}.
 * `inProgress` while the view is rendering tiles/features; `completed` once the
 * visible extent has finished drawing.
 */
export type DrawStatusChangeEventPayload = {
  /** The current draw status. */
  status: DrawStatus;
};

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onGeotriggerNotification}.
 * Emitted when the device location enters or exits a
 * {@link import('./map').MapGeotrigger} fence.
 */
export type GeotriggerNotificationEventPayload = {
  /** Id of the {@link import('./map').MapGeotrigger} that fired. */
  geotriggerId: string;
  /** Whether the location `entered` or `exited` the fence. */
  action: 'entered' | 'exited';
  /** A human-readable message describing the crossing. */
  message: string;
};

/**
 * A layer's rendering state within the current view, mirroring the ArcGIS
 * `LayerViewStatus` set. A layer can hold several at once (e.g. `loading` and
 * `notVisible`).
 */
export type LayerViewStatus =
  'active' | 'notVisible' | 'outOfScale' | 'loading' | 'error' | 'warning';

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onLayerViewStateChange}.
 * Emitted when an operational layer's view state changes (loading, active,
 * out-of-scale, error, …).
 */
export type LayerViewStateChangeEventPayload = {
  /**
   * The caller-assigned id of the layer, when the layer is one added via
   * `map.layers`. Omitted for basemap/reference layers with no caller id.
   */
  layerId?: string;
  /** The layer's display name. */
  layerName: string;
  /** The set of active view statuses for the layer. */
  statuses: LayerViewStatus[];
  /** A stable error message when `statuses` includes `error`; omitted otherwise. */
  error?: string;
};

/**
 * Payload for {@link import('./view').ArcgisMapViewProps.onNavigationStatus}.
 * Emitted repeatedly while turn-by-turn navigation is active (see
 * {@link import('./view').ArcgisMapViewRef.startNavigation}).
 */
export type NavigationStatusEventPayload = {
  /** Text of the current maneuver (e.g. "Turn right onto Main St"). */
  maneuver: string;
  /** Distance remaining to the destination, in meters. */
  distanceRemainingMeters: number;
  /** Estimated time remaining to the destination, in minutes. */
  timeRemainingMinutes: number;
  /** Whether the tracked location is still on the route. */
  isOnRoute: boolean;
};
