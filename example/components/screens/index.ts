import type { ComponentType } from 'react';

import type { ScreenProps } from '../constants';
import { AuthScreen } from './AuthScreen';
import { BackgroundScreen } from './BackgroundScreen';
import { BasemapGalleryScreen } from './BasemapGalleryScreen';
import { BasemapParametersScreen } from './BasemapParametersScreen';
import { BasemapScreen } from './BasemapScreen';
import { BookmarksScreen } from './BookmarksScreen';
import { CalloutScreen } from './CalloutScreen';
import { ClusterScreen } from './ClusterScreen';
import { CoordinatesScreen } from './CoordinatesScreen';
import { CreateGeodatabaseScreen } from './CreateGeodatabaseScreen';
import { AttachmentsScreen } from './AttachmentsScreen';
import { GeodatabaseTransactionScreen } from './GeodatabaseTransactionScreen';
import { UpdateRelatedScreen } from './UpdateRelatedScreen';
import { EditScreen } from './EditScreen';
import { FeatureFormScreen } from './FeatureFormScreen';
import { GeometryEditorScreen } from './GeometryEditorScreen';
import { NavigateRerouteScreen, NavigateRouteScreen } from './NavigationScreen';
import {
  DisplayRouteLayerScreen,
  FindClosestFacilityMultiScreen,
  FindClosestFacilityScreen,
  FindRouteBarriersScreen,
  FindRouteNetworkScreen,
  FindRouteScreen,
  ShowServiceAreaScreen,
  ShowServiceAreasMultiScreen,
} from './RoutingScreens';
import { ErrorScreen } from './ErrorScreen';
import { FeatureCollectionScreen } from './FeatureCollectionScreen';
import { FeatureLayerScreen } from './FeatureLayerScreen';
import { GroupLayerScreen } from './GroupLayerScreen';
import { GeocodeScreen } from './GeocodeScreen';
import { GeodatabaseScreen } from './GeodatabaseScreen';
import { GeodesicScreen } from './GeodesicScreen';
import { GeometryOpsScreen } from './GeometryOpsScreen';
import { GeometryRefineScreen } from './GeometryRefineScreen';
import { GeometryTypesScreen } from './GeometryTypesScreen';
import { GraphicsScreen } from './GraphicsScreen';
import { GridScreen } from './GridScreen';
import { LabelsScreen } from './LabelsScreen';
import { IdentifyScreen } from './IdentifyScreen';
import { MapImageSublayerScreen } from './MapImageSublayerScreen';
import { PopupScreen } from './PopupScreen';
import { LayerTypesScreen } from './LayerTypesScreen';
import { LocationScreen } from './LocationScreen';
import { MonitorStatusScreen } from './MonitorStatusScreen';
import { RotationScreen } from './RotationScreen';
import { OgcCqlScreen } from './OgcCqlScreen';
import { QueryDepthScreen } from './QueryDepthScreen';
import { RelatedFeaturesScreen } from './RelatedFeaturesScreen';
import { RendererScreen } from './RendererScreen';
import { DownloadVectorTilesScreen } from './DownloadVectorTilesScreen';
import { OfflineScreen } from './OfflineScreen';
import { OverviewMapScreen } from './OverviewMapScreen';
import { SpatialReferenceScreen } from './SpatialReferenceScreen';
import { TransformationsScreen } from './TransformationsScreen';
import { QueryScreen } from './QueryScreen';
import { QueryStatisticsScreen } from './QueryStatisticsScreen';
import { RemountScreen } from './RemountScreen';
import { ScaleBarScreen } from './ScaleBarScreen';
import { ScaleExtentScreen } from './ScaleExtentScreen';
import { LocalSceneScreen } from './LocalSceneScreen';
import { SceneScreen } from './SceneScreen';
import {
  Add3DTilesLayerScreen,
  AtmosphereEffectScreen,
  CameraViewshedScreen,
  ConfigureSceneEnvironmentScreen,
  DistanceMeasurementScreen,
  ExtrudedFeaturesScreen,
  ExtrudedGraphicsScreen,
  GeoElementLineOfSightScreen,
  GeoElementViewshedScreen,
  ImageOverlayScreen,
  IntegratedMeshLayerScreen,
  InteractiveViewshedScreen,
  Labels3DScreen,
  LineOfSightScreen,
  OrbitCameraScreen,
  RealisticLightingScreen,
  SceneLayerRendererScreen,
  SceneOrientationScreen,
  SceneRenderingModeScreen,
  SceneServiceLayerScreen,
  SceneSymbolScreen,
  SurfaceNavigationConstraintScreen,
  TerrainExaggerationScreen,
  ViewshedScreen,
} from './SceneScreens';
import { ArcadeExpressionScreen } from './ArcadeExpressionScreen';
import {
  CustomDynamicEntityScreen,
  DynamicEntityLayerScreen,
  QueryDynamicEntitiesScreen,
} from './DynamicEntityScreens';
import {
  BranchVersionScreen,
  ListVersionsScreen,
  FeatureLinkedAnnotationScreen,
  ReticleEditorScreen,
} from './EditDepthScreens';
import {
  AssociationsScreen,
  ContainerContentsScreen,
  IsolationTraceScreen,
  LoadReportScreen,
  SubnetworkTraceScreen,
  TraceScreen,
  UtilityNetworkSnapScreen,
  ValidateTopologyScreen,
} from './UtilityNetworkScreens';
import {
  ArCollectScreen,
  ArFlyoverScreen,
  ArHiddenInfrastructureScreen,
  ArNavigateScreen,
  ArTabletopScreen,
} from './AugmentedRealityScreens';
import { ArDiagnosticsScreen } from './ArDiagnosticsScreen';
import {
  FeatureCollectionQueryScreen,
  FeatureRenderingModeMapScreen,
  FeatureRequestModeScreen,
  PointSceneLayerScreen,
  SubtypeSublayerScreen,
  TimeOffsetScreen,
  WfsXmlQueryScreen,
} from './ApiDemoLayerScreens';
import {
  GeodesicSectorEllipseScreen,
  IdentifyWmsScreen,
  ManageOperationalLayersScreen,
  StyleGraphicsWithRendererScreen,
  WmsStyleScreen,
} from './ApiDemoMiscScreens';
import { TiledBasemapScreen, VectorTiledCustomStyleScreen } from './BasemapLayerScreens';
import {
  BuildingSceneLayerScreen,
  FilterBuildingSceneLayerScreen,
} from './BuildingSceneLayerScreens';
import { EncScreen } from './EncScreen';
import { LineOfSightMapScreen } from './LineOfSightMapScreen';
import { QueryTimeExtentScreen } from './QueryTimeExtentScreen';
import { IwaAuthScreen, PkiAuthScreen } from './EnterpriseAuthScreens';
import { GeoprocessingViewshedScreen, HotspotsScreen } from './GeoprocessingScreens';
import {
  AnnotationSublayerScreen,
  IdentifyRasterCellScreen,
  MosaicRasterScreen,
} from './RasterAnnotationScreens';
import {
  KmlContentsScreen,
  KmlGroundOverlayScreen,
  KmlIdentifyScreen,
  KmlMultiTrackScreen,
  KmlNetworkLinkScreen,
  KmlSaveScreen,
  KmlTourScreen,
} from './KmlScreens';
import {
  FloorsScreen,
  GeotriggerScreen,
  IndoorPositioningScreen,
  NmeaScreen,
} from './LocationSubsystemScreens';
import { MapAlgebraScreen, RasterFunctionServiceScreen } from './RasterFunctionScreens';
import { RasterRenderingRuleScreen } from './RasterRenderingRuleScreen';
import { BlendRasterScreen, ColormapRasterScreen, RgbRasterScreen } from './RasterRendererScreens';
import { ShapefileSymbologyScreen } from './ShapefileScreens';
import { SublayerClassBreaksScreen } from './SublayerRendererScreen';
import { MobileScenePackageScreen, PointCloudLayerScreen } from './ScenePackageScreens';
import { RasterElevationScreen, TilePackageElevationScreen } from './SceneElevationScreens';
import { SurfaceElevationScreen } from './SurfaceElevationScreen';
import { SurfacePlacementScreen } from './SurfacePlacementScreen';
import { AnimateGraphicScreen } from './AnimateGraphicScreen';
import { FilterFeaturesScreen } from './FilterFeaturesScreen';
import { MatchViewpointScreen } from './MatchViewpointScreen';
import { DistanceCompositeScreen } from './DistanceCompositeScreen';
import { SceneSelectionScreen } from './SceneSelectionScreen';
import { ShapefileMetadataScreen } from './ShapefileMetadataScreen';
import { CustomDictionaryScreen, MobileStyleSymbolScreen } from './StyleFileScreens';
import { WebSceneScreen } from './WebSceneScreen';
import { ServiceBrowserScreen } from './ServiceBrowserScreen';
import { ScreenshotScreen } from './ScreenshotScreen';
import { ViewpointScreen } from './ViewpointScreen';
import { SearchWebMapScreen } from './SearchWebMapScreen';
import { WebMapScreen } from './WebMapScreen';

