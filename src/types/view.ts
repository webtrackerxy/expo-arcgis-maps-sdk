import type { StyleProp, ViewStyle } from 'react-native';

import type { GeographicPoint } from './common';
import type { ApplyEditsOptions, ApplyEditsResult } from './edit';
import type {
  DrawStatusChangeEventPayload,
  GeotriggerNotificationEventPayload,
  LayerViewStateChangeEventPayload,
  MapErrorEventPayload,
  MapLoadEventPayload,
  NavigationStatusEventPayload,
  SingleTapEventPayload,
  ViewpointChangeEventPayload,
} from './events';
import type { ArcgisGeometry } from './geometry';
import type { MapGrid } from './grid';
import type {
  ArcadeEvaluationOptions,
  ArcadeEvaluationResult,
  FeatureFormInfo,
  IdentifyOptions,
  IdentifyResult,
  PopupInfo,
} from './identify';
import type { KmlTourOptions } from './layer';
import type { LocationDisplayOptions, LocationUpdateEventPayload } from './location';
import type { ArcgisMapSource } from './map';
import type {
  FeatureQueryOptions,
  FeatureQueryResult,
  QueryExtentOptions,
  QueryExtentResult,
  QueryStatisticsOptions,
  RelatedFeaturesOptions,
  SelectFeaturesOptions,
  StatisticsRow,
} from './query';
import type { ExportImageResult } from './screenshot';
import type { Viewpoint, ViewpointAnimationOptions } from './viewpoint';

/**
 * Options for {@link ArcgisMapViewRef.startGeometryEditor}. The user then taps
 * the map to draw; `stopGeometryEditor` returns the result.
 */
export type GeometryEditorOptions = {
  /** The kind of geometry to draw. */
  geometryType: 'point' | 'polyline' | 'polygon';
  /**
   * The interactive tool:
   *
   * - `'vertex'` — tap to place each vertex (the default).
   * - `'freehand'` — drag to draw.
   * - `'reticle'` — position a fixed on-screen reticle and tap to drop a vertex
   *   under it (precise placement without a fingertip covering the target).
   */
  tool?: 'vertex' | 'freehand' | 'reticle';
  /**
   * Enable snapping to the map's feature layers while editing (aligns new
   * vertices to nearby features). Defaults to `false`.
   */
  snapEnabled?: boolean;
};

/** Options for {@link ArcgisMapViewRef.startNavigation}. */
export type NavigationOptions = {
  /**
   * Enable automatic rerouting. When the tracked location leaves the route, a
   * new route to the remaining stops is solved and navigation continues along
   * it. Defaults to `false`.
   */
  reroute?: boolean;
};

/** Wraps a native-event payload the way Expo delivers it to JS handlers. */
type NativeEvent<T> = { nativeEvent: T };

/**
 * Props for {@link import('../ArcgisMapView').ArcgisMapView}.
 *
 * Declarative state (map source, interaction) lives in props; one-time actions
 * live on the {@link ArcgisMapViewRef}. Do not trigger actions by toggling
 * props.
 */
