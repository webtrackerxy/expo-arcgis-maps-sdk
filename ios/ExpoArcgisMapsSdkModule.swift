import ARKit
import ArcGIS
import Combine
import ExpoModulesCore
import Foundation

/// ArcGIS World Geocoding Service (billed against the configured API key).
private let worldGeocoderURL = URL(
  string: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer"
)!

/// ArcGIS World Routing Service (billed against the configured API key). The
/// solvable layer is `Route_World`; using the bare `Route` path returns the
/// service error `9004$LAYER_NOT_EXIST`.
private let worldRouteURL = URL(
  string: "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
)!

/// ArcGIS World Closest Facility service (billed against the configured API key).
private let worldClosestFacilityURL = URL(
  string:
    "https://route-api.arcgis.com/arcgis/rest/services/World/ClosestFacility/NAServer/ClosestFacility_World"
)!

/// ArcGIS World Service Area service (billed against the configured API key).
private let worldServiceAreaURL = URL(
  string:
    "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World"
)!

/// Default portal for named-user authentication (ArcGIS Online).
private let defaultPortalURL = URL(string: "https://www.arcgis.com")!

/// A stable error for a failed geometry operation.
private func geometryException(_ operation: String) -> ArcgisException {
  ArcgisException((
    code: ArcgisErrorCode.invalidArgument,
    message: "Could not compute the geometry \(operation)."
  ))
}

/// Maps a `GeodatabaseFieldType` string-union value to an ArcGIS `FieldType`.
private func geodatabaseFieldType(_ value: String) -> FieldType {
  switch value {
  case "integer": return .int32
  case "double": return .float64
  case "date": return .date
  default: return .text
  }
}

/// Serializable `{ attributes, location? }` for a queried feature. Attribute
/// values are limited to JSON primitives; the location is a WGS 84 point.
private func featurePayload(_ feature: Feature) -> [String: Any] {
  var attributes: [String: Any] = [:]
  for (key, value) in feature.attributes {
    switch value {
    case is NSNull: attributes[key] = NSNull()
    case let string as String: attributes[key] = string
    case let number as NSNumber: attributes[key] = number
    default: attributes[key] = String(describing: value)
    }
  }
  var payload: [String: Any] = ["attributes": attributes]
  let point = (feature.geometry as? Point) ?? feature.geometry?.extent.center
  if let point, let wgs = GeometryEngine.project(point, into: .wgs84) as? Point {
    payload["location"] = ["latitude": wgs.y, "longitude": wgs.x]
  }
  return payload
}

/// Serializable `{ id, name, contentType, size }` for a feature attachment.
private func attachmentPayload(_ attachment: Attachment) -> [String: Any] {
  [
    "id": attachment.id,
    "name": attachment.name,
    "contentType": attachment.contentType,
    "size": attachment.size,
  ]
}

/// Loads a single feature from a feature service layer by object id, or throws.
private func loadFeature(serviceUrl: String, objectId: Int) async throws -> (
  ServiceFeatureTable, ArcGISFeature
) {
  guard let url = URL(string: serviceUrl) else {
    throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
  }
  let table = ServiceFeatureTable(url: url)
  try await table.load()
  let parameters = QueryParameters()
  parameters.addObjectID(objectId)
  let result = try await table.queryFeatures(using: parameters)
  guard let feature = Array(result.features()).first as? ArcGISFeature else {
    throw ArcgisException((
      code: ArcgisErrorCode.invalidArgument, message: "No feature with object id \(objectId)."))
  }
  try await feature.load()
  return (table, feature)
}

/// Serializable `{ username, fullName?, email? }` for a portal user. Never
/// includes tokens or other credential material.
private func portalUserPayload(_ user: PortalUser?) -> [String: Any] {
  var payload: [String: Any] = ["username": user?.username ?? ""]
  if let fullName = user?.fullName, !fullName.isEmpty {
    payload["fullName"] = fullName
  }
  if let email = user?.email, !email.isEmpty {
    payload["email"] = email
  }
  return payload
}

/// Maps a branch-version access level to its serializable string.
private func accessName(_ access: VersionAccess) -> String {
  switch access {
  case .public: return "public"
  case .protected: return "protected"
  case .private: return "private"
  @unknown default: return "private"
  }
}

/// Serializable `{ distanceMeters, travelTimeMinutes, path }` for a route.
private func routePayload(_ route: Route) -> [String: Any] {
  var path: [[String: Double]] = []
  if let geometry = route.geometry,
    let wgs = GeometryEngine.project(geometry, into: .wgs84) as? Polyline
  {
    for part in wgs.parts {
      for point in part.points {
        path.append(["latitude": point.y, "longitude": point.x])
      }
    }
  }
  return [
    // `totalLength` is a Measurement<UnitLength>; extract the meters value so a
    // plain number crosses to JS (a Measurement serializes to NaN).
    "distanceMeters": route.totalLength.converted(to: .meters).value,
    // `totalTime` is a TimeInterval (seconds); the DTO is minutes.
    "travelTimeMinutes": route.totalTime / 60,
    "path": path,
  ]
}

/// Serializable `{ label, location?, score }` for a geocode candidate.
private func geocodeResultPayload(_ result: GeocodeResult) -> [String: Any] {
  var payload: [String: Any] = ["label": result.label, "score": result.score]
  if let location = result.displayLocation,
    let wgs = GeometryEngine.project(location, into: .wgs84) as? Point
  {
    payload["location"] = ["latitude": wgs.y, "longitude": wgs.x]
  }
  return payload
}

/// Type-erased view of an ArcGIS long-running job so the job registry can hold
/// heterogeneous job types (offline generation, geodatabase sync). ArcGIS jobs
/// already expose `progress`, `status`, `start()`, and `cancel()`; each type
/// adds `awaitPayload` to convert its typed output to a serializable result.
/// Loads a utility network from its feature service (via its service geodatabase).
func loadUtilityNetwork(_ serviceUrl: String) async throws -> UtilityNetwork {
  guard let url = URL(string: serviceUrl) else {
    throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
  }
  let serviceGeodatabase = ServiceGeodatabase(url: url)
  try await serviceGeodatabase.load()
  let network = UtilityNetwork(serviceGeodatabase: serviceGeodatabase)
  try await network.load()
  return network
}

/// Resolves a feature selector to a `UtilityElement` (queries the layer, makes an element).
func makeUtilityElement(
  _ selector: UtilityFeatureSelectorRecord, network: UtilityNetwork
) async throws -> UtilityElement? {
  guard let layerURL = URL(string: selector.layerUrl) else { return nil }
  let table = ServiceFeatureTable(url: layerURL)
  let parameters = QueryParameters()
  parameters.whereClause = selector.whereClause
  let result = try await table.queryFeatures(using: parameters)
  guard let feature = Array(result.features()).first as? ArcGISFeature else { return nil }
  return network.makeElement(arcGISFeature: feature)
}

/// Maps a utility-association kind to a public string.
func utilityAssociationKindName(_ kind: UtilityAssociation.Kind) -> String {
  switch kind {
  case .connectivity: return "connectivity"
  case .containment: return "containment"
  case .attachment: return "attachment"
  default: return "other"
  }
}

/// Maps a KML node's concrete type to the public `KmlNodeType` string union.
func kmlNodeType(_ node: KMLNode) -> String {
  switch node {
  case is KMLDocument: return "document"
  case is KMLFolder: return "folder"
  case is KMLPlacemark: return "placemark"
  case is KMLGroundOverlay: return "groundOverlay"
  case is KMLScreenOverlay: return "screenOverlay"
  case is KMLNetworkLink: return "networkLink"
  case is KMLPhotoOverlay: return "photoOverlay"
  case is KMLTour: return "tour"
  default: return "other"
  }
}

protocol AnyArcgisJob {
  var progress: Progress { get }
  var status: Job.Status { get }
  func start()
  func cancel() async
  func awaitPayload(directory: URL) async throws -> [String: Any]
}

extension GenerateGeodatabaseJob: AnyArcgisJob {
  func awaitPayload(directory: URL) async throws -> [String: Any] {
    let geodatabase = try await self.output
    return ["path": geodatabase.fileURL.path, "layerErrors": [String]()]
  }
}

extension SyncGeodatabaseJob: AnyArcgisJob {
  func awaitPayload(directory: URL) async throws -> [String: Any] {
    _ = try await self.output
    return ["layerErrors": [String]()]
  }
}

