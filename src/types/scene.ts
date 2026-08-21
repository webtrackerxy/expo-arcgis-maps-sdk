/** Serializable DTOs for the 3D `ArcgisSceneView`. */

import type { StyleProp, ViewStyle } from 'react-native';

import type { ArcgisError } from '../errors';
import type { BasemapStyle } from './basemap';
import type { GeographicPoint } from './common';
import type { MapErrorEventPayload, MapLoadEventPayload, SingleTapEventPayload } from './events';
import type { GraphicSource } from './graphics';
import type { IdentifyOptions } from './identify';
import type { LabelDefinition } from './label';
import type { FeatureLayerSource } from './map';
import type { GeographicEnvelope } from './offline';
import type { ArcgisRenderer } from './renderer';
import type { ViewpointAnimationOptions } from './viewpoint';

/**
 * A 3D camera position. `altitude` is metres above the ground; `heading`,
 * `pitch`, and `roll` are degrees.
 */
export type Camera = {
  latitude: number;
  longitude: number;
  /** Metres above the scene's elevation surface. */
  altitude: number;
  /** Compass heading, 0–360° clockwise from north. Defaults to 0. */
  heading?: number;
  /** Tilt, 0° (straight down) to 180°. Defaults to 0. */
  pitch?: number;
  /** Roll in degrees. Defaults to 0. */
  roll?: number;
};

/**
 * Restricts which features of a 3D scene layer are drawn by a polygon region.
 * Only meaningful for an ArcGIS scene layer (`type: 'scene'`).
 */
export type SceneLayerPolygonFilter = {
  /** One or more polygon rings (WGS 84, each ≥ 3 points) defining the region(s). */
  polygons: GeographicPoint[][];
  /**
   * How a feature must relate to the polygons to be shown: `contains` keeps only
   * the features inside the polygons; `disjoint` keeps only those outside them.
   * Defaults to `contains`.
   */
  spatialRelationship?: 'contains' | 'disjoint';
};

/** A 3D scene layer (e.g. a building/3D-object service) referenced by URL or path. */
export type SceneLayerSource = {
  /** Stable id used to reconcile layers across renders. */
  id: string;
  /**
   * The kind of 3D layer. `scene` (default) is an ArcGIS scene layer (3D
   * objects / point scene layers); `integratedMesh` is an integrated mesh
   * layer; `3dTiles` is an OGC 3D Tiles layer; `pointCloud` is a point-cloud
   * layer; `building` is a building scene layer (BIM), which supports
   * {@link buildingFilterExpression}. All load from `url` except `pointCloud`,
   * which loads from `url` (a point-cloud service) or `path` (a local `.slpk`).
   */
  type?: 'scene' | 'integratedMesh' | '3dTiles' | 'pointCloud' | 'building';
  /**
   * For a `building` layer only: an attribute `WHERE` clause (e.g.
   * `"BldgLevel = 3"`) applied as a solid building filter so only the matching
   * parts of the building are drawn. Omit to show the whole building.
   */
  buildingFilterExpression?: string;
  /**
   * URL of the 3D layer's service or dataset. Required for every type except a
   * local `pointCloud`, which uses `path` instead.
   */
  url?: string;
  /**
   * Local filesystem path to a point-cloud scene-layer package (`.slpk`). Only
   * valid when `type` is `pointCloud`; provide this or `url`, not both.
   */
  path?: string;
  /** Whether the layer is drawn. Defaults to `true`. */
  visible?: boolean;
  /** Layer opacity in `[0, 1]`. Defaults to `1`. */
  opacity?: number;
  /**
   * Override symbology for a 3D scene layer (`type: 'scene'`). Omit to use the
   * layer's own symbols. Ignored for other layer types. See {@link ArcgisRenderer}.
   */
  renderer?: ArcgisRenderer;
  /**
   * Restrict which features are drawn to a polygon region (`type: 'scene'` only).
   * Omit for no filter. See {@link SceneLayerPolygonFilter}.
   */
  polygonFilter?: SceneLayerPolygonFilter;
};