export type ArcgisMapViewProps = {
  /** The declarative map to display. */
  map: ArcgisMapSource;
  /** Whether the user can pan/zoom/rotate the map. Defaults to `true`. */
  interactionEnabled?: boolean;
  /**
   * Show a scale bar overlay in the lower-leading corner of the map. Defaults to
   * `false`. The bar updates automatically as the viewpoint changes and adapts
   * its distance units to the device locale.
   */
  scaleBar?: boolean;
  /**
   * Coordinate grid drawn over the map. Defaults to `'none'`. See
   * {@link MapGrid}.
   */
  grid?: MapGrid;
  /**
   * Show and follow the device location (the "blue dot"). Omit to disable.
   * Enabling it triggers the OS location-permission prompt; the app must declare
   * the location usage strings/permissions. See {@link LocationDisplayOptions}.
   */
  locationDisplay?: LocationDisplayOptions;
  /** Standard React Native view style. */
  style?: StyleProp<ViewStyle>;
  /** Fired once the map has loaded successfully. */
  onMapLoad?: (event: NativeEvent<MapLoadEventPayload>) => void;
  /** Fired when the map or a required resource fails to load. */
  onMapError?: (event: NativeEvent<MapErrorEventPayload>) => void;
  /** Fired on a single tap, with both map and screen coordinates. */
  onSingleTap?: (event: NativeEvent<SingleTapEventPayload>) => void;
  /** Fired (throttled) when the viewpoint changes. */
  onViewpointChange?: (event: NativeEvent<ViewpointChangeEventPayload>) => void;
  /**
   * Fired (throttled) as the device location updates, while `locationDisplay` is
   * enabled.
   */
  onLocationUpdate?: (event: NativeEvent<LocationUpdateEventPayload>) => void;
  /**
   * Fired when the map view's draw status changes between drawing and settled.
   * Useful for showing a progress indicator while the visible extent renders.
   */
  onDrawStatusChange?: (event: NativeEvent<DrawStatusChangeEventPayload>) => void;
  /**
   * Fired when the device location enters or exits a {@link MapGeotrigger}
   * fence declared in `map.geotriggers`.
   */
  onGeotriggerNotification?: (event: NativeEvent<GeotriggerNotificationEventPayload>) => void;
  /**
   * Fired when an operational layer's view state changes (loading, active,
   * out-of-scale, error). Only layers in `map.layers` are reported.
   */
  onLayerViewStateChange?: (event: NativeEvent<LayerViewStateChangeEventPayload>) => void;
  /**
   * Emitted repeatedly while turn-by-turn navigation is active (started via
   * {@link ArcgisMapViewRef.startNavigation}) with the current maneuver and
   * remaining distance/time.
   */
  onNavigationStatus?: (event: NativeEvent<NavigationStatusEventPayload>) => void;
};

/**
 * Imperative handle returned via `ref` on {@link ArcgisMapView}. Use it for
 * one-time actions that should not be modeled as declarative props.
 */
