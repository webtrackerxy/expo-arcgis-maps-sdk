package expo.modules.arcgismapssdk

import com.arcgismaps.ApiKey
import com.arcgismaps.ArcGISEnvironment
import com.arcgismaps.analysis.ContinuousField
import com.arcgismaps.analysis.HeightOrigin
import com.arcgismaps.analysis.visibility.LineOfSightFunction
import com.arcgismaps.analysis.visibility.LineOfSightParameters
import com.arcgismaps.analysis.visibility.LineOfSightPosition
import com.arcgismaps.analysis.visibility.ObserverTargetPairs
import com.google.ar.core.ArCoreApk
import com.arcgismaps.data.ArcGISFeature
import com.arcgismaps.data.Attachment
import com.arcgismaps.data.Feature
import com.arcgismaps.data.FeatureCollectionTable
import com.arcgismaps.data.FieldDescription
import com.arcgismaps.data.FieldType
import com.arcgismaps.data.Geodatabase
import com.arcgismaps.data.QueryParameters
import com.arcgismaps.data.ServiceFeatureTable
import com.arcgismaps.mapping.TimeExtent
import com.arcgismaps.arcgisservices.ServiceVersionParameters
import com.arcgismaps.arcgisservices.VersionAccess
import com.arcgismaps.data.ServiceGeodatabase
import com.arcgismaps.data.ShapefileFeatureTable
import com.arcgismaps.data.TableDescription
import com.arcgismaps.geometry.AngularUnit
import com.arcgismaps.geometry.CoordinateFormatter
import com.arcgismaps.geometry.Envelope
import com.arcgismaps.geometry.GeodesicEllipseParameters
import com.arcgismaps.geometry.GeodesicSectorParameters
import com.arcgismaps.geometry.GeodeticCurveType
import com.arcgismaps.geometry.GeometryEngine
import com.arcgismaps.geometry.GeometryType
import com.arcgismaps.geometry.LatitudeLongitudeFormat
import com.arcgismaps.geometry.LinearUnit
import com.arcgismaps.geometry.MgrsConversionMode
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.Polygon
import com.arcgismaps.geometry.Polyline
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.geometry.TransformationCatalog
import com.arcgismaps.geometry.UtmConversionMode
import com.arcgismaps.httpcore.authentication.CertificateCredential
import com.arcgismaps.httpcore.authentication.OAuthUserConfiguration
import com.arcgismaps.httpcore.authentication.OAuthUserCredential
import com.arcgismaps.httpcore.authentication.OAuthUserSignIn
import com.arcgismaps.httpcore.authentication.PasswordCredential
import com.arcgismaps.httpcore.authentication.TokenCredential
import com.arcgismaps.mapping.ArcGISMap
import com.arcgismaps.realtime.ArcGISStreamService
import com.arcgismaps.realtime.DynamicEntityQueryParameters
import com.arcgismaps.tasks.geoprocessing.GeoprocessingExecutionType
import com.arcgismaps.utilitynetworks.UtilityAssociationType
import com.arcgismaps.utilitynetworks.UtilityElement
import com.arcgismaps.utilitynetworks.UtilityElementTraceResult
import com.arcgismaps.utilitynetworks.UtilityNetwork
import com.arcgismaps.utilitynetworks.UtilityTraceParameters
import com.arcgismaps.utilitynetworks.UtilityTraceType
import com.arcgismaps.mapping.kml.KmlAltitudeMode
import com.arcgismaps.mapping.kml.KmlContainer
import com.arcgismaps.mapping.kml.KmlDataset
import com.arcgismaps.mapping.kml.KmlDocument
import com.arcgismaps.mapping.kml.KmlFolder
import com.arcgismaps.mapping.kml.KmlGeometry
import com.arcgismaps.mapping.kml.KmlGroundOverlay
import com.arcgismaps.mapping.kml.KmlMultiTrack
import com.arcgismaps.mapping.kml.KmlNetworkLink
import com.arcgismaps.mapping.kml.KmlNode
import com.arcgismaps.mapping.kml.KmlPhotoOverlay
import com.arcgismaps.mapping.kml.KmlPlacemark
import com.arcgismaps.mapping.kml.KmlScreenOverlay
import com.arcgismaps.mapping.kml.KmlTour
import com.arcgismaps.mapping.kml.KmlTrack
import com.arcgismaps.mapping.kml.KmlTrackElement
import com.arcgismaps.mapping.MobileMapPackage
import com.arcgismaps.mapping.BasemapStylesService
import com.arcgismaps.mapping.PortalItem
import com.arcgismaps.mapping.layers.ArcGISMapImageLayer
import com.arcgismaps.mapping.layers.OgcFeatureService
import com.arcgismaps.mapping.layers.WfsService
import com.arcgismaps.mapping.layers.WmsService
import com.arcgismaps.portal.Portal
import com.arcgismaps.portal.PortalItemContentParameters
import com.arcgismaps.portal.PortalItemType
import com.arcgismaps.portal.PortalQueryParameters
import com.arcgismaps.portal.PortalUser
import com.arcgismaps.tasks.Job as ArcgisJob
import com.arcgismaps.tasks.JobStatus
import com.arcgismaps.tasks.geocode.GeocodeResult
import com.arcgismaps.tasks.geocode.LocatorTask
import com.arcgismaps.tasks.geoprocessing.GeoprocessingTask
import com.arcgismaps.tasks.geoprocessing.geoprocessingparameters.GeoprocessingDouble
import com.arcgismaps.tasks.geoprocessing.geoprocessingparameters.GeoprocessingFeatures
import com.arcgismaps.tasks.geoprocessing.geoprocessingparameters.GeoprocessingString
import com.arcgismaps.tasks.networkanalysis.ClosestFacilityTask
import com.arcgismaps.tasks.networkanalysis.Facility
import com.arcgismaps.tasks.networkanalysis.Incident
import com.arcgismaps.tasks.networkanalysis.PolygonBarrier
import com.arcgismaps.tasks.networkanalysis.Route
import com.arcgismaps.tasks.networkanalysis.RouteTask
import com.arcgismaps.tasks.networkanalysis.ServiceAreaFacility
import com.arcgismaps.tasks.networkanalysis.ServiceAreaTask
import com.arcgismaps.tasks.networkanalysis.Stop
import com.arcgismaps.tasks.exportvectortiles.ExportVectorTilesTask
import com.arcgismaps.tasks.geodatabase.GeodatabaseSyncTask
import com.arcgismaps.tasks.offlinemaptask.GenerateOfflineMapResult
import com.arcgismaps.tasks.offlinemaptask.OfflineMapSyncTask
import com.arcgismaps.tasks.offlinemaptask.OfflineMapTask
import expo.modules.arcgismapssdk.dto.ApplyEditsOptionsRecord
import expo.modules.arcgismapssdk.dto.CameraRecord
import expo.modules.arcgismapssdk.dto.AddPortalItemRecord
import expo.modules.arcgismapssdk.dto.CreateAndSaveMapRecord
import expo.modules.arcgismapssdk.dto.ContingentFeatureRecord
import expo.modules.arcgismapssdk.dto.CreateGeodatabaseRecord
import expo.modules.arcgismapssdk.dto.UpdateFeatureRecord
import expo.modules.arcgismapssdk.dto.ExportVectorTilesRecord
import expo.modules.arcgismapssdk.dto.FeatureQueryOptionsRecord
import expo.modules.arcgismapssdk.dto.StartNavigationRecord
import expo.modules.arcgismapssdk.dto.CreateKmlFileRecord
import expo.modules.arcgismapssdk.dto.DynamicEntityQueryRecord
import expo.modules.arcgismapssdk.dto.GeoprocessingJobRecord
import expo.modules.arcgismapssdk.dto.KmlInfoSourceRecord
import expo.modules.arcgismapssdk.dto.KmlTourOptionsRecord
import expo.modules.arcgismapssdk.dto.LayerWhereRecord
import expo.modules.arcgismapssdk.dto.RelatedFeaturesOptionsRecord
import expo.modules.arcgismapssdk.dto.StatisticsQueryOptionsRecord
import expo.modules.arcgismapssdk.dto.GenerateGeodatabaseRecord
import expo.modules.arcgismapssdk.dto.ArcadeEvaluationOptionsRecord
import expo.modules.arcgismapssdk.dto.IdentifyOptionsRecord
import expo.modules.arcgismapssdk.dto.LocationDisplayRecord
import expo.modules.arcgismapssdk.dto.MapSourceRecord
import expo.modules.arcgismapssdk.dto.OfflineMapJobRecord
import expo.modules.arcgismapssdk.dto.SceneSourceRecord
import expo.modules.arcgismapssdk.dto.ServiceVersionRecord
import expo.modules.arcgismapssdk.dto.TraceUtilityNetworkRecord
import expo.modules.arcgismapssdk.dto.UtilityAssociationsRecord
import expo.modules.arcgismapssdk.dto.UtilityFeatureSelectorRecord
import expo.modules.arcgismapssdk.dto.ValidateUtilityNetworkRecord
import expo.modules.arcgismapssdk.dto.SyncGeodatabaseRecord
import expo.modules.arcgismapssdk.dto.EnvelopeRecord
import expo.modules.arcgismapssdk.dto.GeometryEditorRecord
import expo.modules.arcgismapssdk.dto.GeodesicEllipseRecord
import expo.modules.arcgismapssdk.dto.GeodesicSectorRecord
import expo.modules.arcgismapssdk.dto.GeometryRecord
import expo.modules.arcgismapssdk.dto.PointRecord
import expo.modules.arcgismapssdk.dto.basemapDisplayName
import expo.modules.arcgismapssdk.dto.basemapStyleFromString
import expo.modules.arcgismapssdk.dto.makeGeometry
import expo.modules.arcgismapssdk.dto.serializeGeometry
import expo.modules.arcgismapssdk.dto.ViewpointAnimationRecord
import expo.modules.arcgismapssdk.dto.ViewpointRecord
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.net.URL
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** ArcGIS World Geocoding Service (billed against the configured API key). */
private const val WORLD_GEOCODER_URL =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer"

/** Loads a utility network from its feature service (via its service geodatabase). */
private suspend fun loadUtilityNetwork(serviceUrl: String): UtilityNetwork {
  val serviceGeodatabase = ServiceGeodatabase(serviceUrl)
  serviceGeodatabase.load().getOrThrow()
  val network = UtilityNetwork(serviceGeodatabase)
  network.load().getOrThrow()
  return network
}

