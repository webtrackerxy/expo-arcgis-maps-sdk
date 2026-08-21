/** Public serializable types for `expo-arcgis-maps-sdk`. */

export type { SpatialReference, GeographicPoint, ScreenPoint } from './common';
export { WGS84 } from './common';

export type {
  BasemapStyle,
  BasemapWorldview,
  BasemapStyleParameters,
  BasemapStyleInfo,
} from './basemap';
export { BASEMAP_STYLES, BASEMAP_WORLDVIEWS, isBasemapStyle } from './basemap';

export type { Viewpoint, ViewpointAnimationOptions } from './viewpoint';

export type {
  FeatureLayerSource,
  ArcgisMapSource,
  BasemapLayerSource,
  MapGeotrigger,
  TimeOffset,
  TimeUnit,
} from './map';

export type { MapGrid } from './grid';
export { MAP_GRIDS, isMapGrid } from './grid';

export type {
  LocationAutoPanMode,
  LocationDisplayOptions,
  LocationUpdateEventPayload,
} from './location';

export type { CoordinateFormats } from './coordinates';

export type { ArcgisColor } from './color';
export { isArcgisColor } from './color';

export type {
  PointGeometry,
  PolylineGeometry,
  PolygonGeometry,
  ArcgisGeometry,
  GeodesicEllipseOptions,
  GeodesicSectorOptions,
  GeometryCombineOperation,
  GeometryRelationships,
  ProjectedPoint,
} from './geometry';

export type {
  SimpleMarkerSymbol,
  SimpleMarkerSymbolStyle,
  SimpleLineSymbol,
  SimpleLineSymbolStyle,
  SimpleFillSymbol,
  SimpleFillSymbolStyle,
  MultilayerStrokeLayer,
  MultilayerPolylineSymbol,
  MultilayerPolygonSymbol,
  WebStyleSymbol,
  SimpleMarkerSceneSymbolStyle,
  SimpleMarkerSceneSymbol,
  MeshFillSymbol,
  DistanceSymbolRange,
  DistanceCompositeSceneSymbol,
  ArcgisSymbol,
} from './symbol';

export type { GraphicSource } from './graphics';

export type {
  SimpleRenderer,
  ScaledSymbol,
  UniqueValueClass,
  UniqueValueRenderer,
  ClassBreak,
  ClassBreaksRenderer,
  DictionaryRenderer,
  ArcgisRenderer,
} from './renderer';

export type { LabelDefinition, LabelPlacement } from './label';

export type { ClusteringOptions } from './cluster';

export type {
  TiledLayerSource,
  WebTiledLayerSource,
  OpenStreetMapLayerSource,
  VectorTiledLayerSource,
  WmsLayerSource,
  WfsLayerSource,
  OgcFeatureLayerSource,
  WmtsLayerSource,
  MapImageLayerSource,
  MapImageSublayerVisibility,
  MapImageSublayerRenderer,
  FeatureCollectionLayerSource,
  FeatureCollectionField,
  FeatureCollectionFeature,
  FeatureCollectionTableLayerSource,
  FeatureCollectionQueryLayerSource,
  KmlLayerSource,
  KmlTourAction,
  KmlTourOptions,
  RasterLayerSource,
  HillshadeRasterRenderer,
  StretchRasterRenderer,
  RgbRasterRenderer,
  ColormapRasterRenderer,
  BlendRasterRenderer,
  RasterMosaicRule,
  AnnotationSublayerVisibility,
  ShapefileLayerSource,
  GeoPackageLayerSource,
  AnnotationLayerSource,
  DimensionLayerSource,
  SubtypeFeatureLayerSource,
  CustomDynamicEntityFeed,
  DynamicEntityLayerSource,
  EncLayerSource,
  GroupLayerSource,
  ArcgisNonGroupLayerSource,
  ArcgisLayerSource,
  BrowsableServiceType,
  ServiceLayerInfo,
  GetServiceLayersOptions,
} from './layer';

export type { ConfigureArcgisOptions } from './config';

export type {
  MapLoadEventPayload,
  MapErrorEventPayload,
  SingleTapEventPayload,
  ViewpointChangeEventPayload,
  DrawStatus,
  DrawStatusChangeEventPayload,
  GeotriggerNotificationEventPayload,
  LayerViewStatus,
  LayerViewStateChangeEventPayload,
  NavigationStatusEventPayload,
} from './events';

export type {
  ArcadeEvaluationOptions,
  ArcadeEvaluationResult,
  IdentifyOptions,
  IdentifyResult,
  PopupField,
  PopupInfo,
  FeatureFormInfo,
} from './identify';

export type {
  FeatureQueryOptions,
  FeatureQueryResult,
  SelectFeaturesOptions,
  QueryExtentOptions,
  QueryExtentResult,
  RelatedFeaturesOptions,
  StatisticType,
  StatisticDefinition,
  QueryStatisticsOptions,
  StatisticsRow,
} from './query';

export type { FeatureEdit, ApplyEditsOptions, ApplyEditsResult } from './edit';

export type { ExportImageResult } from './screenshot';

export type { AuthenticateOptions, OAuthAuthenticateOptions, PortalUser } from './auth';

export type { GeocodeResult } from './geocode';

export type {
  WebMapSearchResult,
  CreateAndSaveMapOptions,
  CreateAndSaveMapResult,
  AddPortalItemOptions,
  AddPortalItemResult,
} from './portal';

export type { AttachmentInfo } from './attachment';

export type { JobStatus, JobProgressEvent, Job } from './job';
export type {
  GeoprocessingInput,
  GeoprocessingJobOptions,
  GeoprocessingJobResult,
  GeoprocessingJob,
} from './geoprocessing';

export type {
  GenerateGeodatabaseOptions,
  GenerateGeodatabaseResult,
  GenerateGeodatabaseJob,
  SyncGeodatabaseOptions,
  SyncGeodatabaseResult,
  SyncGeodatabaseJob,
  GeodatabaseFieldType,
  GeodatabaseFieldDescription,
  CreateMobileGeodatabaseOptions,
  MobileGeodatabaseResult,
  GeodatabaseTransactionResult,
  ContingentValidationResult,
} from './geodatabase';

export type {
  RouteResult,
  SolveRouteOptions,
  ClosestFacilityOptions,
  ClosestFacilityResult,
  ClosestFacilityRoute,
  ServiceAreaOptions,
  ServiceAreaResult,
  FacilityServiceArea,
} from './route';

export type {
  ArcgisMapViewProps,
  ArcgisMapViewRef,
  GeometryEditorOptions,
  NavigationOptions,
} from './view';

export type {
  Camera,
  ElevationSource,
  SceneLayerPolygonFilter,
  SceneLayerSource,
  SceneViewingMode,
  SurfacePlacement,
  ExtrusionMode,
  SceneExtrusion,
  SceneGraphicsOverlay,
  SceneOrientationExpressions,
  SceneImageOverlay,
  SceneFeatureLayer,
  ViewshedAnalysis,
  LineOfSightAnalysis,
  GeoElementViewshedAnalysis,
  GeoElementLineOfSightAnalysis,
  DistanceMeasurementAnalysis,
  CameraViewshedAnalysis,
  InteractiveViewshedAnalysis,
  SceneAnalysis,
  WebSceneLayerLabels,
  OrbitLocationCameraController,
  ArcgisSceneSource,
  ArcgisSceneViewProps,
  ArcgisSceneViewRef,
} from './scene';
