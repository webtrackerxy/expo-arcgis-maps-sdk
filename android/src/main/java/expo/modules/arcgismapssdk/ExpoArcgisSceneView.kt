package expo.modules.arcgismapssdk

import android.content.Context
import android.view.ViewGroup
import androidx.lifecycle.findViewTreeLifecycleOwner
import com.arcgismaps.mapping.ArcGISScene
import com.arcgismaps.mapping.ArcGISTiledElevationSource
import com.arcgismaps.mapping.ElevationSource
import com.arcgismaps.mapping.RasterElevationSource
import com.arcgismaps.mapping.Basemap
import com.arcgismaps.UnitSystem
import com.arcgismaps.analysis.interactive.ExploratoryGeoElementLineOfSight
import com.arcgismaps.analysis.interactive.ExploratoryGeoElementViewshed
import com.arcgismaps.analysis.interactive.ExploratoryLocationDistanceMeasurement
import com.arcgismaps.analysis.interactive.ExploratoryLocationLineOfSight
import com.arcgismaps.analysis.interactive.ExploratoryLocationViewshed
import com.arcgismaps.mapping.MobileScenePackage
import com.arcgismaps.mapping.PortalItem
import com.arcgismaps.mapping.Surface
import com.arcgismaps.mapping.Viewpoint
import com.arcgismaps.data.ArcGISFeature
import com.arcgismaps.geometry.Envelope
import com.arcgismaps.geometry.GeometryEngine
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.Polygon
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.mapping.NavigationConstraint
import com.arcgismaps.mapping.view.AtmosphereEffect
import com.arcgismaps.mapping.view.GlobeCameraController
import com.arcgismaps.mapping.view.LightingMode
import com.arcgismaps.mapping.view.OrbitLocationCameraController
import com.arcgismaps.data.ServiceFeatureTable
import com.arcgismaps.mapping.layers.ArcGISSceneLayer
import com.arcgismaps.mapping.layers.BuildingSceneLayer
import com.arcgismaps.mapping.layers.buildingscene.BuildingFilter
import com.arcgismaps.mapping.layers.buildingscene.BuildingFilterBlock
import com.arcgismaps.mapping.layers.buildingscene.BuildingSolidFilterMode
import com.arcgismaps.mapping.layers.FeatureLayer
import com.arcgismaps.mapping.layers.GroupLayer
import com.arcgismaps.mapping.layers.FeatureRenderingMode
import com.arcgismaps.mapping.layers.IntegratedMeshLayer
import com.arcgismaps.mapping.layers.Layer
import com.arcgismaps.mapping.layers.Ogc3DTilesLayer
import com.arcgismaps.mapping.layers.PointCloudLayer
import com.arcgismaps.mapping.layers.SceneLayerPolygonFilter
import com.arcgismaps.mapping.layers.SceneLayerPolygonFilterSpatialRelationship
import com.arcgismaps.mapping.layers.TileCache
import com.arcgismaps.mapping.symbology.ExtrusionMode
import com.arcgismaps.mapping.view.AnalysisOverlay
import com.arcgismaps.mapping.view.Camera
import com.arcgismaps.mapping.view.Graphic
import com.arcgismaps.mapping.view.GraphicsOverlay
import com.arcgismaps.mapping.view.ImageFrame
import com.arcgismaps.mapping.view.ImageOverlay
import com.arcgismaps.mapping.view.LayerSceneProperties
import com.arcgismaps.mapping.view.SceneView
import com.arcgismaps.mapping.view.SceneViewingMode
import com.arcgismaps.mapping.view.ScreenCoordinate
import com.arcgismaps.mapping.view.SurfacePlacement
import com.arcgismaps.portal.Portal
import expo.modules.arcgismapssdk.dto.CameraRecord
import expo.modules.arcgismapssdk.dto.ElevationSourceRecord
import expo.modules.arcgismapssdk.dto.IdentifyOptionsRecord
import expo.modules.arcgismapssdk.dto.ScenePolygonFilterRecord
import expo.modules.arcgismapssdk.dto.FeatureLayerRecord
import expo.modules.arcgismapssdk.dto.PointRecord
import expo.modules.arcgismapssdk.dto.SceneAnalysisRecord
import expo.modules.arcgismapssdk.dto.SceneGraphicsOverlayRecord
import expo.modules.arcgismapssdk.dto.SceneImageOverlayRecord
import expo.modules.arcgismapssdk.dto.SceneLayerRecord
import expo.modules.arcgismapssdk.dto.SceneSourceRecord
import expo.modules.arcgismapssdk.dto.WebSceneLayerLabelsRecord
import expo.modules.arcgismapssdk.dto.basemapStyleFromString
import expo.modules.arcgismapssdk.dto.graphicSignature
import expo.modules.arcgismapssdk.dto.makeGraphic
import expo.modules.arcgismapssdk.dto.makeLabelDefinition
import expo.modules.arcgismapssdk.dto.makeRenderer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** World elevation service (Terrain3D) used for the scene's base surface. */
private const val WORLD_ELEVATION_URL =
  "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"

