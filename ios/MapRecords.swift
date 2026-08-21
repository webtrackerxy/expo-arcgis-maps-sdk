import ExpoModulesCore

/// Serializable prop records mirroring the TypeScript DTOs in `src/types`. Only
/// the v0.1 (Phase 2) subset is modelled: basemap / web map + initial viewpoint.
/// Feature layers and graphics arrive in Milestone 2.

struct PointRecord: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var altitude: Double?
  @Field var spatialReferenceWkid: Int?
}

struct ViewpointRecord: Record {
  @Field var center: PointRecord = PointRecord()
  @Field var scale: Double?
  @Field var rotation: Double?
}

/// Options for an animated `setViewpoint` call.
struct ViewpointAnimationRecord: Record {
  @Field var durationMs: Double?
}

/// A point in the view's coordinate space.
struct ScreenPointRecord: Record {
  @Field var x: Double = 0
  @Field var y: Double = 0
}

/// Options for an `identify` call.
struct IdentifyOptionsRecord: Record {
  @Field var screenPoint: ScreenPointRecord = ScreenPointRecord()
  @Field var tolerance: Double?
  @Field var maximumResults: Int?
}

/// Identify options plus the Arcade expression to evaluate against each feature.
struct ArcadeEvaluationOptionsRecord: Record {
  @Field var screenPoint: ScreenPointRecord = ScreenPointRecord()
  @Field var tolerance: Double?
  @Field var maximumResults: Int?
  @Field var expression: String = ""
}

/// Options for a `queryFeatures` call.
struct FeatureQueryOptionsRecord: Record {
  @Field var layerId: String = ""
  @Field var whereClause: String?
  @Field var maxResults: Int?
  @Field var select: Bool = false
}

/// Options for `selectFeatures` / `queryFeatureExtent` (layer id + where clause).
struct LayerWhereRecord: Record {
  @Field var layerId: String = ""
  @Field var whereClause: String?
}

/// Options for a `queryRelatedFeatures` call.
struct RelatedFeaturesOptionsRecord: Record {
  @Field var layerId: String = ""
  @Field var objectId: Int = 0
}

/// A single add/update to a feature layer's service table.
struct FeatureEditRecord: Record {
  @Field var objectId: Int?
  @Field var attributes: [String: Any]?
  @Field var point: PointRecord?
}

/// Options for an `applyEdits` call.
struct ApplyEditsOptionsRecord: Record {
  @Field var layerId: String = ""
  @Field var adds: [FeatureEditRecord] = []
  @Field var updates: [FeatureEditRecord] = []
  @Field var deleteObjectIds: [Int] = []
}

/// One class of a unique-value renderer.
struct UniqueValueRecord: Record {
  @Field var values: [Any] = []
  @Field var symbol: SymbolRecord = SymbolRecord()
  @Field var label: String?
  @Field var alternateSymbols: [ScaledSymbolRecord] = []
}

/// A symbol shown only within a map-scale range (a unique-value alternate symbol).
struct ScaledSymbolRecord: Record {
  @Field var symbol: SymbolRecord = SymbolRecord()
  @Field var minScale: Double?
  @Field var maxScale: Double?
}

/// One class of a class-breaks renderer.
struct ClassBreakRecord: Record {
  @Field var minValue: Double?
  @Field var maxValue: Double = 0
  @Field var symbol: SymbolRecord = SymbolRecord()
  @Field var label: String?
}

/// A renderer: a `type` discriminator plus the fields for that type.
struct RendererRecord: Record {
  @Field var type: String = ""
  @Field var symbol: SymbolRecord?
  @Field var fields: [String] = []
  @Field var uniqueValues: [UniqueValueRecord] = []
  @Field var field: String?
  @Field var classBreaks: [ClassBreakRecord] = []
  @Field var defaultSymbol: SymbolRecord?
  /// Portal item id of a dictionary symbol style, for a `dictionary` renderer.
  @Field var portalItemId: String?
  /// Local `.stylx` dictionary style file path, for a `dictionary` renderer.
  @Field var stylxPath: String?
}

