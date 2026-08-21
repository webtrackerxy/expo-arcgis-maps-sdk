package expo.modules.arcgismapssdk.dto

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Serializable prop records mirroring the TypeScript DTOs in `src/types`. Only
 * the v0.1 (Phase 2) subset is modelled: basemap / web map + initial viewpoint.
 * Feature layers and graphics are added in Milestone 2.
 *
 * These are plain data carriers — conversion to ArcGIS types lives in the
 * `*Converter` helpers so it can be unit-tested without constructing views.
 */

class PointRecord : Record {
  @Field var latitude: Double = 0.0

  @Field var longitude: Double = 0.0

  @Field var altitude: Double? = null

  @Field var spatialReferenceWkid: Int? = null
}

class ViewpointRecord : Record {
  @Field var center: PointRecord = PointRecord()

  @Field var scale: Double? = null

  @Field var rotation: Double? = null
}

/** Options for an animated `setViewpoint` call. */
class ViewpointAnimationRecord : Record {
  @Field var durationMs: Double? = null
}

/** A point in the view's coordinate space. */
class ScreenPointRecord : Record {
  @Field var x: Double = 0.0

  @Field var y: Double = 0.0
}

/** Options for an `identify` call. */
class IdentifyOptionsRecord : Record {
  @Field var screenPoint: ScreenPointRecord = ScreenPointRecord()

  @Field var tolerance: Double? = null

  @Field var maximumResults: Int? = null
}

/** Identify options plus the Arcade expression to evaluate against each feature. */
class ArcadeEvaluationOptionsRecord : Record {
  @Field var screenPoint: ScreenPointRecord = ScreenPointRecord()

  @Field var tolerance: Double? = null

  @Field var maximumResults: Int? = null

  @Field var expression: String = ""
}

/** Options for a `queryFeatures` call. */
class FeatureQueryOptionsRecord : Record {
  @Field var layerId: String = ""

  @Field var whereClause: String? = null

  @Field var maxResults: Int? = null

  @Field var select: Boolean = false
}

/** Options for `selectFeatures` / `queryFeatureExtent` (layer id + where clause). */
class LayerWhereRecord : Record {
  @Field var layerId: String = ""

  @Field var whereClause: String? = null
}

/** Options for a `queryRelatedFeatures` call. */
class RelatedFeaturesOptionsRecord : Record {
  @Field var layerId: String = ""

  @Field var objectId: Int = 0
}

/** A geographic bounding box (WGS 84 degrees). */
class EnvelopeRecord : Record {
  @Field var minLatitude: Double = 0.0

  @Field var minLongitude: Double = 0.0

  @Field var maxLatitude: Double = 0.0

  @Field var maxLongitude: Double = 0.0
}

/** Options for an `addFeatureWithContingentValues` call. */
class ContingentFeatureRecord : Record {
  @Field var geodatabasePath: String = ""

  @Field var tableName: String = ""

  @Field var attributes: Map<String, Any?> = emptyMap()
}

/** Options for an `updateFeatureAttributes` call. */
class UpdateFeatureRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var objectId: Int = 0

  @Field var attributes: Map<String, Any?> = emptyMap()
}

/** Options for an `addPortalItem` call. */
class AddPortalItemRecord : Record {
  @Field var title: String = ""

  @Field var json: String = ""

  @Field var description: String = ""
}

/** Options for a `createAndSaveMap` call. */
class CreateAndSaveMapRecord : Record {
  @Field var title: String = ""

  @Field var basemap: String = ""

  @Field var description: String = ""

  @Field var tags: List<String> = emptyList()
}

/** Options for a `startOfflineMapJob` call. */
class OfflineMapJobRecord : Record {
  @Field var webMapItemId: String = ""

  @Field var areaOfInterest: EnvelopeRecord = EnvelopeRecord()

  @Field var minScale: Double? = null

  @Field var maxScale: Double? = null

  @Field var localBasemapPath: String? = null
}

/** Options for a `startExportVectorTilesJob` call. */
class ExportVectorTilesRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var area: EnvelopeRecord = EnvelopeRecord()

  @Field var maxScale: Double? = null
}