export type ScreenKey =
  | 'basemap'
  | 'webmap'
  | 'layers'
  | 'layertypes'
  | 'featurecollection'
  | 'grouplayer'
  | 'servicebrowser'
  | 'graphics'
  | 'geometrytypes'
  | 'geometryops'
  | 'geodesic'
  | 'geometryrefine'
  | 'renderer'
  | 'labels'
  | 'rgbraster'
  | 'colormapraster'
  | 'scenelayerrenderer'
  | 'scenerenderingmode'
  | 'shapefilesymbology'
  | 'sublayerclassbreaks'
  | 'rasterfunctionservice'
  | 'rasterrenderingrule'
  | 'cluster'
  | 'viewpoint'
  | 'screenshot'
  | 'scalebar'
  | 'scaleextent'
  | 'grid'
  | 'background'
  | 'callout'
  | 'coordinates'
  | 'location'
  | 'monitorstatus'
  | 'rotation'
  | 'overview'
  | 'bookmarks'
  | 'basemapparams'
  | 'spatialref'
  | 'basemapgallery'
  | 'identify'
  | 'arcadeexpression'
  | 'query'
  | 'querydepth'
  | 'querystats'
  | 'related'
  | 'ogccql'
  | 'geocode'
  | 'route'
  | 'routebarriers'
  | 'routedisplay'
  | 'routenetwork'
  | 'closestfacility'
  | 'closestfacilitymulti'
  | 'servicearea'
  | 'serviceareamulti'
  | 'navigate'
  | 'navigatereroute'
  | 'transformations'
  | 'creategdb'
  | 'edit'
  | 'auth'
  | 'offline'
  | 'geodatabase'
  | 'scene'
  | 'sceneservice'
  | 'integratedmesh'
  | 'tiles3d'
  | 'terrainexaggeration'
  | 'surfaceconstraint'
  | 'atmosphere'
  | 'lighting'
  | 'sceneenvironment'
  | 'orbitcamera'
  | 'scenesymbol'
  | 'extrudedgraphics'
  | 'mobilescenepackage'
  | 'pointcloud'
  | 'viewshed'
  | 'lineofsight'
  | 'geoelementviewshed'
  | 'geoelementlineofsight'
  | 'distancemeasurement'
  | 'cameraviewshed'
  | 'interactiveviewshed'
  | 'sceneorientation'
  | 'imageoverlay'
  | 'extrudedfeatures'
  | 'labels3d'
  | 'rasterelevation'
  | 'tilepackageelevation'
  | 'surfaceelevation'
  | 'surfaceplacement'
  | 'animategraphic'
  | 'filterfeatures'
  | 'matchviewpoint'
  | 'distancecomposite'
  | 'sceneselection'
  | 'blendraster'
  | 'mapalgebra'
  | 'kmltour'
  | 'kmlgroundoverlay'
  | 'kmlnetworklink'
  | 'kmlidentify'
  | 'mosaicraster'
  | 'identifyrastercell'
  | 'annotationsublayer'
  | 'dynamicentitylayer'
  | 'customdynamicentity'
  | 'tiledbasemap'
  | 'vtlcustomstyle'
  | 'enc'
  | 'iwaauth'
  | 'pkiauth'
  | 'querydynamicentities'
  | 'querytimeextent'
  | 'buildingscenelayer'
  | 'filterbuildingscenelayer'
  | 'lineofsightmap'
  | 'fcquery'
  | 'subtypesublayer'
  | 'wfsxmlquery'
  | 'featurerenderingmodemap'
  | 'featurerequestmode'
  | 'timeoffset'
  | 'pointscenelayer'
  | 'geodesicsectorellipse'
  | 'manageoperationallayers'
  | 'wmsstyle'
  | 'stylegraphicsrenderer'
  | 'identifywms'
  | 'reticleeditor'
  | 'branchversion'
  | 'listversions'
  | 'featurelinkedannotation'
  | 'untrace'
  | 'unsubnetwork'
  | 'unisolation'
  | 'unloadreport'
  | 'unvalidate'
  | 'unassociations'
  | 'uncontainer'
  | 'unsnap'
  | 'artabletop'
  | 'arflyover'
  | 'arcollect'
  | 'arnavigate'
  | 'arhidden'
  | 'ardiagnostics'
  | 'kmlcontents'
  | 'kmlsave'
  | 'kmlmultitrack'
  | 'hotspots'
  | 'gpviewshed'
  | 'floors'
  | 'indoorpositioning'
  | 'nmea'
  | 'geotriggers'
  | 'shapefilemetadata'
  | 'customdictionary'
  | 'mobilestylesymbol'
  | 'attachments'
  | 'featureform'
  | 'gdbtransaction'
  | 'geometryeditor'
  | 'localscene'
  | 'mapimagesublayer'
  | 'popup'
  | 'searchwebmap'
  | 'updaterelated'
  | 'vectortiles'
  | 'webscene'
  | 'remount'
  | 'error';