/// A text label definition for a feature layer.
struct LabelRecord: Record {
  @Field var expression: String = ""
  @Field var arcade: Bool?
  @Field var color: String?
  @Field var size: Double?
  @Field var haloColor: String?
  @Field var haloWidth: Double?
  @Field var placement: String?
}

/// Labels applied to a named layer inside a loaded web scene.
struct WebSceneLayerLabelsRecord: Record {
  @Field var layerPath: [String] = []
  @Field var labels: [LabelRecord] = []
}

/// Point clustering (feature reduction) for a feature layer.
struct ClusteringRecord: Record {
  @Field var enabled: Bool = false
  @Field var radius: Double?
  @Field var maxSymbolSize: Double?
  @Field var color: String?
}

/// Visibility override for one sublayer of a map image layer.
struct SublayerVisibilityRecord: Record {
  @Field var sublayerId: Int = 0
  @Field var name: String?
  @Field var visible: Bool = true
}

/// A mosaic rule for an image-service raster layer.
struct MosaicRuleRecord: Record {
  @Field var method: String?
  @Field var operation: String?
  @Field var ascending: Bool?
  @Field var sortField: String?
  @Field var sortValue: String?
  @Field var lockRasterIds: [Int] = []
}

struct SublayerRendererRecord: Record {
  @Field var sublayerId: Int = 0
  @Field var renderer: RendererRecord?
}

/// A non-feature operational layer: a `type` discriminator plus that type's
/// fields. Reconciled by `id`.
struct LayerRecord: Record {
  @Field var id: String = ""
  @Field var type: String = ""
  @Field var visible: Bool?
  @Field var opacity: Double?
  @Field var url: String?
  @Field var urlTemplate: String?
  @Field var subDomains: [String] = []
  @Field var layerNames: [String] = []
  @Field var tableName: String?
  @Field var layerId: String?
  @Field var collectionId: String?
  @Field var cqlFilter: String?
  @Field var sublayerVisibility: [SublayerVisibilityRecord] = []
  @Field var sublayerRenderers: [SublayerRendererRecord] = []
  @Field var renderer: RendererRecord?
  @Field var portalItemId: String?
  /// Sublayers for a `group` layer (leaf layers only; nested groups are rejected in JS).
  @Field var sublayers: [LayerRecord] = []
  @Field var styleName: String?
  @Field var xmlQuery: String?
  @Field var fields: [FeatureCollectionFieldRecord] = []
  @Field var features: [FeatureCollectionFeatureRecord] = []
  @Field var `where`: String?
  @Field var path: String?
  @Field var tableIndex: Int?
  @Field var hillshade: HillshadeRecord?
  @Field var stretch: StretchRecord?
  @Field var rgb: RgbRendererRecord?
  @Field var colormap: ColormapRendererRecord?
  @Field var blend: BlendRendererRecord?
  @Field var rasterFunction: String?
  @Field var renderingRule: String?
  @Field var mosaicRule: MosaicRuleRecord?
  @Field var groundOverlayOpacity: Double?
  @Field var customFeed: CustomDynamicEntityFeedRecord?
  /// ENC layer: S-57/S-52 hydrography resources dir and optional SENC cache dir.
  @Field var resourcePath: String?
  @Field var sencPath: String?
}

/// A custom dynamic-entity feed replayed from a local JSONL observations file.
struct CustomDynamicEntityFeedRecord: Record {
  @Field var observationsPath: String = ""
  @Field var entityIdField: String = ""
  @Field var longitudeField: String = ""
  @Field var latitudeField: String = ""
  @Field var observationsPerSecond: Double?
}

/// Options for the `controlKmlTour` view function.
struct KmlTourOptionsRecord: Record {
  @Field var layerId: String = ""
  @Field var action: String = ""
}