/** Options for a `startGenerateGeodatabaseJob` call. */
class GenerateGeodatabaseRecord : Record {
  @Field var featureServiceUrl: String = ""

  @Field var areaOfInterest: EnvelopeRecord = EnvelopeRecord()
}

/** Options for a `startSyncGeodatabaseJob` call. */
class SyncGeodatabaseRecord : Record {
  @Field var featureServiceUrl: String = ""

  @Field var path: String = ""
}

/** A 3D camera position (altitude in meters; angles in degrees). */
class CameraRecord : Record {
  @Field var latitude: Double = 0.0

  @Field var longitude: Double = 0.0

  @Field var altitude: Double = 0.0

  @Field var heading: Double? = null

  @Field var pitch: Double? = null

  @Field var roll: Double? = null
}

/** A 3D scene layer, reconciled by [id]. */
/** A polygon filter restricting which features of a scene layer are drawn. */
class ScenePolygonFilterRecord : Record {
  @Field var polygons: List<List<PointRecord>> = emptyList()

  @Field var spatialRelationship: String? = null
}

class SceneLayerRecord : Record {
  @Field var id: String = ""

  @Field var type: String = "scene"

  @Field var url: String = ""

  // Local file path for a `pointCloud` layer's `.slpk` scene-layer package.
  @Field var path: String? = null

  @Field var visible: Boolean? = null

  @Field var opacity: Double? = null

  @Field var renderer: RendererRecord? = null

  @Field var polygonFilter: ScenePolygonFilterRecord? = null

  // For a `building` layer: a where clause applied as a solid building filter.
  @Field var buildingFilterExpression: String? = null
}

/** Device-location display configuration. */
class LocationDisplayRecord : Record {
  @Field var enabled: Boolean = false

  @Field var autoPanMode: String? = null

  @Field var showAccuracy: Boolean? = null

  @Field var dataSource: String? = null

  @Field var nmeaSentencesPath: String? = null
}

/** Options for a `startGeometryEditor` view function. */
class GeometryEditorRecord : Record {
  @Field var geometryType: String = "polygon"

  @Field var tool: String? = null

  @Field var snapEnabled: Boolean = false
}

/** Options for a `startNavigation` call. */
class StartNavigationRecord : Record {
  @Field var stops: List<PointRecord> = emptyList()

  @Field var reroute: Boolean = false
}

/** The declarative source for an `ExpoArcgisSceneView`. */
/** A single elevation source for the scene's base surface. */
class ElevationSourceRecord : Record {
  @Field var type: String = "world"

  @Field var url: String? = null

  @Field var path: String? = null
}

class SceneSourceRecord : Record {
  @Field var basemap: String = ""

  @Field var webSceneItemId: String? = null

  @Field var webSceneLayerLabels: List<WebSceneLayerLabelsRecord> = emptyList()

  @Field var mobileScenePackagePath: String? = null

  @Field var viewingMode: String? = null

  @Field var elevationEnabled: Boolean = true

  @Field var elevationSources: List<ElevationSourceRecord> = emptyList()

  @Field var sceneLayers: List<SceneLayerRecord> = emptyList()

  @Field var graphicsOverlays: List<SceneGraphicsOverlayRecord> = emptyList()

  @Field var featureLayers: List<FeatureLayerRecord> = emptyList()

  @Field var analyses: List<SceneAnalysisRecord> = emptyList()

  @Field var imageOverlays: List<SceneImageOverlayRecord> = emptyList()

  @Field var terrainExaggeration: Double? = null

  @Field var surfaceNavigationConstraint: String? = null

  @Field var atmosphereEffect: String? = null

  @Field var sunLighting: String? = null

  @Field var cameraController: CameraControllerRecord? = null

  @Field var initialCamera: CameraRecord? = null
}

/** A 3D graphics overlay drawn in a scene, reconciled by [id]. */
class SceneGraphicsOverlayRecord : Record {
  @Field var id: String = ""

