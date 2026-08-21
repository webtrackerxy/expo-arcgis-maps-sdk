package expo.modules.arcgismapssdk

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp
import androidx.lifecycle.findViewTreeLifecycleOwner
import com.arcgismaps.Color
import com.arcgismaps.LoadStatus
import com.arcgismaps.toolkit.scalebar.Scalebar
import com.arcgismaps.arcgisservices.TimeUnit
import com.arcgismaps.arcade.ArcadeEvaluator
import com.arcgismaps.arcade.ArcadeExpression
import com.arcgismaps.arcade.ArcadeProfile
import com.arcgismaps.data.ArcGISFeature
import com.arcgismaps.data.FeatureCollectionTable
import com.arcgismaps.data.Field
import com.arcgismaps.data.FieldType
import com.arcgismaps.data.Feature
import com.arcgismaps.data.FeatureCollection
import com.arcgismaps.data.FeatureRequestMode
import com.arcgismaps.data.OgcFeatureCollectionTable
import com.arcgismaps.data.QueryParameters
import com.arcgismaps.data.ServiceFeatureTable
import com.arcgismaps.data.StatisticDefinition
import com.arcgismaps.data.StatisticType
import com.arcgismaps.data.StatisticsQueryParameters
import com.arcgismaps.data.WfsFeatureTable
import com.arcgismaps.geometry.Envelope
import com.arcgismaps.geometry.GeometryEngine
import com.arcgismaps.geometry.GeometryType
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.geotriggers.FenceGeotrigger
import com.arcgismaps.geotriggers.FenceGeotriggerNotificationInfo
import com.arcgismaps.geotriggers.FenceNotificationType
import com.arcgismaps.geotriggers.FenceRuleType
import com.arcgismaps.geotriggers.GeotriggerMonitor
import com.arcgismaps.geotriggers.GraphicsOverlayFenceParameters
import com.arcgismaps.geotriggers.LocationGeotriggerFeed
import com.arcgismaps.location.IndoorsLocationDataSource
import com.arcgismaps.location.Location
import com.arcgismaps.location.LocationDisplayAutoPanMode
import com.arcgismaps.location.NmeaLocationDataSource
import com.arcgismaps.location.SimulatedLocationDataSource
import com.arcgismaps.location.SimulationParameters
import com.arcgismaps.location.SystemLocationDataSource
import com.arcgismaps.navigation.ReroutingParameters
import com.arcgismaps.navigation.RouteTracker
import com.arcgismaps.tasks.networkanalysis.RouteTask
import com.arcgismaps.tasks.networkanalysis.Stop
import com.arcgismaps.mapping.ArcGISMap
import com.arcgismaps.mapping.Basemap
import com.arcgismaps.mapping.MobileMapPackage
import com.arcgismaps.mapping.TimeValue
import com.arcgismaps.mapping.GeoElement
import com.arcgismaps.mapping.PortalItem
import com.arcgismaps.mapping.featureforms.FeatureForm
import com.arcgismaps.mapping.featureforms.FieldFormElement
import com.arcgismaps.mapping.featureforms.FormElement
import com.arcgismaps.mapping.featureforms.GroupFormElement
import com.arcgismaps.mapping.popup.FieldsPopupElement
import com.arcgismaps.mapping.popup.Popup
import com.arcgismaps.mapping.popup.PopupDefinition
import com.arcgismaps.mapping.Viewpoint
import com.arcgismaps.mapping.ViewpointType
import com.arcgismaps.mapping.layers.ArcGISMapImageLayer
import com.arcgismaps.mapping.layers.ArcGISTiledLayer
import com.arcgismaps.mapping.symbology.SimpleMarkerSymbol
import com.arcgismaps.mapping.symbology.SimpleMarkerSymbolStyle
import com.arcgismaps.mapping.symbology.SimpleRenderer
import com.arcgismaps.mapping.symbology.SymbolStyle
import com.arcgismaps.mapping.layers.ArcGISVectorTiledLayer
import com.arcgismaps.data.GeoPackage
import com.arcgismaps.data.ShapefileFeatureTable
import com.arcgismaps.mapping.kml.KmlContainer
import com.arcgismaps.mapping.kml.KmlDataset
import com.arcgismaps.mapping.kml.KmlGroundOverlay
import com.arcgismaps.mapping.kml.KmlNode
import com.arcgismaps.mapping.kml.KmlTour
import com.arcgismaps.mapping.kml.KmlTourController
import com.arcgismaps.mapping.layers.AnnotationLayer
import com.arcgismaps.mapping.layers.AnnotationSublayer
import com.arcgismaps.mapping.layers.DimensionLayer
import com.arcgismaps.hydrography.EncCell
import com.arcgismaps.hydrography.EncEnvironmentSettings
import com.arcgismaps.hydrography.EncExchangeSet
import com.arcgismaps.mapping.layers.DynamicEntityLayer
import com.arcgismaps.mapping.layers.EncLayer
import com.arcgismaps.mapping.layers.FeatureCollectionLayer
import com.arcgismaps.mapping.layers.FeatureRenderingMode
import com.arcgismaps.mapping.layers.KmlLayer
import com.arcgismaps.mapping.layers.RasterLayer
import com.arcgismaps.mapping.layers.SubtypeFeatureLayer
import com.arcgismaps.mapping.symbology.raster.BlendRenderer
import com.arcgismaps.mapping.symbology.raster.ColorRamp
import com.arcgismaps.mapping.symbology.raster.HillshadeRenderer
import com.arcgismaps.mapping.symbology.raster.MinMaxStretchParameters
import com.arcgismaps.mapping.symbology.raster.ColormapRenderer
import com.arcgismaps.mapping.symbology.raster.PresetColorRampType
import com.arcgismaps.mapping.symbology.raster.PercentClipStretchParameters
import com.arcgismaps.mapping.symbology.raster.RgbRenderer
import com.arcgismaps.mapping.symbology.raster.StandardDeviationStretchParameters
import com.arcgismaps.mapping.symbology.raster.StretchParameters
import com.arcgismaps.mapping.symbology.raster.StretchRenderer
import com.arcgismaps.raster.ImageServiceRaster
import com.arcgismaps.raster.MosaicMethod
import com.arcgismaps.raster.MosaicOperation
import com.arcgismaps.raster.MosaicRule
import com.arcgismaps.raster.Raster
import com.arcgismaps.raster.RasterFunction
import com.arcgismaps.raster.RenderingRule
import com.arcgismaps.raster.SlopeType
import com.arcgismaps.mapping.layers.FeatureLayer
import com.arcgismaps.mapping.layers.GroupLayer
import com.arcgismaps.mapping.layers.Layer
import com.arcgismaps.mapping.layers.LayerContent
import com.arcgismaps.mapping.layers.OpenStreetMapLayer
import com.arcgismaps.mapping.layers.SelectionMode
import com.arcgismaps.mapping.layers.WebTiledLayer
import com.arcgismaps.mapping.layers.WmsLayer
import com.arcgismaps.mapping.layers.WmsSublayer
import com.arcgismaps.mapping.layers.WmtsLayer
import com.arcgismaps.mapping.view.BackgroundGrid
import com.arcgismaps.mapping.view.Graphic
import com.arcgismaps.mapping.view.GraphicsOverlay
import com.arcgismaps.realtime.ArcGISStreamService
import com.arcgismaps.mapping.view.Grid
import com.arcgismaps.mapping.view.LatitudeLongitudeGrid
import com.arcgismaps.mapping.view.DrawStatus
import com.arcgismaps.mapping.view.LayerViewState
import com.arcgismaps.mapping.view.LayerViewStatus
import com.arcgismaps.mapping.view.MapView
import com.arcgismaps.mapping.view.geometryeditor.FreehandTool
import com.arcgismaps.mapping.view.geometryeditor.ReticleVertexTool
import com.arcgismaps.mapping.view.geometryeditor.GeometryEditor
import com.arcgismaps.mapping.view.geometryeditor.VertexTool
import com.arcgismaps.mapping.view.MgrsGrid
import com.arcgismaps.mapping.view.IdentifyLayerResult
import com.arcgismaps.mapping.view.ScreenCoordinate
import com.arcgismaps.mapping.view.UsngGrid
import com.arcgismaps.mapping.view.UtmGrid
import com.arcgismaps.portal.Portal
import expo.modules.arcgismapssdk.dto.ApplyEditsOptionsRecord
import expo.modules.arcgismapssdk.dto.EnvelopeRecord
import expo.modules.arcgismapssdk.dto.FeatureLayerRecord
import expo.modules.arcgismapssdk.dto.FeatureQueryOptionsRecord
import expo.modules.arcgismapssdk.dto.GraphicRecord
import expo.modules.arcgismapssdk.dto.StretchRecord
import expo.modules.arcgismapssdk.dto.SymbolRecord
import expo.modules.arcgismapssdk.dto.GeometryEditorRecord
import expo.modules.arcgismapssdk.dto.GeotriggerRecord
import expo.modules.arcgismapssdk.dto.ArcadeEvaluationOptionsRecord
import expo.modules.arcgismapssdk.dto.IdentifyOptionsRecord
import expo.modules.arcgismapssdk.dto.LayerRecord
import expo.modules.arcgismapssdk.dto.MosaicRuleRecord
import expo.modules.arcgismapssdk.dto.serializeGeometry
import expo.modules.arcgismapssdk.dto.KmlTourOptionsRecord
import expo.modules.arcgismapssdk.dto.LayerWhereRecord
import expo.modules.arcgismapssdk.dto.LocationDisplayRecord
import expo.modules.arcgismapssdk.dto.BasemapLayerRecord
import expo.modules.arcgismapssdk.dto.MapSourceRecord
import expo.modules.arcgismapssdk.dto.RelatedFeaturesOptionsRecord
import expo.modules.arcgismapssdk.dto.StatisticsQueryOptionsRecord
import expo.modules.arcgismapssdk.dto.PointRecord
import expo.modules.arcgismapssdk.dto.ViewpointRecord
import expo.modules.arcgismapssdk.dto.basemapStyleFromString
import expo.modules.arcgismapssdk.dto.makeStyleParameters
import expo.modules.arcgismapssdk.dto.graphicSignature
import expo.modules.arcgismapssdk.dto.makeClustering
import expo.modules.arcgismapssdk.dto.makeGeometry
import expo.modules.arcgismapssdk.dto.makeLabelDefinition
import expo.modules.arcgismapssdk.dto.makeRenderer
import expo.modules.arcgismapssdk.dto.makeSymbol
import expo.modules.arcgismapssdk.dto.parseHexColor
import expo.modules.arcgismapssdk.dto.viewpointFromRecord
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.sample
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** ArcGIS World Route service, used for turn-by-turn navigation. */
private const val NAVIGATION_ROUTE_URL =
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"