/// Selects a feature (layer + where clause) as a trace starting point / barrier.
struct UtilityFeatureSelectorRecord: Record {
  @Field var layerUrl: String = ""
  @Field var whereClause: String = ""
}

/// Options for a `traceUtilityNetwork` call.
struct TraceUtilityNetworkRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var traceType: String = ""
  @Field var startingPoints: [UtilityFeatureSelectorRecord] = []
  @Field var barriers: [UtilityFeatureSelectorRecord] = []
}

/// Options for a `getUtilityAssociations` call.
struct UtilityAssociationsRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var extent: EnvelopeRecord = EnvelopeRecord()
  @Field var kind: String?
}

/// Options for a `validateUtilityNetworkTopology` call.
struct ValidateUtilityNetworkRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var extent: EnvelopeRecord = EnvelopeRecord()
}

/// Options for a `createServiceVersion` call.
struct ServiceVersionRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var versionName: String = ""
  @Field var description: String?
  @Field var access: String = "private"
}

/// Options for a `queryDynamicEntities` call.
struct DynamicEntityQueryRecord: Record {
  @Field var url: String = ""
  @Field var trackIds: [String]?
}

/// Source for a `getKmlInfo` call: exactly one of `url` / `path`.
struct KmlInfoSourceRecord: Record {
  @Field var url: String?
  @Field var path: String?
}

/// A point placemark to author into a KML file.
struct KmlPlacemarkRecord: Record {
  @Field var name: String = ""
  @Field var point: PointRecord = PointRecord()
}

/// A single track (ordered points) for a KML multi-track.
struct KmlTrackRecord: Record {
  @Field var points: [PointRecord] = []
}

/// Options for a `createKmlFile` call.
struct CreateKmlFileRecord: Record {
  @Field var path: String = ""
  @Field var placemarks: [KmlPlacemarkRecord] = []
  @Field var tracks: [KmlTrackRecord] = []
}

/// A single named input to a geoprocessing task.
struct GeoprocessingInputRecord: Record {
  @Field var name: String = ""
  @Field var type: String = ""
  @Field var stringValue: String?
  @Field var doubleValue: Double?
  @Field var point: PointRecord?
}

/// Options for a `startGeoprocessingJob` call.
struct GeoprocessingJobRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var inputs: [GeoprocessingInputRecord] = []
}

/// A blend raster renderer (base colours + hillshade from an elevation raster).
struct BlendRendererRecord: Record {
  @Field var elevationPath: String?
  @Field var elevationUrl: String?
  @Field var altitudeDegrees: Double?
  @Field var azimuthDegrees: Double?
  @Field var zFactor: Double?
  @Field var colorRamp: String?
}

/// A hillshade raster renderer.
struct HillshadeRecord: Record {
  @Field var altitudeDegrees: Double?
  @Field var azimuthDegrees: Double?
  @Field var zFactor: Double?
}

/// An RGB (multi-band) raster renderer.
struct RgbRendererRecord: Record {
  @Field var stretch: StretchRecord?
  @Field var bandIndices: [Int] = []
}

/// A colormap raster renderer (pixel value → colour).
struct ColormapRendererRecord: Record {
  @Field var colors: [String] = []
}

/// A contrast-stretch raster renderer.
struct StretchRecord: Record {
  @Field var type: String = "minMax"
  @Field var min: Double?
  @Field var max: Double?
  @Field var minPercent: Double?
  @Field var maxPercent: Double?
  @Field var factor: Double?
}

/// One field (column) of an in-memory feature collection table.
struct FeatureCollectionFieldRecord: Record {
  @Field var name: String = ""
  @Field var type: String = "text"
}

/// One point feature for an in-memory feature collection table.
struct FeatureCollectionFeatureRecord: Record {
  @Field var point: PointRecord = PointRecord()
  @Field var attributes: [String: Any] = [:]
}