/**
 * How the scene is presented: `'global'` draws it on a 3D globe (the default);
 * `'local'` draws it on a flat plane, suited to small, localized areas. Ignored
 * for web scenes (they carry their own presentation).
 */
export type SceneViewingMode = 'global' | 'local';

/**
 * An elevation source for the scene's base surface. The `type` selects the
 * backing dataset:
 *
 * - `world` — the ArcGIS world elevation service (no `url`/`path`).
 * - `tiled` — a tiled elevation *service* at `url`.
 * - `raster` — a local raster DEM file at `path` (e.g. a `.dt2`/`.tif`).
 * - `tilePackage` — a local elevation tile package (`.tpk`/`.tpkx`) at `path`.
 */
export type ElevationSource = {
  type: 'world' | 'tiled' | 'raster' | 'tilePackage';
  /** Tiled elevation service URL. Required when `type` is `tiled`. */
  url?: string;
  /** Local file path. Required when `type` is `raster` or `tilePackage`. */
  path?: string;
};

/**
 * The declarative source for an {@link ArcgisSceneView}. Provide either a
 * `basemap` (with optional scene layers) or a `webSceneItemId` to load a web
 * scene from a portal item — not both.
 */
/**
 * Labels applied to a named layer *inside a loaded web scene* (only meaningful
 * with {@link ArcgisSceneSource.webSceneItemId}).
 *
 * `layerPath` names the layer to label, walked from the web scene's operational
 * layers down through group layers — e.g. `["Gas", "Gas Main"]` selects the
 * "Gas Main" feature layer nested in the "Gas" group layer; a single-element
 * path selects a top-level operational layer. The `labels` are added to that
 * layer (and labeling enabled) once the web scene finishes loading; if the path
 * doesn't resolve to a feature layer the entry is ignored.
 */
export type WebSceneLayerLabels = {
  /** Names identifying the target layer, outermost group first. Non-empty. */
  layerPath: string[];
  /** Label definitions to add to the resolved layer. */
  labels: LabelDefinition[];
};