/**
 * Hosts an ArcGIS [MapView] and applies declarative props from JavaScript.
 *
 * Lifecycle & threading (see CLAUDE.md "Native view rules"):
 * - The ArcGIS [MapView] is registered with the host lifecycle while attached.
 * - Map loading runs on a view-scoped coroutine that is cancelled on disposal.
 * - `disposed` guards against emitting events after teardown (stale async).
 *
 * Scope: basemap + initial viewpoint + feature layers + graphics + load/error +
 * viewpoint-change events + `setViewpoint`. Web maps, tap events and `identify`
 * are later Milestone 2 work.
 */
class ExpoArcgisMapView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private val onMapLoad by EventDispatcher<Map<String, Any?>>()
  private val onMapError by EventDispatcher<Map<String, Any?>>()

  private val onSingleTap by EventDispatcher<Map<String, Any?>>()

  private val onViewpointChange by EventDispatcher<Map<String, Any?>>()

  private val onLocationUpdate by EventDispatcher<Map<String, Any?>>()

  private val onDrawStatusChange by EventDispatcher<Map<String, Any?>>()

  private val onLayerViewStateChange by EventDispatcher<Map<String, Any?>>()

  private val onNavigationStatus by EventDispatcher<Map<String, Any?>>()

  private val onGeotriggerNotification by EventDispatcher<Map<String, Any?>>()

  private val mapView = MapView(context)
  private val scope = CoroutineScope(Dispatchers.Main.immediate + SupervisorJob())
  private var disposed = false

  // Turn-by-turn navigation state; active only between start/stopNavigation.
  private var navigationJob: kotlinx.coroutines.Job? = null

  // Interactive geometry editor, attached to the map view; active only between
  // startGeometryEditor and stopGeometryEditor.
  private val geometryEditor = GeometryEditor().also { mapView.geometryEditor = it }

  // Identity of the currently applied source, for minimal-diff prop updates.
  private var currentBasemapKey: String? = null
  private var currentBasemapParamsKey: String? = null
  private var currentBasemapLayerKey: String? = null
  private var currentWebMapItemId: String? = null
  private var currentMobileMapPackagePath: String? = null
  private var currentSpatialReferenceWkid: Int? = null

  // Feature layers on the map, keyed by stable id, plus the URL each was built
  // from — used to reconcile add / update / remove.
  private val featureLayers = mutableMapOf<String, FeatureLayer>()
  private val featureLayerUrls = mutableMapOf<String, String>()

  // Non-feature operational layers, keyed by id, with a content signature so a
  // layer is rebuilt only when its definition (not just visibility) changes.
  private val layers = mutableMapOf<String, Layer>()
  private val layerSignatures = mutableMapOf<String, String>()
  // KML tour controllers, created lazily per KML layer id on first `controlKmlTour`.
  private val kmlTourControllers = mutableMapOf<String, KmlTourController>()

  // A single overlay holding all graphics; lives on the MapView so it survives
  // basemap/map rebuilds. Graphics are reconciled by content signature.
  private val graphicsOverlay = GraphicsOverlay()
  private val graphics = mutableMapOf<String, Graphic>()
  private val graphicSignatures = mutableMapOf<String, String>()

  // Compose state driving the Toolkit scale bar overlay. Updated on viewpoint
  // changes; the composable renders only once all three inputs are available.
  private var scaleBarShown by mutableStateOf(false)
  private var scaleBarViewpoint by mutableStateOf<Viewpoint?>(null)
  private var scaleBarUnitsPerDip by mutableStateOf(0.0)
  private var scaleBarSpatialReference by mutableStateOf<SpatialReference?>(null)

  // A full-size ComposeView over the map; the scale bar is aligned to the bottom-
  // start inside it. It fills the map (so the bar has a bounded width to lay out
  // against and the view always measures non-zero), but only the scale bar draws
  // — empty areas don't consume touches, so map pan/zoom still works.
  private val scaleBarOverlay =
    ComposeView(context).apply {
      setContent {
        val viewpoint = scaleBarViewpoint
        val spatialReference = scaleBarSpatialReference
        val unitsPerDip = scaleBarUnitsPerDip
        Box(Modifier.fillMaxSize()) {
          if (scaleBarShown && viewpoint != null && spatialReference != null && unitsPerDip > 0.0) {
            Scalebar(
              maxWidth = 175.dp,
              unitsPerDip = unitsPerDip,
              viewpoint = viewpoint,
              spatialReference = spatialReference,
              modifier = Modifier.align(Alignment.BottomStart).padding(start = 16.dp, bottom = 16.dp),
            )
          }
        }
      }
    }

  // ExpoView is a LinearLayout (no child overlap), so the map and the scale bar
  // overlay live in a FrameLayout container that fills the view.
  private val container = FrameLayout(context)

  init {
    mapView.layoutParams =
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      )
    mapView.graphicsOverlays.add(graphicsOverlay)
    container.addView(mapView)
    scaleBarOverlay.layoutParams =
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      )
    container.addView(scaleBarOverlay)
    container.layoutParams =
      LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.MATCH_PARENT,
      )
    addView(container)

    // Emit throttled viewpoint changes (center in WGS 84, scale, rotation) and
    // feed the scale bar its current viewpoint / units-per-dip / spatial ref.
    scope.launch {
      mapView.viewpointChanged.sample(100).collect {
        if (disposed) return@collect
        val viewpoint = mapView.getCurrentViewpoint(ViewpointType.CenterAndScale) ?: return@collect
        emitViewpoint(viewpoint)
        scaleBarViewpoint = viewpoint
        scaleBarUnitsPerDip = mapView.unitsPerDip
        scaleBarSpatialReference = mapView.spatialReference.value
      }
    }

    // Emit single-tap events (tapped location in WGS 84 + screen point).
    scope.launch {
      mapView.onSingleTapConfirmed.collect { event ->
        if (disposed) return@collect
        val mapPoint = event.mapPoint ?: return@collect
        val wgs = (GeometryEngine.projectOrNull(mapPoint, SpatialReference.wgs84()) as? Point) ?: mapPoint
        onSingleTap(
          mapOf(
            "mapPoint" to mapOf("latitude" to wgs.y, "longitude" to wgs.x),
            "screenPoint" to mapOf("x" to event.screenCoordinate.x, "y" to event.screenCoordinate.y),
          )
        )
      }
    }

    // Emit map view draw-status changes (drawing vs settled).
    scope.launch {
      mapView.drawStatus.collect { status ->
        if (disposed) return@collect
        onDrawStatusChange(
          mapOf("status" to if (status is DrawStatus.InProgress) "inProgress" else "completed")
        )
      }
    }

    // Emit operational-layer view-state changes.
    scope.launch {
      mapView.layerViewStateChanged.collect { change ->
        if (disposed) return@collect
        onLayerViewStateChange(layerViewStatePayload(change.layer, change.layerViewState))
      }
    }
  }

  /**
   * Builds the serializable view-state payload, mapping the native layer back to
   * the caller-assigned id when it is one we added via `map.layers` /
   * `map.featureLayers`.
   */
  private fun layerViewStatePayload(layer: Layer, state: LayerViewState): Map<String, Any?> {
    val id =
      layers.entries.firstOrNull { it.value === layer }?.key
        ?: featureLayers.entries.firstOrNull { it.value === layer }?.key
    val statuses =
      state.status.mapNotNull {
        when (it) {
          is LayerViewStatus.Active -> "active"
          is LayerViewStatus.NotVisible -> "notVisible"
          is LayerViewStatus.OutOfScale -> "outOfScale"
          is LayerViewStatus.Loading -> "loading"
          is LayerViewStatus.Error -> "error"
          is LayerViewStatus.Warning -> "warning"
          else -> null
        }
      }
    val payload =
      mutableMapOf<String, Any?>("layerName" to layer.name, "statuses" to statuses)
    if (id != null) payload["layerId"] = id
    // A fixed, safe message — never surface raw native error text.
    if (state.status.any { it is LayerViewStatus.Error }) {
      payload["error"] = "The layer failed to load or draw."
    }
    return payload
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // The MapView manages render resources through the host lifecycle.
    findViewTreeLifecycleOwner()?.lifecycle?.addObserver(mapView)
  }

  override fun onDetachedFromWindow() {
    findViewTreeLifecycleOwner()?.lifecycle?.removeObserver(mapView)
    super.onDetachedFromWindow()
  }

  fun setInteractionEnabled(enabled: Boolean) {
    // TODO(verify): confirm the exact interactionOptions flag name in 300.0.
    mapView.interactionOptions.isEnabled = enabled
  }

  fun setScaleBarEnabled(enabled: Boolean) {
    scaleBarShown = enabled
  }

  fun setGrid(value: String) {
    mapView.grid = makeGrid(value)
  }

  private var locationJob: Job? = null
  private var nmeaReplayJob: Job? = null
  private var floorLevel: Int? = null
  private var geotriggerRecords: List<GeotriggerRecord> = emptyList()
  private val geotriggerJobs = mutableListOf<Job>()

  /**
   * Starts/stops the device-location data source per the `locationDisplay` prop
   * and streams updates to JS. Requires the app to hold the location permission;
   * if `start()` fails (e.g. permission denied), nothing is shown.
   */
  fun setLocationDisplay(record: LocationDisplayRecord?) {
    locationJob?.cancel()
    locationJob = null
    nmeaReplayJob?.cancel()
    nmeaReplayJob = null
    val locationDisplay = mapView.locationDisplay
    if (record == null || !record.enabled) {
      scope.launch { locationDisplay.dataSource.stop() }
      return
    }
    locationDisplay.setAutoPanMode(autoPanMode(record.autoPanMode))
    locationDisplay.showAccuracy = record.showAccuracy ?: true

    // Choose the data source: system GPS (default), replayed NMEA sentences, or
    // the map's indoor positioning (IPS).
    when (record.dataSource) {
      "nmea" -> {
        val nmea = NmeaLocationDataSource()
        locationDisplay.dataSource = nmea
        record.nmeaSentencesPath?.let { startNmeaReplay(nmea, it) }
      }
      "indoors" ->
        mapView.map?.indoorPositioningDefinition?.let {
          locationDisplay.dataSource = IndoorsLocationDataSource(it)
        }
      else -> locationDisplay.dataSource = SystemLocationDataSource()
    }

    locationJob =
      scope.launch {
        if (locationDisplay.dataSource.start().isFailure) return@launch
        locationDisplay.dataSource.locationChanged.sample(500).collect { location ->
          if (!disposed) emitLocation(location)
        }
      }
  }

  /**
   * Replays a file of newline-separated NMEA sentences into an
   * [NmeaLocationDataSource] at ~2 Hz, looping so the blue dot keeps moving.
   */
  private fun startNmeaReplay(nmea: NmeaLocationDataSource, path: String) {
    val sentences =
      try {
        File(path).readLines().filter { it.isNotBlank() }
      } catch (e: Exception) {
        return
      }
    if (sentences.isEmpty()) return
    nmeaReplayJob =
      scope.launch {
        var index = 0
        while (isActive) {
          nmea.pushData((sentences[index % sentences.size] + "\n").toByteArray())
          index++
          delay(500)
        }
      }
  }

  /** Shows only the requested floor level on a floor-aware map. */
  private fun applyFloorLevel(map: ArcGISMap) {
    val level = floorLevel ?: return
    val floorManager = map.floorManager ?: return
    scope.launch {
      floorManager.load()
      floorManager.levels.forEach { it.isVisible = it.levelNumber == level }
    }
  }

  /**
   * (Re)creates geotrigger monitors that fence the map's graphics against the
   * device location, emitting enter/exit notifications to JS.
   */
  private fun setupGeotriggers() {
    geotriggerJobs.forEach { it.cancel() }
    geotriggerJobs.clear()
    if (geotriggerRecords.isEmpty()) return
    val feed = LocationGeotriggerFeed(mapView.locationDisplay.dataSource)
    for (record in geotriggerRecords) {
      val ruleType =
        when (record.ruleType) {
          "enter" -> FenceRuleType.Enter
          "exit" -> FenceRuleType.Exit
          else -> FenceRuleType.EnterOrExit
        }
      val fenceParameters = GraphicsOverlayFenceParameters(graphicsOverlay, record.bufferMeters ?: 0.0)
      val geotrigger = FenceGeotrigger(feed, ruleType, fenceParameters, null, record.id)
      val monitor = GeotriggerMonitor(geotrigger)
      geotriggerJobs.add(
        scope.launch {
          if (monitor.start().isFailure) return@launch
          monitor.notifications.collect { info ->
            if (info is FenceGeotriggerNotificationInfo) {
              val action =
                if (info.fenceNotificationType == FenceNotificationType.Entered) "entered"
                else "exited"
              onGeotriggerNotification(
                mapOf(
                  "geotriggerId" to record.id,
                  "action" to action,
                  "message" to info.message,
                )
              )
            }
          }
        }
      )
    }
  }

  private fun autoPanMode(value: String?): LocationDisplayAutoPanMode =
    when (value) {
      "off" -> LocationDisplayAutoPanMode.Off
      "navigation" -> LocationDisplayAutoPanMode.Navigation
      "compassNavigation" -> LocationDisplayAutoPanMode.CompassNavigation
      else -> LocationDisplayAutoPanMode.Recenter
    }

  private fun emitLocation(location: Location) {
    val wgs =
      (GeometryEngine.projectOrNull(location.position, SpatialReference.wgs84()) as? Point)
        ?: location.position
    onLocationUpdate(
      mapOf(
        "position" to mapOf("latitude" to wgs.y, "longitude" to wgs.x),
        "horizontalAccuracy" to location.horizontalAccuracy,
        "speed" to location.speed,
        "course" to location.course,
      )
    )
  }

  private fun makeGrid(value: String): Grid? =
    when (value) {
      "latitudeLongitude" -> LatitudeLongitudeGrid()
      "mgrs" -> MgrsGrid()
      "utm" -> UtmGrid()
      "usng" -> UsngGrid()
      else -> null
    }

  /** Animates (or jumps) to a viewpoint; suspends until the transition applies. */
  suspend fun setViewpoint(record: ViewpointRecord, durationMs: Double) {
    val viewpoint = viewpointFromRecord(record)
    mapView.setViewpointAnimated(viewpoint, (durationMs / 1000).toFloat())
  }

  /** Hit-tests feature layers and the graphics overlay at a screen point. */
  suspend fun identify(options: IdentifyOptionsRecord): List<Map<String, Any?>> {
    val screen = ScreenCoordinate(options.screenPoint.x, options.screenPoint.y)
    val tolerance = options.tolerance ?: 12.0
    val maxResults = options.maximumResults ?: 10
    val results = mutableListOf<Map<String, Any?>>()

    mapView.identifyLayers(screen, tolerance, false, maxResults).onSuccess { layerResults ->
      for (layerResult in layerResults) {
        results.addAll(collectIdentifyResults(layerResult, sourceIdFor(layerResult.layerContent)))
      }
    }
    mapView.identifyGraphicsOverlays(screen, tolerance, false, maxResults).onSuccess { overlayResults ->
      for (overlayResult in overlayResults) {
        for (graphic in overlayResult.graphics) {
          results.add(identifyResult("graphics", graphic))
        }
      }
    }
    return results
  }

  suspend fun showPopup(options: IdentifyOptionsRecord): List<Map<String, Any?>> {
    val screen = ScreenCoordinate(options.screenPoint.x, options.screenPoint.y)
    val tolerance = options.tolerance ?: 12.0
    val maxResults = options.maximumResults ?: 10
    val results = mutableListOf<Map<String, Any?>>()

    mapView.identifyLayers(screen, tolerance, false, maxResults).onSuccess { layerResults ->
      for (layerResult in layerResults) {
        val sourceId = featureLayerId(layerResult.layerContent) ?: "layer"
        val layer = layerResult.layerContent as? FeatureLayer
        for (element in layerResult.geoElements) {
          // Use the layer's configured popup when it has one; otherwise a
          // definition generated from the geo-element gives any feature layer a
          // usable popup built from its fields.
          val definition = layer?.popupDefinition ?: PopupDefinition(element)
          val popup = Popup(element, definition)
          popup.evaluateExpressions()
          val fields = mutableListOf<Map<String, String>>()
          for (popupElement in popup.evaluatedElements) {
            if (popupElement is FieldsPopupElement) {
              popupElement.labels.zip(popupElement.formattedValues).forEach { (label, value) ->
                fields.add(mapOf("label" to label, "value" to value))
              }
            }
          }
          results.add(mapOf("sourceId" to sourceId, "title" to popup.title, "fields" to fields))
        }
      }
    }
    return results
  }

  suspend fun showFeatureForm(options: IdentifyOptionsRecord): List<Map<String, Any?>> {
    val screen = ScreenCoordinate(options.screenPoint.x, options.screenPoint.y)
    val tolerance = options.tolerance ?: 12.0
    val maxResults = options.maximumResults ?: 10
    val results = mutableListOf<Map<String, Any?>>()

    mapView.identifyLayers(screen, tolerance, false, maxResults).onSuccess { layerResults ->
      for (layerResult in layerResults) {
        val sourceId = featureLayerId(layerResult.layerContent) ?: "layer"
        for (element in layerResult.geoElements) {
          val feature = element as? ArcGISFeature ?: continue
          val form = FeatureForm(feature)
          val fields = mutableListOf<Map<String, String>>()
          collectFieldFormElements(form.elements, fields)
          results.add(
            mapOf("sourceId" to sourceId, "title" to form.title.value, "fields" to fields))
        }
      }
    }
    return results
  }

  suspend fun evaluateArcade(
    options: ArcadeEvaluationOptionsRecord
  ): List<Map<String, Any?>> {
    val screen = ScreenCoordinate(options.screenPoint.x, options.screenPoint.y)
    val tolerance = options.tolerance ?: 12.0
    val maxResults = options.maximumResults ?: 10
    val results = mutableListOf<Map<String, Any?>>()

    val expression = ArcadeExpression(options.expression)
    mapView.identifyLayers(screen, tolerance, false, maxResults).onSuccess { layerResults ->
      for (layerResult in layerResults) {
        val sourceId = featureLayerId(layerResult.layerContent) ?: "layer"
        for (element in layerResult.geoElements) {
          val feature = element as? ArcGISFeature ?: continue
          // A fresh evaluator per feature; the form-calculation profile exposes
          // `$feature` and `$map`.
          val evaluator = ArcadeEvaluator(expression, ArcadeProfile.FormCalculation)
          val variables = buildMap {
            put("\$feature", feature)
            mapView.map?.let { put("\$map", it) }
          }
          val evaluation = evaluator.evaluate(variables).getOrNull() ?: continue
          results.add(mapOf("sourceId" to sourceId, "value" to stringifyArcade(evaluation.result)))
        }
      }
    }
    return results
  }

  /**
   * Renders an Arcade result value as display text (whole doubles lose the
   * trailing `.0`; booleans become `true`/`false`; null becomes an empty string).
   */
  private fun stringifyArcade(value: Any?): String =
    when (value) {
      null -> ""
      is Double -> if (value % 1.0 == 0.0) value.toLong().toString() else value.toString()
      is Boolean -> value.toString()
      else -> value.toString()
    }

  /** Flattens field form elements (including those in groups) into label/value rows. */
  private fun collectFieldFormElements(
    elements: List<FormElement>,
    fields: MutableList<Map<String, String>>,
  ) {
    for (element in elements) {
      when (element) {
        is FieldFormElement -> fields.add(mapOf("label" to element.label, "value" to element.formattedValue))
        is GroupFormElement -> collectFieldFormElements(element.elements, fields)
        else -> {}
      }
    }
  }

  fun startGeometryEditor(options: GeometryEditorRecord) {
    geometryEditor.tool =
      when (options.tool) {
        "freehand" -> FreehandTool()
        "reticle" -> ReticleVertexTool()
        else -> VertexTool()
      }
    if (options.snapEnabled) {
      geometryEditor.snapSettings.isEnabled = true
      // Sync snap sources from the connected map's operational layers; a no-op
      // when there are no snappable layers.
      runCatching { geometryEditor.snapSettings.syncSourceSettings() }
    }
    val geometryType =
      when (options.geometryType) {
        "point" -> GeometryType.Point
        "polyline" -> GeometryType.Polyline
        else -> GeometryType.Polygon
      }
    geometryEditor.start(geometryType)
  }

  fun stopGeometryEditor(): Map<String, Any?>? {
    val geometry = geometryEditor.stop() ?: return null
    val wgs = GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84()) ?: geometry
    return serializeGeometry(wgs)
  }

  suspend fun startNavigation(stops: List<PointRecord>, reroute: Boolean = false) {
    stopNavigation()
    val routeTask = RouteTask(NAVIGATION_ROUTE_URL)
    routeTask.load().getOrThrow()
    val parameters = routeTask.createDefaultParameters().getOrThrow()
    parameters.returnDirections = true
    parameters.returnRoutes = true
    // RouteTracker requires the solved result to include its stops; without this
    // the tracker cannot start navigation.
    parameters.returnStops = true
    parameters.setStops(
      stops.map { Stop(Point(it.longitude, it.latitude, SpatialReference.wgs84())) })
    val routeResult = routeTask.solveRoute(parameters).getOrThrow()
    val route =
      routeResult.routes.firstOrNull()
        ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No route to navigate.")
    val geometry = route.routeGeometry ?: return
    val tracker = RouteTracker(routeResult, 0, true)
    // When requested, let the tracker re-solve automatically if the location
    // leaves the route. Rerouting requires a route source that supports it (an
    // offline transportation-network dataset); the online World Route service
    // does not, so surface that as a stable unsupported error.
    if (reroute) {
      val enabled = tracker.enableRerouting(ReroutingParameters(routeTask, parameters))
      if (enabled.isFailure) {
        throw ArcgisCodedException(
          ArcgisErrorCode.UNSUPPORTED, "Rerouting is not supported for this route source.")
      }
    }
    val simulated =
      SimulatedLocationDataSource(
        geometry, SimulationParameters(java.time.Instant.now(), 25.0, 0.0, 0.0))
    mapView.locationDisplay.dataSource = simulated
    mapView.locationDisplay.setAutoPanMode(LocationDisplayAutoPanMode.Navigation)
    simulated.start().getOrThrow()

    navigationJob =
      scope.launch {
        simulated.locationChanged.collect { location ->
          tracker.trackLocation(location)
          val status = tracker.trackingStatus.value ?: return@collect
          val maneuver = route.directionManeuvers.getOrNull(status.currentManeuverIndex)
          val remaining = status.routeProgress.remainingDistance
          onNavigationStatus(
            mapOf(
              "maneuver" to (maneuver?.directionText ?: ""),
              "distanceRemainingMeters" to remaining.displayTextUnits.toMeters(remaining.distance),
              "timeRemainingMinutes" to status.routeProgress.remainingTime / 60.0,
              "isOnRoute" to status.isOnRoute,
            ))
        }
      }
  }

  fun stopNavigation() {
    navigationJob?.cancel()
    navigationJob = null
    scope.launch { mapView.locationDisplay.dataSource.stop() }
  }

  private fun featureLayerId(layerContent: LayerContent): String? =
    featureLayers.entries.firstOrNull { it.value === layerContent }?.key

  /**
   * Resolves a stable source id for any identified layer — feature layers first,
   * then operational layers (WMS, etc.) tracked by id.
   */
  private fun sourceIdFor(layerContent: LayerContent): String =
    featureLayerId(layerContent)
      ?: layers.entries.firstOrNull { it.value === layerContent }?.key
      ?: "layer"

  /**
   * Flattens an identify result and its sublayer results (WMS/map-image feature
   * info arrives nested) into serialized geo-element rows tagged with [sourceId].
   */
  private fun collectIdentifyResults(
    layerResult: IdentifyLayerResult,
    sourceId: String,
  ): List<Map<String, Any?>> {
    val rows = mutableListOf<Map<String, Any?>>()
    for (element in layerResult.geoElements) {
      rows.add(identifyResult(sourceId, element))
    }
    for (sublayerResult in layerResult.sublayerResults) {
      rows.addAll(collectIdentifyResults(sublayerResult, sourceId))
    }
    return rows
  }

  private fun identifyResult(sourceId: String, element: GeoElement): Map<String, Any?> =
    geoElementResult(element) + ("sourceId" to sourceId)

  /** Serializable `{ attributes, location? }` for a geo-element (feature/graphic). */
  private fun geoElementResult(element: GeoElement): Map<String, Any?> {
    val result = mutableMapOf<String, Any?>("attributes" to serializeAttributes(element.attributes))
    val point = (element.geometry as? Point) ?: element.geometry?.extent?.center
    if (point != null) {
      val wgs = (GeometryEngine.projectOrNull(point, SpatialReference.wgs84()) as? Point) ?: point
      result["location"] = mapOf("latitude" to wgs.y, "longitude" to wgs.x)
    }
    return result
  }

  /** Queries features from a feature layer already on the map, by where clause. */
  suspend fun queryFeatures(options: FeatureQueryOptionsRecord): List<Map<String, Any?>> {
    val layer =
      featureLayers[options.layerId]
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT,
          "No feature layer with id \"${options.layerId}\".",
        )
    val table = layer.featureTable ?: return emptyList()
    val parameters =
      QueryParameters().apply {
        whereClause = options.whereClause ?: "1=1"
        options.maxResults?.let { maxFeatures = it }
      }
    val results = mutableListOf<Map<String, Any?>>()
    table.queryFeatures(parameters).onSuccess { queryResult ->
      val features = queryResult.toList()
      // Optionally highlight the matches on the layer, clearing prior selection.
      if (options.select) {
        layer.clearSelection()
        layer.selectFeatures(features)
      }
      for (feature in features) {
        results.add(geoElementResult(feature))
      }
    }
    return results
  }

  /** Highlights (selects) the features matching a where clause; returns the count. */
  suspend fun selectFeatures(options: LayerWhereRecord): Int {
    val layer = requireFeatureLayer(options.layerId)
    val parameters = QueryParameters().apply { whereClause = options.whereClause ?: "1=1" }
    val result = layer.selectFeatures(parameters, SelectionMode.New).getOrThrow()
    return result.toList().size
  }

  /** Clears the selection highlight on a feature layer. */
  fun clearSelection(layerId: String) {
    featureLayers[layerId]?.clearSelection()
  }

  /**
   * Loads the KML dataset, then sets every ground overlay's colour to white at
   * the requested alpha so the overlay images render at that opacity.
   */
  private fun applyGroundOverlayOpacity(opacity: Double, layer: KmlLayer) {
    val alpha = (opacity.coerceIn(0.0, 1.0) * 255).toInt()
    val color = parseHexColor("#FFFFFF%02X".format(alpha)) ?: return
    scope.launch {
      layer.dataset.load()
      kmlGroundOverlays(layer.dataset.rootNodes).forEach { it.color = color }
    }
  }

  /** Recursively collects every [KmlGroundOverlay] under the given nodes. */
  private fun kmlGroundOverlays(nodes: List<KmlNode>): List<KmlGroundOverlay> {
    val result = mutableListOf<KmlGroundOverlay>()
    for (node in nodes) {
      if (node is KmlGroundOverlay) result.add(node)
      if (node is KmlContainer) result.addAll(kmlGroundOverlays(node.childNodes))
    }
    return result
  }

  /** Recursively finds the first [KmlTour] under the given nodes. */
  private fun firstKmlTour(nodes: List<KmlNode>): KmlTour? {
    for (node in nodes) {
      if (node is KmlTour) return node
      if (node is KmlContainer) firstKmlTour(node.childNodes)?.let { return it }
    }
    return null
  }

  /**
   * Plays / pauses / resets the KML tour in a KML layer, creating the tour
   * controller lazily on first use.
   */
  suspend fun controlKmlTour(options: KmlTourOptionsRecord) {
    val kmlLayer =
      layers[options.layerId] as? KmlLayer
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT, "No KML layer with id \"${options.layerId}\".")
    val controller =
      kmlTourControllers[options.layerId]
        ?: run {
          kmlLayer.dataset.load()
          val tour =
            firstKmlTour(kmlLayer.dataset.rootNodes)
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.UNSUPPORTED, "The KML layer has no tour.")
          KmlTourController().apply { this.tour = tour }.also {
            kmlTourControllers[options.layerId] = it
          }
        }
    when (options.action) {
      "play" -> controller.play()
      "pause" -> controller.pause()
      "reset" -> controller.reset()
      else ->
        throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT, "Unknown KML tour action \"${options.action}\".")
    }
  }

  /** Returns `{ count, extent? }` for the features matching a where clause. */
  suspend fun queryFeatureExtent(options: LayerWhereRecord): Map<String, Any?> {
    val layer = requireFeatureLayer(options.layerId)
    val table = layer.featureTable ?: return mapOf("count" to 0)
    val parameters = QueryParameters().apply { whereClause = options.whereClause ?: "1=1" }
    val count = table.queryFeatureCount(parameters).getOrThrow()
    val result = mutableMapOf<String, Any?>("count" to count)
    if (count > 0) {
      val extent = table.queryExtent(parameters).getOrThrow()
      val wgs = (GeometryEngine.projectOrNull(extent, SpatialReference.wgs84()) as? Envelope) ?: extent
      result["extent"] =
        mapOf(
          "minLatitude" to wgs.yMin,
          "minLongitude" to wgs.xMin,
          "maxLatitude" to wgs.yMax,
          "maxLongitude" to wgs.xMax,
        )
    }
    return result
  }

  /** Computes aggregate statistics over a feature layer's field(s), optionally grouped. */
  suspend fun queryStatistics(options: StatisticsQueryOptionsRecord): List<Map<String, Any?>> {
    val layer = requireFeatureLayer(options.layerId)
    val table = layer.featureTable ?: return emptyList()
    table.load().getOrThrow()
    val defs =
      options.statistics.map {
        StatisticDefinition(it.field, statisticTypeFromString(it.type), it.outName ?: "")
      }
    val parameters =
      StatisticsQueryParameters(defs).apply {
        options.whereClause?.let { whereClause = it }
        groupByFieldNames.addAll(options.groupByFields)
      }
    val result = table.queryStatistics(parameters).getOrThrow()
    return result.map { record ->
      mapOf(
        "group" to record.group.mapValues { statValue(it.value) },
        "statistics" to record.statistics.mapValues { statValue(it.value) },
      )
    }
  }

  private fun statValue(value: Any?): Any? =
    when (value) {
      is Number -> value.toDouble()
      null -> null
      else -> value.toString()
    }

  private fun featureRequestModeFromString(value: String): FeatureRequestMode =
    when (value) {
      "onInteractionNoCache" -> FeatureRequestMode.OnInteractionNoCache
      "manualCache" -> FeatureRequestMode.ManualCache
      else -> FeatureRequestMode.OnInteractionCache
    }

  private fun statisticTypeFromString(value: String): StatisticType =
    when (value) {
      "sum" -> StatisticType.Sum
      "average" -> StatisticType.Average
      "min" -> StatisticType.Minimum
      "max" -> StatisticType.Maximum
      "standardDeviation" -> StatisticType.StandardDeviation
      "variance" -> StatisticType.Variance
      else -> StatisticType.Count
    }

  /** Queries features related to the origin feature (by object id). */
  suspend fun queryRelatedFeatures(options: RelatedFeaturesOptionsRecord): List<Map<String, Any?>> {
    val layer = requireFeatureLayer(options.layerId)
    val table =
      layer.featureTable as? ServiceFeatureTable
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.UNSUPPORTED,
          "Feature layer \"${options.layerId}\" does not support related queries.",
        )
    val parameters =
      QueryParameters().apply { whereClause = "${table.objectIdField} = ${options.objectId}" }
    val origin =
      table.queryFeatures(parameters).getOrThrow().toList().firstOrNull() as? ArcGISFeature
        ?: return emptyList()
    // 1-arg overload queries every relationship (RelatedQueryParameters defaults).
    val relatedResults = table.queryRelatedFeatures(origin).getOrThrow()
    val out = mutableListOf<Map<String, Any?>>()
    for (relatedResult in relatedResults) {
      for (feature in relatedResult) {
        out.add(geoElementResult(feature))
      }
    }
    return out
  }

  private fun requireFeatureLayer(layerId: String): FeatureLayer =
    featureLayers[layerId]
      ?: throw ArcgisCodedException(
        ArcgisErrorCode.INVALID_ARGUMENT, "No feature layer with id \"$layerId\".")

  /**
   * Adds/updates/deletes features on a layer's service table, then pushes the
   * edits to the service. Updates and deletes are resolved by querying the table
   * for the target object ids first.
   */
  suspend fun applyEdits(options: ApplyEditsOptionsRecord): Map<String, Any?> {
    val layer =
      featureLayers[options.layerId]
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT,
          "No feature layer with id \"${options.layerId}\".",
        )
    val table =
      layer.featureTable as? ServiceFeatureTable
        ?: throw ArcgisCodedException(
          ArcgisErrorCode.UNSUPPORTED,
          "Feature layer \"${options.layerId}\" is not backed by an editable service table.",
        )

    // Adds: build local features, remember them so we can read their
    // server-assigned object ids back after applyEdits.
    val addedFeatures = mutableListOf<Feature>()
    for (add in options.adds) {
      val feature = table.createFeature()
      applyAttributes(add.attributes, feature)
      add.point?.let { feature.geometry = projectToTable(it, table) }
      table.addFeature(feature).getOrThrow()
      addedFeatures.add(feature)
    }

    // Updates and deletes operate on existing features fetched by object id.
    val updateIds = options.updates.mapNotNull { it.objectId }
    val targetIds = (updateIds + options.deleteObjectIds).toSet()
    val byObjectId = mutableMapOf<Int, Feature>()
    if (targetIds.isNotEmpty()) {
      val parameters =
        QueryParameters().apply { objectIds.addAll(targetIds.map { it.toLong() }) }
      table.queryFeatures(parameters).onSuccess { queryResult ->
        for (feature in queryResult) {
          (feature.attributes[table.objectIdField] as? Number)?.let {
            byObjectId[it.toInt()] = feature
          }
        }
      }
    }

    var updatedCount = 0
    for (update in options.updates) {
      val feature = update.objectId?.let { byObjectId[it] } ?: continue
      applyAttributes(update.attributes, feature)
      update.point?.let { feature.geometry = projectToTable(it, table) }
      table.updateFeature(feature).getOrThrow()
      updatedCount += 1
    }

    var deletedCount = 0
    for (oid in options.deleteObjectIds) {
      val feature = byObjectId[oid] ?: continue
      table.deleteFeature(feature).getOrThrow()
      deletedCount += 1
    }

    // Push the edits and surface any per-edit failure the service reports —
    // otherwise a rejected edit (e.g. an unauthorized token) would look like a
    // silent success with a temporary local object id.
    val results = table.applyEdits().getOrThrow()
    results.firstOrNull { it.completedWithErrors }?.let { throw serviceException(it.error, "feature editing") }

    val addedObjectIds =
      addedFeatures.mapNotNull { (it.attributes[table.objectIdField] as? Number)?.toInt() }
    // A synced add receives a positive server object id; a negative id means the
    // service did not accept the edit (e.g. it rejects this API key), which the
    // SDK does not always surface as a per-edit error.
    if (addedObjectIds.any { it < 0 }) {
      throw ArcgisCodedException(
        ArcgisErrorCode.AUTHENTICATION_FAILED,
        "The service did not accept the edit. Ensure the API key or signed-in user " +
          "is authorized to edit this feature service.",
      )
    }
    return mapOf(
      "addedObjectIds" to addedObjectIds,
      "updatedCount" to updatedCount,
      "deletedCount" to deletedCount,
    )
  }

  /**
   * Exports the current map view as a PNG in the app cache; returns a
   * serializable `{ uri, width, height }` (pixels). The caller owns the file.
   */
  suspend fun exportImage(): Map<String, Any?> {
    // MapView.exportImage() yields a Result<BitmapDrawable> in the ArcGIS Maps
    // SDK for Kotlin 300.0; the pixel data is on its backing bitmap.
    val drawable = mapView.exportImage().getOrElse { throw serviceException(it, "map image export") }
    val bitmap: Bitmap = drawable.bitmap
    val file = File(context.cacheDir, "map-${UUID.randomUUID()}.png")
    FileOutputStream(file).use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }
    return mapOf(
      "uri" to Uri.fromFile(file).toString(),
      "width" to bitmap.width,
      "height" to bitmap.height,
    )
  }

  /** Applies caller attribute values to a feature; `null` is an explicit clear. */
  private fun applyAttributes(attributes: Map<String, Any?>?, feature: Feature) {
    attributes ?: return
    for ((key, value) in attributes) {
      feature.attributes[key] = value
    }
  }

  /** Projects a WGS 84 input point into the table's spatial reference. */
  private fun projectToTable(point: PointRecord, table: ServiceFeatureTable): Point {
    val wgs = Point(point.longitude, point.latitude, SpatialReference.wgs84())
    val sr = table.spatialReference ?: return wgs
    return (GeometryEngine.projectOrNull(wgs, sr) as? Point) ?: wgs
  }

  private fun serializeAttributes(attributes: Map<String, Any?>): Map<String, Any?> {
    val out = mutableMapOf<String, Any?>()
    for ((key, value) in attributes) {
      out[key] =
        when (value) {
          null -> null
          is String,
          is Int,
          is Long,
          is Double,
          is Float,
          is Boolean -> value
          else -> value.toString()
        }
    }
    return out
  }

  private fun emitViewpoint(viewpoint: Viewpoint) {
    val target = viewpoint.targetGeometry as? Point ?: return
    val center = (GeometryEngine.projectOrNull(target, SpatialReference.wgs84()) as? Point) ?: target
    onViewpointChange(
      mapOf(
        "center" to mapOf("latitude" to center.y, "longitude" to center.x),
        "scale" to viewpoint.targetScale,
        "rotation" to viewpoint.rotation,
      )
    )
  }

  fun setMapSource(source: MapSourceRecord) {
    if (disposed) return

    val webMapItemId = source.webMapItemId
    val mmpkPath = source.mobileMapPackagePath
    val basemap = source.basemap
    // Style parameters and spatial reference are baked into the map at creation,
    // so a change to either requires a fresh map.
    val basemapParamsKey = source.basemapStyleParameters?.worldview
    val basemapLayerKey =
      source.basemapLayer?.let { "${it.type}:${it.url ?: it.itemId ?: ""}" }
    val needsNewMap =
      webMapItemId != currentWebMapItemId ||
        mmpkPath != currentMobileMapPackagePath ||
        basemap != currentBasemapKey ||
        basemapParamsKey != currentBasemapParamsKey ||
        basemapLayerKey != currentBasemapLayerKey ||
        source.spatialReferenceWkid != currentSpatialReferenceWkid ||
        mapView.map == null

    if (needsNewMap) {
      currentWebMapItemId = webMapItemId
      currentMobileMapPackagePath = mmpkPath
      currentBasemapKey = basemap
      currentBasemapParamsKey = basemapParamsKey
      currentBasemapLayerKey = basemapLayerKey
      currentSpatialReferenceWkid = source.spatialReferenceWkid
      // The new map starts with no operational layers; drop the reconcile cache.
      featureLayers.clear()
      featureLayerUrls.clear()
      layers.clear()
      layerSignatures.clear()

      val map =
        if (mmpkPath != null) {
          // The package loads asynchronously; start with an empty map and swap in
          // the package's first map (which carries its own basemap + layers) once
          // loaded.
          scope.launch {
            val geoPackage = MobileMapPackage(mmpkPath)
            geoPackage
              .load()
              .onSuccess {
                if (!disposed && currentMobileMapPackagePath == mmpkPath) {
                  geoPackage.maps.firstOrNull()?.let { mapView.map = it }
                }
              }
              .onFailure {
                if (!disposed) {
                  onMapError(
                    arcgisErrorPayload(
                      ArcgisErrorCode.MAP_LOAD_FAILED, "The mobile map package failed to load.")
                  )
                }
              }
          }
          ArcGISMap()
        } else if (webMapItemId != null) {
          val portal = Portal("https://www.arcgis.com", Portal.Connection.Anonymous)
          ArcGISMap(PortalItem(portal, webMapItemId))
        } else if (source.basemapLayer != null) {
          val baseLayer = makeBasemapLayer(source.basemapLayer!!)
          if (baseLayer != null) ArcGISMap(Basemap(baseLayer)) else ArcGISMap()
        } else if (basemap != null) {
          val style =
            basemapStyleFromString(basemap)
              ?: run {
                onMapError(
                  arcgisErrorPayload(ArcgisErrorCode.INVALID_ARGUMENT, "Unsupported basemap style.")
                )
                return
              }
          val params = makeStyleParameters(source.basemapStyleParameters)
          if (params != null) ArcGISMap(Basemap(style, params)) else ArcGISMap(style)
        } else if (source.spatialReferenceWkid != null) {
          val sr = SpatialReference(source.spatialReferenceWkid!!)
          // No basemap: a blank map in a specific spatial reference so operational
          // layers reproject into it.
          ArcGISMap(sr)
        } else {
          // No basemap: an empty map whose content comes from feature layers.
          ArcGISMap()
        }
      source.initialViewpoint?.let { map.initialViewpoint = viewpointFromRecord(it) }
      mapView.map = map
      loadMap(map)
    }

    // A web map defines its own layers, scale limits and extent; only apply the
    // props-provided constraints and feature layers when not showing a web map.
    // Graphics ride the overlay regardless.
    if (webMapItemId == null) {
      mapView.map?.let {
        applyConstraints(source, it)
        reconcileLayers(source.layers, it)
        reconcileFeatureLayers(source.featureLayers, it)
      }
    }
    reconcileGraphics(source.graphics)
    // A renderer on the overlay symbolizes every graphic (overrides symbols).
    graphicsOverlay.renderer = makeRenderer(source.graphicsRenderer)

    floorLevel = source.floorLevel
    geotriggerRecords = source.geotriggers
    // If the map is already loaded (a prop update, not a fresh map), apply the
    // floor level and (re)start geotriggers now; otherwise `loadMap` applies them.
    mapView.map?.takeIf { it.loadStatus.value is LoadStatus.Loaded }?.let {
      applyFloorLevel(it)
      setupGeotriggers()
    }
  }

  /**
   * Applies declarative scale limits and max extent to the map. Absent props
   * reset to the SDK's "unset" sentinels (`0.0` / `null`) so props stay the
   * source of truth. [ArcGISMap.minScale]/[maxScale]/[referenceScale] treat
   * `0.0` as no limit.
   */
  private fun applyConstraints(source: MapSourceRecord, map: ArcGISMap) {
    map.minScale = source.minScale ?: 0.0
    map.maxScale = source.maxScale ?: 0.0
    map.referenceScale = source.referenceScale ?: 0.0
    map.maxExtent = source.maxExtent?.let { makeEnvelope(it) }
    source.backgroundColor?.let { hex ->
      parseHexColor(hex)?.let { color ->
        // A solid background: same grid + line color (so lines are invisible).
        // `gridSize` must be > 1; the lines never show, so its value is cosmetic.
        mapView.backgroundGrid = BackgroundGrid(color, color, 0.0f, 20.0f)
      }
    }
  }

  /** Builds a WGS 84 [Envelope] from a serializable bounding box. */
  private fun makeEnvelope(record: EnvelopeRecord): Envelope =
    Envelope(
      Point(record.minLongitude, record.minLatitude, SpatialReference.wgs84()),
      Point(record.maxLongitude, record.maxLatitude, SpatialReference.wgs84()),
    )

  /**
   * Adds, updates, and removes graphics so the overlay matches [records],
   * preserving graphics whose content signature is unchanged.
   */
  private fun reconcileGraphics(records: List<GraphicRecord>) {
    val incomingIds = records.map { it.id }.toSet()

    for (id in graphics.keys.filter { it !in incomingIds }) {
      graphics.remove(id)?.let { graphicsOverlay.graphics.remove(it) }
      graphicSignatures.remove(id)
    }

    for (record in records) {
      val signature = graphicSignature(record)
      if (graphicSignatures[record.id] == signature) continue

      graphics.remove(record.id)?.let { graphicsOverlay.graphics.remove(it) }

      val geometry = makeGeometry(record.geometry)
      val symbol = makeSymbol(record.symbol)
      if (geometry == null || symbol == null) {
        onMapError(
          arcgisErrorPayload(
            ArcgisErrorCode.INVALID_ARGUMENT,
            "Invalid graphic geometry or symbol.",
            mapOf("graphicId" to record.id),
          )
        )
        graphicSignatures.remove(record.id)
        continue
      }
      val graphic = Graphic(geometry, symbol)
      graphicsOverlay.graphics.add(graphic)
      graphics[record.id] = graphic
      graphicSignatures[record.id] = signature
      if (record.symbol.type == "webStyle") {
        applyWebStyleSymbol(record.symbol, graphic)
      }
    }
  }

  /**
   * Fetches a symbol from a web style (by name or portal item) and applies it to
   * the graphic once loaded. Runs off the reconciliation path since it is async.
   */
  private fun applyWebStyleSymbol(record: SymbolRecord, graphic: Graphic) {
    val key = record.symbolKey ?: return
    val symbolStyle =
      when {
        record.stylxPath?.isNotEmpty() == true -> SymbolStyle.createWithFile(record.stylxPath!!)
        record.portalItemId != null -> {
          val portal = Portal("https://www.arcgis.com", Portal.Connection.Anonymous)
          SymbolStyle.createWithPortalItem(PortalItem(portal, record.portalItemId!!))
        }
        record.styleName != null -> SymbolStyle.createWithStyleNameAndPortal(record.styleName!!)
        else -> return
      }
    val keys = record.symbolKeys.ifEmpty { listOf(key) }
    scope.launch {
      symbolStyle.getSymbol(keys).onSuccess { symbol ->
        if (!disposed) graphic.symbol = symbol
      }
    }
  }

  private fun loadMap(map: ArcGISMap) {
    scope.launch {
      map
        .load()
        .onSuccess {
          if (disposed) return@onSuccess
          applyFloorLevel(map)
          setupGeotriggers()
          onMapLoad(mapOf("spatialReferenceWkid" to (map.spatialReference?.wkid ?: 0)))
        }
        .onFailure { throwable ->
          if (disposed) return@onFailure
          onMapError(mapLoadError(throwable))
        }
    }
  }

  /**
   * Adds, updates, and removes feature layers so the map matches [records],
   * preserving unchanged native layer instances (CLAUDE.md "Source of truth").
   */
  private fun reconcileFeatureLayers(records: List<FeatureLayerRecord>, map: ArcGISMap) {
    val incomingIds = records.map { it.id }.toSet()

    for (id in featureLayers.keys.filter { it !in incomingIds }) {
      featureLayers.remove(id)?.let { map.operationalLayers.remove(it) }
      featureLayerUrls.remove(id)
    }

    for (record in records) {
      val existing = featureLayers[record.id]
      if (existing != null && featureLayerUrls[record.id] == record.url) {
        applyLayerProps(record, existing)
        continue
      }
      if (existing != null) {
        map.operationalLayers.remove(existing)
      }
      val table =
        ServiceFeatureTable(record.url).apply {
          record.featureRequestMode?.let { featureRequestMode = featureRequestModeFromString(it) }
        }
      val layer = FeatureLayer.createWithFeatureTable(table)
      applyLayerProps(record, layer)
      map.operationalLayers.add(layer)
      featureLayers[record.id] = layer
      featureLayerUrls[record.id] = record.url
      loadFeatureLayer(layer, record.id)
    }
  }

  /**
   * Adds, updates, and removes non-feature operational layers so the map matches
   * [records]. A layer is rebuilt only when its definition signature changes;
   * visibility/opacity update in place.
   */
  private fun reconcileLayers(records: List<LayerRecord>, map: ArcGISMap) {
    val incomingIds = records.map { it.id }.toSet()
    for (id in layers.keys.filter { it !in incomingIds }) {
      layers.remove(id)?.let { map.operationalLayers.remove(it) }
      layerSignatures.remove(id)
      kmlTourControllers.remove(id)
    }
    for (record in records) {
      val signature = layerSignature(record)
      val existing = layers[record.id]
      if (existing != null && layerSignatures[record.id] == signature) {
        existing.isVisible = record.visible ?: true
        existing.opacity = (record.opacity ?: 1.0).toFloat()
        continue
      }
      existing?.let {
        map.operationalLayers.remove(it)
        // A rebuilt layer invalidates any tour controller bound to the old one.
        kmlTourControllers.remove(record.id)
      }
      val layer = makeLayer(record)
      if (layer == null) {
        onMapError(
          arcgisErrorPayload(
            ArcgisErrorCode.LAYER_LOAD_FAILED, "Invalid layer.", mapOf("layerId" to record.id)))
        layers.remove(record.id)
        layerSignatures.remove(record.id)
        continue
      }
      layer.isVisible = record.visible ?: true
      layer.opacity = (record.opacity ?: 1.0).toFloat()
      map.operationalLayers.add(layer)
      layers[record.id] = layer
      layerSignatures[record.id] = signature
    }
  }

  private fun layerSignature(record: LayerRecord): String =
    listOf(
        record.type,
        record.url ?: "",
        record.urlTemplate ?: "",
        record.subDomains.joinToString(","),
        record.layerNames.joinToString(","),
        record.tableName ?: "",
        record.layerId ?: "",
        record.sublayerVisibility.joinToString(";") { "${it.sublayerId}:${it.visible}" },
        record.sublayerRenderers.joinToString(";") { "${it.sublayerId}:${it.renderer?.type ?: ""}" },
        "${record.renderer?.type ?: ""}:${record.renderer?.symbol?.type ?: ""}",
        record.collectionId ?: "",
        record.cqlFilter ?: "",
        record.portalItemId ?: "",
        record.sublayers.joinToString(">") { layerSignature(it) },
        record.styleName ?: "",
        record.xmlQuery ?: "",
        // Raster renderer markers so a renderer change rebuilds the layer.
        record.hillshade?.let { "${it.altitudeDegrees}:${it.azimuthDegrees}:${it.zFactor}" } ?: "",
        record.stretch?.let { "${it.type}:${it.min}:${it.max}:${it.minPercent}:${it.maxPercent}:${it.factor}" } ?: "",
        record.rgb?.let { "rgb:${it.bandIndices.joinToString(",")}" } ?: "",
        record.colormap?.let { "cmap:${it.colors.joinToString(",")}" } ?: "",
        record.blend?.let {
          "blend:${it.elevationPath ?: ""}${it.elevationUrl ?: ""}:${it.altitudeDegrees}:${it.azimuthDegrees}:${it.zFactor}:${it.colorRamp ?: ""}"
        } ?: "",
        record.rasterFunction ?: "",
        record.renderingRule ?: "",
        record.groundOverlayOpacity?.let { "kmlgo:$it" } ?: "",
        record.mosaicRule?.let {
          "mosaic:${it.method}:${it.operation}:${it.ascending}:${it.sortField}:${it.sortValue}"
        } ?: "",
        record.sublayerVisibility.joinToString(",") { "${it.name}:${it.visible}" },
      )
      .joinToString("|")

  /** Builds an operational [Layer] from a record, or null if malformed. */
  /** Builds a tiled / vector-tiled base layer for a layer-backed basemap. */
  private fun makeBasemapLayer(record: BasemapLayerRecord): Layer? {
    val item =
      record.itemId?.let {
        PortalItem(Portal("https://www.arcgis.com", Portal.Connection.Anonymous), it)
      }
    return when (record.type) {
      "vectorTiled" ->
        item?.let { ArcGISVectorTiledLayer(it) } ?: record.url?.let { ArcGISVectorTiledLayer(it) }
      else -> item?.let { ArcGISTiledLayer(it) } ?: record.url?.let { ArcGISTiledLayer(it) }
    }
  }

  private fun makeLayer(record: LayerRecord): Layer? =
    when (record.type) {
      "tiled" -> record.url?.let { ArcGISTiledLayer(it) }
      "vectorTiled" -> record.url?.let { ArcGISVectorTiledLayer(it) }
      "openStreetMap" -> OpenStreetMapLayer()
      "webTiled" -> record.urlTemplate?.let { WebTiledLayer.create(it, record.subDomains) }
      "wms" ->
        record.url?.let { url ->
          WmsLayer(url, record.layerNames).also { wms ->
            record.styleName?.let { style ->
              scope.launch {
                wms.load()
                wms.sublayers.value.filterIsInstance<WmsSublayer>().forEach {
                  it.currentStyle = style
                }
              }
            }
          }
        }
      "wmts" ->
        if (record.url != null && record.layerId != null) WmtsLayer(record.url!!, record.layerId!!)
        else null
      "mapImage" ->
        record.url?.let { url ->
          ArcGISMapImageLayer(url).also {
            applySublayerVisibility(record, it)
            applySublayerRenderers(record, it)
          }
        }
      "wfs" ->
        if (record.url != null && record.tableName != null) {
          val table =
            WfsFeatureTable(record.url!!, record.tableName!!).apply {
              featureRequestMode = FeatureRequestMode.ManualCache
            }
          val xml = record.xmlQuery
          scope.launch {
            if (xml != null) table.populateFromService(xml, true)
            else table.populateFromService(QueryParameters(), true, listOf("*"))
          }
          FeatureLayer.createWithFeatureTable(table)
        } else null
      "ogcFeature" ->
        if (record.url != null && record.collectionId != null) {
          val table =
            OgcFeatureCollectionTable(record.url!!, record.collectionId!!).apply {
              featureRequestMode = FeatureRequestMode.ManualCache
            }
          val cql = record.cqlFilter
          scope.launch {
            val params = QueryParameters().apply { cql?.let { whereClause = it } }
            // `queryLanguage` is the OGC token; "cql2-text" interprets the CQL2 filter.
            table.populateFromService(params, true, listOf("*"), if (cql != null) "cql2-text" else "")
          }
          FeatureLayer.createWithFeatureTable(table)
        } else null
      "featureCollection" ->
        record.portalItemId?.let { itemId ->
          val portal = Portal("https://www.arcgis.com", Portal.Connection.Anonymous)
          FeatureCollectionLayer(FeatureCollection(PortalItem(portal, itemId)))
        }
      "featureCollectionFromTable" -> {
        val fields =
          record.fields.map { Field(fieldTypeFromString(it.type), it.name, it.name, 0, null) }
        val table =
          FeatureCollectionTable(fields, GeometryType.Point, SpatialReference.wgs84(), false, false)
        table.renderer =
          SimpleRenderer(SimpleMarkerSymbol(SimpleMarkerSymbolStyle.Circle, Color.red, 10f))
        val featureRecords = record.features
        scope.launch {
          for (fr in featureRecords) {
            val point = Point(fr.point.longitude, fr.point.latitude, SpatialReference.wgs84())
            val attributes = fr.attributes.filterValues { it != null }.mapValues { it.value!! }
            table.addFeature(table.createFeature(attributes, point))
          }
        }
        FeatureCollectionLayer(FeatureCollection(listOf(table)))
      }
      "kml" ->
        record.url?.let { url ->
          KmlLayer(KmlDataset(url)).also { kmlLayer ->
            record.groundOverlayOpacity?.let { applyGroundOverlayOpacity(it, kmlLayer) }
          }
        }
      "raster" -> {
        val baseRaster =
          when {
            record.url != null ->
              ImageServiceRaster(record.url!!).apply {
                record.renderingRule?.takeIf { it.isNotEmpty() }?.let {
                  renderingRule = RenderingRule(it)
                }
                record.mosaicRule?.let { mosaicRule = makeMosaicRule(it) }
              }
            record.path != null -> Raster.createWithPath(record.path!!)
            else -> null
          }
        // Optionally wrap the base raster in a raster-function chain.
        val raster = baseRaster?.let { applyRasterFunction(record.rasterFunction, it) }
        raster?.let {
          val rasterLayer = RasterLayer(it)
          // Precedence: blend, rgb, colormap, stretch, hillshade.
          val rgb = record.rgb
          val colormap = record.colormap
          val blend = record.blend
          when {
            blend != null -> {
              val elevationRaster: Raster? =
                blend.elevationUrl?.takeIf { it.isNotEmpty() }?.let { ImageServiceRaster(it) }
                  ?: blend.elevationPath?.takeIf { it.isNotEmpty() }?.let { Raster.createWithPath(it) }
              val colorRamp: ColorRamp? =
                when (blend.colorRamp) {
                  "elevation" -> ColorRamp.create(PresetColorRampType.Elevation, 256)
                  "demScreen" -> ColorRamp.create(PresetColorRampType.DemScreen, 256)
                  "demLight" -> ColorRamp.create(PresetColorRampType.DemLight, 256)
                  else -> null
                }
              rasterLayer.renderer =
                BlendRenderer(
                  elevationRaster,
                  listOf(9.0),
                  listOf(255.0),
                  emptyList(),
                  emptyList(),
                  emptyList(),
                  emptyList(),
                  colorRamp,
                  blend.altitudeDegrees ?: 45.0,
                  blend.azimuthDegrees ?: 315.0,
                  SlopeType.None,
                  blend.zFactor ?: 1.0,
                  1.0,
                  1.0,
                  8,
                )
            }
            rgb != null -> {
              val params = rgb.stretch?.let { s -> stretchParameters(s) }
                ?: PercentClipStretchParameters(0.5, 0.5)
              val bands = rgb.bandIndices.ifEmpty { listOf(0, 1, 2) }
              rasterLayer.renderer = RgbRenderer(params, bands, emptyList(), true)
            }
            colormap != null && colormap.colors.isNotEmpty() -> {
              val colors = colormap.colors.mapNotNull { parseHexColor(it) }
              rasterLayer.renderer = ColormapRenderer(colors)
            }
            record.stretch != null -> {
              val stretchParams = stretchParameters(record.stretch!!)
              if (stretchParams != null) {
                rasterLayer.renderer = StretchRenderer(stretchParams, emptyList(), true, null)
              }
            }
            record.hillshade != null -> {
              val h = record.hillshade!!
              rasterLayer.renderer =
                HillshadeRenderer.create(
                  h.altitudeDegrees ?: 45.0,
                  h.azimuthDegrees ?: 315.0,
                  h.zFactor ?: 1.0,
                  SlopeType.None,
                )
            }
          }
          rasterLayer
        }
      }
      "shapefile" ->
        record.path?.let {
          FeatureLayer.createWithFeatureTable(ShapefileFeatureTable(it)).apply {
            makeRenderer(record.renderer)?.let { renderer = it }
          }
        }
      "geoPackage" ->
        record.path?.let { path ->
          // GeoPackage tables load asynchronously; use a group as a placeholder
          // and add the feature layer once the package has loaded.
          val group = GroupLayer()
          val index = record.tableIndex ?: 0
          scope.launch {
            val geoPackage = GeoPackage(path)
            geoPackage.load()
            val tables = geoPackage.geoPackageFeatureTables
            if (index in tables.indices) {
              group.layers.add(FeatureLayer.createWithFeatureTable(tables[index]))
            }
          }
          group
        }
      "annotation" ->
        record.url?.let { url ->
          AnnotationLayer(url).also { annotationLayer ->
            if (record.sublayerVisibility.isNotEmpty()) {
              scope.launch {
                annotationLayer.load()
                val contents = annotationLayer.subLayerContents.value
                record.sublayerVisibility.forEach { entry ->
                  entry.name?.let { name ->
                    (contents.firstOrNull { it.name == name } as? AnnotationSublayer)?.isVisible =
                      entry.visible
                  }
                }
              }
            }
          }
        }
      "dimension" -> record.url?.let { DimensionLayer(it) }
      "enc" ->
        record.path?.let { path ->
          // ENC needs process-wide hydrography resources; set them before loading.
          record.resourcePath?.let { EncEnvironmentSettings.resourcePath = it }
          record.sencPath?.let { EncEnvironmentSettings.sencDataPath = it }
          // An exchange set may hold several cells; load asynchronously and add
          // each cell's ENC layer to a group used as the reconciled layer.
          val group = GroupLayer()
          val exchangeSet = EncExchangeSet(listOf(path))
          scope.launch {
            exchangeSet.load().onSuccess {
              exchangeSet.datasets.forEach { dataset ->
                group.layers.add(EncLayer(EncCell(dataset)))
              }
            }
          }
          group
        }
      "dynamicEntity" ->
        record.customFeed?.let { feed -> makeCustomDynamicEntityLayer(feed, scope) }
          ?: record.url?.let { url ->
            val service = ArcGISStreamService(url)
            DynamicEntityLayer(service).also { scope.launch { service.connect() } }
          }
      "subtypeFeature" -> record.url?.let { SubtypeFeatureLayer(ServiceFeatureTable(it)) }
      "featureCollectionFromQuery" ->
        record.url?.let { url ->
          val collection = FeatureCollection()
          val whereClause = record.where ?: "1=1"
          scope.launch {
            val serviceTable = ServiceFeatureTable(url)
            serviceTable.load()
            val params = QueryParameters().apply { this.whereClause = whereClause }
            serviceTable.queryFeatures(params).onSuccess { result ->
              collection.tables.add(FeatureCollectionTable(result))
            }
          }
          FeatureCollectionLayer(collection)
        }
      "group" ->
        // Sublayers are leaf layers (nested groups rejected in JS validation).
        GroupLayer(record.sublayers.mapNotNull { makeLayer(it) })
      else -> null
    }

  /** Applies sublayer visibility once a map image layer has loaded. */
  private fun applySublayerVisibility(record: LayerRecord, layer: ArcGISMapImageLayer) {
    if (record.sublayerVisibility.isEmpty()) return
    scope.launch {
      layer.load()
      for (sv in record.sublayerVisibility) {
        layer.mapImageSublayers.firstOrNull { it.id.toInt() == sv.sublayerId }?.isVisible =
          sv.visible
      }
    }
  }

  /** Applies per-sublayer renderers once a map image layer has loaded. */
  /**
   * Wraps a base raster in a raster-function chain (from its JSON), binding the
   * chain's raster variable to the base raster. Returns the base raster
   * unchanged when no function is set or the JSON is invalid.
   */
  private fun applyRasterFunction(json: String?, base: Raster): Raster {
    val function = json?.let { RasterFunction.fromJsonOrNull(it) } ?: return base
    val arguments = function.arguments ?: return base
    val rasterName = arguments.rasterNames.firstOrNull() ?: return base
    arguments.setRaster(rasterName, base)
    return Raster.createWithRasterFunction(function)
  }

  /** Builds a [MosaicRule] from a JS record. `objectID` maps to `None` on Android. */
  private fun makeMosaicRule(record: MosaicRuleRecord): MosaicRule =
    MosaicRule().apply {
      mosaicMethod =
        when (record.method) {
          "objectID" -> MosaicMethod.None
          "center" -> MosaicMethod.Center
          "northwest" -> MosaicMethod.Northwest
          "nadir" -> MosaicMethod.Nadir
          "viewpoint" -> MosaicMethod.Viewpoint
          "attribute" -> MosaicMethod.Attribute
          "seamline" -> MosaicMethod.Seamline
          else -> mosaicMethod
        }
      mosaicOperation =
        when (record.operation) {
          "first" -> MosaicOperation.First
          "last" -> MosaicOperation.Last
          "min" -> MosaicOperation.Min
          "max" -> MosaicOperation.Max
          "mean" -> MosaicOperation.Mean
          "blend" -> MosaicOperation.Blend
          "sum" -> MosaicOperation.Sum
          else -> mosaicOperation
        }
      record.ascending?.let { isAscending = it }
      record.sortField?.let { sortField = it }
      record.sortValue?.let { sortValue = it }
    }

  private fun applySublayerRenderers(record: LayerRecord, layer: ArcGISMapImageLayer) {
    if (record.sublayerRenderers.isEmpty()) return
    scope.launch {
      layer.load()
      for (sr in record.sublayerRenderers) {
        val renderer = makeRenderer(sr.renderer) ?: continue
        layer.mapImageSublayers.firstOrNull { it.id.toInt() == sr.sublayerId }?.renderer = renderer
      }
    }
  }

  private fun applyLayerProps(record: FeatureLayerRecord, layer: FeatureLayer) {
    layer.isVisible = record.visible ?: true
    layer.opacity = (record.opacity ?: 1.0).toFloat()
    makeRenderer(record.renderer)?.let { layer.renderer = it }
    record.definitionExpression?.let { layer.definitionExpression = it }
    record.labels?.let { labels ->
      layer.labelDefinitions.clear()
      layer.labelDefinitions.addAll(labels.map { makeLabelDefinition(it) })
      layer.labelsEnabled = labels.isNotEmpty()
    }
    record.clustering?.let { layer.featureReduction = makeClustering(it) }
    layer.timeOffset =
      record.timeOffset?.let { TimeValue(it.value, timeUnitFromString(it.unit)) }
    when (record.renderingMode) {
      "static" -> layer.renderingMode = FeatureRenderingMode.Static
      "dynamic" -> layer.renderingMode = FeatureRenderingMode.Dynamic
      "automatic" -> layer.renderingMode = FeatureRenderingMode.Automatic
    }
  }

  private fun stretchParameters(record: StretchRecord): StretchParameters? =
    when (record.type) {
      "minMax" ->
        MinMaxStretchParameters(listOf(record.min ?: 0.0), listOf(record.max ?: 255.0))
      "percentClip" ->
        PercentClipStretchParameters(record.minPercent ?: 0.0, record.maxPercent ?: 0.0)
      "standardDeviation" -> StandardDeviationStretchParameters(record.factor ?: 2.0)
      else -> null
    }

  private fun fieldTypeFromString(value: String): FieldType =
    when (value) {
      "integer" -> FieldType.Int32
      "double" -> FieldType.Float64
      else -> FieldType.Text
    }

  private fun timeUnitFromString(value: String): TimeUnit =
    when (value) {
      "centuries" -> TimeUnit.Centuries
      "decades" -> TimeUnit.Decades
      "years" -> TimeUnit.Years
      "months" -> TimeUnit.Months
      "weeks" -> TimeUnit.Weeks
      "days" -> TimeUnit.Days
      "hours" -> TimeUnit.Hours
      "minutes" -> TimeUnit.Minutes
      "seconds" -> TimeUnit.Seconds
      "milliseconds" -> TimeUnit.Milliseconds
      else -> TimeUnit.Years
    }

  private fun loadFeatureLayer(layer: FeatureLayer, id: String) {
    scope.launch {
      layer.load().onFailure {
        if (disposed) return@onFailure
        onMapError(
          arcgisErrorPayload(
            ArcgisErrorCode.LAYER_LOAD_FAILED,
            "A feature layer failed to load.",
            mapOf("layerId" to id),
          )
        )
      }
    }
  }

  /** Full teardown; invoked from the module's OnViewDestroys hook. */
  fun dispose() {
    if (disposed) return
    disposed = true
    // Release the GPS before cancelling the view scope (stop() is suspend, so it
    // runs on a short-lived detached scope that outlives the cancellation).
    val locationSource = mapView.locationDisplay.dataSource
    CoroutineScope(Dispatchers.Main.immediate).launch { locationSource.stop() }
    scope.cancel()
    findViewTreeLifecycleOwner()?.lifecycle?.removeObserver(mapView)
    scaleBarOverlay.disposeComposition()
    mapView.map = null
    removeView(container)
  }
}