/** Resolves a feature selector to a [UtilityElement] (queries the layer, makes an element). */
private suspend fun makeUtilityElement(
  selector: UtilityFeatureSelectorRecord,
  network: UtilityNetwork,
): UtilityElement? {
  val table = ServiceFeatureTable(selector.layerUrl)
  val params = QueryParameters().apply { whereClause = selector.whereClause }
  val result = table.queryFeatures(params).getOrElse { return null }
  val feature = result.firstOrNull() as? ArcGISFeature ?: return null
  return network.createElementOrNull(feature)
}

/** Maps a utility-association type to a public string. */
private fun utilityAssociationKindName(type: UtilityAssociationType): String =
  when (type) {
    UtilityAssociationType.Connectivity -> "connectivity"
    UtilityAssociationType.Containment -> "containment"
    UtilityAssociationType.Attachment -> "attachment"
    else -> "other"
  }

/** Maps a KML node's concrete type to the public `KmlNodeType` string union. */
private fun kmlNodeType(node: KmlNode): String =
  when (node) {
    is KmlDocument -> "document"
    is KmlFolder -> "folder"
    is KmlPlacemark -> "placemark"
    is KmlGroundOverlay -> "groundOverlay"
    is KmlScreenOverlay -> "screenOverlay"
    is KmlNetworkLink -> "networkLink"
    is KmlPhotoOverlay -> "photoOverlay"
    is KmlTour -> "tour"
    else -> "other"
  }

/** Serializable `{ label, location?, score }` for a geocode candidate. */
private fun geocodeResultPayload(result: GeocodeResult): Map<String, Any?> {
  val payload = mutableMapOf<String, Any?>("label" to result.label, "score" to result.score)
  result.displayLocation?.let { location ->
    val wgs = (GeometryEngine.projectOrNull(location, SpatialReference.wgs84()) as? Point) ?: location
    payload["location"] = mapOf("latitude" to wgs.y, "longitude" to wgs.x)
  }
  return payload
}

/**
 * ArcGIS World Routing Service (billed against the configured API key). The
 * solvable layer is `Route_World`; the bare `Route` path returns the service
 * error `9004${'$'}LAYER_NOT_EXIST`.
 */
private const val WORLD_ROUTE_URL =
  "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"

private const val WORLD_CLOSEST_FACILITY_URL =
  "https://route-api.arcgis.com/arcgis/rest/services/World/ClosestFacility/NAServer/ClosestFacility_World"

private const val WORLD_SERVICE_AREA_URL =
  "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World"

/** Serializable `{ distanceMeters, travelTimeMinutes, path }` for a route. */
private fun routePayload(route: Route): Map<String, Any?> {
  val path = mutableListOf<Map<String, Double>>()
  route.routeGeometry?.let { geometry ->
    val wgs = (GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84()) as? Polyline) ?: geometry
    for (part in wgs.parts) {
      for (point in part.points) {
        path.add(mapOf("latitude" to point.y, "longitude" to point.x))
      }
    }
  }
  return mapOf(
    "distanceMeters" to route.totalLength,
    "travelTimeMinutes" to route.travelTime,
    "path" to path,
  )
}

/** Options for [ExpoArcgisMapsSdkModule.configure]. */
class ConfigureRecord : Record {
  @Field var apiKey: String = ""
}

/** Options for a token (named-user) `authenticate` call. */
class AuthenticateRecord : Record {
  @Field var portalUrl: String? = null

  @Field var username: String = ""

  @Field var password: String = ""
}

/** Options for an `authenticateWithOAuth` call. */
class OAuthAuthenticateRecord : Record {
  @Field var portalUrl: String = "https://www.arcgis.com"

  @Field var clientId: String = ""

  @Field var redirectUri: String = ""
}

/** Options for Integrated Windows Authentication (NTLM / Negotiate). */
class IwaAuthenticateRecord : Record {
  @Field var portalUrl: String = ""

  @Field var username: String = ""

  @Field var password: String = ""
}

/**
 * Options for PKI (client-certificate) authentication. Android references a
 * certificate by its system-KeyChain `certificateAlias`; `certificatePath` /
 * `password` are the iOS PKCS#12 file inputs and are unused on Android.
 */
class PkiAuthenticateRecord : Record {
  @Field var portalUrl: String = ""

  @Field var certificatePath: String? = null

  @Field var password: String? = null

  @Field var certificateAlias: String? = null
}

/** Options for a line-of-sight computation. */
class LineOfSightRecord : Record {
  @Field var observer: PointRecord = PointRecord()

  @Field var target: PointRecord = PointRecord()

  @Field var elevationRasterPath: String = ""
}

/** Options for a time-extent feature query. */
class TimeExtentQueryRecord : Record {
  @Field var serviceUrl: String = ""

  @Field var startTime: Double = 0.0

  @Field var endTime: Double = 0.0

  @Field var whereClause: String? = null
}

/** Default portal for named-user authentication (ArcGIS Online). */
private const val DEFAULT_PORTAL_URL = "https://www.arcgis.com"

// ARCore availability polling: re-check every 200ms for up to 5s while ARCore
// reports the transient UNKNOWN_CHECKING state (see isArSupported).
private const val AR_AVAILABILITY_POLL_MS = 200L
private const val AR_AVAILABILITY_TIMEOUT_MS = 5_000L

/**
 * Serializable `{ username, fullName?, email? }` for a portal user. Never
 * includes tokens or other credential material.
 */
private fun portalUserPayload(user: PortalUser?): Map<String, Any?> {
  val payload = mutableMapOf<String, Any?>("username" to (user?.username ?: ""))
  user?.fullName?.takeIf { it.isNotEmpty() }?.let { payload["fullName"] = it }
  user?.email?.takeIf { it.isNotEmpty() }?.let { payload["email"] = it }
  return payload
}

/**
 * Serializable `{ attributes, location? }` for a queried feature. Attribute
 * values are limited to JSON primitives; the location is a WGS 84 point.
 */
private fun featurePayload(feature: Feature): Map<String, Any?> {
  val attributes = mutableMapOf<String, Any?>()
  for ((key, value) in feature.attributes) {
    attributes[key] =
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
  val payload = mutableMapOf<String, Any?>("attributes" to attributes)
  val point = (feature.geometry as? Point) ?: feature.geometry?.extent?.center
  if (point != null) {
    val wgs = (GeometryEngine.projectOrNull(point, SpatialReference.wgs84()) as? Point) ?: point
    payload["location"] = mapOf("latitude" to wgs.y, "longitude" to wgs.x)
  }
  return payload
}

/** Serializable `{ id, name, contentType, size }` for a feature attachment. */
private fun attachmentPayload(attachment: Attachment): Map<String, Any?> =
  mapOf(
    "id" to attachment.id,
    "name" to attachment.name,
    "contentType" to attachment.contentType,
    "size" to attachment.size,
  )

/** Loads a single feature from a feature service layer by object id, or throws. */
private suspend fun loadFeatureByObjectId(
  serviceUrl: String,
  objectId: Int,
): Pair<ServiceFeatureTable, ArcGISFeature> {
  val table = ServiceFeatureTable(serviceUrl)
  table.load().getOrThrow()
  val parameters = QueryParameters()
  parameters.objectIds.add(objectId.toLong())
  val result = table.queryFeatures(parameters).getOrThrow()
  val feature =
    (result.firstOrNull() as? ArcGISFeature)
      ?: throw ArcgisCodedException(
        ArcgisErrorCode.INVALID_ARGUMENT, "No feature with object id $objectId.")
  feature.load().getOrThrow()
  return table to feature
}

/** Thrown from native functions with a stable, package-owned code. */
class ArcgisCodedException(code: String, message: String) : CodedException(code, message, null)

/** A stable error for a failed geometry operation. */
private fun geometryException(operation: String) =
  ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Could not compute the geometry $operation.")

/** Maps a `GeodatabaseFieldType` string-union value to an ArcGIS [FieldType]. */
private fun geodatabaseFieldType(value: String): FieldType =
  when (value) {
    "integer" -> FieldType.Int32
    "double" -> FieldType.Float64
    "date" -> FieldType.Date
    else -> FieldType.Text
  }

/**
 * Detects authorization failures (HTTP 401/403, token / permission / licence /
 * privilege problems) by inspecting a native error. The text is only read
 * internally to classify the failure; it never becomes the public message and
 * no secrets are surfaced.
 */
internal fun isAuthorizationError(error: Throwable?): Boolean {
  // Walk the full cause chain: ArcGIS wraps the underlying HTTP/service failure
  // (which carries the 403/permission detail) inside higher-level exceptions.
  val sb = StringBuilder()
  var cur: Throwable? = error
  var depth = 0
  while (cur != null && depth < 12) {
    sb.append(cur.toString()).append(' ').append(cur.message ?: "").append(' ')
    cur = cur.cause
    depth++
  }
  val text = sb.toString().lowercase()
  val markers =
    listOf(
      "forbidden", "unauthor", "not authorized", "token", "permission",
      "authentication", "licen", "privilege", "api key", "does not have access",
      "403", "401", "498", "499",
    )
  return markers.any { text.contains(it) }
}

/**
 * Wraps a native service error as a stable exception with an actionable,
 * secret-free message. Authorization failures map to `E_AUTHENTICATION_FAILED`.
 */
internal fun serviceException(error: Throwable?, context: String): ArcgisCodedException =
  if (isAuthorizationError(error)) {
    ArcgisCodedException(
      ArcgisErrorCode.AUTHENTICATION_FAILED,
      "Not authorized for the ArcGIS $context service. Ensure the API key or " +
        "signed-in user has the required privilege.",
    )
  } else {
    ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "The ArcGIS $context request failed.")
  }

/**
 * A running job plus a closure that awaits its typed result and converts it to a
 * serializable payload. The closure captures the concrete job so the registry
 * can hold heterogeneous job types (offline generation, geodatabase sync).
 */
private data class JobEntry(
  val job: ArcgisJob<*>,
  val awaitPayload: suspend () -> Map<String, Any?>,
)

/** Maps an ArcGIS job status to the stable string union used in `onJobProgress`. */
private fun jobStatusString(status: JobStatus): String =
  when (status) {
    is JobStatus.NotStarted -> "notStarted"
    is JobStatus.Started -> "started"
    is JobStatus.Paused -> "paused"
    is JobStatus.Succeeded -> "succeeded"
    is JobStatus.Failed -> "failed"
    is JobStatus.Canceling -> "canceling"
  }