  @Field var graphics: List<GraphicRecord> = emptyList()

  @Field var surfacePlacement: String? = null

  @Field var renderer: RendererRecord? = null

  @Field var extrusion: ExtrusionRecord? = null

  @Field var orientationExpressions: SceneOrientationRecord? = null
}

/** Extrusion applied to a scene graphics overlay's renderer. */
class ExtrusionRecord : Record {
  @Field var expression: String = ""

  @Field var mode: String? = null
}

/** Scene-property orientation expressions applied to a scene overlay's renderer. */
class SceneOrientationRecord : Record {
  @Field var headingExpression: String? = null

  @Field var pitchExpression: String? = null

  @Field var rollExpression: String? = null
}

/** An animated image overlay drawn in a scene, reconciled by [id]. */
class SceneImageOverlayRecord : Record {
  @Field var id: String = ""

  @Field var imagePaths: List<String> = emptyList()

  @Field var extent: EnvelopeRecord = EnvelopeRecord()

  @Field var framesPerSecond: Double? = null

  @Field var opacity: Double? = null
}

/** A 3D analysis (viewshed or line-of-sight) drawn in an analysis overlay. */
class SceneAnalysisRecord : Record {
  @Field var type: String = ""

  // Viewshed fields.
  @Field var location: PointRecord? = null

  @Field var headingDegrees: Double = 0.0

  @Field var pitchDegrees: Double = 0.0

  @Field var horizontalAngleDegrees: Double? = null

  @Field var verticalAngleDegrees: Double? = null

  @Field var minDistanceMeters: Double? = null

  @Field var maxDistanceMeters: Double = 1000.0

  // Line-of-sight fields.
  @Field var observer: PointRecord? = null

  @Field var target: PointRecord? = null

  // Distance-measurement fields.
  @Field var startLocation: PointRecord? = null

  @Field var endLocation: PointRecord? = null

  @Field var unitSystem: String? = null
}

/** An orbit-location camera controller for a scene. */
class CameraControllerRecord : Record {
  @Field var type: String = "orbitLocation"

  @Field var target: PointRecord = PointRecord()

  @Field var distanceMeters: Double = 1000.0
}

/** A single add/update to a feature layer's service table. */
class FeatureEditRecord : Record {
  @Field var objectId: Int? = null

  @Field var attributes: Map<String, Any?>? = null

  @Field var point: PointRecord? = null
}

/** Options for an `applyEdits` call. */
class ApplyEditsOptionsRecord : Record {
  @Field var layerId: String = ""

  @Field var adds: List<FeatureEditRecord> = emptyList()

  @Field var updates: List<FeatureEditRecord> = emptyList()

  @Field var deleteObjectIds: List<Int> = emptyList()
}

/** One class of a unique-value renderer. */
class UniqueValueRecord : Record {
  @Field var values: List<Any> = emptyList()

  @Field var symbol: SymbolRecord = SymbolRecord()

  @Field var label: String? = null

  @Field var alternateSymbols: List<ScaledSymbolRecord> = emptyList()
}

/** A symbol shown only within a map-scale range (a unique-value alternate symbol). */
class ScaledSymbolRecord : Record {
  @Field var symbol: SymbolRecord = SymbolRecord()

  @Field var minScale: Double? = null

  @Field var maxScale: Double? = null
}

/** One class of a class-breaks renderer. */
class ClassBreakRecord : Record {
  @Field var minValue: Double? = null

  @Field var maxValue: Double = 0.0

  @Field var symbol: SymbolRecord = SymbolRecord()

  @Field var label: String? = null
}

/** A renderer: a `type` discriminator plus the fields for that type. */
class RendererRecord : Record {
  @Field var type: String = ""

  @Field var symbol: SymbolRecord? = null

  @Field var fields: List<String> = emptyList()

  @Field var uniqueValues: List<UniqueValueRecord> = emptyList()

  @Field var field: String? = null

  @Field var classBreaks: List<ClassBreakRecord> = emptyList()

  @Field var defaultSymbol: SymbolRecord? = null