export type ArcgisSceneSource = {
  /** The 3D basemap style. Required unless `webSceneItemId` is set. */
  basemap?: BasemapStyle;
  /**
   * Load a web scene from an ArcGIS portal item id. When set, `basemap`,
   * `viewingMode`, and `sceneLayers` are ignored (the web scene defines them).
   */
  webSceneItemId?: string;
  /**
   * Labels applied to named layers inside the loaded web scene. Only valid with
   * `webSceneItemId`; applied once the web scene loads. See
   * {@link WebSceneLayerLabels}.
   */
  webSceneLayerLabels?: WebSceneLayerLabels[];
  /**
   * Load a scene from a local mobile scene package (`.mspk`) by filesystem path.
   * When set, all other scene fields (`basemap`, `webSceneItemId`, `sceneLayers`,
   * `graphicsOverlays`, environment settings) are ignored — the package's first
   * scene carries its own basemap, layers, elevation, and camera.
   */
  mobileScenePackagePath?: string;
  /** Global (globe) vs local (planar) presentation. Defaults to `'global'`. */
  viewingMode?: SceneViewingMode;
  /**
   * Whether to drape the scene over the ArcGIS world elevation surface for real
   * terrain. Defaults to `true`. Ignored when {@link elevationSources} is set.
   */
  elevationEnabled?: boolean;
  /**
   * Explicit elevation sources for the scene's base surface. When provided (and
   * non-empty), these replace the default world-elevation surface — each is
   * added to the surface in order, so you can combine, say, a local raster DEM
   * with the world service. Omit to use the default (world elevation when
   * `elevationEnabled`). Ignored for web scenes and mobile scene packages (they
   * carry their own surface). See {@link ElevationSource}.
   */
  elevationSources?: ElevationSource[];
  /** 3D scene layers, reconciled by {@link SceneLayerSource.id}. */
  sceneLayers?: SceneLayerSource[];
  /** 3D graphics overlays, reconciled by {@link SceneGraphicsOverlay.id}. */
  graphicsOverlays?: SceneGraphicsOverlay[];
  /**
   * Feature service layers drawn in the scene, reconciled by
   * {@link FeatureLayerSource.id}. Like the 2D map's feature layers but with
   * optional {@link SceneFeatureLayer.extrusion} to raise features into 3D
   * volumes; the layer's `labels` render as 3D labels.
   */
  featureLayers?: SceneFeatureLayer[];
  /**
   * 3D analyses (viewshed, line-of-sight) drawn in an analysis overlay above the
   * scene. Rebuilt when the array changes.
   */
  analyses?: SceneAnalysis[];
  /**
   * Animated image overlays drawn above the scene, reconciled by
   * {@link SceneImageOverlay.id}.
   */
  imageOverlays?: SceneImageOverlay[];
  /**
   * Vertical exaggeration of the elevation surface (e.g. `3` makes terrain three
   * times taller). Defaults to `1`. Only applied when `elevationEnabled`.
   */
  terrainExaggeration?: number;
  /**
   * Restricts camera movement relative to the elevation surface: `none` lets the
   * camera go below ground; `stayAbove` keeps it above the surface. Defaults to
   * `none`.
   */
  surfaceNavigationConstraint?: 'none' | 'stayAbove';
  /**
   * Atmospheric effect drawn around the globe: `off`, `horizonOnly` (a thin
   * horizon band), or `realistic` (a full atmosphere). Defaults to `horizonOnly`.
   */
  atmosphereEffect?: 'off' | 'horizonOnly' | 'realistic';
  /**
   * Sun lighting of the scene: `off` (flat), `light` (directional sunlight), or
   * `lightAndShadows` (sunlight plus cast shadows). Defaults to `off`.
   */
  sunLighting?: 'off' | 'light' | 'lightAndShadows';
  /**
   * Camera controller governing how the camera moves. Omit for the default globe
   * controller (free navigation); set an orbit controller to lock the camera onto
   * a target the user can orbit around.
   */
  cameraController?: OrbitLocationCameraController;
  /** The camera position applied when the scene first loads. */
  initialCamera?: Camera;
};

/**
 * How a graphics overlay's graphics are placed relative to the scene's
 * elevation surface:
 *
 * - `drapedBillboarded` — draped on the surface, always facing the camera (default).
 * - `drapedFlat` — draped flat on the surface.
 * - `absolute` — at the geometry's `z` value, as an absolute height above sea level.
 * - `relative` — at the geometry's `z` value, relative to the surface elevation.
 * - `relativeToScene` — relative to the tops of scene-layer features (e.g. buildings).
 */
export type SurfacePlacement =
  'drapedBillboarded' | 'drapedFlat' | 'absolute' | 'relative' | 'relativeToScene';

/**
 * How an {@link SceneExtrusion} raises a graphic's base geometry into a 3D volume:
 *
 * - `baseHeight` — extrude from the base geometry up to the expression's value.
 * - `absoluteHeight` — the expression is the absolute top height; the base sits on the surface.
 * - `minimum` — extrude so the minimum vertex reaches the expression's value.
 * - `maximum` — extrude so the maximum vertex reaches the expression's value.
 * - `none` — no extrusion (the default when `extrusion` is omitted).
 */
export type ExtrusionMode = 'baseHeight' | 'absoluteHeight' | 'minimum' | 'maximum' | 'none';

/**
 * Extrudes an overlay's polygon/point graphics into 3D volumes. The height comes
 * from an ArcGIS expression evaluated per graphic — typically an attribute
 * reference such as `"[height]"`, or an arithmetic expression like `"[pop] / 10"`.
 */
export type SceneExtrusion = {
  /** Expression yielding the extrusion height in metres, e.g. `"[height]"`. */
  expression: string;
  /** How the height is applied. Defaults to `baseHeight`. */
  mode?: ExtrusionMode;
};