/** Serializable `{ path, layerErrors }` for a generated offline map. */
private fun offlineResultPayload(
  result: GenerateOfflineMapResult,
  path: String,
): Map<String, Any?> {
  val errors = mutableListOf<String>()
  result.layerErrors.forEach { (_, error) -> errors.add(error.message ?: "layer error") }
  result.tableErrors.forEach { (_, error) -> errors.add(error.message ?: "table error") }
  return mapOf("path" to path, "layerErrors" to errors)
}

/**
 * Phase 2 native surface for the ArcGIS Maps SDK for Kotlin.
 *
 * - `configure` applies the global API key.
 * - The view renders a basemap and emits load/error events.
 *
 * `setViewpoint` animates the camera and `identify` hit-tests layers/graphics.
 * The API key is never logged.
 */
class ExpoArcgisMapsSdkModule : Module() {
  private val moduleScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
  private val jobs = ConcurrentHashMap<String, JobEntry>()
  private val progressJobs = ConcurrentHashMap<String, Job>()
  private val cancelledJobs = java.util.concurrent.ConcurrentHashMap.newKeySet<String>()
  private val jobCounter = AtomicInteger(0)

  // The in-flight OAuth sign-in, completed when the browser redirects back into
  // the app (caught by OnNewIntent).
  @Volatile private var pendingOAuthSignIn: OAuthUserSignIn? = null

  /** Removes a job and cancels its progress collector so nothing leaks. */
  private fun releaseJob(id: String) {
    progressJobs.remove(id)?.cancel()
    jobs.remove(id)
    cancelledJobs.remove(id)
  }

  /** Registers a job, starts it, and streams its progress until it ends. */
  private fun launchJob(
    id: String,
    job: ArcgisJob<*>,
    awaitPayload: suspend () -> Map<String, Any?>,
  ) {
    jobs[id] = JobEntry(job, awaitPayload)
    job.start()
    progressJobs[id] =
      moduleScope.launch {
        job.progress.collect { percent ->
          sendEvent(
            "onJobProgress",
            mapOf(
              "jobId" to id,
              "status" to jobStatusString(job.status.value),
              "progress" to percent,
            ),
          )
        }
      }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoArcgisMapsSdk")

    Events("onJobProgress")

    OnDestroy {
      progressJobs.values.forEach { it.cancel() }
      progressJobs.clear()
      jobs.clear()
      moduleScope.cancel()
    }

    // The OAuth browser redirects back into the app via the deep link registered
    // by the config plugin; complete the in-flight sign-in with the redirect URL.
    OnNewIntent { intent ->
      val redirectUrl = intent.data?.toString()
      val signIn = pendingOAuthSignIn
      if (redirectUrl != null && signIn != null) {
        pendingOAuthSignIn = null
        signIn.complete(redirectUrl)
      }
    }

    AsyncFunction("configure") { options: ConfigureRecord ->
      if (options.apiKey.isBlank()) {
        throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT,
          "configure requires a non-empty apiKey."
        )
      }
      // Network-analysis tasks (routing, closest facility, service area) and
      // other module-level ArcGIS tasks require an application Context on
      // Android; a mounted map view is not guaranteed to have set it. Set it
      // once here, since `configure` runs before any service call.
      appContext.reactContext?.applicationContext?.let {
        ArcGISEnvironment.applicationContext = it
      }
      ArcGISEnvironment.apiKey = ApiKey.create(options.apiKey)
    }

