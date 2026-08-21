package expo.modules.arcgismapssdk

import android.content.Context
import android.view.ViewGroup
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import com.arcgismaps.geometry.GeometryEngine
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.mapping.ArcGISScene
import com.arcgismaps.mapping.ArcGISTiledElevationSource
import com.arcgismaps.mapping.Basemap
import com.arcgismaps.mapping.PortalItem
import com.arcgismaps.mapping.Surface
import com.arcgismaps.mapping.Viewpoint
import com.arcgismaps.data.ServiceFeatureTable
import com.arcgismaps.mapping.layers.ArcGISSceneLayer
import com.arcgismaps.mapping.layers.FeatureLayer
import com.arcgismaps.mapping.layers.IntegratedMeshLayer
import com.arcgismaps.mapping.layers.Layer
import com.arcgismaps.mapping.layers.Ogc3DTilesLayer
import com.arcgismaps.mapping.layers.PointCloudLayer
import com.arcgismaps.mapping.view.Camera
import com.arcgismaps.mapping.view.GraphicsOverlay
import com.arcgismaps.mapping.view.LayerSceneProperties
import com.arcgismaps.mapping.view.SceneViewingMode
import com.arcgismaps.mapping.view.SingleTapConfirmedEvent
import com.arcgismaps.mapping.view.SurfacePlacement
import com.arcgismaps.portal.Portal
import com.arcgismaps.toolkit.ar.FlyoverSceneView
import com.arcgismaps.toolkit.ar.FlyoverSceneViewProxy
import com.arcgismaps.toolkit.ar.TableTopSceneView
import com.arcgismaps.toolkit.ar.WorldScaleSceneView
import com.arcgismaps.toolkit.ar.WorldScaleTrackingMode
import com.google.ar.core.ArCoreApk
import expo.modules.arcgismapssdk.dto.CameraRecord
import expo.modules.arcgismapssdk.dto.FeatureLayerRecord
import expo.modules.arcgismapssdk.dto.PointRecord
import expo.modules.arcgismapssdk.dto.SceneGraphicsOverlayRecord
import expo.modules.arcgismapssdk.dto.SceneLayerRecord
import expo.modules.arcgismapssdk.dto.SceneSourceRecord
import expo.modules.arcgismapssdk.dto.basemapStyleFromString
import expo.modules.arcgismapssdk.dto.makeGraphic
import expo.modules.arcgismapssdk.dto.makeRenderer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/** World elevation service (Terrain3D) used for the scene's base surface. */
private const val WORLD_ELEVATION_URL =
  "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"

/** ArcGIS Online portal, used to load web scenes from portal items. */
private const val ARCGIS_ONLINE_URL = "https://www.arcgis.com"

/**
 * Hosts one of the ArcGIS Maps SDK Toolkit's augmented-reality scene views
 * (world-scale / tabletop / flyover) in a [ComposeView], selected by [mode].
 * The scene content is declared through the same [SceneSourceRecord] as
 * [ExpoArcgisSceneView]; because an AR scene is configured once rather than
 * continuously reconciled, the scene is rebuilt when the source changes.
 *
 * The toolkit AR views require ARCore. On a device without it the view renders
 * nothing and reports `E_UNSUPPORTED` through `onArError`.
 */