/// A feature service layer. Reconciled by `id` (add / update / remove).
struct FeatureLayerRecord: Record {
  @Field var id: String = ""
  @Field var url: String = ""
  @Field var visible: Bool?
  @Field var opacity: Double?
  @Field var renderer: RendererRecord?
  @Field var definitionExpression: String?
  @Field var labels: [LabelRecord]?
  @Field var clustering: ClusteringRecord?
  @Field var featureRequestMode: String?
  @Field var timeOffset: TimeOffsetRecord?
  @Field var renderingMode: String?
  // Extrusion for a feature layer drawn in a scene (ignored on a 2D map).
  @Field var extrusion: ExtrusionRecord?
}

/// A signed duration used to shift a feature layer's time.
struct TimeOffsetRecord: Record {
  @Field var value: Double = 0
  @Field var unit: String = "years"
}

/// Options for a `geodesicEllipse` call.
struct GeodesicEllipseRecord: Record {
  @Field var center: PointRecord = PointRecord()
  @Field var semiAxis1LengthMeters: Double = 0
  @Field var semiAxis2LengthMeters: Double = 0
  @Field var axisDirectionDegrees: Double = 0
}

/// Options for a `geodesicSector` call.
struct GeodesicSectorRecord: Record {
  @Field var center: PointRecord = PointRecord()
  @Field var semiAxis1LengthMeters: Double = 0
  @Field var semiAxis2LengthMeters: Double = 0
  @Field var axisDirectionDegrees: Double = 0
  @Field var sectorAngleDegrees: Double = 0
  @Field var startDirectionDegrees: Double = 0
}

/// A geometry: a `type` discriminator plus the fields for that type.
struct GeometryRecord: Record {
  @Field var type: String = ""
  @Field var point: PointRecord?
  @Field var path: [PointRecord] = []
  @Field var ring: [PointRecord] = []
}

/// A simple symbol: a `type` discriminator plus shared/optional fields.
struct SymbolRecord: Record {
  @Field var type: String = ""
  @Field var color: String = ""
  @Field var size: Double?
  @Field var width: Double?
  @Field var style: String?
  @Field var outline: SymbolRecord?
  @Field var strokeLayers: [StrokeLayerRecord] = []
  @Field var fillColor: String?
  @Field var symbolKey: String?
  // Multiple keys composed into one multilayer `webStyle` symbol, in order.
  @Field var symbolKeys: [String] = []
  @Field var styleName: String?
  @Field var portalItemId: String?
  // Local `.stylx` mobile style file path, for a `webStyle` symbol.
  @Field var stylxPath: String?
  // 3D scene marker symbol (`simpleMarkerScene`) dimensions, in metres.
  @Field var height: Double?
  @Field var depth: Double?
  // Camera-distance ranges for a `distanceCompositeScene` symbol.
  @Field var ranges: [DistanceRangeRecord] = []
}

/// One camera-distance range of a `distanceCompositeScene` symbol.
struct DistanceRangeRecord: Record {
  @Field var symbol: SymbolRecord?
  @Field var minDistance: Double?
  @Field var maxDistance: Double?
}

/// One stroke layer of a multilayer symbol.
struct StrokeLayerRecord: Record {
  @Field var color: String = ""
  @Field var widthPoints: Double = 1
}

/// A graphic, reconciled by `id`.
struct GraphicRecord: Record {
  @Field var id: String = ""
  @Field var geometry: GeometryRecord = GeometryRecord()
  @Field var symbol: SymbolRecord = SymbolRecord()
  // Feature-like attributes referenced by renderer expressions (e.g. scene
  // extrusion `[height]`). Present on scene graphics overlays.
  @Field var attributes: [String: Any]?
}

/// Basemap-style tuning (worldview).
struct BasemapStyleParametersRecord: Record {
  @Field var worldview: String?
}

/// One field description for a new mobile geodatabase table.
struct GeodatabaseFieldRecord: Record {
  @Field var name: String = ""
  @Field var type: String = ""
}