/**
 * A graphics overlay drawn in a scene. Reconciled by `id`. Graphics are placed
 * per {@link surfacePlacement}; an optional {@link renderer} overrides per-graphic
 * symbols and can carry {@link extrusion} to raise flat geometry into 3D volumes.
 */
export type SceneGraphicsOverlay = {
  /** Stable id used to reconcile overlays across renders. */
  id: string;
  /** The graphics to draw, reconciled within the overlay by {@link GraphicSource.id}. */
  graphics: GraphicSource[];
  /** How graphics sit relative to the surface. Defaults to `drapedBillboarded`. */
  surfacePlacement?: SurfacePlacement;
  /**
   * A renderer applied to every graphic in the overlay, overriding per-graphic
   * symbols. Required when {@link extrusion} is set (extrusion is a renderer
   * property).
   */
  renderer?: ArcgisRenderer;
  /**
   * Extrudes the overlay's graphics into 3D volumes. Applied to {@link renderer};
   * ignored unless a `renderer` is provided.
   */
  extrusion?: SceneExtrusion;
  /**
   * Scene-property expressions that orient the overlay's 3D symbols per graphic
   * from attribute values (e.g. rotate a cone by its `[HEADING]` / `[PITCH]`).
   * Applied to {@link renderer}; ignored unless a `renderer` is provided.
   */
  orientationExpressions?: SceneOrientationExpressions;
};

/**
 * ArcGIS expressions that drive a 3D symbol's orientation from a graphic's
 * attributes — typically attribute references such as `"[HEADING]"`. Each is
 * optional; omit one to leave that axis unrotated.
 */
export type SceneOrientationExpressions = {
  /** Expression yielding the heading (Z-axis rotation), degrees. */
  headingExpression?: string;
  /** Expression yielding the pitch (X-axis rotation), degrees. */
  pitchExpression?: string;
  /** Expression yielding the roll (Y-axis rotation), degrees. */
  rollExpression?: string;
};

/**
 * An animated image overlay drawn in a scene: a sequence of images draped over a
 * geographic extent and cycled to animate (e.g. a radar/precipitation loop).
 * Reconciled by {@link id}.
 */
export type SceneImageOverlay = {
  /** Stable id used to reconcile overlays across renders. */
  id: string;
  /**
   * Ordered local image file paths (not `file://` URIs) shown as animation
   * frames. A single path shows a static image.
   */
  imagePaths: string[];
  /** Geographic extent (WGS 84) each frame is draped over. */
  extent: GeographicEnvelope;
  /**
   * Playback rate in frames per second. Defaults to `15`. `0` shows the first
   * frame without animating.
   */
  framesPerSecond?: number;
  /** Overlay opacity, `0`–`1`. Defaults to `1`. */
  opacity?: number;
};

/**
 * A viewshed analysis — shades the scene by what is visible (green) versus
 * obstructed (red) from an observer looking in a given direction, within a
 * field of view and distance range.
 */
export type ViewshedAnalysis = {
  type: 'viewshed';
  /** Observer location (WGS 84); include `altitude` for a realistic eye height. */
  location: GeographicPoint;
  /** Look direction, degrees clockwise from north. */
  headingDegrees: number;
  /** Look tilt, degrees (0 is horizontal, positive looks up). */
  pitchDegrees: number;
  /** Horizontal field-of-view angle in degrees. Defaults to `90`. */
  horizontalAngleDegrees?: number;
  /** Vertical field-of-view angle in degrees. Defaults to `90`. */
  verticalAngleDegrees?: number;
  /** Near clipping distance in metres. Omit for none. */
  minDistanceMeters?: number;
  /** Far clipping distance in metres — how far the viewshed reaches. */
  maxDistanceMeters: number;
};

/**
 * A line-of-sight analysis — draws the sight line between two points, coloured
 * by which segments are visible (green) versus obstructed (red) by the surface
 * or scene layers.
 */