/**
 * The Esri sample-app categories, in the same alphabetical order as the
 * ArcGIS Maps SDK for Swift samples app. `all` is the catch-all that lists
 * every screen (including diagnostics that belong to no feature category).
 */
export type CategoryKey =
  | 'all'
  | 'analysis'
  | 'ar'
  | 'cloudPortal'
  | 'editManage'
  | 'layers'
  | 'maps'
  | 'routing'
  | 'scenes'
  | 'searchQuery'
  | 'utility'
  | 'visualization';

export type ScreenEntry = {
  key: ScreenKey;
  title: string;
  Component: ComponentType<ScreenProps>;
  /**
   * The Esri category this sample belongs to. Omitted for diagnostics
   * (remount / expected-error), which appear only under `all`.
   */
  category?: Exclude<CategoryKey, 'all'>;
};

export type CategoryEntry = {
  key: CategoryKey;
  title: string;
  /** Fallback background color shown behind the thumbnail while it loads. */
  tint: string;
};

/** The category cards, in Esri's alphabetical order. Artwork: `categoryAssets`. */
export const CATEGORIES: CategoryEntry[] = [
  { key: 'all', title: 'All', tint: '#6E7B8B' },
  { key: 'analysis', title: 'Analysis', tint: '#8A7B6B' },
  { key: 'ar', title: 'Augmented Reality', tint: '#5B6B5A' },
  { key: 'cloudPortal', title: 'Cloud and Portal', tint: '#6B7C93' },
  { key: 'editManage', title: 'Edit and Manage Data', tint: '#8B6B6B' },
  { key: 'layers', title: 'Layers', tint: '#7A8B6B' },
  { key: 'maps', title: 'Maps', tint: '#4C5A73' },
  { key: 'routing', title: 'Routing and Logistics', tint: '#7B8B8B' },
  { key: 'scenes', title: 'Scenes', tint: '#7A6B7B' },
  { key: 'searchQuery', title: 'Search and Query', tint: '#8B7B6B' },
  { key: 'utility', title: 'Utility Networks', tint: '#5A7B8B' },
  { key: 'visualization', title: 'Visualization', tint: '#6B8B5A' },
];