/// Options for `createMobileGeodatabase`.
struct CreateGeodatabaseRecord: Record {
  @Field var tableName: String = ""
  @Field var geometryType: String = ""
  @Field var fields: [GeodatabaseFieldRecord] = []
}

/// One aggregate statistic to compute in a statistics query.
struct StatisticDefinitionRecord: Record {
  @Field var field: String = ""
  @Field var type: String = ""
  @Field var outName: String?
}

/// Options for a `queryStatistics` call.
struct StatisticsQueryOptionsRecord: Record {
  @Field var layerId: String = ""
  @Field var statistics: [StatisticDefinitionRecord] = []
  @Field var whereClause: String?
  @Field var groupByFields: [String] = []
}

struct MapSourceRecord: Record {
  /// One of the `BasemapStyle` string-union values, or nil when a web map is used.
  @Field var basemap: String?
  /// A basemap built from a tiled / vector-tiled base layer (overrides `basemap`).
  @Field var basemapLayer: BasemapLayerRecord?
  /// Optional tuning for the basemap style (language strategy + worldview).
  @Field var basemapStyleParameters: BasemapStyleParametersRecord?
  /// ArcGIS portal item id of a web map, mutually exclusive with `basemap`.
  @Field var webMapItemId: String?
  /// Path to a local `.mmpk` whose first map is shown; mutually exclusive with the above.
  @Field var mobileMapPackagePath: String?
  /// WKID of the map spatial reference; applied only when there is no basemap/web map.
  @Field var spatialReferenceWkid: Int?
  @Field var initialViewpoint: ViewpointRecord?
  /// Feature layers, reconciled by `FeatureLayerRecord.id`.
  @Field var featureLayers: [FeatureLayerRecord] = []
  /// Non-feature operational layers, reconciled by `LayerRecord.id`.
  @Field var layers: [LayerRecord] = []
  /// Graphics, reconciled by `GraphicRecord.id`.
  @Field var graphics: [GraphicRecord] = []
  /// Renderer applied to the graphics overlay (overrides per-graphic symbols).
  @Field var graphicsRenderer: RendererRecord?
  /// Smallest (most zoomed-out) scale denominator; `nil` for no minimum.
  @Field var minScale: Double?
  /// Largest (most zoomed-in) scale denominator; `nil` for no maximum.
  @Field var maxScale: Double?
  /// Reference scale for symbol/label sizing; `nil` disables it.
  @Field var referenceScale: Double?
  /// Bounding box the map may be navigated within (WGS 84); `nil` for no limit.
  @Field var maxExtent: EnvelopeRecord?
  /// Solid background color (`#RRGGBB`/`#RRGGBBAA`); `nil` keeps the default.
  @Field var backgroundColor: String?
  /// For a floor-aware map, the `levelNumber` to show; `nil` keeps defaults.
  @Field var floorLevel: Int?
  /// Location-driven geotriggers, reconciled by `GeotriggerRecord.id`.
  @Field var geotriggers: [GeotriggerRecord] = []
}

/// A location-driven geotrigger fence over the map's graphics.
struct GeotriggerRecord: Record {
  @Field var id: String = ""
  @Field var bufferMeters: Double?
  @Field var ruleType: String?
}

/// Device-location display configuration.
struct LocationDisplayRecord: Record {
  @Field var enabled: Bool = false
  @Field var autoPanMode: String?
  @Field var showAccuracy: Bool?
  @Field var dataSource: String?
  @Field var nmeaSentencesPath: String?
}

struct ConfigureRecord: Record {
  @Field var apiKey: String = ""
}

/// Options for a token (named-user) `authenticate` call.
struct AuthenticateRecord: Record {
  @Field var portalUrl: String?
  @Field var username: String = ""
  @Field var password: String = ""
}

/// Options for Integrated Windows Authentication (NTLM / Negotiate).
struct IwaAuthenticateRecord: Record {
  @Field var portalUrl: String = ""
  @Field var username: String = ""
  @Field var password: String = ""
}