  /** Portal item id of a dictionary symbol style, for a `dictionary` renderer. */
  @Field var portalItemId: String? = null

  /** Local `.stylx` dictionary style file path, for a `dictionary` renderer. */
  @Field var stylxPath: String? = null
}

/** A text label definition for a feature layer. */
class LabelRecord : Record {
  @Field var expression: String = ""

  @Field var arcade: Boolean? = null

  @Field var color: String? = null

  @Field var size: Double? = null

  @Field var haloColor: String? = null

  @Field var haloWidth: Double? = null

  @Field var placement: String? = null
}

/** Labels applied to a named layer inside a loaded web scene. */
class WebSceneLayerLabelsRecord : Record {
  @Field var layerPath: List<String> = emptyList()

  @Field var labels: List<LabelRecord> = emptyList()
}

/** Point clustering (feature reduction) for a feature layer. */
class ClusteringRecord : Record {
  @Field var enabled: Boolean = false

  @Field var radius: Double? = null

  @Field var maxSymbolSize: Double? = null

  @Field var color: String? = null
}

/** Visibility override for one sublayer of a map image layer. */
class SublayerVisibilityRecord : Record {
  @Field var sublayerId: Int = 0

  @Field var name: String? = null

  @Field var visible: Boolean = true
}

/** A mosaic rule for an image-service raster layer. */
class MosaicRuleRecord : Record {
  @Field var method: String? = null

  @Field var operation: String? = null

  @Field var ascending: Boolean? = null

  @Field var sortField: String? = null

  @Field var sortValue: String? = null
}

class SublayerRendererRecord : Record {
  @Field var sublayerId: Int = 0

  @Field var renderer: RendererRecord? = null
}

/** A non-feature operational layer: a `type` discriminator plus that type's fields. */
class LayerRecord : Record {
  @Field var id: String = ""

  @Field var type: String = ""

  @Field var visible: Boolean? = null

  @Field var opacity: Double? = null

  @Field var url: String? = null

  @Field var urlTemplate: String? = null

  @Field var subDomains: List<String> = emptyList()

  @Field var layerNames: List<String> = emptyList()

  @Field var tableName: String? = null

  @Field var layerId: String? = null

  @Field var collectionId: String? = null

  @Field var cqlFilter: String? = null

  @Field var sublayerVisibility: List<SublayerVisibilityRecord> = emptyList()

  @Field var sublayerRenderers: List<SublayerRendererRecord> = emptyList()

  @Field var renderer: RendererRecord? = null

  @Field var portalItemId: String? = null

  /** Sublayers for a `group` layer (leaf layers only; nested groups rejected in JS). */
  @Field var sublayers: List<LayerRecord> = emptyList()

  @Field var styleName: String? = null

  @Field var xmlQuery: String? = null

  @Field var fields: List<FeatureCollectionFieldRecord> = emptyList()

  @Field var features: List<FeatureCollectionFeatureRecord> = emptyList()

  @Field var where: String? = null

  @Field var path: String? = null

  @Field var tableIndex: Int? = null

  @Field var hillshade: HillshadeRecord? = null

  @Field var stretch: StretchRecord? = null

  @Field var rgb: RgbRendererRecord? = null

  @Field var colormap: ColormapRendererRecord? = null

  @Field var blend: BlendRendererRecord? = null

  @Field var rasterFunction: String? = null

  @Field var renderingRule: String? = null

  @Field var mosaicRule: MosaicRuleRecord? = null

  @Field var groundOverlayOpacity: Double? = null

  @Field var customFeed: CustomDynamicEntityFeedRecord? = null

  // ENC layer: S-57/S-52 hydrography resources dir and optional SENC cache dir.
  @Field var resourcePath: String? = null

  @Field var sencPath: String? = null
}

/** A custom dynamic-entity feed replayed from a local JSONL observations file. */
class CustomDynamicEntityFeedRecord : Record {
  @Field var observationsPath: String = ""

  @Field var entityIdField: String = ""

  @Field var longitudeField: String = ""

  @Field var latitudeField: String = ""