/** The test screens, in category-browse order. */
export const SCREENS: ScreenEntry[] = [
  { key: 'basemap', title: 'Set basemap', Component: BasemapScreen, category: 'maps' },
  { key: 'webmap', title: 'Display map from portal item', Component: WebMapScreen, category: 'maps' },
  { key: 'viewpoint', title: 'Change viewpoint', Component: ViewpointScreen, category: 'maps' },
  { key: 'screenshot', title: 'Take screenshot', Component: ScreenshotScreen, category: 'maps' },
  { key: 'scalebar', title: 'Show scale bar', Component: ScaleBarScreen, category: 'maps' },
  {
    key: 'scaleextent',
    title: 'Set scale limits and extent',
    Component: ScaleExtentScreen,
    category: 'maps',
  },
  { key: 'grid', title: 'Show grid', Component: GridScreen, category: 'maps' },
  { key: 'background', title: 'Change map view background', Component: BackgroundScreen, category: 'maps' },
  { key: 'callout', title: 'Show callout', Component: CalloutScreen, category: 'maps' },
  { key: 'location', title: 'Show device location', Component: LocationScreen, category: 'maps' },
  { key: 'floors', title: 'Browse building floors', Component: FloorsScreen, category: 'maps' },
  { key: 'indoorpositioning', title: 'Show device location using indoor positioning', Component: IndoorPositioningScreen, category: 'maps' },
  { key: 'nmea', title: 'Show device location with NMEA data sources', Component: NmeaScreen, category: 'maps' },
  { key: 'geotriggers', title: 'Set up location-driven geotriggers', Component: GeotriggerScreen, category: 'maps' },
  {
    key: 'monitorstatus',
    title: 'Monitor draw and layer view state',
    Component: MonitorStatusScreen,
    category: 'maps',
  },
  { key: 'rotation', title: 'Set viewpoint rotation', Component: RotationScreen, category: 'maps' },
  { key: 'overview', title: 'Display overview map', Component: OverviewMapScreen, category: 'maps' },
  { key: 'bookmarks', title: 'Manage bookmarks', Component: BookmarksScreen, category: 'maps' },
  {
    key: 'basemapparams',
    title: 'Configure basemap style parameters',
    Component: BasemapParametersScreen,
    category: 'maps',
  },
  { key: 'spatialref', title: 'Set spatial reference', Component: SpatialReferenceScreen, category: 'maps' },
  {
    key: 'basemapgallery',
    title: 'Create dynamic basemap gallery',
    Component: BasemapGalleryScreen,
    category: 'maps',
  },
  {
    key: 'coordinates',
    title: 'Show coordinates in multiple formats',
    Component: CoordinatesScreen,
    category: 'searchQuery',
  },
  { key: 'layers', title: 'Add feature layers', Component: FeatureLayerScreen, category: 'layers' },
  { key: 'layertypes', title: 'Add 2D layer types', Component: LayerTypesScreen, category: 'layers' },
  {
    key: 'featurecollection',
    title: 'Add feature collection layer',
    Component: FeatureCollectionScreen,
    category: 'layers',
  },
  { key: 'grouplayer', title: 'Group layers together', Component: GroupLayerScreen, category: 'layers' },
  { key: 'kmlnetworklink', title: 'Add KML layer with network links', Component: KmlNetworkLinkScreen, category: 'layers' },
  { key: 'kmlidentify', title: 'Identify KML features', Component: KmlIdentifyScreen, category: 'layers' },
  { key: 'mosaicraster', title: 'Apply mosaic rule to rasters', Component: MosaicRasterScreen, category: 'layers' },
  { key: 'identifyrastercell', title: 'Identify raster cell', Component: IdentifyRasterCellScreen, category: 'layers' },
  { key: 'annotationsublayer', title: 'Control annotation sublayer visibility', Component: AnnotationSublayerScreen, category: 'layers' },
  { key: 'dynamicentitylayer', title: 'Add dynamic entity layer', Component: DynamicEntityLayerScreen, category: 'layers' },
  { key: 'customdynamicentity', title: 'Add custom dynamic entity data source', Component: CustomDynamicEntityScreen, category: 'layers' },
  { key: 'tiledbasemap', title: 'Add tiled layer as basemap', Component: TiledBasemapScreen, category: 'layers' },
  { key: 'vtlcustomstyle', title: 'Add vector tiled layer from custom style', Component: VectorTiledCustomStyleScreen, category: 'layers' },
  { key: 'enc', title: 'Configure electronic navigational charts', Component: EncScreen, category: 'layers' },
  {
    key: 'servicebrowser',
    title: 'Browse OGC services',
    Component: ServiceBrowserScreen,
    category: 'layers',
  },
  { key: 'graphics', title: 'Style graphics with symbols', Component: GraphicsScreen, category: 'visualization' },
  { key: 'geometrytypes', title: 'Style geometry types with symbols', Component: GeometryTypesScreen, category: 'visualization' },
  { key: 'geometryops', title: 'Geometry operations', Component: GeometryOpsScreen, category: 'analysis' },
  { key: 'geodesic', title: 'Show geodesic path', Component: GeodesicScreen, category: 'visualization' },
  { key: 'geometryrefine', title: 'Simplify, densify, generalize', Component: GeometryRefineScreen, category: 'analysis' },
  { key: 'geoelementviewshed', title: 'Show viewshed from geoelement in scene', Component: GeoElementViewshedScreen, category: 'analysis' },
  { key: 'geoelementlineofsight', title: 'Show line of sight between geoelements', Component: GeoElementLineOfSightScreen, category: 'analysis' },
  { key: 'distancemeasurement', title: 'Measure distance in scene', Component: DistanceMeasurementScreen, category: 'analysis' },
  { key: 'cameraviewshed', title: 'Show viewshed from camera in scene', Component: CameraViewshedScreen, category: 'analysis' },
  { key: 'interactiveviewshed', title: 'Show interactive viewshed with analysis overlay', Component: InteractiveViewshedScreen, category: 'analysis' },
  { key: 'mapalgebra', title: 'Apply map algebra', Component: MapAlgebraScreen, category: 'analysis' },
  { key: 'hotspots', title: 'Analyze hotspots', Component: HotspotsScreen, category: 'analysis' },
  { key: 'gpviewshed', title: 'Show viewshed from geoprocessing task', Component: GeoprocessingViewshedScreen, category: 'analysis' },
  { key: 'renderer', title: 'Apply renderers to a feature layer', Component: RendererScreen, category: 'visualization' },
  { key: 'labels', title: 'Show labels on layer', Component: LabelsScreen, category: 'visualization' },
  { key: 'sceneorientation', title: 'Apply scene property expressions', Component: SceneOrientationScreen, category: 'visualization' },
  { key: 'imageoverlay', title: 'Animate images with image overlay', Component: ImageOverlayScreen, category: 'visualization' },
  { key: 'cluster', title: 'Display clusters', Component: ClusterScreen, category: 'visualization' },
  { key: 'customdictionary', title: 'Style features with custom dictionary', Component: CustomDictionaryScreen, category: 'visualization' },
  { key: 'mobilestylesymbol', title: 'Style symbols from mobile style file', Component: MobileStyleSymbolScreen, category: 'visualization' },
  { key: 'rgbraster', title: 'Apply RGB renderer', Component: RgbRasterScreen, category: 'visualization' },
  { key: 'colormapraster', title: 'Apply colormap renderer to raster', Component: ColormapRasterScreen, category: 'visualization' },
  { key: 'blendraster', title: 'Apply blend renderer to hillshade', Component: BlendRasterScreen, category: 'visualization' },
  { key: 'kmltour', title: 'Play KML tour', Component: KmlTourScreen, category: 'visualization' },
  { key: 'kmlgroundoverlay', title: 'Set KML ground overlay properties', Component: KmlGroundOverlayScreen, category: 'visualization' },
  { key: 'scenelayerrenderer', title: 'Apply renderers to scene layer', Component: SceneLayerRendererScreen, category: 'visualization' },
  { key: 'scenerenderingmode', title: 'Set feature layer rendering mode on scene', Component: SceneRenderingModeScreen, category: 'visualization' },
  { key: 'shapefilesymbology', title: 'Apply symbology to shapefile', Component: ShapefileSymbologyScreen, category: 'visualization' },
  { key: 'shapefilemetadata', title: 'Show shapefile metadata', Component: ShapefileMetadataScreen, category: 'visualization' },
  { key: 'sublayerclassbreaks', title: 'Apply class breaks renderer to sublayer', Component: SublayerClassBreaksScreen, category: 'visualization' },
  { key: 'rasterfunctionservice', title: 'Apply function to raster from service', Component: RasterFunctionServiceScreen, category: 'visualization' },
  { key: 'rasterrenderingrule', title: 'Apply raster rendering rule', Component: RasterRenderingRuleScreen, category: 'visualization' },
  { key: 'identify', title: 'Identify layer features', Component: IdentifyScreen, category: 'searchQuery' },
  { key: 'arcadeexpression', title: 'Query features with Arcade expression', Component: ArcadeExpressionScreen, category: 'searchQuery' },
  { key: 'popup', title: 'Show popup', Component: PopupScreen, category: 'searchQuery' },
  { key: 'mapimagesublayer', title: 'Query map image sublayer', Component: MapImageSublayerScreen, category: 'searchQuery' },
  { key: 'query', title: 'Query feature table', Component: QueryScreen, category: 'searchQuery' },
  { key: 'querydepth', title: 'Filter, select, count and extent', Component: QueryDepthScreen, category: 'searchQuery' },
  { key: 'querystats', title: 'Query table statistics', Component: QueryStatisticsScreen, category: 'searchQuery' },
  { key: 'related', title: 'Query related features', Component: RelatedFeaturesScreen, category: 'searchQuery' },
  { key: 'querydynamicentities', title: 'Query dynamic entities', Component: QueryDynamicEntitiesScreen, category: 'searchQuery' },
  { key: 'querytimeextent', title: 'Query with time extent', Component: QueryTimeExtentScreen, category: 'searchQuery' },
  { key: 'lineofsightmap', title: 'Show line of sight analysis in map', Component: LineOfSightMapScreen, category: 'analysis' },
  { key: 'fcquery', title: 'Add feature collection layer from query', Component: FeatureCollectionQueryScreen, category: 'layers' },
  { key: 'subtypesublayer', title: 'Set visibility of subtype sublayer', Component: SubtypeSublayerScreen, category: 'layers' },
  { key: 'wfsxmlquery', title: 'Show WFS layer with XML query', Component: WfsXmlQueryScreen, category: 'layers' },
  { key: 'featurerequestmode', title: 'Set feature request mode', Component: FeatureRequestModeScreen, category: 'layers' },
  { key: 'timeoffset', title: 'Add feature layer with time offset', Component: TimeOffsetScreen, category: 'layers' },
  { key: 'featurerenderingmodemap', title: 'Set feature layer rendering mode on map', Component: FeatureRenderingModeMapScreen, category: 'visualization' },
  { key: 'pointscenelayer', title: 'Add point scene layer', Component: PointSceneLayerScreen, category: 'scenes' },
  { key: 'geodesicsectorellipse', title: 'Show geodesic sector and ellipse', Component: GeodesicSectorEllipseScreen, category: 'visualization' },
  { key: 'manageoperationallayers', title: 'Manage operational layers', Component: ManageOperationalLayersScreen, category: 'layers' },
  { key: 'wmsstyle', title: 'Apply style to WMS layer', Component: WmsStyleScreen, category: 'layers' },
  { key: 'stylegraphicsrenderer', title: 'Style graphics with renderer', Component: StyleGraphicsWithRendererScreen, category: 'visualization' },
  { key: 'identifywms', title: 'Identify features in WMS layer', Component: IdentifyWmsScreen, category: 'layers' },
  { key: 'ogccql', title: 'Query with CQL filters', Component: OgcCqlScreen, category: 'searchQuery' },
  { key: 'geocode', title: 'Search with geocode', Component: GeocodeScreen, category: 'searchQuery' },
  { key: 'routedisplay', title: 'Display route layer', Component: DisplayRouteLayerScreen, category: 'routing' },
  { key: 'closestfacility', title: 'Find closest facility from point', Component: FindClosestFacilityScreen, category: 'routing' },
  { key: 'closestfacilitymulti', title: 'Find closest facility to multiple points', Component: FindClosestFacilityMultiScreen, category: 'routing' },
  { key: 'route', title: 'Find route', Component: FindRouteScreen, category: 'routing' },
  { key: 'routebarriers', title: 'Find route around barriers', Component: FindRouteBarriersScreen, category: 'routing' },
  { key: 'routenetwork', title: 'Find route in transport network', Component: FindRouteNetworkScreen, category: 'routing' },
  { key: 'navigate', title: 'Navigate route', Component: NavigateRouteScreen, category: 'routing' },
  { key: 'navigatereroute', title: 'Navigate route with rerouting', Component: NavigateRerouteScreen, category: 'routing' },
  { key: 'servicearea', title: 'Show service area', Component: ShowServiceAreaScreen, category: 'routing' },
  { key: 'serviceareamulti', title: 'Show service areas for multiple facilities', Component: ShowServiceAreasMultiScreen, category: 'routing' },
  { key: 'transformations', title: 'Project with chosen transformation', Component: TransformationsScreen, category: 'editManage' },
  { key: 'kmlcontents', title: 'List contents of KML file', Component: KmlContentsScreen, category: 'editManage' },
  { key: 'kmlsave', title: 'Create and save KML file', Component: KmlSaveScreen, category: 'editManage' },
  { key: 'kmlmultitrack', title: 'Create KML multi-track', Component: KmlMultiTrackScreen, category: 'editManage' },
  { key: 'reticleeditor', title: 'Edit geometries with programmatic reticle tool', Component: ReticleEditorScreen, category: 'editManage' },
  { key: 'branchversion', title: 'Edit with branch versioning', Component: BranchVersionScreen, category: 'editManage' },
  { key: 'listversions', title: 'List geodatabase versions', Component: ListVersionsScreen, category: 'editManage' },
  { key: 'featurelinkedannotation', title: 'Edit features with feature-linked annotation', Component: FeatureLinkedAnnotationScreen, category: 'editManage' },
  { key: 'creategdb', title: 'Create mobile geodatabase', Component: CreateGeodatabaseScreen, category: 'editManage' },
  { key: 'gdbtransaction', title: 'Edit geodatabase with transactions', Component: GeodatabaseTransactionScreen, category: 'editManage' },
  { key: 'geometryeditor', title: 'Snap geometry edits', Component: GeometryEditorScreen, category: 'editManage' },
  { key: 'edit', title: 'Manage features', Component: EditScreen, category: 'editManage' },
  { key: 'featureform', title: 'Edit features using feature forms', Component: FeatureFormScreen, category: 'editManage' },
  { key: 'attachments', title: 'Edit feature attachments', Component: AttachmentsScreen, category: 'editManage' },
  { key: 'updaterelated', title: 'Update related features', Component: UpdateRelatedScreen, category: 'editManage' },
  { key: 'offline', title: 'Generate offline map', Component: OfflineScreen, category: 'editManage' },
  { key: 'vectortiles', title: 'Download vector tiles', Component: DownloadVectorTilesScreen, category: 'editManage' },
  { key: 'geodatabase', title: 'Edit and sync features', Component: GeodatabaseScreen, category: 'editManage' },
  { key: 'searchwebmap', title: 'Search for web map', Component: SearchWebMapScreen, category: 'cloudPortal' },
  { key: 'auth', title: 'Authenticate with token', Component: AuthScreen, category: 'cloudPortal' },
  { key: 'iwaauth', title: 'Authenticate with Integrated Windows Authentication', Component: IwaAuthScreen, category: 'cloudPortal' },
  { key: 'pkiauth', title: 'Authenticate with PKI certificate', Component: PkiAuthScreen, category: 'cloudPortal' },
  { key: 'scene', title: 'Display scene', Component: SceneScreen, category: 'scenes' },
  { key: 'webscene', title: 'Display web scene from portal item', Component: WebSceneScreen, category: 'scenes' },
  { key: 'localscene', title: 'Display local scene', Component: LocalSceneScreen, category: 'scenes' },
  { key: 'sceneservice', title: 'Add scene layer from service', Component: SceneServiceLayerScreen, category: 'scenes' },
  { key: 'integratedmesh', title: 'Add integrated mesh layer', Component: IntegratedMeshLayerScreen, category: 'scenes' },
  { key: 'tiles3d', title: 'Add 3D tiles layer', Component: Add3DTilesLayerScreen, category: 'scenes' },
  { key: 'terrainexaggeration', title: 'Apply terrain exaggeration', Component: TerrainExaggerationScreen, category: 'scenes' },
  { key: 'surfaceconstraint', title: 'Set surface navigation constraint', Component: SurfaceNavigationConstraintScreen, category: 'scenes' },
  { key: 'atmosphere', title: 'Set atmosphere effect in scene', Component: AtmosphereEffectScreen, category: 'scenes' },
  { key: 'lighting', title: 'Show realistic light and shadows', Component: RealisticLightingScreen, category: 'scenes' },
  { key: 'sceneenvironment', title: 'Configure scene environment', Component: ConfigureSceneEnvironmentScreen, category: 'scenes' },
  { key: 'orbitcamera', title: 'Orbit camera around object', Component: OrbitCameraScreen, category: 'scenes' },
  { key: 'scenesymbol', title: 'Style point with scene symbol', Component: SceneSymbolScreen, category: 'scenes' },
  { key: 'extrudedgraphics', title: 'Show extruded graphics', Component: ExtrudedGraphicsScreen, category: 'scenes' },
  { key: 'mobilescenepackage', title: 'Display scene from mobile scene package', Component: MobileScenePackageScreen, category: 'scenes' },
  { key: 'pointcloud', title: 'Add point cloud layer from file', Component: PointCloudLayerScreen, category: 'scenes' },
  { key: 'buildingscenelayer', title: 'Add building scene layer', Component: BuildingSceneLayerScreen, category: 'scenes' },
  { key: 'filterbuildingscenelayer', title: 'Filter building scene layer', Component: FilterBuildingSceneLayerScreen, category: 'scenes' },
  { key: 'viewshed', title: 'Show viewshed from point in scene', Component: ViewshedScreen, category: 'scenes' },
  { key: 'lineofsight', title: 'Show line of sight in scene', Component: LineOfSightScreen, category: 'scenes' },
  { key: 'extrudedfeatures', title: 'Show extruded features', Component: ExtrudedFeaturesScreen, category: 'scenes' },
  { key: 'labels3d', title: 'Show labels on layer in 3D', Component: Labels3DScreen, category: 'scenes' },
  { key: 'rasterelevation', title: 'Add elevation source from raster', Component: RasterElevationScreen, category: 'scenes' },
  { key: 'tilepackageelevation', title: 'Add elevation source from tile package', Component: TilePackageElevationScreen, category: 'scenes' },
  { key: 'surfaceelevation', title: 'Get elevation at point on surface', Component: SurfaceElevationScreen, category: 'scenes' },
  { key: 'surfaceplacement', title: 'Set surface placement mode', Component: SurfacePlacementScreen, category: 'scenes' },
  { key: 'animategraphic', title: 'Animate 3D graphic', Component: AnimateGraphicScreen, category: 'scenes' },
  { key: 'filterfeatures', title: 'Filter features in scene', Component: FilterFeaturesScreen, category: 'scenes' },
  { key: 'matchviewpoint', title: 'Match viewpoint of geo views', Component: MatchViewpointScreen, category: 'scenes' },
  { key: 'distancecomposite', title: 'Style point with distance composite scene symbol', Component: DistanceCompositeScreen, category: 'scenes' },
  { key: 'sceneselection', title: 'Select features in scene layer', Component: SceneSelectionScreen, category: 'scenes' },
  { key: 'untrace', title: 'Trace utility network', Component: TraceScreen, category: 'utility' },
  { key: 'unsubnetwork', title: 'Analyze network with subnetwork trace', Component: SubnetworkTraceScreen, category: 'utility' },
  { key: 'unisolation', title: 'Run valve isolation trace', Component: IsolationTraceScreen, category: 'utility' },
  { key: 'unloadreport', title: 'Create load report', Component: LoadReportScreen, category: 'utility' },
  { key: 'unvalidate', title: 'Validate utility network topology', Component: ValidateTopologyScreen, category: 'utility' },
  { key: 'unassociations', title: 'Show utility associations', Component: AssociationsScreen, category: 'utility' },
  { key: 'uncontainer', title: 'Display content of utility network container', Component: ContainerContentsScreen, category: 'utility' },
  { key: 'unsnap', title: 'Snap geometry edits with utility network rules', Component: UtilityNetworkSnapScreen, category: 'utility' },
  { key: 'artabletop', title: 'Augment reality to show tabletop scene', Component: ArTabletopScreen, category: 'ar' },
  { key: 'arflyover', title: 'Augment reality to fly over scene', Component: ArFlyoverScreen, category: 'ar' },
  { key: 'arcollect', title: 'Augment reality to collect data', Component: ArCollectScreen, category: 'ar' },
  { key: 'arnavigate', title: 'Augment reality to navigate route', Component: ArNavigateScreen, category: 'ar' },
  { key: 'arhidden', title: 'Augment reality to show hidden infrastructure', Component: ArHiddenInfrastructureScreen, category: 'ar' },
  { key: 'ardiagnostics', title: 'AR diagnostics & device sensors', Component: ArDiagnosticsScreen, category: 'ar' },
  { key: 'remount', title: 'Unmount / remount', Component: RemountScreen },
  { key: 'error', title: 'Expected error', Component: ErrorScreen },
];

/** The screens shown under a category card. `all` returns everything. */
export function screensForCategory(key: CategoryKey): ScreenEntry[] {
  if (key === 'all') return SCREENS;
  return SCREENS.filter((screen) => screen.category === key);
}