    AsyncFunction("geocode") Coroutine
      { address: String ->
        try {
          val locator = LocatorTask(WORLD_GEOCODER_URL)
          locator.geocode(address).getOrThrow().map { geocodeResultPayload(it) }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "geocoding")
        }
      }

    AsyncFunction("geocodeOffline") Coroutine
      { locatorPath: String, address: String ->
        try {
          val locator = LocatorTask(locatorPath)
          locator.load().getOrThrow()
          locator.geocode(address).getOrThrow().map { geocodeResultPayload(it) }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "offline geocoding")
        }
      }

    AsyncFunction("reverseGeocode") Coroutine
      { point: PointRecord ->
        try {
          val locator = LocatorTask(WORLD_GEOCODER_URL)
          val location = Point(point.longitude, point.latitude, SpatialReference.wgs84())
          locator.reverseGeocode(location).getOrThrow().map { geocodeResultPayload(it) }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "geocoding")
        }
      }

    AsyncFunction("solveRoute") Coroutine
      { stops: List<PointRecord>, barriers: List<GeometryRecord> ->
        try {
          val routeTask = RouteTask(WORLD_ROUTE_URL)
          // Load explicitly first: on a permission/auth failure the task's load
          // error carries the real 403/permission detail, whereas
          // createDefaultParameters() reports only a generic "failed to load".
          routeTask.load().getOrThrow()
          val parameters = routeTask.createDefaultParameters().getOrThrow()
          parameters.setStops(
            stops.map { Stop(Point(it.longitude, it.latitude, SpatialReference.wgs84())) }
          )
          val polygonBarriers =
            barriers.mapNotNull { makeGeometry(it) as? Polygon }.map { PolygonBarrier(it) }
          if (polygonBarriers.isNotEmpty()) parameters.setPolygonBarriers(polygonBarriers)
          val result = routeTask.solveRoute(parameters).getOrThrow()
          val route =
            result.routes.firstOrNull()
              ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No route found.")
          routePayload(route)
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "routing")
        }
      }

    AsyncFunction("solveRouteInNetwork") Coroutine
      { geodatabasePath: String, networkName: String, stops: List<PointRecord> ->
        try {
          val routeTask = RouteTask(geodatabasePath, networkName)
          routeTask.load().getOrThrow()
          val parameters = routeTask.createDefaultParameters().getOrThrow()
          parameters.setStops(
            stops.map { Stop(Point(it.longitude, it.latitude, SpatialReference.wgs84())) }
          )
          val result = routeTask.solveRoute(parameters).getOrThrow()
          val route =
            result.routes.firstOrNull()
              ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No route found.")
          routePayload(route)
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "offline routing")
        }
      }

    AsyncFunction("findClosestFacility") Coroutine
      { incident: PointRecord, facilities: List<PointRecord> ->
        try {
          val task = ClosestFacilityTask(WORLD_CLOSEST_FACILITY_URL)
          task.load().getOrThrow()
          val parameters = task.createDefaultParameters().getOrThrow()
          parameters.setIncidents(
            listOf(Incident(Point(incident.longitude, incident.latitude, SpatialReference.wgs84())))
          )
          parameters.setFacilities(
            facilities.map { Facility(Point(it.longitude, it.latitude, SpatialReference.wgs84())) }
          )
          val result = task.solveClosestFacility(parameters).getOrThrow()
          val facilityIndex =
            result.getRankedFacilityIndexes(0).firstOrNull()
              ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No reachable facility.")
          val route =
            result.getRoute(facilityIndex, 0)
              ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No reachable facility.")
          val path = mutableListOf<Map<String, Double>>()
          route.routeGeometry?.let { geometry ->
            val wgs =
              (GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84()) as? Polyline)
                ?: geometry
            for (part in wgs.parts) {
              for (p in part.points) path.add(mapOf("latitude" to p.y, "longitude" to p.x))
            }
          }
          mapOf(
            "facilityIndex" to facilityIndex,
            "distanceMeters" to route.totalLength,
            "travelTimeMinutes" to route.travelTime,
            "path" to path,
          )
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "closest facility")
        }
      }

    AsyncFunction("findClosestFacilities") Coroutine
      { incidents: List<PointRecord>, facilities: List<PointRecord> ->
        try {
          val task = ClosestFacilityTask(WORLD_CLOSEST_FACILITY_URL)
          task.load().getOrThrow()
          val parameters = task.createDefaultParameters().getOrThrow()
          parameters.setIncidents(
            incidents.map { Incident(Point(it.longitude, it.latitude, SpatialReference.wgs84())) }
          )
          parameters.setFacilities(
            facilities.map { Facility(Point(it.longitude, it.latitude, SpatialReference.wgs84())) }
          )
          val result = task.solveClosestFacility(parameters).getOrThrow()
          val routes = mutableListOf<Map<String, Any>>()
          for (incidentIndex in incidents.indices) {
            val facilityIndex = result.getRankedFacilityIndexes(incidentIndex).firstOrNull() ?: continue
            val route = result.getRoute(facilityIndex, incidentIndex) ?: continue
            val path = mutableListOf<Map<String, Double>>()
            route.routeGeometry?.let { geometry ->
              val wgs =
                (GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84()) as? Polyline)
                  ?: geometry
              for (part in wgs.parts) {
                for (p in part.points) path.add(mapOf("latitude" to p.y, "longitude" to p.x))
              }
            }
            routes.add(
              mapOf(
                "incidentIndex" to incidentIndex,
                "facilityIndex" to facilityIndex,
                "distanceMeters" to route.totalLength,
                "travelTimeMinutes" to route.travelTime,
                "path" to path,
              )
            )
          }
          routes
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "closest facility")
        }
      }

    AsyncFunction("findServiceArea") Coroutine
      { facility: PointRecord, breaksMinutes: List<Double> ->
        try {
          val task = ServiceAreaTask(WORLD_SERVICE_AREA_URL)
          task.load().getOrThrow()
          val parameters = task.createDefaultParameters().getOrThrow()
          parameters.setFacilities(
            listOf(
              ServiceAreaFacility(Point(facility.longitude, facility.latitude, SpatialReference.wgs84()))
            )
          )
          // Largest cutoff first so smaller areas draw on top of larger ones.
          parameters.defaultImpedanceCutoffs.clear()
          parameters.defaultImpedanceCutoffs.addAll(breaksMinutes.sortedDescending())
          val result = task.solveServiceArea(parameters).getOrThrow()
          val polygons = result.getResultPolygons(0).mapNotNull { serializeGeometry(it.geometry) }
          mapOf("polygons" to polygons)
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "service area")
        }
      }

    AsyncFunction("findServiceAreas") Coroutine
      { facilities: List<PointRecord>, breaksMinutes: List<Double> ->
        try {
          val task = ServiceAreaTask(WORLD_SERVICE_AREA_URL)
          task.load().getOrThrow()
          val parameters = task.createDefaultParameters().getOrThrow()
          parameters.setFacilities(
            facilities.map {
              ServiceAreaFacility(Point(it.longitude, it.latitude, SpatialReference.wgs84()))
            }
          )
          // Largest cutoff first so smaller areas draw on top of larger ones.
          parameters.defaultImpedanceCutoffs.clear()
          parameters.defaultImpedanceCutoffs.addAll(breaksMinutes.sortedDescending())
          val result = task.solveServiceArea(parameters).getOrThrow()
          facilities.indices.map { facilityIndex ->
            val polygons =
              result.getResultPolygons(facilityIndex).mapNotNull { serializeGeometry(it.geometry) }
            mapOf("facilityIndex" to facilityIndex, "polygons" to polygons)
          }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "service area")
        }
      }

    AsyncFunction("formatCoordinates") { point: PointRecord ->
      val p = Point(point.longitude, point.latitude, SpatialReference.wgs84())
      mapOf(
        "decimalDegrees" to
          (CoordinateFormatter.toLatitudeLongitudeOrNull(
            p, LatitudeLongitudeFormat.DecimalDegrees, 5) ?: ""),
        "degreesMinutesSeconds" to
          (CoordinateFormatter.toLatitudeLongitudeOrNull(
            p, LatitudeLongitudeFormat.DegreesMinutesSeconds, 1) ?: ""),
        "usng" to (CoordinateFormatter.toUsngOrNull(p, 7, true) ?: ""),
        "mgrs" to
          (CoordinateFormatter.toMgrsOrNull(p, MgrsConversionMode.Automatic, 5, true) ?: ""),
        "utm" to
          (CoordinateFormatter.toUtmOrNull(p, UtmConversionMode.LatitudeBandIndicators, true) ?: ""),
      )
    }

    AsyncFunction("getBasemapStyles") Coroutine { ->
      try {
        val service = BasemapStylesService()
        service.load().getOrThrow()
        val stylesInfo = service.info?.stylesInfo ?: emptyList()
        stylesInfo.map { info ->
          val entry =
            mutableMapOf<String, Any?>(
              "styleName" to info.styleName,
              "name" to basemapDisplayName(info.styleName),
            )
          info.thumbnail?.uri?.let { if (it.isNotEmpty()) entry["thumbnailUri"] = it }
          entry
        }
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "basemap styles")
      }
    }

    AsyncFunction("searchWebMaps") Coroutine { query: String ->
      try {
        val portal = Portal(DEFAULT_PORTAL_URL, Portal.Connection.Anonymous)
        portal.load().getOrThrow()
        val parameters =
          PortalQueryParameters.items(listOf(PortalItemType.WebMap), "", "", query)
        val resultSet = portal.findItems(parameters).getOrThrow()
        resultSet.results.map { item ->
          mapOf(
            "itemId" to item.itemId,
            "title" to item.title,
            "snippet" to item.snippet,
            "owner" to item.owner,
          )
        }
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "web map search")
      }
    }

    AsyncFunction("addPortalItem") Coroutine { options: AddPortalItemRecord ->
      try {
        val portal = Portal(DEFAULT_PORTAL_URL, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        val user =
          portal.user
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.AUTHENTICATION_FAILED,
              "Not signed in. Authenticate a named user first.")
        val item = PortalItem(portal, PortalItemType.FeatureCollection)
        item.title = options.title
        item.description = options.description
        val params = PortalItemContentParameters.json(options.json)
        user.addPortalItem(item, params, null).getOrThrow()
        val itemId =
          item.itemId
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE, "The added item has no id.")
        mapOf("itemId" to itemId)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "add portal item")
      }
    }

    AsyncFunction("createAndSaveMap") Coroutine { options: CreateAndSaveMapRecord ->
      try {
        val style =
          basemapStyleFromString(options.basemap)
            ?: throw ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Invalid basemap.")
        val portal = Portal(DEFAULT_PORTAL_URL, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        val map = ArcGISMap(style)
        map
          .saveAs(portal, null, options.title, options.description, options.tags, null, false)
          .getOrThrow()
        val itemId =
          map.item?.itemId
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE, "The saved map has no item id.")
        mapOf("itemId" to itemId)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "save map")
      }
    }

    AsyncFunction("queryMapImageSublayer") Coroutine
      { serviceUrl: String, sublayerId: Int, whereClause: String ->
        try {
          val layer = ArcGISMapImageLayer(serviceUrl)
          layer.load().getOrThrow()
          val sublayer =
            layer.mapImageSublayers.firstOrNull { it.id == sublayerId.toLong() }
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.INVALID_ARGUMENT, "No sublayer with id $sublayerId.")
          sublayer.load().getOrThrow()
          val table =
            sublayer.table
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.UNSUPPORTED, "Sublayer $sublayerId is not queryable.")
          table.load().getOrThrow()
          val parameters = QueryParameters()
          parameters.whereClause = whereClause.ifEmpty { "1=1" }
          val result = table.queryFeatures(parameters).getOrThrow()
          result.map { featurePayload(it) }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "map image sublayer query")
        }
      }

    AsyncFunction("queryFeaturesInTimeExtent") Coroutine { options: TimeExtentQueryRecord ->
      try {
        val table = ServiceFeatureTable(options.serviceUrl)
        table.load().getOrThrow()
        val parameters =
          QueryParameters().apply {
            timeExtent =
              TimeExtent(
                Instant.ofEpochMilli(options.startTime.toLong()),
                Instant.ofEpochMilli(options.endTime.toLong()),
              )
            whereClause = options.whereClause?.takeIf { it.isNotEmpty() } ?: "1=1"
          }
        val result = table.queryFeatures(parameters).getOrThrow()
        result.map { featurePayload(it) }
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "time extent query")
      }
    }

    AsyncFunction("computeLineOfSight") Coroutine { options: LineOfSightRecord ->
      try {
        val field =
          ContinuousField.createFromFiles(listOf(options.elevationRasterPath), 0).getOrThrow()
        val observer =
          Point(
            options.observer.longitude,
            options.observer.latitude,
            options.observer.altitude ?: 2.0,
            SpatialReference.wgs84(),
          )
        val target =
          Point(
            options.target.longitude,
            options.target.latitude,
            options.target.altitude ?: 2.0,
            SpatialReference.wgs84(),
          )
        val parameters =
          LineOfSightParameters().apply {
            observerTargetPairs =
              ObserverTargetPairs(
                listOf(LineOfSightPosition(observer, HeightOrigin.Relative)),
                listOf(LineOfSightPosition(target, HeightOrigin.Relative)),
              )
          }
        val results = LineOfSightFunction(field, parameters).evaluate().getOrThrow()
        val los =
          results.firstOrNull()
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE, "No line of sight result.")
        val payload = mutableMapOf<String, Any?>("targetVisibility" to los.targetVisibility.toDouble())
        serializeGeometry(los.visibleLine)?.let { payload["visibleLine"] = it }
        serializeGeometry(los.notVisibleLine)?.let { payload["obstructedLine"] = it }
        payload
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "line of sight")
      }
    }

    AsyncFunction("updateFeatureAttributes") Coroutine { options: UpdateFeatureRecord ->
      try {
        val (table, feature) = loadFeatureByObjectId(options.serviceUrl, options.objectId)
        for ((key, value) in options.attributes) {
          feature.attributes[key] = value
        }
        table.updateFeature(feature).getOrThrow()
        val results = table.applyEdits().getOrThrow()
        results.firstOrNull { it.completedWithErrors }?.let {
          throw serviceException(it.error, "feature editing")
        }
        mapOf("objectId" to options.objectId)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "feature editing")
      }
    }

    AsyncFunction("queryFeatureAttachments") Coroutine { serviceUrl: String, objectId: Int ->
      try {
        val (_, feature) = loadFeatureByObjectId(serviceUrl, objectId)
        val attachments = feature.fetchAttachments().getOrThrow()
        attachments.map { attachmentPayload(it) }
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "attachment query")
      }
    }

    AsyncFunction("addFeatureAttachment") Coroutine
      { serviceUrl: String, objectId: Int, name: String, contentType: String, dataBase64: String ->
        try {
          val data =
            try {
              android.util.Base64.decode(dataBase64, android.util.Base64.DEFAULT)
            } catch (e: IllegalArgumentException) {
              throw ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Invalid base64 data.")
            }
          val (table, feature) = loadFeatureByObjectId(serviceUrl, objectId)
          val attachment = feature.addAttachment(name, contentType, data).getOrThrow()
          table.applyEdits().getOrThrow()
          attachmentPayload(attachment)
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "add attachment")
        }
      }

    AsyncFunction("deleteFeatureAttachment") Coroutine
      { serviceUrl: String, objectId: Int, attachmentId: Int ->
        try {
          val (table, feature) = loadFeatureByObjectId(serviceUrl, objectId)
          val attachments = feature.fetchAttachments().getOrThrow()
          val attachment =
            attachments.firstOrNull { it.id == attachmentId.toLong() }
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.INVALID_ARGUMENT, "No attachment with id $attachmentId.")
          feature.deleteAttachment(attachment).getOrThrow()
          table.applyEdits().getOrThrow()
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "delete attachment")
        }
      }

    AsyncFunction("getServiceLayers") Coroutine { type: String, url: String ->
      try {
        when (type) {
          "wms" -> {
            val service = WmsService(url)
            service.load().getOrThrow()
            service.serviceInfo?.layerInfos.orEmpty().map {
              mapOf("id" to it.name, "title" to it.title.ifEmpty { it.name })
            }
          }
          "wfs" -> {
            val service = WfsService(url)
            service.load().getOrThrow()
            service.serviceInfo?.layerInfos.orEmpty().map {
              mapOf("id" to it.name, "title" to it.title.ifEmpty { it.name })
            }
          }
          "ogcFeature" -> {
            val service = OgcFeatureService(url)
            service.load().getOrThrow()
            service.serviceInfo?.featureCollectionInfos.orEmpty().map {
              mapOf("id" to it.collectionId, "title" to it.title.ifEmpty { it.collectionId })
            }
          }
          else ->
            throw ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Unsupported service type.")
        }
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "service browse")
      }
    }

    AsyncFunction("getShapefileInfo") Coroutine { path: String ->
      val table = ShapefileFeatureTable(path)
      table.load().getOrElse { throw serviceException(it, "shapefile") }
      val info = table.info
      mapOf(
        "credits" to (info?.credits ?: ""),
        "description" to (info?.description ?: ""),
        "summary" to (info?.summary ?: ""),
        "tags" to (info?.tags ?: emptyList<String>()),
        "copyrightText" to (info?.copyrightText ?: ""),
      )
    }

    AsyncFunction("traceUtilityNetwork") Coroutine { options: TraceUtilityNetworkRecord ->
      val network = loadUtilityNetwork(options.serviceUrl)
      val startingLocations = options.startingPoints.mapNotNull { makeUtilityElement(it, network) }
      if (startingLocations.isEmpty()) {
        throw ArcgisCodedException(
          ArcgisErrorCode.INVALID_ARGUMENT, "No starting features were found.")
      }
      val traceType =
        when (options.traceType) {
          "subnetwork" -> UtilityTraceType.Subnetwork
          "upstream" -> UtilityTraceType.Upstream
          "downstream" -> UtilityTraceType.Downstream
          "isolation" -> UtilityTraceType.Isolation
          "loops" -> UtilityTraceType.Loops
          "shortestPath" -> UtilityTraceType.ShortestPath
          else -> UtilityTraceType.Connected
        }
      val parameters = UtilityTraceParameters(traceType, startingLocations)
      options.barriers.forEach { selector ->
        makeUtilityElement(selector, network)?.let { parameters.barriers.add(it) }
      }
      val results =
        network.trace(parameters).getOrElse { throw serviceException(it, "utility network") }
      val byAssetGroup = mutableMapOf<String, Int>()
      var count = 0
      for (result in results) {
        if (result is UtilityElementTraceResult) {
          for (element in result.elements) {
            count++
            val group = element.assetGroup.name
            byAssetGroup[group] = (byAssetGroup[group] ?: 0) + 1
          }
        }
      }
      mapOf("elementCount" to count, "byAssetGroup" to byAssetGroup)
    }

    AsyncFunction("getUtilityAssociations") Coroutine { options: UtilityAssociationsRecord ->
      val network = loadUtilityNetwork(options.serviceUrl)
      val extent =
        Envelope(
          Point(options.extent.minLongitude, options.extent.minLatitude, SpatialReference.wgs84()),
          Point(options.extent.maxLongitude, options.extent.maxLatitude, SpatialReference.wgs84()),
        )
      val kind =
        when (options.kind) {
          "connectivity" -> UtilityAssociationType.Connectivity
          "containment" -> UtilityAssociationType.Containment
          "attachment" -> UtilityAssociationType.Attachment
          else -> null
        }
      val associations =
        network.getAssociations(extent, kind).getOrElse {
          throw serviceException(it, "utility network")
        }
      val payload =
        associations.map { association ->
          val item =
            mutableMapOf<String, Any?>(
              "kind" to utilityAssociationKindName(association.associationType))
          association.geometry?.let { geometry ->
            val wgs =
              (GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84()) ?: geometry)
            serializeGeometry(wgs)?.let { item["geometry"] = it }
          }
          item
        }
      mapOf("associations" to payload)
    }

    AsyncFunction("validateUtilityNetworkTopology") Coroutine { options: ValidateUtilityNetworkRecord ->
      val network = loadUtilityNetwork(options.serviceUrl)
      val extent =
        Envelope(
          Point(options.extent.minLongitude, options.extent.minLatitude, SpatialReference.wgs84()),
          Point(options.extent.maxLongitude, options.extent.maxLatitude, SpatialReference.wgs84()),
        )
      val job =
        network.validateNetworkTopology(extent, GeoprocessingExecutionType.SynchronousExecute)
      job.start()
      val result = job.result().getOrElse { throw serviceException(it, "utility network") }
      mapOf("hasErrors" to result.hasErrors)
    }

    // ARCore's first availability check in a process returns the transient
    // UNKNOWN_CHECKING while it resolves device compatibility asynchronously.
    // Poll until it settles (or a short timeout) instead of reporting the device
    // "unsupported" on that first transient result. Runs as a Coroutine so the
    // poll delay never blocks a caller thread.
    AsyncFunction("isArSupported") Coroutine { ->
      val context = appContext.reactContext
      if (context == null) {
        mapOf("supported" to false, "reason" to "unknown")
      } else {
        val arCoreApk = ArCoreApk.getInstance()
        var availability = arCoreApk.checkAvailability(context)
        var waitedMs = 0L
        while (availability.isTransient && waitedMs < AR_AVAILABILITY_TIMEOUT_MS) {
          delay(AR_AVAILABILITY_POLL_MS)
          waitedMs += AR_AVAILABILITY_POLL_MS
          availability = arCoreApk.checkAvailability(context)
        }
        if (availability.isSupported) {
          mapOf("supported" to true)
        } else {
          val reason = if (availability.isTransient) "unknown" else "unsupportedDevice"
          mapOf("supported" to false, "reason" to reason)
        }
      }
    }

    AsyncFunction("createServiceVersion") Coroutine { options: ServiceVersionRecord ->
      val serviceGeodatabase = ServiceGeodatabase(options.serviceUrl)
      serviceGeodatabase.load().getOrElse { throw serviceException(it, "branch version") }
      val params =
        ServiceVersionParameters().apply {
          name = options.versionName
          options.description?.let { description = it }
          access =
            when (options.access) {
              "public" -> VersionAccess.Public
              "protected" -> VersionAccess.Protected
              else -> VersionAccess.Private
            }
        }
      val info =
        serviceGeodatabase.createVersion(params).getOrElse {
          throw serviceException(it, "branch version")
        }
      serviceGeodatabase.switchVersion(info.name).getOrElse {
        throw serviceException(it, "branch version")
      }
      mapOf("versionName" to info.name)
    }

    AsyncFunction("getServiceVersions") Coroutine { serviceUrl: String ->
      val serviceGeodatabase = ServiceGeodatabase(serviceUrl)
      serviceGeodatabase.load().getOrElse { throw serviceException(it, "branch version") }
      val versions =
        serviceGeodatabase.fetchVersions().getOrElse { throw serviceException(it, "branch version") }
      versions.map { info ->
        mapOf(
          "name" to info.name,
          "access" to
            when (info.access) {
              VersionAccess.Public -> "public"
              VersionAccess.Protected -> "protected"
              else -> "private"
            },
          "description" to info.description,
          "isOwner" to info.isOwner,
        )
      }
    }

    AsyncFunction("queryDynamicEntities") Coroutine { options: DynamicEntityQueryRecord ->
      val service = ArcGISStreamService(options.url)
      try {
        service.connect().getOrThrow()
        val result =
          if (!options.trackIds.isNullOrEmpty()) {
            service.queryDynamicEntities(options.trackIds!!).getOrThrow()
          } else {
            service.queryDynamicEntities(DynamicEntityQueryParameters()).getOrThrow()
          }
        val entities =
          result.map { entity ->
            val payload = mutableMapOf<String, Any?>("attributes" to entity.attributes)
            (entity.geometry as? Point)?.let { p ->
              val wgs = (GeometryEngine.projectOrNull(p, SpatialReference.wgs84()) as? Point) ?: p
              payload["latitude"] = wgs.y
              payload["longitude"] = wgs.x
            }
            payload
          }
        service.disconnect()
        mapOf("entities" to entities)
      } catch (e: Exception) {
        service.disconnect()
        throw serviceException(e, "dynamic entities")
      }
    }

    AsyncFunction("getKmlInfo") Coroutine { source: KmlInfoSourceRecord ->
      val dataset =
        when {
          !source.url.isNullOrEmpty() -> KmlDataset(source.url!!)
          !source.path.isNullOrEmpty() -> KmlDataset(source.path!!)
          else ->
            throw ArcgisCodedException(
              ArcgisErrorCode.INVALID_ARGUMENT, "getKmlInfo requires a url or path.")
        }
      dataset.load().getOrElse { throw serviceException(it, "KML") }
      val nodes = mutableListOf<Map<String, Any?>>()
      fun walk(list: List<KmlNode>, depth: Int) {
        for (node in list) {
          nodes.add(
            mapOf(
              "name" to node.name,
              "type" to kmlNodeType(node),
              "visible" to node.isVisible,
              "depth" to depth,
            ))
          if (node is KmlContainer) walk(node.childNodes, depth + 1)
        }
      }
      walk(dataset.rootNodes, 0)
      mapOf("nodes" to nodes)
    }

    AsyncFunction("createKmlFile") Coroutine { options: CreateKmlFileRecord ->
      val document = KmlDocument()
      for (placemarkRecord in options.placemarks) {
        val point =
          Point(placemarkRecord.point.longitude, placemarkRecord.point.latitude, SpatialReference.wgs84())
        val geometry = KmlGeometry(point, KmlAltitudeMode.ClampToGround)
        document.childNodes.add(KmlPlacemark(geometry).apply { name = placemarkRecord.name })
      }
      if (options.tracks.isNotEmpty()) {
        val tracks =
          options.tracks.map { trackRecord ->
            var instant = Instant.now()
            val elements =
              trackRecord.points.map { p ->
                val element =
                  KmlTrackElement(
                    instant, Point(p.longitude, p.latitude, SpatialReference.wgs84()), null)
                instant = instant.plusSeconds(1)
                element
              }
            KmlTrack(elements, KmlAltitudeMode.ClampToGround, false, false, null)
          }
        document.childNodes.add(
          KmlPlacemark(KmlMultiTrack(tracks, false)).apply { name = "Multi-track" })
      }
      document.saveAs(options.path).getOrElse { throw serviceException(it, "KML") }
      mapOf("path" to options.path)
    }

    AsyncFunction("bufferGeometry") { geometry: GeometryRecord, distanceMeters: Double ->
      val input = makeGeometry(geometry) ?: throw geometryException("buffer")
      val result =
        GeometryEngine.bufferGeodeticOrNull(
          input, distanceMeters, LinearUnit.meters, Double.NaN, GeodeticCurveType.Geodesic)
          ?: throw geometryException("buffer")
      serializeGeometry(result) ?: throw geometryException("buffer")
    }

    AsyncFunction("planarBufferGeometry") { geometry: GeometryRecord, distanceMeters: Double ->
      val input = makeGeometry(geometry) ?: throw geometryException("planar buffer")
      // Project to Web Mercator so the planar buffer runs in meters, then project
      // the result back to WGS 84. The Web Mercator distortion is intentional —
      // it is what distinguishes a planar buffer from the geodesic one.
      val projected =
        GeometryEngine.projectOrNull(input, SpatialReference.webMercator())
          ?: throw geometryException("planar buffer")
      val buffered =
        GeometryEngine.bufferOrNull(projected, distanceMeters)
          ?: throw geometryException("planar buffer")
      val wgs =
        GeometryEngine.projectOrNull(buffered, SpatialReference.wgs84())
          ?: throw geometryException("planar buffer")
      serializeGeometry(wgs) ?: throw geometryException("planar buffer")
    }

    AsyncFunction("convexHull") { geometries: List<GeometryRecord> ->
      val inputs = geometries.mapNotNull { makeGeometry(it) }
      val merged = GeometryEngine.unionOrNull(inputs) ?: throw geometryException("convex hull")
      val result = GeometryEngine.convexHullOrNull(merged) ?: throw geometryException("convex hull")
      serializeGeometry(result) ?: throw geometryException("convex hull")
    }

    AsyncFunction("clipGeometry") { geometry: GeometryRecord, envelope: EnvelopeRecord ->
      val input = makeGeometry(geometry) ?: throw geometryException("clip")
      val env =
        Envelope(
          Point(envelope.minLongitude, envelope.minLatitude, SpatialReference.wgs84()),
          Point(envelope.maxLongitude, envelope.maxLatitude, SpatialReference.wgs84()),
        )
      val result = GeometryEngine.clipOrNull(input, env) ?: throw geometryException("clip")
      serializeGeometry(result) ?: throw geometryException("clip")
    }

    AsyncFunction("cutGeometry") { geometry: GeometryRecord, cutter: GeometryRecord ->
      val input = makeGeometry(geometry) ?: throw geometryException("cut")
      val cutterLine = makeGeometry(cutter) as? Polyline ?: throw geometryException("cut")
      GeometryEngine.tryCut(input, cutterLine).mapNotNull { serializeGeometry(it) }
    }

    AsyncFunction("projectPoint") { point: PointRecord, toWkid: Int, transformationName: String? ->
      val source = Point(point.longitude, point.latitude, SpatialReference.wgs84())
      val target = SpatialReference(toWkid)
      val transformation =
        transformationName?.let { name ->
          TransformationCatalog.getTransformationsBySuitability(SpatialReference.wgs84(), target)
            .firstOrNull { it.name == name }
        }
      val projected =
        (if (transformation != null)
          GeometryEngine.projectOrNull(source, target, transformation)
        else GeometryEngine.projectOrNull(source, target)) as? Point
          ?: throw geometryException("projection")
      mapOf("x" to projected.x, "y" to projected.y, "wkid" to toWkid)
    }

    AsyncFunction("getTransformations") { fromWkid: Int, toWkid: Int ->
      TransformationCatalog.getTransformationsBySuitability(
          SpatialReference(fromWkid), SpatialReference(toWkid))
        .map {
          mapOf(
            "name" to it.name,
            "isMissingProjectionEngineFiles" to it.isMissingProjectionEngineFiles,
          )
        }
    }

    AsyncFunction("createMobileGeodatabase") Coroutine { options: CreateGeodatabaseRecord ->
      try {
        val dir =
          appContext.reactContext?.cacheDir
            ?: throw ArcgisCodedException(ArcgisErrorCode.NATIVE_FAILURE, "No cache directory.")
        val file = File(dir, "created-${java.util.UUID.randomUUID()}.geodatabase")
        if (file.exists()) file.delete()
        val geodatabase = Geodatabase.create(file.absolutePath).getOrThrow()
        val geometryType =
          when (options.geometryType) {
            "polyline" -> GeometryType.Polyline
            "polygon" -> GeometryType.Polygon
            else -> GeometryType.Point
          }
        val description =
          TableDescription(options.tableName, SpatialReference.wgs84(), geometryType).apply {
            options.fields.forEach {
              fieldDescriptions.add(FieldDescription(it.name, geodatabaseFieldType(it.type)))
            }
          }
        val table = geodatabase.createTable(description).getOrThrow()
        table.load().getOrThrow()
        var count = 0
        if (options.geometryType == "point") {
          listOf(
              Point(-118.0, 34.0, SpatialReference.wgs84()),
              Point(-117.0, 35.0, SpatialReference.wgs84()),
              Point(-116.0, 33.0, SpatialReference.wgs84()),
            )
            .forEach { point ->
              val feature = table.createFeature().apply { geometry = point }
              table.addFeature(feature).getOrThrow()
              count++
            }
        }
        geodatabase.close()
        mapOf(
          "path" to file.absolutePath,
          "tableName" to options.tableName,
          "featureCount" to count,
        )
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "geodatabase creation")
      }
    }

    AsyncFunction("addFeatureWithContingentValues") Coroutine
      { options: ContingentFeatureRecord ->
        try {
          val geodatabase = Geodatabase(options.geodatabasePath)
          geodatabase.load().getOrThrow()
          val table =
            geodatabase.getFeatureTable(options.tableName)
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.INVALID_ARGUMENT, "No table named \"${options.tableName}\".")
          table.load().getOrThrow()
          table.contingentValuesDefinition.load().getOrThrow()
          val feature =
            table.createFeature() as? ArcGISFeature
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.NATIVE_FAILURE, "Table produced an invalid feature.")
          for ((key, value) in options.attributes) {
            feature.attributes[key] = value
          }
          val violations = table.validateContingencyConstraints(feature)
          if (violations.isEmpty()) {
            table.addFeature(feature).getOrThrow()
            geodatabase.close()
            mapOf("added" to true, "violations" to emptyList<String>())
          } else {
            geodatabase.close()
            mapOf("added" to false, "violations" to violations.map { it.fieldGroup.name })
          }
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "contingent values")
        }
      }

    AsyncFunction("applyGeodatabaseTransaction") Coroutine
      { path: String, tableName: String, addCount: Int, commit: Boolean ->
        try {
          val geodatabase = Geodatabase(path)
          geodatabase.load().getOrThrow()
          val table =
            geodatabase.getFeatureTable(tableName)
              ?: throw ArcgisCodedException(
                ArcgisErrorCode.INVALID_ARGUMENT, "No table named \"$tableName\".")
          table.load().getOrThrow()
          geodatabase.beginTransaction().getOrThrow()
          try {
            for (index in 0 until addCount) {
              val feature =
                table.createFeature().apply {
                  geometry = Point(-118.0 + index * 0.05, 34.0, SpatialReference.wgs84())
                }
              table.addFeature(feature).getOrThrow()
            }
          } catch (e: Throwable) {
            geodatabase.rollbackTransaction()
            geodatabase.close()
            throw e
          }
          if (commit) {
            geodatabase.commitTransaction().getOrThrow()
          } else {
            geodatabase.rollbackTransaction().getOrThrow()
          }
          val count = table.numberOfFeatures
          geodatabase.close()
          mapOf("committed" to commit, "featureCount" to count)
        } catch (e: ArcgisCodedException) {
          throw e
        } catch (e: Throwable) {
          throw serviceException(e, "geodatabase transaction")
        }
      }

    AsyncFunction("combineGeometries") {
      operation: String,
      a: GeometryRecord,
      b: GeometryRecord ->
      val g1 = makeGeometry(a) ?: throw geometryException(operation)
      val g2 = makeGeometry(b) ?: throw geometryException(operation)
      val result =
        when (operation) {
          "union" -> GeometryEngine.union(g1, g2)
          "intersection" -> GeometryEngine.intersectionOrNull(g1, g2)
          "difference" -> GeometryEngine.differenceOrNull(g1, g2)
          "symmetricDifference" -> GeometryEngine.symmetricDifferenceOrNull(g1, g2)
          else -> null
        } ?: throw geometryException(operation)
      serializeGeometry(result) ?: throw geometryException(operation)
    }

    AsyncFunction("geometryRelationships") { a: GeometryRecord, b: GeometryRecord ->
      val g1 = makeGeometry(a) ?: throw geometryException("relationships")
      val g2 = makeGeometry(b) ?: throw geometryException("relationships")
      mapOf(
        "contains" to GeometryEngine.contains(g1, g2),
        "within" to GeometryEngine.within(g1, g2),
        "crosses" to GeometryEngine.crosses(g1, g2),
        "disjoint" to GeometryEngine.disjoint(g1, g2),
        "intersects" to GeometryEngine.intersects(g1, g2),
        "overlaps" to GeometryEngine.overlaps(g1, g2),
        "touches" to GeometryEngine.touches(g1, g2),
      )
    }

    AsyncFunction("geodesicPath") { from: PointRecord, to: PointRecord ->
      val line =
        Polyline(
          listOf(
            Point(from.longitude, from.latitude, SpatialReference.wgs84()),
            Point(to.longitude, to.latitude, SpatialReference.wgs84()),
          )
        )
      val densified =
        GeometryEngine.densifyGeodeticOrNull(
          line, 100_000.0, LinearUnit.meters, GeodeticCurveType.Geodesic)
      serializeGeometry(densified) ?: throw geometryException("geodesic path")
    }

    AsyncFunction("geodesicEllipse") { options: GeodesicEllipseRecord ->
      val parameters =
        GeodesicEllipseParameters.createForPolygon().apply {
          center = Point(options.center.longitude, options.center.latitude, SpatialReference.wgs84())
          linearUnit = LinearUnit.meters
          angularUnit = AngularUnit.degrees
          semiAxis1Length = options.semiAxis1LengthMeters
          semiAxis2Length = options.semiAxis2LengthMeters
          axisDirection = options.axisDirectionDegrees
        }
      serializeGeometry(GeometryEngine.ellipseGeodesicOrNull(parameters))
        ?: throw geometryException("geodesic ellipse")
    }

    AsyncFunction("geodesicSector") { options: GeodesicSectorRecord ->
      val parameters =
        GeodesicSectorParameters.createForPolygon().apply {
          center = Point(options.center.longitude, options.center.latitude, SpatialReference.wgs84())
          linearUnit = LinearUnit.meters
          angularUnit = AngularUnit.degrees
          semiAxis1Length = options.semiAxis1LengthMeters
          semiAxis2Length = options.semiAxis2LengthMeters
          axisDirection = options.axisDirectionDegrees
          sectorAngle = options.sectorAngleDegrees
          startDirection = options.startDirectionDegrees
        }
      serializeGeometry(GeometryEngine.sectorGeodesicOrNull(parameters))
        ?: throw geometryException("geodesic sector")
    }

    AsyncFunction("simplifyGeometry") { geometry: GeometryRecord ->
      val g = makeGeometry(geometry) ?: throw geometryException("simplify")
      serializeGeometry(GeometryEngine.simplifyOrNull(g)) ?: throw geometryException("simplify")
    }

    AsyncFunction("densifyGeometry") { geometry: GeometryRecord, maxSegmentLength: Double ->
      val g = makeGeometry(geometry) ?: throw geometryException("densify")
      serializeGeometry(GeometryEngine.densifyOrNull(g, maxSegmentLength))
        ?: throw geometryException("densify")
    }

    AsyncFunction("generalizeGeometry") { geometry: GeometryRecord, maxDeviation: Double ->
      val g = makeGeometry(geometry) ?: throw geometryException("generalize")
      serializeGeometry(GeometryEngine.generalizeOrNull(g, maxDeviation, true))
        ?: throw geometryException("generalize")
    }

    AsyncFunction("nearestVertex") { geometry: GeometryRecord, point: PointRecord ->
      val g = makeGeometry(geometry) ?: throw geometryException("nearest vertex")
      val p = Point(point.longitude, point.latitude, SpatialReference.wgs84())
      val result = GeometryEngine.nearestVertex(g, p) ?: throw geometryException("nearest vertex")
      val wgs =
        (GeometryEngine.projectOrNull(result.coordinate, SpatialReference.wgs84()) as? Point)
          ?: result.coordinate
      mapOf(
        "point" to mapOf("latitude" to wgs.y, "longitude" to wgs.x),
        "distance" to result.distance,
      )
    }

    AsyncFunction("authenticate") Coroutine
      { options: AuthenticateRecord ->
        val portalUrl = options.portalUrl ?: DEFAULT_PORTAL_URL
        val credential =
          TokenCredential.create(portalUrl, options.username, options.password).getOrThrow()
        ArcGISEnvironment.authenticationManager.arcGISCredentialStore.add(credential)
        val portal = Portal(portalUrl, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        portalUserPayload(portal.user)
      }

    AsyncFunction("authenticateWithOAuth") Coroutine { options: OAuthAuthenticateRecord ->
      try {
        val configuration =
          OAuthUserConfiguration(options.portalUrl, options.clientId, options.redirectUri)
        // Launches the ArcGIS sign-in page in the browser; the redirect back
        // into the app is caught by OnNewIntent, which completes this sign-in.
        val credential =
          OAuthUserCredential.create(configuration) { signIn ->
              pendingOAuthSignIn = signIn
              val intent =
                android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse(signIn.authorizeUrl),
                  )
                  .apply { addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK) }
              (appContext.currentActivity ?: appContext.reactContext)?.startActivity(intent)
            }
            .getOrThrow()
        ArcGISEnvironment.authenticationManager.arcGISCredentialStore.add(credential)
        val portal = Portal(options.portalUrl, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        portalUserPayload(portal.user)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "authentication")
      } finally {
        pendingOAuthSignIn = null
      }
    }

    AsyncFunction("authenticateWithIWA") Coroutine { options: IwaAuthenticateRecord ->
      try {
        val host =
          URL(options.portalUrl).host
            ?: throw ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Invalid portalUrl.")
        val credential = PasswordCredential(options.username, options.password)
        // Loading an IWA-protected portal triggers the NTLM/Negotiate challenge,
        // which the handler answers with the Windows credential.
        ArcGISEnvironment.authenticationManager.networkAuthenticationChallengeHandler =
          SingleHostNetworkChallengeHandler(host, credential)
        val portal = Portal(options.portalUrl, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        portalUserPayload(portal.user)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "authentication")
      }
    }

    AsyncFunction("authenticateWithPKI") Coroutine { options: PkiAuthenticateRecord ->
      try {
        val host =
          URL(options.portalUrl).host
            ?: throw ArcgisCodedException(ArcgisErrorCode.INVALID_ARGUMENT, "Invalid portalUrl.")
        val alias =
          options.certificateAlias
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.INVALID_ARGUMENT,
              "Android PKI authentication requires a certificateAlias (a system-KeyChain alias).",
            )
        val credential = CertificateCredential(alias)
        ArcGISEnvironment.authenticationManager.networkAuthenticationChallengeHandler =
          SingleHostNetworkChallengeHandler(host, credential)
        val portal = Portal(options.portalUrl, Portal.Connection.Authenticated)
        portal.load().getOrThrow()
        portalUserPayload(portal.user)
      } catch (e: ArcgisCodedException) {
        throw e
      } catch (e: Throwable) {
        throw serviceException(e, "authentication")
      }
    }

    AsyncFunction("signOut") Coroutine
      { ->
        ArcGISEnvironment.authenticationManager.arcGISCredentialStore.removeAll()
      }

    AsyncFunction("startOfflineMapJob") Coroutine
      { options: OfflineMapJobRecord ->
        val cacheDir =
          appContext.reactContext?.cacheDir
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE,
              "No cache directory available.",
            )
        val portal = Portal(DEFAULT_PORTAL_URL, Portal.Connection.Anonymous)
        val portalItem = PortalItem(portal, options.webMapItemId)
        val onlineMap = ArcGISMap(portalItem)
        val offlineTask = OfflineMapTask(onlineMap)
        val area = options.areaOfInterest
        val envelope =
          Envelope(
            Point(area.minLongitude, area.minLatitude, SpatialReference.wgs84()),
            Point(area.maxLongitude, area.maxLatitude, SpatialReference.wgs84()),
          )
        val parameters =
          offlineTask.createDefaultGenerateOfflineMapParameters(envelope).getOrThrow()
        options.minScale?.let { parameters.minScale = it }
        options.maxScale?.let { parameters.maxScale = it }
        // Use a pre-provisioned local basemap instead of downloading the web
        // map's basemap; only operational layers are taken offline.
        options.localBasemapPath?.let { path ->
          val basemapFile = File(path)
          parameters.referenceBasemapDirectory = basemapFile.parent ?: ""
          parameters.referenceBasemapFilename = basemapFile.name
        }

        val id = "job-${jobCounter.incrementAndGet()}"
        // The download directory must not already exist, and the job id can
        // repeat across app launches, so make the path unique.
        val directory = File(cacheDir, "offline-$id-${java.util.UUID.randomUUID()}").absolutePath
        val job = offlineTask.createGenerateOfflineMapJob(parameters, directory)
        launchJob(id, job) { offlineResultPayload(job.result().getOrThrow(), directory) }
        id
      }

    AsyncFunction("startPreplannedMapAreaJob") Coroutine
      { webMapItemId: String, areaIndex: Int ->
        val cacheDir =
          appContext.reactContext?.cacheDir
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE, "No cache directory available.")
        val portal = Portal(DEFAULT_PORTAL_URL, Portal.Connection.Anonymous)
        val offlineTask = OfflineMapTask(ArcGISMap(PortalItem(portal, webMapItemId)))
        val areas = offlineTask.getPreplannedMapAreas().getOrThrow()
        if (areaIndex < 0 || areaIndex >= areas.size) {
          throw ArcgisCodedException(
            ArcgisErrorCode.INVALID_ARGUMENT,
            "No preplanned map area at index $areaIndex (found ${areas.size}).")
        }
        val area = areas[areaIndex]
        area.load().getOrThrow()
        val parameters =
          offlineTask.createDefaultDownloadPreplannedOfflineMapParameters(area).getOrThrow()
        val id = "job-${jobCounter.incrementAndGet()}"
        val directory =
          File(cacheDir, "preplanned-$id-${java.util.UUID.randomUUID()}").absolutePath
        val job = offlineTask.createDownloadPreplannedOfflineMapJob(parameters, directory)
        launchJob(id, job) {
          job.result().getOrThrow()
          mapOf("path" to directory, "layerErrors" to emptyList<String>())
        }
        id
      }

    AsyncFunction("startScheduledUpdatesJob") Coroutine
      { mobileMapPackagePath: String ->
        val mmpk = MobileMapPackage(mobileMapPackagePath)
        mmpk.load().getOrThrow()
        val map =
          mmpk.maps.firstOrNull()
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.INVALID_ARGUMENT, "The mobile map package contains no maps.")
        val syncTask = OfflineMapSyncTask(map)
        val parameters = syncTask.createDefaultOfflineMapSyncParameters().getOrThrow()
        val id = "job-${jobCounter.incrementAndGet()}"
        val job = syncTask.createOfflineMapSyncJob(parameters)
        launchJob(id, job) {
          val result = job.result().getOrThrow()
          val layerErrors =
            if (result.hasErrors) listOf("Some tables reported sync errors.") else emptyList()
          mapOf("path" to mobileMapPackagePath, "layerErrors" to layerErrors)
        }
        id
      }

    AsyncFunction("startExportVectorTilesJob") Coroutine
      { options: ExportVectorTilesRecord ->
        val cacheDir =
          appContext.reactContext?.cacheDir
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE,
              "No cache directory available.",
            )
        val task = ExportVectorTilesTask(options.serviceUrl)
        task.load().getOrThrow()
        val area = options.area
        val wgs84Envelope =
          Envelope(
            Point(area.minLongitude, area.minLatitude, SpatialReference.wgs84()),
            Point(area.maxLongitude, area.maxLatitude, SpatialReference.wgs84()),
          )
        // The export service requires the area-of-interest to be in the service's
        // spatial reference; vector tile services are Web Mercator, so project the
        // WGS 84 area before requesting default parameters.
        val envelope =
          (GeometryEngine.projectOrNull(wgs84Envelope, SpatialReference.webMercator())
            as? Envelope) ?: wgs84Envelope
        val parameters =
          task
            .createDefaultExportVectorTilesParameters(envelope, options.maxScale ?: 0.0)
            .getOrThrow()
        val id = "job-${jobCounter.incrementAndGet()}"
        val path = File(cacheDir, "vtiles-$id-${java.util.UUID.randomUUID()}.vtpk").absolutePath
        val job = task.createExportVectorTilesJob(parameters, path)
        launchJob(id, job) {
          val result = job.result().getOrThrow()
          mapOf("path" to (result.vectorTileCache?.path ?: path))
        }
        id
      }

    AsyncFunction("startGeoprocessingJob") Coroutine
      { options: GeoprocessingJobRecord ->
        val task = GeoprocessingTask(options.serviceUrl)
        task.load().getOrThrow()
        // The service dictates the execution type (sync/async); default parameters
        // carry it, then the caller's inputs are bound by name.
        val parameters = task.createDefaultParameters().getOrThrow()
        for (input in options.inputs) {
          when (input.type) {
            "string" -> parameters.inputs[input.name] = GeoprocessingString(input.stringValue ?: "")
            "double" -> parameters.inputs[input.name] = GeoprocessingDouble(input.doubleValue ?: 0.0)
            "point" ->
              input.point?.let { p ->
                val table =
                  FeatureCollectionTable(
                    emptyList(), GeometryType.Point, SpatialReference.wgs84(), false, false)
                val point = Point(p.longitude, p.latitude, SpatialReference.wgs84())
                table.addFeature(table.createFeature(emptyMap(), point)).getOrThrow()
                parameters.inputs[input.name] = GeoprocessingFeatures().apply { features = table }
              }
          }
        }
        val id = "job-${jobCounter.incrementAndGet()}"
        val job = task.createJob(parameters)
        launchJob(id, job) {
          val result = job.result().getOrThrow()
          val payload = mutableMapOf<String, Any?>()
          result.mapImageLayer?.url?.let { payload["mapImageUrl"] = it }
          val features = mutableListOf<Map<String, Any?>>()
          for ((_, parameter) in result.outputs) {
            if (parameter is GeoprocessingFeatures) {
              parameter.features?.forEach { feature ->
                feature.geometry?.let { geometry ->
                  val wgs = GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84())
                  serializeGeometry(wgs ?: geometry)?.let { features.add(it) }
                }
              }
            }
          }
          payload["features"] = features
          payload
        }
        id
      }

    AsyncFunction("startGenerateGeodatabaseJob") Coroutine
      { options: GenerateGeodatabaseRecord ->
        val cacheDir =
          appContext.reactContext?.cacheDir
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.NATIVE_FAILURE,
              "No cache directory available.",
            )
        val syncTask = GeodatabaseSyncTask(options.featureServiceUrl)
        val area = options.areaOfInterest
        val envelope =
          Envelope(
            Point(area.minLongitude, area.minLatitude, SpatialReference.wgs84()),
            Point(area.maxLongitude, area.maxLatitude, SpatialReference.wgs84()),
          )
        val parameters =
          syncTask.createDefaultGenerateGeodatabaseParameters(envelope).getOrThrow()
        val id = "job-${jobCounter.incrementAndGet()}"
        val path = File(cacheDir, "$id-${java.util.UUID.randomUUID()}.geodatabase").absolutePath
        val job = syncTask.createGenerateGeodatabaseJob(parameters, path)
        launchJob(id, job) {
          val geodatabase = job.result().getOrThrow()
          mapOf("path" to (geodatabase.path ?: path), "layerErrors" to emptyList<String>())
        }
        id
      }

    AsyncFunction("startSyncGeodatabaseJob") Coroutine
      { options: SyncGeodatabaseRecord ->
        val geodatabase = Geodatabase(options.path)
        geodatabase.load().getOrThrow()
        val syncTask = GeodatabaseSyncTask(options.featureServiceUrl)
        val parameters =
          syncTask.createDefaultSyncGeodatabaseParameters(geodatabase).getOrThrow()
        val id = "job-${jobCounter.incrementAndGet()}"
        val job = syncTask.createSyncGeodatabaseJob(parameters, geodatabase)
        launchJob(id, job) {
          job.result().getOrThrow()
          mapOf("layerErrors" to emptyList<String>())
        }
        id
      }

    AsyncFunction("awaitJob") Coroutine
      { jobId: String ->
        val entry =
          jobs[jobId]
            ?: throw ArcgisCodedException(
              ArcgisErrorCode.INVALID_ARGUMENT,
              "No job with id \"$jobId\".",
            )
        try {
          val payload = entry.awaitPayload()
          releaseJob(jobId)
          payload
        } catch (error: Throwable) {
          val cancelled = cancelledJobs.contains(jobId)
          releaseJob(jobId)
          if (cancelled) {
            throw ArcgisCodedException(ArcgisErrorCode.JOB_CANCELLED, "The job was cancelled.")
          }
          throw serviceException(error, "job")
        }
      }

    AsyncFunction("cancelJob") Coroutine
      { jobId: String ->
        // Idempotent: cancelling an unknown/finished job is a no-op.
        jobs[jobId]?.let {
          cancelledJobs.add(jobId)
          it.job.cancel()
        }
        Unit
      }

    AsyncFunction("deleteOfflineMap") { path: String ->
      val file = File(path)
      if (file.exists()) {
        file.deleteRecursively()
      }
    }

    View(ExpoArcgisMapView::class) {
      Events(
        "onMapLoad", "onMapError", "onSingleTap", "onViewpointChange", "onLocationUpdate",
        "onDrawStatusChange", "onLayerViewStateChange", "onNavigationStatus",
        "onGeotriggerNotification")

      Prop("map") { view: ExpoArcgisMapView, map: MapSourceRecord -> view.setMapSource(map) }

      Prop("interactionEnabled") { view: ExpoArcgisMapView, enabled: Boolean ->
        view.setInteractionEnabled(enabled)
      }

      Prop("scaleBar") { view: ExpoArcgisMapView, enabled: Boolean ->
        view.setScaleBarEnabled(enabled)
      }

      Prop("grid") { view: ExpoArcgisMapView, grid: String -> view.setGrid(grid) }

      Prop("locationDisplay") { view: ExpoArcgisMapView, record: LocationDisplayRecord? ->
        view.setLocationDisplay(record)
      }

      AsyncFunction("setViewpoint") Coroutine
        { view: ExpoArcgisMapView, viewpoint: ViewpointRecord, options: ViewpointAnimationRecord? ->
          view.setViewpoint(viewpoint, options?.durationMs ?: 0.0)
        }

      AsyncFunction("identify") Coroutine
        { view: ExpoArcgisMapView, options: IdentifyOptionsRecord ->
          view.identify(options)
        }

      AsyncFunction("showPopup") Coroutine
        { view: ExpoArcgisMapView, options: IdentifyOptionsRecord ->
          view.showPopup(options)
        }

      AsyncFunction("showFeatureForm") Coroutine
        { view: ExpoArcgisMapView, options: IdentifyOptionsRecord ->
          view.showFeatureForm(options)
        }

      AsyncFunction("evaluateArcade") Coroutine
        { view: ExpoArcgisMapView, options: ArcadeEvaluationOptionsRecord ->
          view.evaluateArcade(options)
        }

      AsyncFunction("startGeometryEditor") { view: ExpoArcgisMapView, options: GeometryEditorRecord ->
        view.startGeometryEditor(options)
      }

      AsyncFunction("stopGeometryEditor") { view: ExpoArcgisMapView ->
        view.stopGeometryEditor()
      }

      AsyncFunction("startNavigation") Coroutine
        { view: ExpoArcgisMapView, options: StartNavigationRecord ->
          view.startNavigation(options.stops, options.reroute)
        }

      AsyncFunction("stopNavigation") { view: ExpoArcgisMapView ->
        view.stopNavigation()
      }

      AsyncFunction("queryFeatures") Coroutine
        { view: ExpoArcgisMapView, options: FeatureQueryOptionsRecord ->
          view.queryFeatures(options)
        }

      AsyncFunction("selectFeatures") Coroutine
        { view: ExpoArcgisMapView, options: LayerWhereRecord ->
          view.selectFeatures(options)
        }

      AsyncFunction("clearSelection") { view: ExpoArcgisMapView, layerId: String ->
        view.clearSelection(layerId)
      }

      AsyncFunction("controlKmlTour") Coroutine
        { view: ExpoArcgisMapView, options: KmlTourOptionsRecord ->
          view.controlKmlTour(options)
        }

      AsyncFunction("queryFeatureExtent") Coroutine
        { view: ExpoArcgisMapView, options: LayerWhereRecord ->
          view.queryFeatureExtent(options)
        }

      AsyncFunction("queryRelatedFeatures") Coroutine
        { view: ExpoArcgisMapView, options: RelatedFeaturesOptionsRecord ->
          view.queryRelatedFeatures(options)
        }

      AsyncFunction("queryStatistics") Coroutine
        { view: ExpoArcgisMapView, options: StatisticsQueryOptionsRecord ->
          view.queryStatistics(options)
        }

      AsyncFunction("applyEdits") Coroutine
        { view: ExpoArcgisMapView, options: ApplyEditsOptionsRecord ->
          try {
            view.applyEdits(options)
          } catch (e: ArcgisCodedException) {
            throw e
          } catch (e: Throwable) {
            throw serviceException(e, "feature editing")
          }
        }

      AsyncFunction("exportImage") Coroutine
        { view: ExpoArcgisMapView ->
          view.exportImage()
        }

      OnViewDestroys { view: ExpoArcgisMapView -> view.dispose() }
    }

    View(ExpoArcgisSceneView::class) {
      Events("onSceneLoad", "onSceneError", "onSingleTap")

      Prop("scene") { view: ExpoArcgisSceneView, scene: SceneSourceRecord ->
        view.setSceneSource(scene)
      }

      AsyncFunction("setCamera") Coroutine
        { view: ExpoArcgisSceneView, camera: CameraRecord, options: ViewpointAnimationRecord? ->
          view.setCamera(camera, options?.durationMs ?: 0.0)
        }

      AsyncFunction("getSurfaceElevation") Coroutine
        { view: ExpoArcgisSceneView, point: PointRecord ->
          view.getSurfaceElevation(point)
        }

      AsyncFunction("selectSceneFeatures") Coroutine
        { view: ExpoArcgisSceneView, options: IdentifyOptionsRecord ->
          view.selectSceneFeatures(options)
        }

      AsyncFunction("clearSceneSelection") { view: ExpoArcgisSceneView ->
        view.clearSceneSelection()
      }

      OnViewDestroys { view: ExpoArcgisSceneView -> view.dispose() }
    }

    View(ExpoArcgisArView::class) {
      Events("onSceneLoad", "onSceneError", "onSingleTap", "onTrackingStateChange", "onArError")

      Prop("scene") { view: ExpoArcgisArView, scene: SceneSourceRecord ->
        view.setSceneSource(scene)
      }
      Prop("mode") { view: ExpoArcgisArView, mode: String -> view.setMode(mode) }
      Prop("trackingMode") { view: ExpoArcgisArView, mode: String? -> view.setTrackingMode(mode) }
      Prop("anchor") { view: ExpoArcgisArView, anchor: PointRecord? -> view.setAnchor(anchor) }
      Prop("initialCamera") { view: ExpoArcgisArView, camera: CameraRecord? ->
        view.setInitialCamera(camera)
      }
      Prop("translationFactor") { view: ExpoArcgisArView, factor: Double? ->
        view.setTranslationFactor(factor)
      }
      Prop("clippingDistanceMeters") { view: ExpoArcgisArView, meters: Double? ->
        view.setClippingDistance(meters)
      }
      Prop("calibrationVisible") { view: ExpoArcgisArView, visible: Boolean? ->
        view.setCalibrationVisible(visible)
      }

      AsyncFunction("getCurrentCamera") { view: ExpoArcgisArView -> view.getCurrentCamera() }

      OnViewDestroys { view: ExpoArcgisArView -> view.dispose() }
    }
  }
}