extension GeoprocessingJob: AnyArcgisJob {
  func awaitPayload(directory: URL) async throws -> [String: Any] {
    let result = try await self.output
    var payload: [String: Any] = [:]
    // Async services return their result as a map-image layer (e.g. hotspots).
    if let mapImageURL = result.mapImageLayer?.url {
      payload["mapImageUrl"] = mapImageURL.absoluteString
    }
    // Feature outputs (e.g. a viewshed polygon) are projected to WGS 84 and
    // serialized as geometry DTOs.
    var features: [[String: Any]] = []
    for (_, parameter) in result.outputs {
      guard let gpFeatures = parameter as? GeoprocessingFeatures,
        let featureSet = gpFeatures.features
      else { continue }
      for feature in featureSet.features() {
        guard let geometry = feature.geometry,
          let wgs = GeometryEngine.project(geometry, into: .wgs84),
          let serialized = serializeGeometry(wgs)
        else { continue }
        features.append(serialized)
      }
    }
    payload["features"] = features
    return payload
  }
}

/// Native surface for the ArcGIS Maps SDK for Swift.
///
/// - `configure` applies the global API key (never logged).
/// - The view renders basemaps / web maps + feature layers + graphics, emits
///   load/error/tap/viewpoint events, and exposes `setViewpoint` / `identify`.
/// - `geocode` / `reverseGeocode` use the ArcGIS World Geocoding Service.
public class ExpoArcgisMapsSdkModule: Module {
  /// A running job plus the local file/directory URL its output is written to.
  private struct JobEntry {
    let job: any AnyArcgisJob
    let directory: URL
  }

  // Long-running jobs are keyed by an opaque id and accessed from multiple async
  // contexts, so all access is guarded by `jobsLock`.
  private let jobsLock = NSLock()
  private var jobs: [String: JobEntry] = [:]
  private var progressTasks: [String: Task<Void, Never>] = [:]
  private var cancelledJobs: Set<String> = []
  private var jobCounter = 0

  private func markCancelled(_ id: String) {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    cancelledJobs.insert(id)
  }

  private func wasCancelled(_ id: String) -> Bool {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    return cancelledJobs.contains(id)
  }

  private func nextJobId() -> String {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    jobCounter += 1
    return "job-\(jobCounter)"
  }

  private func storeJob(_ id: String, _ entry: JobEntry) {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    jobs[id] = entry
  }

  private func jobEntry(_ id: String) -> JobEntry? {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    return jobs[id]
  }

  private func setProgressTask(_ id: String, _ task: Task<Void, Never>) {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    progressTasks[id] = task
  }

  /// Removes a job and cancels its progress observer. Called on completion,
  /// cancellation, and module teardown so no observers or jobs leak.
  private func releaseJob(_ id: String) {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    jobs[id] = nil
    progressTasks[id]?.cancel()
    progressTasks[id] = nil
    cancelledJobs.remove(id)
  }

  private func releaseAllJobs() {
    jobsLock.lock()
    defer { jobsLock.unlock() }
    for task in progressTasks.values {
      task.cancel()
    }
    progressTasks.removeAll()
    let runningJobs = jobs.values.map { $0.job }
    jobs.removeAll()
    for job in runningJobs {
      Task { await job.cancel() }
    }
  }

  private func jobStatusString(_ status: Job.Status) -> String {
    switch status {
    case .notStarted: return "notStarted"
    case .started: return "started"
    case .paused: return "paused"
    case .succeeded: return "succeeded"
    case .failed: return "failed"
    case .canceling: return "canceling"
    @unknown default: return "started"
    }
  }

  private func sendJobProgress(id: String, status: Job.Status, fraction: Double) {
    sendEvent(
      "onJobProgress",
      [
        "jobId": id,
        "status": jobStatusString(status),
        "progress": Int((fraction * 100).rounded()),
      ]
    )
  }

  /// Registers a job, starts it, and observes its fractional progress off the
  /// main thread until the job ends or the observer is cancelled during release.
  private func launchJob(_ id: String, _ job: any AnyArcgisJob, directory: URL) {
    storeJob(id, JobEntry(job: job, directory: directory))
    job.start()
    let observer = Task { [weak self] in
      for await fraction in job.progress.publisher(for: \.fractionCompleted).values {
        guard let self, !Task.isCancelled else { break }
        self.sendJobProgress(id: id, status: job.status, fraction: fraction)
      }
    }
    setProgressTask(id, observer)
  }