class ExpoArcgisArView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private val onSceneLoad by EventDispatcher<Map<String, Any?>>()
  private val onSceneError by EventDispatcher<Map<String, Any?>>()
  private val onSingleTap by EventDispatcher<Map<String, Any?>>()
  private val onTrackingStateChange by EventDispatcher<Map<String, Any?>>()
  private val onArError by EventDispatcher<Map<String, Any?>>()

  private val composeView = ComposeView(context)
  private val scope = CoroutineScope(Dispatchers.Main.immediate + SupervisorJob())
  private val arAvailable: Boolean

  // Compose-observable state driving which AR view renders and how. The `State`
  // suffix keeps the generated setter names (setModeState, …) from clashing with
  // the public setMode(…)/setTrackingMode(…) prop handlers below.
  private var arcScene by mutableStateOf<ArcGISScene?>(null)
  private val graphicsOverlays = mutableStateListOf<GraphicsOverlay>()
  private var modeState by mutableStateOf("worldScale")
  private var trackingModeState by mutableStateOf("world")
  private var anchorState by mutableStateOf<PointRecord?>(null)
  private var initialCameraState by mutableStateOf<CameraRecord?>(null)
  private var translationFactorState by mutableStateOf(1.0)
  private var clippingDistanceState by mutableStateOf<Double?>(null)
  private var calibrationVisibleState by mutableStateOf(true)

  /** Latest camera reported by the AR view, cached for `getCurrentCamera`. */
  private var lastCamera: Camera? = null
  private var currentSceneKey: String? = null

  init {
    arAvailable = ArCoreApk.getInstance().checkAvailability(context).isSupported
    if (arAvailable) {
      composeView.layoutParams =
        ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
      addView(composeView)
      composeView.setContent { ArContent() }
    } else {
      onArError(
        mapOf(
          "code" to "E_UNSUPPORTED",
          "message" to "Augmented reality is not available on this device."))
    }
  }

  @Composable
  private fun ArContent() {
    val scene = arcScene ?: return
    when (modeState) {
      "tabletop" -> {
        val a = anchorState ?: return
        TableTopSceneView(
          arcGISScene = scene,
          arcGISSceneAnchor = Point(a.longitude, a.latitude, SpatialReference.wgs84()),
          translationFactor = translationFactorState,
          clippingDistance = clippingDistanceState,
          graphicsOverlays = graphicsOverlays,
          onInitializationStatusChanged = { emitStatus(it::class.simpleName) },
          onCurrentViewpointCameraChanged = { lastCamera = it },
          onSingleTapConfirmed = { emitTap(it) },
        )
      }
      "flyover" -> {
        val c = initialCameraState ?: return
        val proxy =
          remember(c, translationFactorState) {
            FlyoverSceneViewProxy(
              Point(c.longitude, c.latitude, c.altitude, SpatialReference.wgs84()),
              translationFactorState)
          }
        FlyoverSceneView(
          arcGISScene = scene,
          flyoverSceneViewProxy = proxy,
          translationFactor = translationFactorState,
          graphicsOverlays = graphicsOverlays,
          onInitializationStatusChanged = { emitStatus(it::class.simpleName) },
          onCurrentViewpointCameraChanged = { lastCamera = it },
          onSingleTapConfirmed = { emitTap(it) },
        )
      }
      else -> {
        WorldScaleSceneView(
          arcGISScene = scene,
          worldScaleTrackingMode =
            if (trackingModeState == "geo") WorldScaleTrackingMode.Geospatial()
            else WorldScaleTrackingMode.World(),
          clippingDistance = clippingDistanceState,
          graphicsOverlays = graphicsOverlays,
          onInitializationStatusChanged = { emitStatus(it::class.simpleName) },
          onCurrentViewpointCameraChanged = { lastCamera = it },
          onSingleTapConfirmed = { emitTap(it) },
        ) {
          if (calibrationVisibleState) {
            CalibrationView(onDismiss = {})
          }
        }
      }
    }
  }

  /**
   * Maps a toolkit AR status class name onto the public `ArTrackingState` plus an
   * `ArTrackingReason`. The ArcGIS toolkit only surfaces coarse initialization
   * status on Android, so the reason is limited to `initializing` /
   * `detectingPlanes` / `unknown` — the granular ARCore failure reasons
   * (insufficient features/light, excessive motion) are not exposed here.
   */
  private fun emitStatus(statusName: String?) {
    val (state, reason) =
      when (statusName) {
        "Initialized" -> "tracking" to null
        "FailedToInitialize" -> "unavailable" to "unknown"
        "DetectingPlanes" -> "initializing" to "detectingPlanes"
        else -> "initializing" to "initializing" // Initializing + any other pre-init status
      }
    val payload = mutableMapOf<String, Any?>("state" to state)
    if (reason != null) payload["reason"] = reason
    onTrackingStateChange(payload)
  }

  private fun emitTap(event: SingleTapConfirmedEvent) {
    val payload =
      mutableMapOf<String, Any?>(
        "screenPoint" to
          mapOf("x" to event.screenCoordinate.x, "y" to event.screenCoordinate.y))
    event.mapPoint?.let { scenePoint ->
      val wgs =
        (GeometryEngine.projectOrNull(scenePoint, SpatialReference.wgs84()) as? Point) ?: scenePoint
      payload["mapPoint"] = mapOf("latitude" to wgs.y, "longitude" to wgs.x)
    }
    onSingleTap(payload)
  }

  fun setSceneSource(source: SceneSourceRecord) {
    val webSceneId = source.webSceneItemId?.takeIf { it.isNotEmpty() }
    val sceneKey =
      when {
        webSceneId != null -> "item:$webSceneId"
        else -> "basemap:${source.basemap}:${source.viewingMode ?: "global"}"
      }

    if (arcScene == null || sceneKey != currentSceneKey) {
      currentSceneKey = sceneKey
      buildScene(source, webSceneId)
    }
    reconcileGraphicsOverlays(source.graphicsOverlays)
  }

  private fun buildScene(source: SceneSourceRecord, webSceneId: String?) {
    val scene: ArcGISScene
    if (webSceneId != null) {
      val portal = Portal(ARCGIS_ONLINE_URL, Portal.Connection.Anonymous)
      scene = ArcGISScene(PortalItem(portal, webSceneId))
    } else {
      val style =
        basemapStyleFromString(source.basemap)
          ?: run {
            onSceneError(
              arcgisErrorPayload(ArcgisErrorCode.INVALID_ARGUMENT, "Unsupported basemap style."))
            return
          }
      val viewingMode =
        if (source.viewingMode == "local") SceneViewingMode.Local else SceneViewingMode.Global
      scene = ArcGISScene(viewingMode, Basemap(style))
      if (source.elevationEnabled) {
        scene.baseSurface =
          Surface().apply { elevationSources.add(ArcGISTiledElevationSource(WORLD_ELEVATION_URL)) }
      }
      source.sceneLayers.forEach { record -> scene.operationalLayers.add(makeSceneLayer(record)) }
      source.featureLayers.forEach { record ->
        scene.operationalLayers.add(makeFeatureLayer(record))
      }
      source.initialCamera?.let { record ->
        val camera = makeCamera(record)
        scene.initialViewpoint = Viewpoint(camera.location, camera)
      }
    }
    arcScene = scene
    loadScene(scene, currentSceneKey)
  }

  private fun makeSceneLayer(record: SceneLayerRecord): Layer {
    val layerSource = record.url.ifEmpty { record.path ?: "" }
    val layer: Layer =
      when (record.type) {
        "integratedMesh" -> IntegratedMeshLayer(record.url)
        "3dTiles" -> Ogc3DTilesLayer(record.url)
        "pointCloud" -> PointCloudLayer(layerSource)
        else -> ArcGISSceneLayer(record.url).apply { renderer = makeRenderer(record.renderer) }
      }
    layer.isVisible = record.visible ?: true
    layer.opacity = (record.opacity ?: 1.0).toFloat()
    return layer
  }

  private fun makeFeatureLayer(record: FeatureLayerRecord): FeatureLayer {
    val layer = FeatureLayer.createWithFeatureTable(ServiceFeatureTable(record.url))
    layer.isVisible = record.visible ?: true
    layer.opacity = (record.opacity ?: 1.0).toFloat()
    makeRenderer(record.renderer)?.let { layer.renderer = it }
    record.definitionExpression?.let { layer.definitionExpression = it }
    return layer
  }

  private fun reconcileGraphicsOverlays(records: List<SceneGraphicsOverlayRecord>) {
    graphicsOverlays.clear()
    for (record in records) {
      val overlay =
        GraphicsOverlay().apply {
          sceneProperties = LayerSceneProperties(surfacePlacement(record.surfacePlacement))
          makeRenderer(record.renderer)?.let { renderer = it }
          record.graphics.forEach { g -> makeGraphic(g)?.let { graphics.add(it) } }
        }
      graphicsOverlays.add(overlay)
    }
  }

  private fun surfacePlacement(value: String?): SurfacePlacement =
    when (value) {
      "drapedFlat" -> SurfacePlacement.DrapedFlat
      "absolute" -> SurfacePlacement.Absolute
      "relative" -> SurfacePlacement.Relative
      "relativeToScene" -> SurfacePlacement.RelativeToScene
      else -> SurfacePlacement.DrapedBillboarded
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

  private fun loadScene(scene: ArcGISScene, key: String?) {
    scope.launch {
      scene
        .load()
        .onSuccess {
          if (currentSceneKey != key) return@onSuccess
          onSceneLoad(mapOf("spatialReferenceWkid" to (scene.spatialReference?.wkid ?: 0)))
        }
        .onFailure { if (currentSceneKey == key) onSceneError(mapLoadError(it)) }
    }
  }

  fun setMode(value: String) {
    modeState = value
  }

  fun setTrackingMode(value: String?) {
    trackingModeState = value ?: "world"
  }

  fun setAnchor(value: PointRecord?) {
    anchorState = value
  }

  fun setInitialCamera(value: CameraRecord?) {
    initialCameraState = value
  }

  fun setTranslationFactor(value: Double?) {
    translationFactorState = value ?: 1.0
  }

  fun setClippingDistance(value: Double?) {
    clippingDistanceState = value
  }

  fun setCalibrationVisible(value: Boolean?) {
    calibrationVisibleState = value ?: true
  }

  /** The AR camera's current position, or throws if not yet tracking. */
  fun getCurrentCamera(): Map<String, Any?> {
    val camera =
      lastCamera
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.NATIVE_FAILURE, "The AR view is not tracking yet.")
    val location = camera.location
    return mapOf(
      "latitude" to location.y,
      "longitude" to location.x,
      "altitude" to (location.z ?: 0.0),
      "heading" to camera.heading,
      "pitch" to camera.pitch,
      "roll" to camera.roll,
    )
  }

  fun dispose() {
    scope.cancel()
    graphicsOverlays.clear()
    arcScene = null
  }
}