  @Field var observationsPerSecond: Double? = null
}

/** Options for the `controlKmlTour` view function. */
class KmlTourOptionsRecord : Record {
  @Field var layerId: String = ""

  @Field var action: String = ""
}

/** Selects a feature (layer + where clause) as a trace starting point / barrier. */
class UtilityFeatureSelectorRecord : Record {
  @Field var layerUrl: String = ""

  @Field var whereClause: String = ""
}

/** Options for a `traceUtilityNetwork` call. */
class TraceUtilityNetworkRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var traceType: String = ""

  @Field var startingPoints: List<UtilityFeatureSelectorRecord> = emptyList()

  @Field var barriers: List<UtilityFeatureSelectorRecord> = emptyList()
}

/** Options for a `getUtilityAssociations` call. */
class UtilityAssociationsRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var extent: EnvelopeRecord = EnvelopeRecord()

  @Field var kind: String? = null
}

/** Options for a `validateUtilityNetworkTopology` call. */
class ValidateUtilityNetworkRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var extent: EnvelopeRecord = EnvelopeRecord()
}

/** Options for a `createServiceVersion` call. */
class ServiceVersionRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var versionName: String = ""

  @Field var description: String? = null

  @Field var access: String = "private"
}

/** Options for a `queryDynamicEntities` call. */
class DynamicEntityQueryRecord : Record {
  @Field var url: String = ""

  @Field var trackIds: List<String>? = null
}

/** Source for a `getKmlInfo` call: exactly one of `url` / `path`. */
class KmlInfoSourceRecord : Record {
  @Field var url: String? = null

  @Field var path: String? = null
}

/** A point placemark to author into a KML file. */
class KmlPlacemarkRecord : Record {
  @Field var name: String = ""

  @Field var point: PointRecord = PointRecord()
}

/** A single track (ordered points) for a KML multi-track. */
class KmlTrackRecord : Record {
  @Field var points: List<PointRecord> = emptyList()
}

/** Options for a `createKmlFile` call. */
class CreateKmlFileRecord : Record {
  @Field var path: String = ""

  @Field var placemarks: List<KmlPlacemarkRecord> = emptyList()

  @Field var tracks: List<KmlTrackRecord> = emptyList()
}

/** A single named input to a geoprocessing task. */
class GeoprocessingInputRecord : Record {
  @Field var name: String = ""

  @Field var type: String = ""

  @Field var stringValue: String? = null

  @Field var doubleValue: Double? = null

  @Field var point: PointRecord? = null
}

/** Options for a `startGeoprocessingJob` call. */
class GeoprocessingJobRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var inputs: List<GeoprocessingInputRecord> = emptyList()
}

/** A blend raster renderer (base colours + hillshade from an elevation raster). */
class BlendRendererRecord : Record {
  @Field var elevationPath: String? = null

  @Field var elevationUrl: String? = null

  @Field var altitudeDegrees: Double? = null

  @Field var azimuthDegrees: Double? = null

  @Field var zFactor: Double? = null

  @Field var colorRamp: String? = null
}

/** A hillshade raster renderer. */
class HillshadeRecord : Record {
  @Field var altitudeDegrees: Double? = null

  @Field var azimuthDegrees: Double? = null

  @Field var zFactor: Double? = null
}

/** An RGB (multi-band) raster renderer. */
class RgbRendererRecord : Record {
  @Field var stretch: StretchRecord? = null

  @Field var bandIndices: List<Int> = emptyList()
}

/** A colormap raster renderer (pixel value -> colour). */
class ColormapRendererRecord : Record {
  @Field var colors: List<String> = emptyList()
}

/** A contrast-stretch raster renderer. */
class StretchRecord : Record {
  @Field var type: String = "minMax"

  @Field var min: Double? = null

  @Field var max: Double? = null

  @Field var minPercent: Double? = null

  @Field var maxPercent: Double? = null

  @Field var factor: Double? = null
}

/** One field (column) of an in-memory feature collection table. */
class FeatureCollectionFieldRecord : Record {
  @Field var name: String = ""