/// Options for PKI (client-certificate) authentication. iOS uses a PKCS#12 file
/// (`certificatePath` + `password`); `certificateAlias` is the Android KeyChain
/// alias and is unused on iOS.
struct PkiAuthenticateRecord: Record {
  @Field var portalUrl: String = ""
  @Field var certificatePath: String?
  @Field var password: String?
  @Field var certificateAlias: String?
}

/// Options for a line-of-sight computation.
struct LineOfSightRecord: Record {
  @Field var observer: PointRecord = PointRecord()
  @Field var target: PointRecord = PointRecord()
  @Field var elevationRasterPath: String = ""
}

/// Options for a time-extent feature query.
struct TimeExtentQueryRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var startTime: Double = 0
  @Field var endTime: Double = 0
  @Field var whereClause: String?
}

/// A basemap built from a tiled / vector-tiled base layer.
struct BasemapLayerRecord: Record {
  @Field var type: String = "tiled"
  @Field var url: String?
  @Field var itemId: String?
}

/// A geographic bounding box (WGS 84 degrees).
struct EnvelopeRecord: Record {
  @Field var minLatitude: Double = 0
  @Field var minLongitude: Double = 0
  @Field var maxLatitude: Double = 0
  @Field var maxLongitude: Double = 0
}

/// Options for an `addFeatureWithContingentValues` call.
struct ContingentFeatureRecord: Record {
  @Field var geodatabasePath: String = ""
  @Field var tableName: String = ""
  @Field var attributes: [String: Any] = [:]
}

/// Options for an `updateFeatureAttributes` call.
struct UpdateFeatureRecord: Record {
  @Field var serviceUrl: String = ""
  @Field var objectId: Int = 0
  @Field var attributes: [String: Any] = [:]
}

/// Options for a `startGeometryEditor` view function.
struct GeometryEditorRecord: Record {
  @Field var geometryType: String = "polygon"
  @Field var tool: String?
  @Field var snapEnabled: Bool = false
}

/// Options for a `startNavigation` call.
struct StartNavigationRecord: Record {
  @Field var stops: [PointRecord] = []
  @Field var reroute: Bool = false
}

/// Options for an `authenticateWithOAuth` call.
struct OAuthAuthenticateRecord: Record {
  @Field var portalUrl: String = "https://www.arcgis.com"
  @Field var clientId: String = ""
  @Field var redirectUri: String = ""
}

/// Options for an `addPortalItem` call.
struct AddPortalItemRecord: Record {
  @Field var title: String = ""
  @Field var json: String = ""
  @Field var description: String = ""
}

/// Options for a `createAndSaveMap` call.
struct CreateAndSaveMapRecord: Record {
  @Field var title: String = ""
  @Field var basemap: String = ""
  @Field var description: String = ""
  @Field var tags: [String] = []
}

/// Options for a `startGenerateGeodatabaseJob` call.
struct GenerateGeodatabaseRecord: Record {
  @Field var featureServiceUrl: String = ""
  @Field var areaOfInterest: EnvelopeRecord = EnvelopeRecord()
}

/// Options for a `startSyncGeodatabaseJob` call.
struct SyncGeodatabaseRecord: Record {
  @Field var featureServiceUrl: String = ""
  @Field var path: String = ""
}

/// A 3D camera position (altitude in meters; angles in degrees).
struct CameraRecord: Record {
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
  @Field var altitude: Double = 0
  @Field var heading: Double?
  @Field var pitch: Double?
  @Field var roll: Double?
}

/// A 3D scene layer, reconciled by `id`.
/// A polygon filter restricting which features of a scene layer are drawn.
struct ScenePolygonFilterRecord: Record {
  @Field var polygons: [[PointRecord]] = []
  @Field var spatialRelationship: String?
}