export type LineOfSightAnalysis = {
  type: 'lineOfSight';
  /** Observer point (WGS 84); include `altitude`. */
  observer: GeographicPoint;
  /** Target point (WGS 84); include `altitude`. */
  target: GeographicPoint;
};

/**
 * A viewshed analysis attached to a geoelement — like {@link ViewshedAnalysis},
 * but the observer is a graphic placed at {@link location} rather than a fixed
 * point, so the analysis tracks the graphic. The look direction is applied as an
 * offset from the graphic's own orientation (which is level and facing north for
 * the plain backing graphic), so {@link headingDegrees} / {@link pitchDegrees}
 * read the same as a location viewshed.
 */
export type GeoElementViewshedAnalysis = {
  type: 'geoElementViewshed';
  /** Observer location (WGS 84); include `altitude` for a realistic eye height. */
  location: GeographicPoint;
  /** Look direction, degrees clockwise from north. */
  headingDegrees: number;
  /** Look tilt, degrees (0 is horizontal, positive looks up). */
  pitchDegrees: number;
  /** Horizontal field-of-view angle in degrees. Defaults to `90`. */
  horizontalAngleDegrees?: number;
  /** Vertical field-of-view angle in degrees. Defaults to `90`. */
  verticalAngleDegrees?: number;
  /** Near clipping distance in metres. Omit for none. */
  minDistanceMeters?: number;
  /** Far clipping distance in metres — how far the viewshed reaches. */
  maxDistanceMeters: number;
};

/**
 * A line-of-sight analysis between two geoelements — like
 * {@link LineOfSightAnalysis}, but each endpoint is a graphic placed at the given
 * point, so the sight line tracks the graphics rather than fixed coordinates.
 */
export type GeoElementLineOfSightAnalysis = {
  type: 'geoElementLineOfSight';
  /** Observer point (WGS 84); include `altitude`. */
  observer: GeographicPoint;
  /** Target point (WGS 84); include `altitude`. */
  target: GeographicPoint;
};

/**
 * A distance measurement between two points in the scene — reports the direct,
 * horizontal and vertical distances between {@link startLocation} and
 * {@link endLocation}, drawn as a measurement line in the scene.
 */
export type DistanceMeasurementAnalysis = {
  type: 'distanceMeasurement';
  /** Start point (WGS 84); include `altitude`. */
  startLocation: GeographicPoint;
  /** End point (WGS 84); include `altitude`. */
  endLocation: GeographicPoint;
  /**
   * Unit system the measurement is reported in: `metric` (metres/kilometres) or
   * `imperial` (feet/miles). Defaults to `metric`.
   */
  unitSystem?: 'metric' | 'imperial';
};

/**
 * A viewshed that tracks the scene's camera — it is positioned at the camera and
 * re-aimed to match the camera's heading and pitch as the user navigates, so it
 * always shows what is visible from the current point of view.
 */
export type CameraViewshedAnalysis = {
  type: 'cameraViewshed';
  /** Horizontal field-of-view angle in degrees. Defaults to `90`. */
  horizontalAngleDegrees?: number;
  /** Vertical field-of-view angle in degrees. Defaults to `90`. */
  verticalAngleDegrees?: number;
  /** Near clipping distance in metres. Omit for none. */
  minDistanceMeters?: number;
  /** Far clipping distance in metres — how far the viewshed reaches. */
  maxDistanceMeters: number;
};

/**
 * A viewshed the user repositions by tapping the scene — it starts at
 * {@link location} and moves to each tapped point, keeping its {@link headingDegrees}
 * and {@link pitchDegrees}. Useful for exploring visibility interactively.
 */