export type ArcgisMapViewRef = {
  /**
   * Move the map to `viewpoint`, optionally animating over
   * {@link ViewpointAnimationOptions.durationMs}. Resolves once the transition
   * has been applied. Rejects with an {@link import('../errors').ArcgisError}.
   */
  setViewpoint: (viewpoint: Viewpoint, options?: ViewpointAnimationOptions) => Promise<void>;
  /**
   * Identify features and graphics near a screen location. Resolves with the
   * matched results (possibly empty). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  identify: (options: IdentifyOptions) => Promise<IdentifyResult[]>;
  /**
   * Identify features near a screen location and return each feature's popup
   * (title + formatted field rows) built from its layer's popup definition.
   * Features whose layer has popups disabled are omitted. Resolves with the
   * matched popups (possibly empty). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  showPopup: (options: IdentifyOptions) => Promise<PopupInfo[]>;
  /**
   * Identify features near a screen location and return each feature's editing
   * form (title + field rows with current values), built from the layer's form
   * definition or a default form. This is a read-only view of the form.
   * Resolves with the matched forms (possibly empty). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  showFeatureForm: (options: IdentifyOptions) => Promise<FeatureFormInfo[]>;
  /**
   * Identify features near a screen location and evaluate an Arcade expression
   * against each, with the feature bound to `$feature` and the map to `$map`.
   * Use it to compute a value from a tapped feature (e.g. a density or a related
   * count) without pulling the feature's raw fields across the bridge. Resolves
   * with one result per identified feature (possibly empty). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  evaluateArcade: (options: ArcadeEvaluationOptions) => Promise<ArcadeEvaluationResult[]>;
  /**
   * Query features from a feature layer on the map by attribute expression.
   * Resolves with the matched features (possibly empty). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  queryFeatures: (options: FeatureQueryOptions) => Promise<FeatureQueryResult[]>;
  /**
   * Highlight (select) the features of a layer matching a `WHERE` clause,
   * clearing any prior selection on that layer. Resolves with the number of
   * features selected. Rejects with an {@link import('../errors').ArcgisError}.
   */
  selectFeatures: (options: SelectFeaturesOptions) => Promise<number>;
  /** Clear the selection highlight on a feature layer. */
  clearSelection: (layerId: string) => Promise<void>;
  /**
   * Control the playback of a KML tour in a {@link KmlLayerSource} layer:
   * `play`, `pause`, or `reset`. Rejects with `E_UNSUPPORTED` if the layer has
   * no tour, or `E_INVALID_ARGUMENT` for an unknown layer/action.
   */
  controlKmlTour: (options: KmlTourOptions) => Promise<void>;
  /**
   * Return the count and combined extent of the features matching a `WHERE`
   * clause, without returning the features themselves. Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  queryFeatureExtent: (options: QueryExtentOptions) => Promise<QueryExtentResult>;
  /**
   * Query the records related to an origin feature (by object id) through the
   * layer's relationships. Resolves with the related features (possibly empty).
   * Rejects with an {@link import('../errors').ArcgisError}.
   */
  queryRelatedFeatures: (options: RelatedFeaturesOptions) => Promise<FeatureQueryResult[]>;
  /**
   * Compute aggregate statistics (count/sum/average/min/max/…) over a feature
   * layer's field(s), optionally grouped. Resolves with one row per group (a
   * single row when not grouping). Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  queryStatistics: (options: QueryStatisticsOptions) => Promise<StatisticsRow[]>;
  /**
   * Add, update, and/or delete features on a feature layer's service table, then
   * push the edits to the service. Resolves with a summary. Rejects with an
   * {@link import('../errors').ArcgisError}. Requires an editable service and a
   * key with editing privileges.
   */
  applyEdits: (options: ApplyEditsOptions) => Promise<ApplyEditsResult>;
  /**
   * Export the current map view as a PNG written to the app cache. Resolves with
   * a {@link ExportImageResult} whose `uri` is a `file://` URL usable as a React
   * Native `<Image>` source. Rejects with an
   * {@link import('../errors').ArcgisError}. The file is not cleaned up
   * automatically.
   */
  exportImage: () => Promise<ExportImageResult>;
  /**
   * Begin interactively editing a new geometry on the map. The user taps (vertex
   * tool) or drags (freehand tool) to draw; call {@link stopGeometryEditor} to
   * finish. Optionally snaps new vertices to the map's feature layers. Rejects
   * with an {@link import('../errors').ArcgisError}.
   */
  startGeometryEditor: (options: GeometryEditorOptions) => Promise<void>;
  /**
   * Finish the interactive geometry edit and return the drawn geometry (WGS 84),
   * or `null` if nothing was drawn. Rejects with an
   * {@link import('../errors').ArcgisError}.
   */
  stopGeometryEditor: () => Promise<ArcgisGeometry | null>;
  /**
   * Start turn-by-turn navigation along the route through `stops` (solved with
   * the ArcGIS routing service). Drives the map's location display in
   * navigation mode from a simulated location that follows the route, and emits
   * {@link ArcgisMapViewProps.onNavigationStatus} as it progresses. Requires at
   * least two stops. Rejects with an {@link import('../errors').ArcgisError}.
   *
   * Pass `{ reroute: true }` to enable automatic rerouting: if the tracked
   * location leaves the route, a new route to the remaining stops is solved and
   * navigation continues along it. Rerouting requires a route source that
   * supports it (an offline transportation-network dataset); the online routing
   * service does not, and rejects with `E_UNSUPPORTED`. Off by default.
   */
  startNavigation: (stops: GeographicPoint[], options?: NavigationOptions) => Promise<void>;
  /** Stop navigation and the simulated location display. */
  stopNavigation: () => Promise<void>;
};