struct SceneLayerRecord: Record {
  @Field var id: String = ""
  @Field var type: String = "scene"
  @Field var url: String = ""
  // Local file path for a `pointCloud` layer's `.slpk` scene-layer package.
  @Field var path: String?
  @Field var visible: Bool?
  @Field var opacity: Double?
  @Field var renderer: RendererRecord?
  @Field var polygonFilter: ScenePolygonFilterRecord?
  // For a `building` layer: a where clause applied as a solid building filter.
  @Field var buildingFilterExpression: String?
}

/// A single elevation source for the scene's base surface.
struct ElevationSourceRecord: Record {
  @Field var type: String = "world"
  @Field var url: String?
  @Field var path: String?
}

/// The declarative source for an `ExpoArcgisSceneView`.
struct SceneSourceRecord: Record {
  @Field var basemap: String = ""
  @Field var webSceneItemId: String?
  @Field var webSceneLayerLabels: [WebSceneLayerLabelsRecord] = []
  @Field var mobileScenePackagePath: String?
  @Field var viewingMode: String?
  @Field var elevationEnabled: Bool = true
  @Field var elevationSources: [ElevationSourceRecord] = []
  @Field var sceneLayers: [SceneLayerRecord] = []
  @Field var graphicsOverlays: [SceneGraphicsOverlayRecord] = []
  @Field var featureLayers: [FeatureLayerRecord] = []
  @Field var analyses: [SceneAnalysisRecord] = []
  @Field var imageOverlays: [SceneImageOverlayRecord] = []
  @Field var terrainExaggeration: Double?
  @Field var surfaceNavigationConstraint: String?
  @Field var atmosphereEffect: String?
  @Field var sunLighting: String?
  @Field var cameraController: CameraControllerRecord?
  @Field var initialCamera: CameraRecord?
}

/// A 3D graphics overlay drawn in a scene, reconciled by `id`.
struct SceneGraphicsOverlayRecord: Record {
  @Field var id: String = ""
  @Field var graphics: [GraphicRecord] = []
  @Field var surfacePlacement: String?
  @Field var renderer: RendererRecord?
  @Field var extrusion: ExtrusionRecord?
  @Field var orientationExpressions: SceneOrientationRecord?
}

/// Extrusion applied to a scene graphics overlay's renderer.
struct ExtrusionRecord: Record {
  @Field var expression: String = ""
  @Field var mode: String?
}

/// Scene-property orientation expressions applied to a scene overlay's renderer.
struct SceneOrientationRecord: Record {
  @Field var headingExpression: String?
  @Field var pitchExpression: String?
  @Field var rollExpression: String?
}

/// An animated image overlay drawn in a scene, reconciled by `id`.
struct SceneImageOverlayRecord: Record {
  @Field var id: String = ""
  @Field var imagePaths: [String] = []
  @Field var extent: EnvelopeRecord = EnvelopeRecord()
  @Field var framesPerSecond: Double?
  @Field var opacity: Double?
}

/// A 3D analysis (viewshed or line-of-sight) drawn in an analysis overlay.
struct SceneAnalysisRecord: Record {
  @Field var type: String = ""
  // Viewshed fields.
  @Field var location: PointRecord?
  @Field var headingDegrees: Double = 0
  @Field var pitchDegrees: Double = 0
  @Field var horizontalAngleDegrees: Double?
  @Field var verticalAngleDegrees: Double?
  @Field var minDistanceMeters: Double?
  @Field var maxDistanceMeters: Double = 1000
  // Line-of-sight fields.
  @Field var observer: PointRecord?
  @Field var target: PointRecord?
  // Distance-measurement fields.
  @Field var startLocation: PointRecord?
  @Field var endLocation: PointRecord?
  @Field var unitSystem: String?
}

/// An orbit-location camera controller for a scene.
struct CameraControllerRecord: Record {
  @Field var type: String = "orbitLocation"
  @Field var target: PointRecord = PointRecord()
  @Field var distanceMeters: Double = 1000
}