  @Field var type: String = "text"
}

/** One point feature for an in-memory feature collection table. */
class FeatureCollectionFeatureRecord : Record {
  @Field var point: PointRecord = PointRecord()

  @Field var attributes: Map<String, Any?> = emptyMap()
}

/** A feature service layer. Reconciled by [id] (add / update / remove). */
class FeatureLayerRecord : Record {
  @Field var id: String = ""

  @Field var url: String = ""

  @Field var visible: Boolean? = null

  @Field var opacity: Double? = null

  @Field var renderer: RendererRecord? = null

  @Field var definitionExpression: String? = null

  @Field var labels: List<LabelRecord>? = null

  @Field var clustering: ClusteringRecord? = null

  @Field var featureRequestMode: String? = null

  @Field var timeOffset: TimeOffsetRecord? = null

  @Field var renderingMode: String? = null

  // Extrusion for a feature layer drawn in a scene (ignored on a 2D map).
  @Field var extrusion: ExtrusionRecord? = null
}

/** A signed duration used to shift a feature layer's time. */
class TimeOffsetRecord : Record {
  @Field var value: Double = 0.0

  @Field var unit: String = "years"
}

/** Options for a `geodesicEllipse` call. */
class GeodesicEllipseRecord : Record {
  @Field var center: PointRecord = PointRecord()

  @Field var semiAxis1LengthMeters: Double = 0.0

  @Field var semiAxis2LengthMeters: Double = 0.0

  @Field var axisDirectionDegrees: Double = 0.0
}

/** Options for a `geodesicSector` call. */
class GeodesicSectorRecord : Record {
  @Field var center: PointRecord = PointRecord()

  @Field var semiAxis1LengthMeters: Double = 0.0

  @Field var semiAxis2LengthMeters: Double = 0.0

  @Field var axisDirectionDegrees: Double = 0.0

  @Field var sectorAngleDegrees: Double = 0.0

  @Field var startDirectionDegrees: Double = 0.0
}

/** One field description for a new mobile geodatabase table. */
class GeodatabaseFieldRecord : Record {
  @Field var name: String = ""

  @Field var type: String = ""
}

/** Options for `createMobileGeodatabase`. */
class CreateGeodatabaseRecord : Record {
  @Field var tableName: String = ""

  @Field var geometryType: String = ""

  @Field var fields: List<GeodatabaseFieldRecord> = emptyList()
}

/** One aggregate statistic to compute in a statistics query. */
class StatisticDefinitionRecord : Record {
  @Field var field: String = ""

  @Field var type: String = ""

  @Field var outName: String? = null
}

/** Options for a `queryStatistics` call. */
class StatisticsQueryOptionsRecord : Record {
  @Field var layerId: String = ""

  @Field var statistics: List<StatisticDefinitionRecord> = emptyList()

  @Field var whereClause: String? = null

  @Field var groupByFields: List<String> = emptyList()
}

/** A geometry: a `type` discriminator plus the fields for that type. */
class GeometryRecord : Record {
  @Field var type: String = ""

  @Field var point: PointRecord? = null

  @Field var path: List<PointRecord> = emptyList()

  @Field var ring: List<PointRecord> = emptyList()
}

/** A simple symbol: a `type` discriminator plus shared/optional fields. */
class SymbolRecord : Record {
  @Field var type: String = ""

  @Field var color: String = ""

  @Field var size: Double? = null

  @Field var width: Double? = null

  @Field var style: String? = null

  @Field var outline: SymbolRecord? = null

  @Field var strokeLayers: List<StrokeLayerRecord> = emptyList()

  @Field var fillColor: String? = null

  @Field var symbolKey: String? = null

  // Multiple keys composed into one multilayer `webStyle` symbol, in order.
  @Field var symbolKeys: List<String> = emptyList()

  @Field var styleName: String? = null

  @Field var portalItemId: String? = null

  // Local `.stylx` mobile style file path, for a `webStyle` symbol.
  @Field var stylxPath: String? = null

  // 3D scene marker symbol (`simpleMarkerScene`) dimensions, in metres.
  @Field var height: Double? = null