/** ArcGIS Online portal, used to load web scenes from portal items. */
private const val ARCGIS_ONLINE_URL = "https://www.arcgis.com"

/**
 * Hosts an ArcGIS [SceneView] and applies declarative props from JavaScript.
 * Mirrors [ExpoArcgisMapView] but for the initial 3D foundation: basemap +
 * world elevation + scene layers + an initial/imperative camera.
 */
class ExpoArcgisSceneView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private val onSceneLoad by EventDispatcher<Map<String, Any?>>()
  private val onSceneError by EventDispatcher<Map<String, Any?>>()
  private val onSingleTap by EventDispatcher<Map<String, Any?>>()

  private val sceneView = SceneView(context)
  private val scope = CoroutineScope(Dispatchers.Main.immediate + SupervisorJob())
  private var disposed = false

  private var currentSceneKey: String? = null
  // Labels to apply to named layers once the current web scene finishes loading.
  private var webSceneLayerLabels: List<WebSceneLayerLabelsRecord> = emptyList()
  private val sceneLayers = mutableMapOf<String, Layer>()
  private val sceneLayerUrls = mutableMapOf<String, String>()
  private val graphicsOverlays = mutableMapOf<String, GraphicsOverlay>()
  private val overlaySignatures = mutableMapOf<String, String>()
  private val sceneFeatureLayers = mutableMapOf<String, FeatureLayer>()
  private val sceneFeatureLayerSignatures = mutableMapOf<String, String>()
  private var analysesSignature = ""
  private var imageOverlaySignature = ""
  // Viewsheds that track the scene camera / follow interactive taps.
  private val cameraViewsheds = mutableListOf<ExploratoryLocationViewshed>()
  private val interactiveViewsheds = mutableListOf<ExploratoryLocationViewshed>()
  private var imageAnimationJob: Job? = null

  init {
    sceneView.layoutParams =
      ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    addView(sceneView)

    // Emit single-tap events (tapped location in WGS 84 + screen point), and move
    // any interactive viewsheds to the tapped point.
    scope.launch {
      sceneView.onSingleTapConfirmed.collect { event ->
        if (disposed) return@collect
        val payload =
          mutableMapOf<String, Any?>(
            "screenPoint" to
              mapOf("x" to event.screenCoordinate.x, "y" to event.screenCoordinate.y))
        event.mapPoint?.let { scenePoint ->
          interactiveViewsheds.forEach { it.location = scenePoint }
          val wgs =
            (GeometryEngine.projectOrNull(scenePoint, SpatialReference.wgs84()) as? Point)
              ?: scenePoint
          payload["mapPoint"] = mapOf("latitude" to wgs.y, "longitude" to wgs.x)
        }
        onSingleTap(payload)
      }
    }

    // Re-aim any camera-tracking viewsheds to the scene's current camera.
    scope.launch {
      sceneView.viewpointChanged.collect {
        if (disposed || cameraViewsheds.isEmpty()) return@collect
        val camera = sceneView.getCurrentViewpointCamera() ?: return@collect
        cameraViewsheds.forEach {
          it.location = camera.location
          it.heading = camera.heading
          it.pitch = camera.pitch
        }
      }
    }
  }

  /** Identifies scene-layer features at a screen point and selects them. */
  suspend fun selectSceneFeatures(options: IdentifyOptionsRecord): Int {
    val screen = ScreenCoordinate(options.screenPoint.x, options.screenPoint.y)
    val tolerance = options.tolerance ?: 12.0
    val maxResults = options.maximumResults ?: 10
    var selected = 0
    sceneView.identifyLayers(screen, tolerance, false, maxResults).onSuccess { results ->
      for (result in results) {
        val layer = result.layerContent as? ArcGISSceneLayer ?: continue
        val features = result.geoElements.filterIsInstance<ArcGISFeature>()
        layer.selectFeatures(features)
        selected += features.size
      }
    }
    return selected
  }

  /** Clears the selection highlight on every scene layer. */
  fun clearSceneSelection() {
    sceneLayers.values.forEach { (it as? ArcGISSceneLayer)?.clearSelection() }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    findViewTreeLifecycleOwner()?.lifecycle?.addObserver(sceneView)
  }

  override fun onDetachedFromWindow() {
    findViewTreeLifecycleOwner()?.lifecycle?.removeObserver(sceneView)
    super.onDetachedFromWindow()
  }

  fun setSceneSource(source: SceneSourceRecord) {
    if (disposed) return

    // Scene-view environment settings apply regardless of scene rebuild.
    when (source.atmosphereEffect) {
      "off" -> sceneView.atmosphereEffect = AtmosphereEffect.None
      "realistic" -> sceneView.atmosphereEffect = AtmosphereEffect.Realistic
      "horizonOnly" -> sceneView.atmosphereEffect = AtmosphereEffect.HorizonOnly
    }
    when (source.sunLighting) {
      "light" -> sceneView.sunLighting = LightingMode.Light
      "lightAndShadows" -> sceneView.sunLighting = LightingMode.LightAndShadows
      "off" -> sceneView.sunLighting = LightingMode.NoLight
    }
    sceneView.cameraController =
      source.cameraController?.let { c ->
        val target = Point(c.target.longitude, c.target.latitude, SpatialReference.wgs84())
        OrbitLocationCameraController(target, c.distanceMeters)
      } ?: GlobeCameraController()

    val mspkPath = source.mobileScenePackagePath?.takeIf { it.isNotEmpty() }
    val webSceneId = source.webSceneItemId?.takeIf { it.isNotEmpty() }
    val sceneKey =
      when {
        mspkPath != null -> "mspk:$mspkPath"
        webSceneId != null -> "item:$webSceneId"
        else -> "basemap:${source.basemap}:${source.viewingMode ?: "global"}"
      }

    if (sceneView.scene == null || sceneKey != currentSceneKey) {
      currentSceneKey = sceneKey
      sceneLayers.clear()
      sceneLayerUrls.clear()
      graphicsOverlays.clear()
      overlaySignatures.clear()
      sceneView.graphicsOverlays.clear()
      sceneView.analysisOverlays.clear()
      sceneFeatureLayers.clear()
      sceneFeatureLayerSignatures.clear()
      analysesSignature = ""
      imageAnimationJob?.cancel()
      imageAnimationJob = null
      sceneView.imageOverlays.clear()
      imageOverlaySignature = ""

      if (mspkPath != null) {
        // The package loads asynchronously; start with an empty scene and swap in
        // the package's first scene (which carries its own basemap, layers, and
        // camera) once loaded.
        sceneView.scene = ArcGISScene()
        loadMobileScenePackage(mspkPath, sceneKey)
      } else {
        val scene: ArcGISScene
        if (webSceneId != null) {
          val portal = Portal(ARCGIS_ONLINE_URL, Portal.Connection.Anonymous)
          scene = ArcGISScene(PortalItem(portal, webSceneId))
          webSceneLayerLabels = source.webSceneLayerLabels
        } else {
          webSceneLayerLabels = emptyList()
          val style =
            basemapStyleFromString(source.basemap)
              ?: run {
                onSceneError(
                  arcgisErrorPayload(ArcgisErrorCode.INVALID_ARGUMENT, "Unsupported basemap style.")
                )
                return
              }
          val viewingMode =
            if (source.viewingMode == "local") SceneViewingMode.Local else SceneViewingMode.Global
          scene = ArcGISScene(viewingMode, Basemap(style))
          // Explicit elevation sources replace the default world surface; each is
          // added in order. Otherwise fall back to world elevation.
          val explicitSources = source.elevationSources.mapNotNull(::makeElevationSource)
          if (explicitSources.isNotEmpty()) {
            scene.baseSurface = Surface().apply { elevationSources.addAll(explicitSources) }
          } else if (source.elevationEnabled) {
            scene.baseSurface =
              Surface().apply {
                elevationSources.add(ArcGISTiledElevationSource(WORLD_ELEVATION_URL))
              }
          }
          source.terrainExaggeration?.let {
            scene.baseSurface.elevationExaggeration = it.toFloat()
          }
          when (source.surfaceNavigationConstraint) {
            "stayAbove" -> scene.baseSurface.navigationConstraint = NavigationConstraint.StayAbove
            "none" -> scene.baseSurface.navigationConstraint = NavigationConstraint.None
          }
        }
        source.initialCamera?.let { record ->
          val camera = makeCamera(record)
          scene.initialViewpoint = Viewpoint(camera.location, camera)
        }
        sceneView.scene = scene
        loadScene(scene)
      }
    }

    // A web scene or mobile scene package owns its operational layers; only a
    // basemap scene reconciles JS-declared scene layers and graphics overlays.
    if (webSceneId == null && mspkPath == null) {
      sceneView.scene?.let { reconcileSceneLayers(source.sceneLayers, it) }
      sceneView.scene?.let { reconcileSceneFeatureLayers(source.featureLayers, it) }
      reconcileGraphicsOverlays(source.graphicsOverlays)
      reconcileAnalyses(source.analyses)
    }
    // Image overlays are SceneView-level and independent of the scene's layers.
    reconcileImageOverlays(source.imageOverlays)
  }

  private fun sceneFeatureLayerSignature(record: FeatureLayerRecord): String =
    listOf(
        record.url,
        record.definitionExpression ?: "",
        record.renderingMode ?: "",
        record.renderer?.let { "${it.type}:${it.symbol?.type ?: ""}:${it.symbol?.color ?: ""}" } ?: "",
        record.extrusion?.let { "${it.expression}:${it.mode ?: ""}" } ?: "",
        (record.labels ?: emptyList()).joinToString(";") { it.expression },
      )
      .joinToString("|")

  private fun reconcileSceneFeatureLayers(records: List<FeatureLayerRecord>, scene: ArcGISScene) {
    val incomingIds = records.map { it.id }.toSet()
    for (id in sceneFeatureLayers.keys.filter { it !in incomingIds }) {
      sceneFeatureLayers.remove(id)?.let { scene.operationalLayers.remove(it) }
      sceneFeatureLayerSignatures.remove(id)
    }
    for (record in records) {
      val signature = sceneFeatureLayerSignature(record)
      val existing = sceneFeatureLayers[record.id]
      if (existing != null && sceneFeatureLayerSignatures[record.id] == signature) {
        existing.isVisible = record.visible ?: true
        existing.opacity = (record.opacity ?: 1.0).toFloat()
        continue
      }
      existing?.let { scene.operationalLayers.remove(it) }
      val layer = FeatureLayer.createWithFeatureTable(ServiceFeatureTable(record.url))
      layer.isVisible = record.visible ?: true
      layer.opacity = (record.opacity ?: 1.0).toFloat()
      // Extrusion requires dynamic rendering; honour an explicit mode otherwise.
      when (record.renderingMode) {
        "static" -> layer.renderingMode = FeatureRenderingMode.Static
        "dynamic" -> layer.renderingMode = FeatureRenderingMode.Dynamic
        "automatic" -> layer.renderingMode = FeatureRenderingMode.Automatic
        else -> if (record.extrusion != null) layer.renderingMode = FeatureRenderingMode.Dynamic
      }
      makeRenderer(record.renderer)?.let { renderer ->
        record.extrusion?.let { ex ->
          renderer.sceneProperties.extrusionExpression = ex.expression
          renderer.sceneProperties.extrusionMode = extrusionMode(ex.mode)
        }
        layer.renderer = renderer
      }
      record.labels?.let { labels ->
        layer.labelDefinitions.clear()
        layer.labelDefinitions.addAll(labels.map { makeLabelDefinition(it) })
        layer.labelsEnabled = labels.isNotEmpty()
      }
      record.definitionExpression?.let { layer.definitionExpression = it }
      scene.operationalLayers.add(layer)
      sceneFeatureLayers[record.id] = layer
      sceneFeatureLayerSignatures[record.id] = signature
    }
  }

  private fun analysisPoint(record: PointRecord): Point =
    Point(record.longitude, record.latitude, record.altitude ?: 0.0, SpatialReference.wgs84())

  private fun reconcileAnalyses(records: List<SceneAnalysisRecord>) {
    val signature =
      records.joinToString("|") { r ->
        "${r.type}:${r.location?.let { "${it.latitude},${it.longitude},${it.altitude}" }}" +
          ":${r.headingDegrees}:${r.pitchDegrees}:${r.horizontalAngleDegrees}:${r.verticalAngleDegrees}" +
          ":${r.minDistanceMeters}:${r.maxDistanceMeters}" +
          ":${r.observer?.let { "${it.latitude},${it.longitude},${it.altitude}" }}" +
          ":${r.target?.let { "${it.latitude},${it.longitude},${it.altitude}" }}" +
          ":${r.startLocation?.let { "${it.latitude},${it.longitude},${it.altitude}" }}" +
          ":${r.endLocation?.let { "${it.latitude},${it.longitude},${it.altitude}" }}" +
          ":${r.unitSystem}"
      }
    if (signature == analysesSignature) return
    analysesSignature = signature
    sceneView.analysisOverlays.clear()
    cameraViewsheds.clear()
    interactiveViewsheds.clear()
    if (records.isEmpty()) return

    val overlay = AnalysisOverlay()
    for (record in records) {
      when (record.type) {
        "viewshed" -> {
          val location = record.location ?: continue
          val camera =
            Camera(analysisPoint(location), record.headingDegrees, record.pitchDegrees, 0.0)
          val viewshed =
            ExploratoryLocationViewshed(
              camera,
              record.horizontalAngleDegrees ?: 90.0,
              record.verticalAngleDegrees ?: 90.0,
            )
          record.minDistanceMeters?.let { viewshed.minDistance = it }
          viewshed.maxDistance = record.maxDistanceMeters
          overlay.analyses.add(viewshed)
        }
        "lineOfSight" -> {
          val observer = record.observer ?: continue
          val target = record.target ?: continue
          overlay.analyses.add(
            ExploratoryLocationLineOfSight(analysisPoint(observer), analysisPoint(target))
          )
        }
        "geoElementViewshed" -> {
          val location = record.location ?: continue
          // A plain backing graphic is level and facing north, so the desired look
          // direction is applied as heading/pitch offsets from that zero orientation.
          val graphic = Graphic(analysisPoint(location))
          overlay.analyses.add(
            ExploratoryGeoElementViewshed(
              graphic,
              record.horizontalAngleDegrees ?: 90.0,
              record.verticalAngleDegrees ?: 90.0,
              record.headingDegrees,
              record.pitchDegrees,
              record.minDistanceMeters,
              record.maxDistanceMeters,
            )
          )
        }
        "geoElementLineOfSight" -> {
          val observer = record.observer ?: continue
          val target = record.target ?: continue
          overlay.analyses.add(
            ExploratoryGeoElementLineOfSight(
              Graphic(analysisPoint(observer)), Graphic(analysisPoint(target))
            )
          )
        }
        "distanceMeasurement" -> {
          val start = record.startLocation ?: continue
          val end = record.endLocation ?: continue
          overlay.analyses.add(
            ExploratoryLocationDistanceMeasurement(analysisPoint(start), analysisPoint(end)).apply {
              unitSystem =
                if (record.unitSystem == "imperial") UnitSystem.Imperial else UnitSystem.Metric
            }
          )
        }
        "cameraViewshed" -> {
          val viewshed =
            ExploratoryLocationViewshed(
              Point(0.0, 0.0, 0.0, SpatialReference.wgs84()),
              0.0,
              0.0,
              record.horizontalAngleDegrees ?: 90.0,
              record.verticalAngleDegrees ?: 90.0,
              record.minDistanceMeters,
              record.maxDistanceMeters,
            )
          overlay.analyses.add(viewshed)
          cameraViewsheds.add(viewshed)
        }
        "interactiveViewshed" -> {
          val location = record.location ?: continue
          val viewshed =
            ExploratoryLocationViewshed(
              analysisPoint(location),
              record.headingDegrees,
              record.pitchDegrees,
              record.horizontalAngleDegrees ?: 90.0,
              record.verticalAngleDegrees ?: 90.0,
              record.minDistanceMeters,
              record.maxDistanceMeters,
            )
          overlay.analyses.add(viewshed)
          interactiveViewsheds.add(viewshed)
        }
      }
    }
    sceneView.analysisOverlays.add(overlay)
  }

  private fun reconcileImageOverlays(records: List<SceneImageOverlayRecord>) {
    val signature =
      records.joinToString("|") { r ->
        "${r.id}:${r.imagePaths.joinToString(",")}" +
          ":${r.extent.minLongitude},${r.extent.minLatitude},${r.extent.maxLongitude},${r.extent.maxLatitude}" +
          ":${r.framesPerSecond ?: 15.0}:${r.opacity ?: 1.0}"
      }
    if (signature == imageOverlaySignature) return
    imageOverlaySignature = signature

    imageAnimationJob?.cancel()
    imageAnimationJob = null
    sceneView.imageOverlays.clear()
    if (records.isEmpty()) return

    // Each animated overlay pairs its ImageOverlay with its ordered frames.
    val animated = mutableListOf<Pair<ImageOverlay, List<ImageFrame>>>()
    var maxFps = 0.0
    for (record in records) {
      val extent =
        Envelope(
          Point(record.extent.minLongitude, record.extent.minLatitude, SpatialReference.wgs84()),
          Point(record.extent.maxLongitude, record.extent.maxLatitude, SpatialReference.wgs84()),
        )
      val frames = record.imagePaths.map { ImageFrame(it, extent) }
      val first = frames.firstOrNull() ?: continue
      val overlay = ImageOverlay(first).apply { opacity = (record.opacity ?: 1.0).toFloat() }
      sceneView.imageOverlays.add(overlay)
      val fps = record.framesPerSecond ?: 15.0
      if (frames.size > 1 && fps > 0) {
        animated.add(overlay to frames)
        maxFps = maxOf(maxFps, fps)
      }
    }

    if (animated.isNotEmpty() && maxFps > 0) {
      val periodMs = (1000.0 / maxFps).toLong().coerceAtLeast(1)
      imageAnimationJob =
        scope.launch {
          var index = 0
          while (isActive) {
            delay(periodMs)
            index++
            for ((overlay, frames) in animated) {
              overlay.imageFrame = frames[index % frames.size]
            }
          }
        }
    }
  }

  private fun loadMobileScenePackage(path: String, key: String) {
    scope.launch {
      val package_ = MobileScenePackage(path)
      package_
        .load()
        .onSuccess {
          if (disposed || currentSceneKey != key) return@onSuccess
          val packageScene = package_.scenes.firstOrNull()
          if (packageScene == null) {
            onSceneError(
              arcgisErrorPayload(
                ArcgisErrorCode.MAP_LOAD_FAILED, "The mobile scene package has no scenes."
              )
            )
            return@onSuccess
          }
          sceneView.scene = packageScene
          packageScene
            .load()
            .onSuccess {
              if (disposed || currentSceneKey != key) return@onSuccess
              // Swapping the scene after load does not re-apply its authored
              // viewpoint, so apply it explicitly to frame the package's content.
              packageScene.initialViewpoint?.let { sceneView.setViewpoint(it) }
              onSceneLoad(mapOf("spatialReferenceWkid" to (packageScene.spatialReference?.wkid ?: 0)))
            }
            .onFailure { if (!disposed && currentSceneKey == key) onSceneError(mapLoadError(it)) }
        }
        .onFailure { if (!disposed && currentSceneKey == key) onSceneError(mapLoadError(it)) }
    }
  }

  /** Builds a scene-layer polygon filter from a JS record, or null to clear it. */
  private fun makePolygonFilter(record: ScenePolygonFilterRecord?): SceneLayerPolygonFilter? {
    if (record == null || record.polygons.isEmpty()) return null
    val polygons =
      record.polygons.map { ring ->
        Polygon(ring.map { Point(it.longitude, it.latitude, SpatialReference.wgs84()) })
      }
    val relationship =
      if (record.spatialRelationship == "disjoint") {
        SceneLayerPolygonFilterSpatialRelationship.Disjoint
      } else {
        SceneLayerPolygonFilterSpatialRelationship.Contains
      }
    return SceneLayerPolygonFilter(polygons, relationship)
  }

  /**
   * Builds an elevation source from a JS record, or null for an unrecognized/
   * incomplete one. A `tilePackage` loads a local `.tpk`/`.tpkx` via a tile
   * cache; `raster` loads local DEM file(s); `tiled` loads a service URL.
   */
  private fun makeElevationSource(record: ElevationSourceRecord): ElevationSource? =
    when (record.type) {
      "world" -> ArcGISTiledElevationSource(WORLD_ELEVATION_URL)
      "tiled" -> record.url?.let { ArcGISTiledElevationSource(it) }
      "raster" -> record.path?.let { RasterElevationSource(listOf(it)) }
      "tilePackage" -> record.path?.let { ArcGISTiledElevationSource(TileCache(it)) }
      else -> null
    }

  private fun surfacePlacement(value: String?): SurfacePlacement =
    when (value) {
      "drapedFlat" -> SurfacePlacement.DrapedFlat
      "absolute" -> SurfacePlacement.Absolute
      "relative" -> SurfacePlacement.Relative
      "relativeToScene" -> SurfacePlacement.RelativeToScene
      else -> SurfacePlacement.DrapedBillboarded
    }

  private fun extrusionMode(value: String?): ExtrusionMode =
    when (value) {
      "absoluteHeight" -> ExtrusionMode.AbsoluteHeight
      "minimum" -> ExtrusionMode.Minimum
      "maximum" -> ExtrusionMode.Maximum
      "none" -> ExtrusionMode.None
      else -> ExtrusionMode.BaseHeight
    }

  /**
   * A signature capturing everything that would require an overlay to be rebuilt
   * (placement, extrusion, renderer, and each graphic including attributes).
   */
  private fun overlaySignature(record: SceneGraphicsOverlayRecord): String {
    val parts = mutableListOf(record.surfacePlacement ?: "")
    parts.add(record.extrusion?.let { "${it.expression}:${it.mode ?: ""}" } ?: "")
    parts.add(
      record.orientationExpressions?.let {
        "${it.headingExpression ?: ""}:${it.pitchExpression ?: ""}:${it.rollExpression ?: ""}"
      } ?: ""
    )
    parts.add(
      record.renderer?.let { "${it.type}:${it.symbol?.type ?: ""}:${it.symbol?.color ?: ""}" } ?: ""
    )
    for (graphic in record.graphics) {
      parts.add(graphicSignature(graphic))
      graphic.attributes?.let { attrs ->
        parts.add(attrs.keys.sorted().joinToString("&") { "$it=${attrs[it]}" })
      }
    }
    return parts.joinToString("|")
  }

  private fun reconcileGraphicsOverlays(records: List<SceneGraphicsOverlayRecord>) {
    val incomingIds = records.map { it.id }.toSet()
    for (id in graphicsOverlays.keys.filter { it !in incomingIds }) {
      graphicsOverlays.remove(id)?.let { sceneView.graphicsOverlays.remove(it) }
      overlaySignatures.remove(id)
    }
    for (record in records) {
      val signature = overlaySignature(record)
      if (overlaySignatures[record.id] == signature && graphicsOverlays[record.id] != null) {
        continue
      }
      graphicsOverlays.remove(record.id)?.let { sceneView.graphicsOverlays.remove(it) }
      val overlay =
        GraphicsOverlay().apply {
          sceneProperties = LayerSceneProperties(surfacePlacement(record.surfacePlacement))
          makeRenderer(record.renderer)?.let { renderer ->
            record.extrusion?.let { extrusion ->
              renderer.sceneProperties.extrusionExpression = extrusion.expression
              renderer.sceneProperties.extrusionMode = extrusionMode(extrusion.mode)
            }
            record.orientationExpressions?.let { orientation ->
              orientation.headingExpression?.let { renderer.sceneProperties.headingExpression = it }
              orientation.pitchExpression?.let { renderer.sceneProperties.pitchExpression = it }
              orientation.rollExpression?.let { renderer.sceneProperties.rollExpression = it }
            }
            this.renderer = renderer
          }
          record.graphics.forEach { graphicRecord ->
            makeGraphic(graphicRecord)?.let { graphics.add(it) }
          }
        }
      sceneView.graphicsOverlays.add(overlay)
      graphicsOverlays[record.id] = overlay
      overlaySignatures[record.id] = signature
    }
  }

  private fun reconcileSceneLayers(records: List<SceneLayerRecord>, scene: ArcGISScene) {
    val incomingIds = records.map { it.id }.toSet()

    for (id in sceneLayers.keys.filter { it !in incomingIds }) {
      sceneLayers.remove(id)?.let { scene.operationalLayers.remove(it) }
      sceneLayerUrls.remove(id)
    }

    for (record in records) {
      // A layer's source is its `url`, or (for a local point cloud) its `path`.
      val layerSource = record.url.ifEmpty { record.path ?: "" }
      val existing = sceneLayers[record.id]
      if (existing != null && sceneLayerUrls[record.id] == layerSource) {
        existing.isVisible = record.visible ?: true
        existing.opacity = (record.opacity ?: 1.0).toFloat()
        (existing as? ArcGISSceneLayer)?.let {
          it.renderer = makeRenderer(record.renderer)
          it.polygonFilter = makePolygonFilter(record.polygonFilter)
        }
        continue
      }
      existing?.let { scene.operationalLayers.remove(it) }
      val layer: Layer =
        when (record.type) {
          "integratedMesh" -> IntegratedMeshLayer(record.url)
          "3dTiles" -> Ogc3DTilesLayer(record.url)
          "pointCloud" -> PointCloudLayer(layerSource)
          "building" ->
            BuildingSceneLayer(record.url).apply {
              record.buildingFilterExpression?.takeIf { it.isNotEmpty() }?.let { expression ->
                activeFilter =
                  BuildingFilter(
                    "filter",
                    "",
                    listOf(BuildingFilterBlock("solid", expression, BuildingSolidFilterMode())),
                  )
              }
            }
          else ->
            ArcGISSceneLayer(record.url).apply {
              renderer = makeRenderer(record.renderer)
              polygonFilter = makePolygonFilter(record.polygonFilter)
            }
        }
      layer.isVisible = record.visible ?: true
      layer.opacity = (record.opacity ?: 1.0).toFloat()
      scene.operationalLayers.add(layer)
      sceneLayers[record.id] = layer
      sceneLayerUrls[record.id] = layerSource
    }
  }

  private fun makeCamera(record: CameraRecord): Camera =
    Camera(
      record.latitude,
      record.longitude,
      record.altitude,
      record.heading ?: 0.0,
      record.pitch ?: 0.0,
      record.roll ?: 0.0,
    )

  suspend fun setCamera(record: CameraRecord, durationMs: Double) {
    if (disposed) return
    sceneView.setViewpointCameraAnimated(makeCamera(record), (durationMs / 1000).toFloat())
  }

  /** Queries the base surface's elevation (metres above sea level) at a point. */
  suspend fun getSurfaceElevation(point: PointRecord): Double {
    val surface =
      sceneView.scene?.baseSurface
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.NATIVE_FAILURE, "The scene has no elevation surface.")
    val location = Point(point.longitude, point.latitude, SpatialReference.wgs84())
    return surface.getElevation(location).getOrElse { throw serviceException(it, "elevation") }
  }

  private fun loadScene(scene: ArcGISScene) {
    scope.launch {
      scene
        .load()
        .onSuccess {
          if (disposed) return@onSuccess
          applyWebSceneLayerLabels(scene)
          onSceneLoad(mapOf("spatialReferenceWkid" to (scene.spatialReference?.wkid ?: 0)))
        }
        .onFailure { throwable ->
          if (disposed) return@onFailure
          onSceneError(mapLoadError(throwable))
        }
    }
  }

  /**
   * Applies the JS-declared web-scene layer labels once the scene has loaded:
   * walks each `layerPath` from the operational layers through group layers to a
   * feature layer, adds the label definitions, and enables labeling.
   */
  private fun applyWebSceneLayerLabels(scene: ArcGISScene) {
    for (record in webSceneLayerLabels) {
      val layer = findFeatureLayer(record.layerPath, scene.operationalLayers) ?: continue
      layer.labelDefinitions.clear()
      layer.labelDefinitions.addAll(record.labels.map { makeLabelDefinition(it) })
      layer.labelsEnabled = record.labels.isNotEmpty()
    }
  }

  /**
   * Resolves a name path (outermost group first) to a feature layer, descending
   * through group layers. Returns null if any segment is missing or the leaf is
   * not a feature layer.
   */
  private fun findFeatureLayer(path: List<String>, layers: List<Layer>): FeatureLayer? {
    val head = path.firstOrNull() ?: return null
    val match = layers.firstOrNull { it.name == head } ?: return null
    if (path.size == 1) return match as? FeatureLayer
    val group = match as? GroupLayer ?: return null
    return findFeatureLayer(path.drop(1), group.layers)
  }

  fun dispose() {
    disposed = true
    imageAnimationJob?.cancel()
    imageAnimationJob = null
    scope.cancel()
    graphicsOverlays.clear()
    overlaySignatures.clear()
    sceneView.graphicsOverlays.clear()
    sceneView.analysisOverlays.clear()
    sceneView.imageOverlays.clear()
    sceneFeatureLayers.clear()
    sceneFeatureLayerSignatures.clear()
    findViewTreeLifecycleOwner()?.lifecycle?.removeObserver(sceneView)
  }
}