export type InteractiveViewshedAnalysis = {
  type: 'interactiveViewshed';
  /** Initial observer location (WGS 84); include `altitude` for eye height. */
  location: GeographicPoint;
  /** Look direction, degrees clockwise from north. */
  headingDegrees: number;
  /** Look tilt, degrees (0 is horizontal, positive looks up). */
  pitchDegrees: number;
  /** Horizontal field-of-view angle in degrees. Defaults to `90`. */
  horizontalAngleDegrees?: number;
  /** Vertical field-of-view angle in degrees. Defaults to `90`. */
  verticalAngleDegrees?: number;
  /** Near clipping distance in metres. Omit for none. */
  minDistanceMeters?: number;
  /** Far clipping distance in metres — how far the viewshed reaches. */
  maxDistanceMeters: number;
};

/** A 3D analysis drawn in a scene's analysis overlay. */
export type SceneAnalysis =
  | ViewshedAnalysis
  | LineOfSightAnalysis
  | GeoElementViewshedAnalysis
  | GeoElementLineOfSightAnalysis
  | DistanceMeasurementAnalysis
  | CameraViewshedAnalysis
  | InteractiveViewshedAnalysis;

/**
 * A feature service layer drawn in a scene. Same as the 2D map's
 * {@link FeatureLayerSource} (renderer, labels, definition expression, …) plus
 * an optional {@link extrusion} that raises the features into 3D volumes by an
 * expression (applied to the renderer's scene properties).
 */
export type SceneFeatureLayer = FeatureLayerSource & {
  /** Extrude the features into 3D volumes. Requires a `renderer`. */
  extrusion?: SceneExtrusion;
};

/**
 * A camera controller that orbits a fixed target location at a set distance —
 * dragging orbits the camera around the point instead of free-flying.
 */
export type OrbitLocationCameraController = {
  type: 'orbitLocation';
  /** The point the camera orbits (WGS 84). */
  target: GeographicPoint;
  /** Camera distance from the target, in metres. */
  distanceMeters: number;
};

/** Wraps a native-event payload the way Expo delivers it to JS handlers. */
type NativeEvent<T> = { nativeEvent: T };

/** Props for the 3D `ArcgisSceneView`. */
export type ArcgisSceneViewProps = {
  /** The declarative scene to display. */
  scene: ArcgisSceneSource;
  /** Standard React Native view style. */
  style?: StyleProp<ViewStyle>;
  /** Fired once the scene has loaded successfully. */
  onSceneLoad?: (event: NativeEvent<MapLoadEventPayload>) => void;
  /** Fired when the scene or a required resource fails to load. */
  onSceneError?: (event: NativeEvent<MapErrorEventPayload>) => void;
  /**
   * Fired on a single tap, with the screen location and (when the tap hit the
   * scene) the corresponding geographic point. Pair with
   * {@link ArcgisSceneViewRef.selectSceneFeatures} to select tapped features.
   */
  onSingleTap?: (event: NativeEvent<SingleTapEventPayload>) => void;
};

/** Imperative handle for {@link ArcgisSceneView}. */
export type ArcgisSceneViewRef = {
  /**
   * Move the camera to `camera`, optionally animating over
   * {@link ViewpointAnimationOptions.durationMs}. Resolves once applied; rejects
   * with an {@link ArcgisError}.
   */
  setCamera: (camera: Camera, options?: ViewpointAnimationOptions) => Promise<void>;
  /**
   * Query the elevation of the scene's base surface at a geographic point.
   * Resolves with the elevation in metres above sea level. Requires an elevation
   * surface (present by default); rejects with an {@link ArcgisError} if the
   * surface has no data at the point or is still loading.
   */
  getSurfaceElevation: (point: GeographicPoint) => Promise<number>;
  /**
   * Identify the scene-layer features near a screen location (e.g. from
   * {@link ArcgisSceneViewProps.onSingleTap}) and select them, highlighting the
   * hits. Resolves with the number of features selected across all scene layers.
   * Rejects with an {@link ArcgisError}.
   */
  selectSceneFeatures: (options: IdentifyOptions) => Promise<number>;
  /** Clear the selection highlight on every scene layer. */
  clearSceneSelection: () => Promise<void>;
};

// Re-exported so consumers can type error handlers without reaching into events.
export type { ArcgisError };