  @Field var depth: Double? = null

  // Camera-distance ranges for a `distanceCompositeScene` symbol.
  @Field var ranges: List<DistanceRangeRecord> = emptyList()
}

/** One camera-distance range of a `distanceCompositeScene` symbol. */
class DistanceRangeRecord : Record {
  @Field var symbol: SymbolRecord? = null

  @Field var minDistance: Double? = null

  @Field var maxDistance: Double? = null
}

/** One stroke layer of a multilayer symbol. */
class StrokeLayerRecord : Record {
  @Field var color: String = ""

  @Field var widthPoints: Double = 1.0
}

/** A graphic, reconciled by [id]. */
class GraphicRecord : Record {
  @Field var id: String = ""

  @Field var geometry: GeometryRecord = GeometryRecord()

  @Field var symbol: SymbolRecord = SymbolRecord()

  // Feature-like attributes referenced by renderer expressions (e.g. scene
  // extrusion `[height]`). Present on scene graphics overlays.
  @Field var attributes: Map<String, Any?>? = null
}

/** Basemap-style tuning (worldview). */
class BasemapStyleParametersRecord : Record {
  @Field var worldview: String? = null
}

/** A basemap built from a tiled / vector-tiled base layer. */
class BasemapLayerRecord : Record {
  @Field var type: String = "tiled"

  @Field var url: String? = null

  @Field var itemId: String? = null
}

class MapSourceRecord : Record {
  /** One of the `BasemapStyle` string-union values, or null when a web map is used. */
  @Field var basemap: String? = null

  /** A basemap built from a tiled / vector-tiled base layer (overrides `basemap`). */
  @Field var basemapLayer: BasemapLayerRecord? = null

  /** Optional tuning for the basemap style (worldview). */
  @Field var basemapStyleParameters: BasemapStyleParametersRecord? = null

  /** ArcGIS portal item id of a web map, mutually exclusive with [basemap]. */
  @Field var webMapItemId: String? = null

  /** Path to a local `.mmpk` whose first map is shown; mutually exclusive with the above. */
  @Field var mobileMapPackagePath: String? = null

  /** WKID of the map spatial reference; applied only when there is no basemap/web map. */
  @Field var spatialReferenceWkid: Int? = null

  @Field var initialViewpoint: ViewpointRecord? = null

  /** Feature layers, reconciled by [FeatureLayerRecord.id]. */
  @Field var featureLayers: List<FeatureLayerRecord> = emptyList()

  /** Non-feature operational layers, reconciled by [LayerRecord.id]. */
  @Field var layers: List<LayerRecord> = emptyList()

  /** Graphics, reconciled by [GraphicRecord.id]. */
  @Field var graphics: List<GraphicRecord> = emptyList()

  /** Renderer applied to the graphics overlay (overrides per-graphic symbols). */
  @Field var graphicsRenderer: RendererRecord? = null

  /** Smallest (most zoomed-out) scale denominator; null for no minimum. */
  @Field var minScale: Double? = null

  /** Largest (most zoomed-in) scale denominator; null for no maximum. */
  @Field var maxScale: Double? = null

  /** Reference scale for symbol/label sizing; null disables it. */
  @Field var referenceScale: Double? = null

  /** Bounding box the map may be navigated within (WGS 84); null for no limit. */
  @Field var maxExtent: EnvelopeRecord? = null

  /** Solid background color (`#RRGGBB`/`#RRGGBBAA`); null keeps the default. */
  @Field var backgroundColor: String? = null

  /** For a floor-aware map, the `levelNumber` to show; null keeps defaults. */
  @Field var floorLevel: Int? = null

  /** Location-driven geotriggers, reconciled by [GeotriggerRecord.id]. */
  @Field var geotriggers: List<GeotriggerRecord> = emptyList()
}

/** A location-driven geotrigger fence over the map's graphics. */
class GeotriggerRecord : Record {
  @Field var id: String = ""

  @Field var bufferMeters: Double? = null

  @Field var ruleType: String? = null
}