  /// Awaits a job's terminal outcome, mapping cancellation to `E_JOB_CANCELLED`.
  private func awaitJobPayload(_ jobId: String) async throws -> [String: Any] {
    guard let entry = jobEntry(jobId) else {
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "No job with id \"\(jobId)\"."
      ))
    }
    do {
      let payload = try await entry.job.awaitPayload(directory: entry.directory)
      releaseJob(jobId)
      return payload
    } catch {
      let cancelled = wasCancelled(jobId)
      releaseJob(jobId)
      if cancelled {
        throw ArcgisException((
          code: ArcgisErrorCode.jobCancelled,
          message: "The job was cancelled."
        ))
      }
      throw serviceException(error, context: "job")
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoArcgisMapsSdk")

    Events("onJobProgress")

    OnDestroy {
      self.releaseAllJobs()
    }

    AsyncFunction("configure") { (options: ConfigureRecord) in
      let trimmed = options.apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmed.isEmpty, let apiKey = APIKey(trimmed) else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument,
          message: "configure requires a non-empty apiKey."
        ))
      }
      ArcGISEnvironment.apiKey = apiKey
    }

    AsyncFunction("geocode") { (address: String) -> [[String: Any]] in
      do {
        let locator = LocatorTask(url: worldGeocoderURL)
        try await locator.load()
        let results = try await locator.geocode(forSearchText: address)
        return results.map(geocodeResultPayload)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "geocoding")
      }
    }

    AsyncFunction("geocodeOffline") { (locatorPath: String, address: String) -> [[String: Any]] in
      do {
        let locator = LocatorTask(url: URL(fileURLWithPath: locatorPath))
        try await locator.load()
        let results = try await locator.geocode(forSearchText: address)
        return results.map(geocodeResultPayload)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "offline geocoding")
      }
    }

    AsyncFunction("reverseGeocode") { (point: PointRecord) -> [[String: Any]] in
      do {
        let locator = LocatorTask(url: worldGeocoderURL)
        try await locator.load()
        let location = Point(latitude: point.latitude, longitude: point.longitude)
        let results = try await locator.reverseGeocode(forLocation: location)
        return results.map(geocodeResultPayload)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "geocoding")
      }
    }

    AsyncFunction("formatCoordinates") { (point: PointRecord) -> [String: Any] in
      let p = Point(latitude: point.latitude, longitude: point.longitude)
      return [
        "decimalDegrees": CoordinateFormatter.latitudeLongitudeString(
          from: p, format: .decimalDegrees, decimalPlaces: 5),
        "degreesMinutesSeconds": CoordinateFormatter.latitudeLongitudeString(
          from: p, format: .degreesMinutesSeconds, decimalPlaces: 1),
        "usng": CoordinateFormatter.usngString(from: p, precision: 7, addSpaces: true),
        "mgrs": CoordinateFormatter.mgrsString(
          from: p, conversionMode: .automatic, precision: 5, addSpaces: true),
        "utm": CoordinateFormatter.utmString(
          from: p, conversionMode: .latitudeBandIndicators, addSpaces: true),
      ]
    }

    AsyncFunction("getBasemapStyles") { () -> [[String: Any]] in
      do {
        let service = BasemapStylesService()
        try await service.load()
        let stylesInfo = service.info?.stylesInfo ?? []
        return stylesInfo.map { info in
          var entry: [String: Any] = [
            "styleName": info.styleName,
            "name": basemapDisplayName(from: info.styleName),
          ]
          if let url = info.thumbnail?.url { entry["thumbnailUri"] = url.absoluteString }
          return entry
        }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "basemap styles")
      }
    }

    AsyncFunction("searchWebMaps") { (query: String) -> [[String: Any]] in
      do {
        let portal = Portal.arcGISOnline(connection: .anonymous)
        try await portal.load()
        let parameters = PortalQueryParameters.items(ofKinds: [.webMap], searchText: query)
        let resultSet = try await portal.findItems(queryParameters: parameters)
        return resultSet.results.map { item in
          [
            "itemId": item.id?.rawValue ?? "",
            "title": item.title,
            "snippet": item.snippet,
            "owner": item.owner,
          ]
        }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "web map search")
      }
    }

    AsyncFunction("addPortalItem") { (options: AddPortalItemRecord) -> [String: Any] in
      do {
        guard let data = options.json.data(using: .utf8) else {
          throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid json."))
        }
        let portal = Portal.arcGISOnline(connection: .authenticated)
        try await portal.load()
        guard let user = portal.user else {
          throw ArcgisException((
            code: ArcgisErrorCode.authenticationFailed,
            message: "Not signed in. Authenticate a named user first."))
        }
        let item = PortalItem(portal: portal, kind: .featureCollection)
        item.title = options.title
        item.description = options.description
        try await user.add(item, with: .json(data))
        guard let itemID = item.id?.rawValue else {
          throw ArcgisException((
            code: ArcgisErrorCode.nativeFailure, message: "The added item has no id."))
        }
        return ["itemId": itemID]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "add portal item")
      }
    }

    AsyncFunction("createAndSaveMap") { (options: CreateAndSaveMapRecord) -> [String: Any] in
      do {
        guard let style = basemapStyle(from: options.basemap) else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "Invalid basemap."))
        }
        let portal = Portal.arcGISOnline(connection: .authenticated)
        try await portal.load()
        let map = Map(basemapStyle: style)
        try await map.save(
          to: portal, title: options.title, forceSaveToSupportedVersion: false,
          description: options.description, tags: options.tags)
        guard let itemID = map.item?.id?.rawValue else {
          throw ArcgisException((
            code: ArcgisErrorCode.nativeFailure, message: "The saved map has no item id."))
        }
        return ["itemId": itemID]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "save map")
      }
    }

    AsyncFunction("queryMapImageSublayer") {
      (serviceUrl: String, sublayerId: Int, whereClause: String) -> [[String: Any]] in
      do {
        guard let url = URL(string: serviceUrl) else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
        }
        let layer = ArcGISMapImageLayer(url: url)
        try await layer.load()
        guard let sublayer = layer.mapImageSublayers.first(where: { $0.id == sublayerId })
        else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument,
            message: "No sublayer with id \(sublayerId)."))
        }
        try await sublayer.load()
        guard let table = sublayer.table else {
          throw ArcgisException((
            code: ArcgisErrorCode.unsupported,
            message: "Sublayer \(sublayerId) is not queryable."))
        }
        try await table.load()
        let parameters = QueryParameters()
        parameters.whereClause = whereClause.isEmpty ? "1=1" : whereClause
        let result = try await table.queryFeatures(using: parameters)
        return Array(result.features()).map { featurePayload($0) }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "map image sublayer query")
      }
    }

    AsyncFunction("queryFeaturesInTimeExtent") { (options: TimeExtentQueryRecord) -> [[String: Any]] in
      do {
        guard let url = URL(string: options.serviceUrl) else {
          throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
        }
        let table = ServiceFeatureTable(url: url)
        try await table.load()
        let parameters = QueryParameters()
        parameters.timeExtent = TimeExtent(
          startDate: Date(timeIntervalSince1970: options.startTime / 1000),
          endDate: Date(timeIntervalSince1970: options.endTime / 1000))
        if let whereClause = options.whereClause, !whereClause.isEmpty {
          parameters.whereClause = whereClause
        }
        let result = try await table.queryFeatures(using: parameters)
        return Array(result.features()).map { featurePayload($0) }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "time extent query")
      }
    }

    AsyncFunction("computeLineOfSight") { (options: LineOfSightRecord) -> [String: Any] in
      do {
        let field = try await ContinuousField.field(
          fromFilesAt: [URL(fileURLWithPath: options.elevationRasterPath)], bandIndex: 0)
        let observer = Point(
          x: options.observer.longitude, y: options.observer.latitude,
          z: options.observer.altitude ?? 2, spatialReference: .wgs84)
        let target = Point(
          x: options.target.longitude, y: options.target.latitude,
          z: options.target.altitude ?? 2, spatialReference: .wgs84)
        let parameters = LineOfSightParameters()
        parameters.observerTargetPairs = ObserverTargetPairs(
          observers: [LineOfSightPosition(position: observer, heightOrigin: .relative)],
          targets: [LineOfSightPosition(position: target, heightOrigin: .relative)])
        let function = LineOfSightFunction(elevation: field, parameters: parameters)
        let results = try await function.evaluate()
        guard let lineOfSight = results.first else {
          throw ArcgisException((
            code: ArcgisErrorCode.nativeFailure, message: "No line of sight result."))
        }
        var payload: [String: Any] = ["targetVisibility": Double(lineOfSight.targetVisibility)]
        if let visible = serializeGeometry(lineOfSight.visibleLine) { payload["visibleLine"] = visible }
        if let obstructed = serializeGeometry(lineOfSight.notVisibleLine) {
          payload["obstructedLine"] = obstructed
        }
        return payload
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "line of sight")
      }
    }

    AsyncFunction("updateFeatureAttributes") { (options: UpdateFeatureRecord) -> [String: Any] in
      do {
        let (table, feature) = try await loadFeature(
          serviceUrl: options.serviceUrl, objectId: options.objectId)
        for (key, value) in options.attributes {
          switch value {
          case is NSNull: feature.setAttributeValue(nil, forKey: key)
          case let string as String: feature.setAttributeValue(string, forKey: key)
          case let number as NSNumber: feature.setAttributeValue(number, forKey: key)
          default: feature.setAttributeValue(String(describing: value), forKey: key)
          }
        }
        try await table.update(feature)
        let results = try await table.applyEdits()
        for result in results where result.error != nil {
          throw serviceException(result.error!, context: "feature editing")
        }
        return ["objectId": options.objectId]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "feature editing")
      }
    }

    AsyncFunction("queryFeatureAttachments") {
      (serviceUrl: String, objectId: Int) -> [[String: Any]] in
      do {
        let (_, feature) = try await loadFeature(serviceUrl: serviceUrl, objectId: objectId)
        let attachments = try await feature.attachments
        return attachments.map { attachmentPayload($0) }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "attachment query")
      }
    }

    AsyncFunction("addFeatureAttachment") {
      (serviceUrl: String, objectId: Int, name: String, contentType: String, dataBase64: String)
        -> [String: Any] in
      do {
        guard let data = Data(base64Encoded: dataBase64) else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "Invalid base64 data."))
        }
        let (table, feature) = try await loadFeature(serviceUrl: serviceUrl, objectId: objectId)
        let attachment = try await feature.addAttachment(
          named: name, contentType: contentType, data: data)
        _ = try await table.applyEdits()
        return attachmentPayload(attachment)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "add attachment")
      }
    }

    AsyncFunction("deleteFeatureAttachment") {
      (serviceUrl: String, objectId: Int, attachmentId: Int) in
      do {
        let (table, feature) = try await loadFeature(serviceUrl: serviceUrl, objectId: objectId)
        let attachments = try await feature.attachments
        guard let attachment = attachments.first(where: { $0.id == attachmentId }) else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument,
            message: "No attachment with id \(attachmentId)."))
        }
        try await feature.deleteAttachment(attachment)
        _ = try await table.applyEdits()
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "delete attachment")
      }
    }

    AsyncFunction("getServiceLayers") { (type: String, urlString: String) -> [[String: Any]] in
      guard let url = URL(string: urlString) else {
        throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid service url."))
      }
      do {
        switch type {
        case "wms":
          let service = WMSService(url: url)
          try await service.load()
          return (service.serviceInfo?.layerInfos ?? []).map {
            ["id": $0.name, "title": $0.title.isEmpty ? $0.name : $0.title]
          }
        case "wfs":
          let service = WFSService(url: url)
          try await service.load()
          return (service.serviceInfo?.layerInfos ?? []).map {
            ["id": $0.name, "title": $0.title.isEmpty ? $0.name : $0.title]
          }
        case "ogcFeature":
          let service = OGCFeatureService(url: url)
          try await service.load()
          return (service.serviceInfo?.featureCollectionInfos ?? []).map {
            ["id": $0.collectionID, "title": $0.title.isEmpty ? $0.collectionID : $0.title]
          }
        default:
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "Unsupported service type."))
        }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "service browse")
      }
    }

    AsyncFunction("getShapefileInfo") { (path: String) -> [String: Any] in
      let table = ShapefileFeatureTable(fileURL: URL(fileURLWithPath: path))
      do {
        try await table.load()
      } catch {
        throw serviceException(error, context: "shapefile")
      }
      let info = table.info
      return [
        "credits": info?.credits ?? "",
        "description": info?.description ?? "",
        "summary": info?.summary ?? "",
        "tags": info?.tags ?? [],
        "copyrightText": info?.copyrightText ?? "",
      ]
    }

    AsyncFunction("traceUtilityNetwork") { (options: TraceUtilityNetworkRecord) -> [String: Any] in
      do {
        let network = try await loadUtilityNetwork(options.serviceUrl)
        var startingLocations: [UtilityElement] = []
        for selector in options.startingPoints {
          if let element = try await makeUtilityElement(selector, network: network) {
            startingLocations.append(element)
          }
        }
        guard !startingLocations.isEmpty else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "No starting features were found."))
        }
        let traceType: UtilityTraceParameters.TraceType
        switch options.traceType {
        case "subnetwork": traceType = .subnetwork
        case "upstream": traceType = .upstream
        case "downstream": traceType = .downstream
        case "isolation": traceType = .isolation
        case "loops": traceType = .loops
        case "shortestPath": traceType = .shortestPath
        default: traceType = .connected
        }
        let parameters = UtilityTraceParameters(
          traceType: traceType, startingLocations: startingLocations)
        for selector in options.barriers {
          if let element = try await makeUtilityElement(selector, network: network) {
            parameters.addBarrier(element)
          }
        }
        let results = try await network.trace(using: parameters)
        var byAssetGroup: [String: Int] = [:]
        var count = 0
        for result in results {
          guard let elementResult = result as? UtilityElementTraceResult else { continue }
          for element in elementResult.elements {
            count += 1
            byAssetGroup[element.assetGroup.name, default: 0] += 1
          }
        }
        return ["elementCount": count, "byAssetGroup": byAssetGroup]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "utility network")
      }
    }

    AsyncFunction("getUtilityAssociations") { (options: UtilityAssociationsRecord) -> [String: Any] in
      do {
        let network = try await loadUtilityNetwork(options.serviceUrl)
        let extent = Envelope(
          xMin: options.extent.minLongitude, yMin: options.extent.minLatitude,
          xMax: options.extent.maxLongitude, yMax: options.extent.maxLatitude,
          spatialReference: .wgs84)
        let kind: UtilityAssociation.Kind?
        switch options.kind {
        case "connectivity": kind = .connectivity
        case "containment": kind = .containment
        case "attachment": kind = .attachment
        default: kind = nil
        }
        let associations = try await network.associations(forExtent: extent, ofKind: kind)
        var payload: [[String: Any]] = []
        for association in associations {
          var item: [String: Any] = ["kind": utilityAssociationKindName(association.kind)]
          if let geometry = association.geometry,
            let wgs = GeometryEngine.project(geometry, into: .wgs84),
            let serialized = serializeGeometry(wgs) {
            item["geometry"] = serialized
          }
          payload.append(item)
        }
        return ["associations": payload]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "utility network")
      }
    }

    AsyncFunction("validateUtilityNetworkTopology") { (options: ValidateUtilityNetworkRecord) -> [String: Any] in
      do {
        let network = try await loadUtilityNetwork(options.serviceUrl)
        let extent = Envelope(
          xMin: options.extent.minLongitude, yMin: options.extent.minLatitude,
          xMax: options.extent.maxLongitude, yMax: options.extent.maxLatitude,
          spatialReference: .wgs84)
        let job = network.validateNetworkTopology(forExtent: extent)
        job.start()
        let result = try await job.output
        return ["hasErrors": result.hasErrors]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "utility network")
      }
    }

    AsyncFunction("isArSupported") { () -> [String: Any] in
      #if os(iOS)
      if ARWorldTrackingConfiguration.isSupported {
        return ["supported": true]
      }
      return ["supported": false, "reason": "unsupportedDevice"]
      #else
      return ["supported": false, "reason": "unsupportedDevice"]
      #endif
    }

    AsyncFunction("createServiceVersion") { (options: ServiceVersionRecord) -> [String: Any] in
      guard let url = URL(string: options.serviceUrl) else {
        throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
      }
      let serviceGeodatabase = ServiceGeodatabase(url: url)
      do {
        try await serviceGeodatabase.load()
        let parameters = ServiceVersionParameters()
        parameters.name = options.versionName
        if let description = options.description { parameters.description = description }
        switch options.access {
        case "public": parameters.access = .public
        case "protected": parameters.access = .protected
        default: parameters.access = .private
        }
        let info = try await serviceGeodatabase.makeVersion(parameters: parameters)
        try await serviceGeodatabase.switchToVersion(named: info.name)
        return ["versionName": info.name]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "branch version")
      }
    }

    AsyncFunction("getServiceVersions") { (serviceUrl: String) -> [[String: Any]] in
      guard let url = URL(string: serviceUrl) else {
        throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
      }
      let serviceGeodatabase = ServiceGeodatabase(url: url)
      do {
        // Loading a branch-versioned service populates its version list.
        try await serviceGeodatabase.load()
        return try await serviceGeodatabase.versions.map { info in
          [
            "name": info.name,
            "access": accessName(info.access),
            "description": info.description,
            "isOwner": info.isOwner,
          ]
        }
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "branch version")
      }
    }

    AsyncFunction("queryDynamicEntities") { (options: DynamicEntityQueryRecord) -> [String: Any] in
      guard let url = URL(string: options.url) else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument, message: "Invalid stream service url."))
      }
      let service = ArcGISStreamService(url: url)
      do {
        try await service.connect()
        let result: DynamicEntityQueryResult
        if let trackIds = options.trackIds, !trackIds.isEmpty {
          result = try await service.queryDynamicEntities(withTrackIDs: trackIds)
        } else {
          result = try await service.queryDynamicEntities(using: DynamicEntityQueryParameters())
        }
        var entities: [[String: Any]] = []
        for entity in result.entities() {
          var attributes: [String: Any] = [:]
          for (key, value) in entity.attributes {
            attributes[key] = value
          }
          var payload: [String: Any] = ["attributes": attributes]
          if let point = entity.geometry as? Point,
            let wgs = GeometryEngine.project(point, into: .wgs84) as? Point {
            payload["latitude"] = wgs.y
            payload["longitude"] = wgs.x
          }
          entities.append(payload)
        }
        await service.disconnect()
        return ["entities": entities]
      } catch {
        await service.disconnect()
        throw serviceException(error, context: "dynamic entities")
      }
    }

    AsyncFunction("getKmlInfo") { (source: KmlInfoSourceRecord) -> [String: Any] in
      let dataset: KMLDataset
      if let url = source.url, !url.isEmpty, let parsed = URL(string: url) {
        dataset = KMLDataset(url: parsed)
      } else if let path = source.path, !path.isEmpty {
        dataset = KMLDataset(url: URL(fileURLWithPath: path))
      } else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument, message: "getKmlInfo requires a url or path."))
      }
      do {
        try await dataset.load()
      } catch {
        throw serviceException(error, context: "KML")
      }
      var nodes: [[String: Any]] = []
      func walk(_ list: [KMLNode], depth: Int) {
        for node in list {
          nodes.append([
            "name": node.name, "type": kmlNodeType(node), "visible": node.isVisible, "depth": depth,
          ])
          if let container = node as? KMLContainer {
            walk(container.childNodes, depth: depth + 1)
          }
        }
      }
      walk(dataset.rootNodes, depth: 0)
      return ["nodes": nodes]
    }

    AsyncFunction("createKmlFile") { (options: CreateKmlFileRecord) -> [String: Any] in
      let document = KMLDocument()
      for placemarkRecord in options.placemarks {
        let point = Point(
          latitude: placemarkRecord.point.latitude, longitude: placemarkRecord.point.longitude)
        guard let geometry = KMLGeometry(geometry: point, altitudeMode: .clampToGround) else {
          continue
        }
        let placemark = KMLPlacemark(geometry: geometry)
        placemark.name = placemarkRecord.name
        document.addChildNode(placemark)
      }
      if !options.tracks.isEmpty {
        var tracks: [KMLTrack] = []
        for trackRecord in options.tracks {
          var timestamp = Date()
          let elements = trackRecord.points.map { pointRecord -> KMLTrackElement in
            let element = KMLTrackElement(
              when: timestamp,
              coordinate: Point(latitude: pointRecord.latitude, longitude: pointRecord.longitude),
              angle: nil)
            timestamp = timestamp.addingTimeInterval(1)
            return element
          }
          if let track = KMLTrack(elements: elements, altitudeMode: .clampToGround) {
            tracks.append(track)
          }
        }
        let placemark = KMLPlacemark(geometry: KMLMultiTrack(tracks: tracks))
        placemark.name = "Multi-track"
        document.addChildNode(placemark)
      }
      do {
        try await document.save(to: URL(fileURLWithPath: options.path))
      } catch {
        throw serviceException(error, context: "KML")
      }
      return ["path": options.path]
    }

    AsyncFunction("bufferGeometry") { (geometry: GeometryRecord, distanceMeters: Double) in
      guard let input = makeGeometry(from: geometry),
        let result = GeometryEngine.geodeticBuffer(
          around: input, distance: distanceMeters, distanceUnit: .meters, maxDeviation: .nan,
          curveType: .geodesic),
        let serialized = serializeGeometry(result)
      else { throw geometryException("buffer") }
      return serialized
    }

    AsyncFunction("planarBufferGeometry") { (geometry: GeometryRecord, distanceMeters: Double) in
      // Project to Web Mercator so the planar buffer runs in meters, then project
      // the result back to WGS 84. The Web Mercator distortion is intentional —
      // it is what distinguishes a planar buffer from the geodesic one.
      guard let input = makeGeometry(from: geometry),
        let projected = GeometryEngine.project(input, into: .webMercator),
        let buffered = GeometryEngine.buffer(around: projected, distance: distanceMeters),
        let wgs = GeometryEngine.project(buffered, into: .wgs84),
        let serialized = serializeGeometry(wgs)
      else { throw geometryException("planar buffer") }
      return serialized
    }

    AsyncFunction("convexHull") { (geometries: [GeometryRecord]) in
      let inputs = geometries.compactMap { makeGeometry(from: $0) }
      guard let result = GeometryEngine.convexHull(for: inputs, shouldMerge: true).first,
        let serialized = serializeGeometry(result)
      else { throw geometryException("convex hull") }
      return serialized
    }

    AsyncFunction("clipGeometry") { (geometry: GeometryRecord, envelope: EnvelopeRecord) in
      guard let input = makeGeometry(from: geometry) else { throw geometryException("clip") }
      let env = Envelope(
        xMin: envelope.minLongitude, yMin: envelope.minLatitude,
        xMax: envelope.maxLongitude, yMax: envelope.maxLatitude, spatialReference: .wgs84)
      guard let result = GeometryEngine.clip(input, to: env),
        let serialized = serializeGeometry(result)
      else { throw geometryException("clip") }
      return serialized
    }

    AsyncFunction("cutGeometry") { (geometry: GeometryRecord, cutter: GeometryRecord) in
      guard let input = makeGeometry(from: geometry),
        let cutterLine = makeGeometry(from: cutter) as? Polyline
      else { throw geometryException("cut") }
      return GeometryEngine.cut(input, usingCutter: cutterLine).compactMap { serializeGeometry($0) }
    }

    AsyncFunction("projectPoint") { (point: PointRecord, toWkid: Int, transformationName: String?) -> [String: Any] in
      let source = Point(latitude: point.latitude, longitude: point.longitude)
      guard let wkid = WKID(rawValue: toWkid), let target = SpatialReference(wkid: wkid)
      else { throw geometryException("projection") }
      var transformation: DatumTransformation?
      if let name = transformationName, let sourceSR = source.spatialReference {
        transformation = TransformationCatalog.transformations(from: sourceSR, to: target).first {
          $0.name == name
        }
      }
      guard
        let projected = GeometryEngine.project(
          source, into: target, datumTransformation: transformation) as? Point
      else { throw geometryException("projection") }
      return ["x": projected.x, "y": projected.y, "wkid": toWkid]
    }

    AsyncFunction("getTransformations") { (fromWkid: Int, toWkid: Int) -> [[String: Any]] in
      guard let fw = WKID(rawValue: fromWkid), let fromSR = SpatialReference(wkid: fw),
        let tw = WKID(rawValue: toWkid), let toSR = SpatialReference(wkid: tw)
      else { throw geometryException("transformations") }
      return TransformationCatalog.transformations(from: fromSR, to: toSR).map {
        ["name": $0.name, "isMissingProjectionEngineFiles": $0.isMissingProjectionEngineFiles]
      }
    }

    AsyncFunction("createMobileGeodatabase") { (options: CreateGeodatabaseRecord) -> [String: Any] in
      do {
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let fileURL = dir.appendingPathComponent("created-\(UUID().uuidString).geodatabase")
        try? FileManager.default.removeItem(at: fileURL)
        let geodatabase = try await Geodatabase.createEmpty(fileURL: fileURL)
        let geometryType: Geometry.Type =
          options.geometryType == "polyline"
          ? Polyline.self : options.geometryType == "polygon" ? ArcGIS.Polygon.self : Point.self
        let description = TableDescription(
          name: options.tableName, spatialReference: .wgs84, geometryType: geometryType)
        for field in options.fields {
          description.addFieldDescription(
            FieldDescription(name: field.name, fieldType: geodatabaseFieldType(field.type)))
        }
        let table = try await geodatabase.makeTable(description: description)
        try await table.load()
        var count = 0
        if options.geometryType == "point" {
          let points = [
            Point(x: -118, y: 34, spatialReference: .wgs84),
            Point(x: -117, y: 35, spatialReference: .wgs84),
            Point(x: -116, y: 33, spatialReference: .wgs84),
          ]
          for point in points {
            let feature = table.makeFeature()
            feature.geometry = point
            try await table.add(feature)
            count += 1
          }
        }
        geodatabase.close()
        return ["path": fileURL.path, "tableName": options.tableName, "featureCount": count]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "geodatabase creation")
      }
    }

    AsyncFunction("addFeatureWithContingentValues") {
      (options: ContingentFeatureRecord) -> [String: Any] in
      do {
        let geodatabase = Geodatabase(fileURL: URL(fileURLWithPath: options.geodatabasePath))
        try await geodatabase.load()
        guard let table = geodatabase.featureTable(named: options.tableName) else {
          geodatabase.close()
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument,
            message: "No table named \"\(options.tableName)\"."))
        }
        try await table.load()
        try await table.contingentValuesDefinition.load()
        let feature = table.makeFeature()
        for (key, value) in options.attributes {
          switch value {
          case is NSNull: feature.setAttributeValue(nil, forKey: key)
          case let string as String: feature.setAttributeValue(string, forKey: key)
          case let number as NSNumber: feature.setAttributeValue(number, forKey: key)
          default: feature.setAttributeValue(String(describing: value), forKey: key)
          }
        }
        guard let arcgisFeature = feature as? ArcGISFeature else {
          geodatabase.close()
          throw ArcgisException((
            code: ArcgisErrorCode.nativeFailure, message: "Table produced an invalid feature."))
        }
        let violations = table.validateContingencyConstraints(for: arcgisFeature)
        if violations.isEmpty {
          try await table.add(arcgisFeature)
          geodatabase.close()
          return ["added": true, "violations": [String]()]
        }
        geodatabase.close()
        return ["added": false, "violations": violations.map { $0.fieldGroup.name }]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "contingent values")
      }
    }

    AsyncFunction("applyGeodatabaseTransaction") {
      (path: String, tableName: String, addCount: Int, commit: Bool) -> [String: Any] in
      do {
        let geodatabase = Geodatabase(fileURL: URL(fileURLWithPath: path))
        try await geodatabase.load()
        guard let table = geodatabase.featureTable(named: tableName) else {
          geodatabase.close()
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "No table named \"\(tableName)\"."))
        }
        try await table.load()
        try geodatabase.beginTransaction()
        do {
          for index in 0..<addCount {
            let feature = table.makeFeature()
            feature.geometry = Point(
              x: -118 + Double(index) * 0.05, y: 34, spatialReference: .wgs84)
            try await table.add(feature)
          }
        } catch {
          try? geodatabase.rollbackTransaction()
          geodatabase.close()
          throw error
        }
        if commit {
          try geodatabase.commitTransaction()
        } else {
          try geodatabase.rollbackTransaction()
        }
        let count = table.numberOfFeatures
        geodatabase.close()
        return ["committed": commit, "featureCount": count]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "geodatabase transaction")
      }
    }

    AsyncFunction("combineGeometries") {
      (operation: String, a: GeometryRecord, b: GeometryRecord) in
      guard let g1 = makeGeometry(from: a), let g2 = makeGeometry(from: b) else {
        throw geometryException(operation)
      }
      let result: Geometry?
      switch operation {
      case "union": result = GeometryEngine.union(g1, g2)
      case "intersection": result = GeometryEngine.intersection(g1, g2)
      case "difference": result = GeometryEngine.difference(g1, g2)
      case "symmetricDifference": result = GeometryEngine.symmetricDifference(g1, g2)
      default: result = nil
      }
      guard let serialized = serializeGeometry(result) else { throw geometryException(operation) }
      return serialized
    }

    AsyncFunction("geometryRelationships") { (a: GeometryRecord, b: GeometryRecord) -> [String: Any] in
      guard let g1 = makeGeometry(from: a), let g2 = makeGeometry(from: b) else {
        throw geometryException("relationships")
      }
      return [
        "contains": GeometryEngine.isGeometry(g2, within: g1),
        "within": GeometryEngine.isGeometry(g1, within: g2),
        "crosses": GeometryEngine.isGeometry(g1, crossing: g2),
        "disjoint": GeometryEngine.isGeometry(g1, disjointWith: g2),
        "intersects": GeometryEngine.isGeometry(g1, intersecting: g2),
        "overlaps": GeometryEngine.isGeometry(g1, overlapping: g2),
        "touches": GeometryEngine.isGeometry(g1, touching: g2),
      ]
    }

    AsyncFunction("geodesicPath") { (from: PointRecord, to: PointRecord) -> [String: Any] in
      let line = Polyline(
        points: [
          Point(latitude: from.latitude, longitude: from.longitude),
          Point(latitude: to.latitude, longitude: to.longitude),
        ], spatialReference: .wgs84)
      guard
        let densified = GeometryEngine.geodeticDensify(
          line, maxSegmentLength: 100_000, lengthUnit: .meters, curveType: .geodesic),
        let payload = serializeGeometry(densified)
      else { throw geometryException("geodesic path") }
      return payload
    }

    AsyncFunction("geodesicEllipse") { (options: GeodesicEllipseRecord) -> [String: Any] in
      let parameters = GeodesicEllipseParameters<Polygon>(
        axisDirection: options.axisDirectionDegrees,
        center: Point(latitude: options.center.latitude, longitude: options.center.longitude),
        semiAxis1Length: options.semiAxis1LengthMeters,
        semiAxis2Length: options.semiAxis2LengthMeters)
      guard let ellipse = GeometryEngine.geodesicEllipse(parameters: parameters),
        let payload = serializeGeometry(ellipse)
      else { throw geometryException("geodesic ellipse") }
      return payload
    }

    AsyncFunction("geodesicSector") { (options: GeodesicSectorRecord) -> [String: Any] in
      let parameters = GeodesicSectorParameters<Polygon>(
        axisDirection: options.axisDirectionDegrees,
        center: Point(latitude: options.center.latitude, longitude: options.center.longitude),
        sectorAngle: options.sectorAngleDegrees,
        semiAxis1Length: options.semiAxis1LengthMeters,
        semiAxis2Length: options.semiAxis2LengthMeters,
        startDirection: options.startDirectionDegrees)
      guard let sector = GeometryEngine.geodesicSector(parameters: parameters),
        let payload = serializeGeometry(sector)
      else { throw geometryException("geodesic sector") }
      return payload
    }

    AsyncFunction("simplifyGeometry") { (geometry: GeometryRecord) -> [String: Any] in
      guard let g = makeGeometry(from: geometry), let r = GeometryEngine.simplify(g),
        let p = serializeGeometry(r)
      else { throw geometryException("simplify") }
      return p
    }

    AsyncFunction("densifyGeometry") { (geometry: GeometryRecord, maxSegmentLength: Double) -> [String: Any] in
      guard let g = makeGeometry(from: geometry),
        let r = GeometryEngine.densify(g, maxSegmentLength: maxSegmentLength),
        let p = serializeGeometry(r)
      else { throw geometryException("densify") }
      return p
    }

    AsyncFunction("generalizeGeometry") { (geometry: GeometryRecord, maxDeviation: Double) -> [String: Any] in
      guard let g = makeGeometry(from: geometry),
        let r = GeometryEngine.generalize(g, maxDeviation: maxDeviation, removeDegenerateParts: true),
        let p = serializeGeometry(r)
      else { throw geometryException("generalize") }
      return p
    }

    AsyncFunction("nearestVertex") { (geometry: GeometryRecord, point: PointRecord) -> [String: Any] in
      guard let g = makeGeometry(from: geometry),
        let result = GeometryEngine.nearestVertex(
          in: g, to: Point(latitude: point.latitude, longitude: point.longitude))
      else { throw geometryException("nearest vertex") }
      let wgs = (GeometryEngine.project(result.coordinate, into: .wgs84) as? Point) ?? result.coordinate
      return ["point": ["latitude": wgs.y, "longitude": wgs.x], "distance": result.distance]
    }

    AsyncFunction("solveRoute") { (stops: [PointRecord], barriers: [GeometryRecord]) -> [String: Any] in
      do {
        let routeTask = RouteTask(url: worldRouteURL)
        // Load the task first so an authorization failure surfaces as the real
        // load error, not a downstream generic "object failed to load".
        try await routeTask.load()
        let parameters = try await routeTask.makeDefaultParameters()
        // Required for the service to compute total distance/time on the route.
        parameters.returnsDirections = true
        parameters.setStops(
          stops.map { Stop(point: Point(latitude: $0.latitude, longitude: $0.longitude)) }
        )
        let polygonBarriers = barriers
          .compactMap { makeGeometry(from: $0) as? ArcGIS.Polygon }
          .map { PolygonBarrier(polygon: $0) }
        if !polygonBarriers.isEmpty {
          parameters.setPolygonBarriers(polygonBarriers)
        }
        let result = try await routeTask.solveRoute(using: parameters)
        guard let route = result.routes.first else {
          throw ArcgisException((code: ArcgisErrorCode.nativeFailure, message: "No route found."))
        }
        return routePayload(route)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "routing")
      }
    }

    AsyncFunction("solveRouteInNetwork") {
      (geodatabasePath: String, networkName: String, stops: [PointRecord]) -> [String: Any] in
      do {
        let routeTask = RouteTask(
          pathToDatabaseURL: URL(fileURLWithPath: geodatabasePath), networkName: networkName)
        try await routeTask.load()
        let parameters = try await routeTask.makeDefaultParameters()
        parameters.returnsDirections = true
        parameters.setStops(
          stops.map { Stop(point: Point(latitude: $0.latitude, longitude: $0.longitude)) })
        let result = try await routeTask.solveRoute(using: parameters)
        guard let route = result.routes.first else {
          throw ArcgisException((code: ArcgisErrorCode.nativeFailure, message: "No route found."))
        }
        return routePayload(route)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "offline routing")
      }
    }

    AsyncFunction("findClosestFacility") { (incident: PointRecord, facilities: [PointRecord]) -> [String: Any] in
      do {
        let task = ClosestFacilityTask(url: worldClosestFacilityURL)
        try await task.load()
        let parameters = try await task.makeDefaultParameters()
        parameters.setIncidents([
          Incident(point: Point(latitude: incident.latitude, longitude: incident.longitude))
        ])
        parameters.setFacilities(
          facilities.map { Facility(point: Point(latitude: $0.latitude, longitude: $0.longitude)) })
        let result = try await task.solveClosestFacility(using: parameters)
        guard let facilityIndex = result.rankedIndexesOfFacilities(forIncidentAtIndex: 0).first,
          let route = result.route(toFacilityAtIndex: facilityIndex, fromIncidentAtIndex: 0)
        else {
          throw ArcgisException((
            code: ArcgisErrorCode.nativeFailure, message: "No reachable facility."))
        }
        var path: [[String: Double]] = []
        if let geometry = route.routeGeometry,
          let wgs = GeometryEngine.project(geometry, into: .wgs84) as? Polyline
        {
          for part in wgs.parts {
            for point in part.points { path.append(["latitude": point.y, "longitude": point.x]) }
          }
        }
        return [
          "facilityIndex": facilityIndex,
          "distanceMeters": route.totalLength.converted(to: .meters).value,
          "travelTimeMinutes": route.totalTime / 60,
          "path": path,
        ]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "closest facility")
      }
    }

    AsyncFunction("findClosestFacilities") { (incidents: [PointRecord], facilities: [PointRecord]) -> [[String: Any]] in
      do {
        let task = ClosestFacilityTask(url: worldClosestFacilityURL)
        try await task.load()
        let parameters = try await task.makeDefaultParameters()
        parameters.setIncidents(
          incidents.map { Incident(point: Point(latitude: $0.latitude, longitude: $0.longitude)) })
        parameters.setFacilities(
          facilities.map { Facility(point: Point(latitude: $0.latitude, longitude: $0.longitude)) })
        let result = try await task.solveClosestFacility(using: parameters)
        var routes: [[String: Any]] = []
        for incidentIndex in incidents.indices {
          guard
            let facilityIndex = result.rankedIndexesOfFacilities(forIncidentAtIndex: incidentIndex)
              .first,
            let route = result.route(
              toFacilityAtIndex: facilityIndex, fromIncidentAtIndex: incidentIndex)
          else { continue }
          var path: [[String: Double]] = []
          if let geometry = route.routeGeometry,
            let wgs = GeometryEngine.project(geometry, into: .wgs84) as? Polyline
          {
            for part in wgs.parts {
              for point in part.points { path.append(["latitude": point.y, "longitude": point.x]) }
            }
          }
          routes.append([
            "incidentIndex": incidentIndex,
            "facilityIndex": facilityIndex,
            "distanceMeters": route.totalLength.converted(to: .meters).value,
            "travelTimeMinutes": route.totalTime / 60,
            "path": path,
          ])
        }
        return routes
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "closest facility")
      }
    }

    AsyncFunction("findServiceArea") { (facility: PointRecord, breaksMinutes: [Double]) -> [String: Any] in
      do {
        let task = ServiceAreaTask(url: worldServiceAreaURL)
        try await task.load()
        let parameters = try await task.makeDefaultParameters()
        parameters.setFacilities([
          ServiceAreaFacility(
            point: Point(latitude: facility.latitude, longitude: facility.longitude))
        ])
        // Largest cutoff first so smaller areas draw on top of larger ones.
        parameters.removeAllDefaultImpedanceCutoffs()
        parameters.addDefaultImpedanceCutoffs(breaksMinutes.sorted(by: >))
        let result = try await task.solveServiceArea(using: parameters)
        let polygons = result.resultPolygons(forFacilityAtIndex: 0)
          .compactMap { serializeGeometry($0.geometry) }
        return ["polygons": polygons]
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "service area")
      }
    }

    AsyncFunction("findServiceAreas") { (facilities: [PointRecord], breaksMinutes: [Double]) -> [[String: Any]] in
      do {
        let task = ServiceAreaTask(url: worldServiceAreaURL)
        try await task.load()
        let parameters = try await task.makeDefaultParameters()
        parameters.setFacilities(
          facilities.map {
            ServiceAreaFacility(point: Point(latitude: $0.latitude, longitude: $0.longitude))
          })
        // Largest cutoff first so smaller areas draw on top of larger ones.
        parameters.removeAllDefaultImpedanceCutoffs()
        parameters.addDefaultImpedanceCutoffs(breaksMinutes.sorted(by: >))
        let result = try await task.solveServiceArea(using: parameters)
        var areas: [[String: Any]] = []
        for facilityIndex in facilities.indices {
          let polygons = result.resultPolygons(forFacilityAtIndex: facilityIndex)
            .compactMap { serializeGeometry($0.geometry) }
          areas.append(["facilityIndex": facilityIndex, "polygons": polygons])
        }
        return areas
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "service area")
      }
    }

    AsyncFunction("authenticate") { (options: AuthenticateRecord) -> [String: Any] in
      let portalURL = options.portalUrl.flatMap { URL(string: $0) } ?? defaultPortalURL
      let credential = try await TokenCredential.credential(
        for: portalURL,
        username: options.username,
        password: options.password
      )
      await ArcGISEnvironment.authenticationManager.arcGISCredentialStore.add(credential)
      let portal = Portal(url: portalURL, connection: .authenticated)
      try await portal.load()
      return portalUserPayload(portal.user)
    }

    AsyncFunction("authenticateWithOAuth") { (options: OAuthAuthenticateRecord) -> [String: Any] in
      do {
        guard let portalURL = URL(string: options.portalUrl) else {
          throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid portalUrl."))
        }
        guard let redirectURL = URL(string: options.redirectUri) else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument, message: "Invalid redirectUri."))
        }
        let configuration = OAuthUserConfiguration(
          portalURL: portalURL, clientID: options.clientId, redirectURL: redirectURL)
        // Presents the ArcGIS sign-in page via ASWebAuthenticationSession and
        // exchanges the redirect for a credential; cancellation throws.
        let credential = try await OAuthUserCredential.credential(for: configuration)
        await ArcGISEnvironment.authenticationManager.arcGISCredentialStore.add(credential)
        let portal = Portal(url: portalURL, connection: .authenticated)
        try await portal.load()
        return portalUserPayload(portal.user)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "authentication")
      }
    }

    AsyncFunction("authenticateWithIWA") { (options: IwaAuthenticateRecord) -> [String: Any] in
      do {
        guard let portalURL = URL(string: options.portalUrl), let host = portalURL.host else {
          throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid portalUrl."))
        }
        let credential = NetworkCredential.password(
          username: options.username, password: options.password)
        ArcGISEnvironment.authenticationManager.networkAuthenticationChallengeHandler =
          SingleHostNetworkChallengeHandler(host: host, credential: credential)
        // Loading an IWA-protected portal triggers the NTLM/Negotiate challenge,
        // which the handler answers with the Windows credential.
        let portal = Portal(url: portalURL, connection: .authenticated)
        try await portal.load()
        return portalUserPayload(portal.user)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "authentication")
      }
    }

    AsyncFunction("authenticateWithPKI") { (options: PkiAuthenticateRecord) -> [String: Any] in
      do {
        guard let portalURL = URL(string: options.portalUrl), let host = portalURL.host else {
          throw ArcgisException((code: ArcgisErrorCode.invalidArgument, message: "Invalid portalUrl."))
        }
        guard let certificatePath = options.certificatePath else {
          throw ArcgisException((
            code: ArcgisErrorCode.invalidArgument,
            message: "iOS PKI authentication requires a certificatePath."))
        }
        let credential = try NetworkCredential.certificate(
          at: URL(fileURLWithPath: certificatePath), password: options.password ?? "")
        ArcGISEnvironment.authenticationManager.networkAuthenticationChallengeHandler =
          SingleHostNetworkChallengeHandler(host: host, credential: credential)
        let portal = Portal(url: portalURL, connection: .authenticated)
        try await portal.load()
        return portalUserPayload(portal.user)
      } catch let error as ArcgisException {
        throw error
      } catch {
        throw serviceException(error, context: "authentication")
      }
    }

    AsyncFunction("signOut") {
      await ArcGISEnvironment.authenticationManager.arcGISCredentialStore.removeAll()
    }

    AsyncFunction("startGeoprocessingJob") { (options: GeoprocessingJobRecord) -> String in
      guard let url = URL(string: options.serviceUrl) else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument, message: "Invalid serviceUrl."))
      }
      let task = GeoprocessingTask(url: url)
      // The service dictates the execution type (sync/async); default parameters
      // carry it, then the caller's inputs are bound by name.
      let parameters = try await task.makeDefaultParameters()
      for input in options.inputs {
        switch input.type {
        case "string":
          parameters.setInputValue(
            GeoprocessingString(value: input.stringValue ?? ""), forKey: input.name)
        case "double":
          parameters.setInputValue(
            GeoprocessingDouble(value: input.doubleValue ?? 0), forKey: input.name)
        case "point":
          guard let p = input.point else { continue }
          let table = FeatureCollectionTable(
            fields: [], geometryType: Point.self, spatialReference: .wgs84)
          let feature = table.makeFeature(
            geometry: Point(latitude: p.latitude, longitude: p.longitude))
          try? await table.add(feature)
          parameters.setInputValue(GeoprocessingFeatures(features: table), forKey: input.name)
        default: continue
        }
      }
      let id = self.nextJobId()
      let job = task.makeJob(parameters: parameters)
      self.launchJob(id, job, directory: FileManager.default.temporaryDirectory)
      return id
    }

    AsyncFunction("startGenerateGeodatabaseJob") { (options: GenerateGeodatabaseRecord) -> String in
      guard let serviceURL = URL(string: options.featureServiceUrl) else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument,
          message: "Invalid featureServiceUrl."
        ))
      }
      let syncTask = GeodatabaseSyncTask(url: serviceURL)
      let area = options.areaOfInterest
      let envelope = Envelope(
        xMin: area.minLongitude,
        yMin: area.minLatitude,
        xMax: area.maxLongitude,
        yMax: area.maxLatitude,
        spatialReference: .wgs84
      )
      let parameters = try await syncTask.makeDefaultGenerateGeodatabaseParameters(
        extent: envelope
      )
      let id = self.nextJobId()
      let fileURL = FileManager.default.temporaryDirectory
        .appendingPathComponent("\(id)-\(UUID().uuidString).geodatabase")
      let job = syncTask.makeGenerateGeodatabaseJob(
        parameters: parameters,
        downloadFileURL: fileURL
      )
      self.launchJob(id, job, directory: fileURL)
      return id
    }

    AsyncFunction("startSyncGeodatabaseJob") { (options: SyncGeodatabaseRecord) -> String in
      guard let serviceURL = URL(string: options.featureServiceUrl) else {
        throw ArcgisException((
          code: ArcgisErrorCode.invalidArgument,
          message: "Invalid featureServiceUrl."
        ))
      }
      let geodatabase = Geodatabase(fileURL: URL(fileURLWithPath: options.path))
      try await geodatabase.load()
      let syncTask = GeodatabaseSyncTask(url: serviceURL)
      let parameters = try await syncTask.makeDefaultSyncGeodatabaseParameters(
        geodatabase: geodatabase
      )
      let id = self.nextJobId()
      let job = syncTask.makeSyncGeodatabaseJob(
        parameters: parameters,
        geodatabase: geodatabase
      )
      self.launchJob(id, job, directory: URL(fileURLWithPath: options.path))
      return id
    }

    AsyncFunction("awaitJob") { (jobId: String) -> [String: Any] in
      try await self.awaitJobPayload(jobId)
    }

    AsyncFunction("cancelJob") { (jobId: String) in
      // Idempotent: cancelling an unknown/finished job is a no-op.
      if let entry = self.jobEntry(jobId) {
        self.markCancelled(jobId)
        await entry.job.cancel()
      }
    }

    View(ExpoArcgisMapView.self) {
      Events(
        "onMapLoad", "onMapError", "onSingleTap", "onViewpointChange", "onLocationUpdate",
        "onDrawStatusChange", "onLayerViewStateChange", "onNavigationStatus",
        "onGeotriggerNotification")

      Prop("map") { (view: ExpoArcgisMapView, map: MapSourceRecord) in
        view.setMapSource(map)
      }

      Prop("interactionEnabled") { (view: ExpoArcgisMapView, enabled: Bool) in
        view.setInteractionEnabled(enabled)
      }

      Prop("scaleBar") { (view: ExpoArcgisMapView, enabled: Bool) in
        view.setScaleBarEnabled(enabled)
      }

      Prop("grid") { (view: ExpoArcgisMapView, grid: String) in
        view.setGrid(grid)
      }

      Prop("locationDisplay") { (view: ExpoArcgisMapView, record: LocationDisplayRecord?) in
        view.setLocationDisplay(record)
      }

      AsyncFunction("setViewpoint") {
        (view: ExpoArcgisMapView, viewpoint: ViewpointRecord, options: ViewpointAnimationRecord?) in
        await view.setViewpoint(viewpoint, animation: options)
      }

      AsyncFunction("identify") { (view: ExpoArcgisMapView, options: IdentifyOptionsRecord) in
        await view.identify(options)
      }

      AsyncFunction("showPopup") { (view: ExpoArcgisMapView, options: IdentifyOptionsRecord) in
        await view.showPopup(options)
      }

      AsyncFunction("showFeatureForm") { (view: ExpoArcgisMapView, options: IdentifyOptionsRecord) in
        await view.showFeatureForm(options)
      }

      AsyncFunction("evaluateArcade") {
        (view: ExpoArcgisMapView, options: ArcadeEvaluationOptionsRecord) in
        await view.evaluateArcade(options)
      }

      AsyncFunction("startGeometryEditor") {
        (view: ExpoArcgisMapView, options: GeometryEditorRecord) in
        view.startGeometryEditor(options)
      }

      AsyncFunction("stopGeometryEditor") { (view: ExpoArcgisMapView) -> [String: Any]? in
        view.stopGeometryEditor()
      }

      AsyncFunction("startNavigation") { (view: ExpoArcgisMapView, options: StartNavigationRecord) in
        try await view.startNavigation(options)
      }

      AsyncFunction("stopNavigation") { (view: ExpoArcgisMapView) in
        view.stopNavigation()
      }

      AsyncFunction("queryFeatures") {
        (view: ExpoArcgisMapView, options: FeatureQueryOptionsRecord) in
        try await view.queryFeatures(options)
      }

      AsyncFunction("selectFeatures") { (view: ExpoArcgisMapView, options: LayerWhereRecord) in
        try await view.selectFeatures(options)
      }

      AsyncFunction("clearSelection") { (view: ExpoArcgisMapView, layerId: String) in
        view.clearSelection(layerId)
      }

      AsyncFunction("controlKmlTour") { (view: ExpoArcgisMapView, options: KmlTourOptionsRecord) in
        try await view.controlKmlTour(options)
      }

      AsyncFunction("queryFeatureExtent") { (view: ExpoArcgisMapView, options: LayerWhereRecord) in
        try await view.queryFeatureExtent(options)
      }

      AsyncFunction("queryRelatedFeatures") {
        (view: ExpoArcgisMapView, options: RelatedFeaturesOptionsRecord) in
        try await view.queryRelatedFeatures(options)
      }

      AsyncFunction("queryStatistics") {
        (view: ExpoArcgisMapView, options: StatisticsQueryOptionsRecord) in
        try await view.queryStatistics(options)
      }

      AsyncFunction("applyEdits") {
        (view: ExpoArcgisMapView, options: ApplyEditsOptionsRecord) in
        do {
          return try await view.applyEdits(options)
        } catch let error as ArcgisException {
          throw error
        } catch {
          throw serviceException(error, context: "feature editing")
        }
      }

      AsyncFunction("exportImage") { (view: ExpoArcgisMapView) in
        do {
          return try await view.exportImage()
        } catch let error as ArcgisException {
          throw error
        } catch {
          throw serviceException(error, context: "map image export")
        }
      }
    }

    View(ExpoArcgisSceneView.self) {
      Events("onSceneLoad", "onSceneError", "onSingleTap")

      Prop("scene") { (view: ExpoArcgisSceneView, scene: SceneSourceRecord) in
        view.setSceneSource(scene)
      }

      AsyncFunction("setCamera") {
        (view: ExpoArcgisSceneView, camera: CameraRecord, options: ViewpointAnimationRecord?) in
        await view.setCamera(camera, animation: options)
      }

      AsyncFunction("getSurfaceElevation") { (view: ExpoArcgisSceneView, point: PointRecord) in
        try await view.getSurfaceElevation(point)
      }

      AsyncFunction("selectSceneFeatures") {
        (view: ExpoArcgisSceneView, options: IdentifyOptionsRecord) in
        await view.selectSceneFeatures(options)
      }

      AsyncFunction("clearSceneSelection") { (view: ExpoArcgisSceneView) in
        view.clearSceneSelection()
      }
    }

    View(ExpoArcgisArView.self) {
      Events("onSceneLoad", "onSceneError", "onSingleTap", "onTrackingStateChange", "onArError")

      Prop("scene") { (view: ExpoArcgisArView, scene: SceneSourceRecord) in
        view.setSceneSource(scene)
      }
      Prop("mode") { (view: ExpoArcgisArView, mode: String) in
        view.setMode(mode)
      }
      Prop("trackingMode") { (view: ExpoArcgisArView, mode: String?) in
        view.setTrackingMode(mode)
      }
      Prop("anchor") { (view: ExpoArcgisArView, anchor: PointRecord?) in
        view.setAnchor(anchor)
      }
      Prop("initialCamera") { (view: ExpoArcgisArView, camera: CameraRecord?) in
        view.setInitialCamera(camera)
      }
      Prop("translationFactor") { (view: ExpoArcgisArView, factor: Double?) in
        view.setTranslationFactor(factor)
      }
      Prop("clippingDistanceMeters") { (view: ExpoArcgisArView, meters: Double?) in
        view.setClippingDistance(meters)
      }
      Prop("calibrationVisible") { (view: ExpoArcgisArView, visible: Bool?) in
        view.setCalibrationVisible(visible)
      }

      AsyncFunction("getCurrentCamera") { (view: ExpoArcgisArView) -> [String: Any] in
        try view.getCurrentCamera()
      }
    }
  }
}
