import ArcGIS
import ExpoModulesCore
import SwiftUI

/// Hosts the SwiftUI ArcGIS `MapView` (via `UIHostingController`) inside the
/// UIKit `ExpoView`, and bridges declarative props + events + imperative
/// view functions.
///
/// Scope: basemap + initial viewpoint + feature layers + graphics + load/error
/// + viewpoint-change events + `setViewpoint`. Web maps, tap events and
/// `identify` are later Milestone 2 work.
class ExpoArcgisMapView: ExpoView {
  let onMapLoad = EventDispatcher()
  let onMapError = EventDispatcher()
  let onSingleTap = EventDispatcher()
  let onViewpointChange = EventDispatcher()
  let onLocationUpdate = EventDispatcher()
  let onDrawStatusChange = EventDispatcher()
  let onLayerViewStateChange = EventDispatcher()
  let onNavigationStatus = EventDispatcher()
  let onGeotriggerNotification = EventDispatcher()

  private let model = MapViewModel()
  private var hostingController: UIHostingController<MapContainerView>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true

    model.onLoad = { [weak self] wkid in
      self?.onMapLoad(["spatialReferenceWkid": wkid])
    }
    model.onError = { [weak self] payload in
      self?.onMapError(payload)
    }
    model.onViewpointChange = { [weak self] payload in
      self?.onViewpointChange(payload)
    }
    model.onSingleTap = { [weak self] payload in
      self?.onSingleTap(payload)
    }
    model.onLocationUpdate = { [weak self] payload in
      self?.onLocationUpdate(payload)
    }
    model.onDrawStatusChange = { [weak self] payload in
      self?.onDrawStatusChange(payload)
    }
    model.onLayerViewStateChange = { [weak self] payload in
      self?.onLayerViewStateChange(payload)
    }
    model.onNavigationStatus = { [weak self] payload in
      self?.onNavigationStatus(payload)
    }
    model.onGeotrigger = { [weak self] payload in
      self?.onGeotriggerNotification(payload)
    }

    let controller = UIHostingController(rootView: MapContainerView(model: model))
    controller.view.frame = bounds
    controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    controller.view.backgroundColor = .clear
    addSubview(controller.view)
    hostingController = controller
  }

  func setMapSource(_ source: MapSourceRecord) {
    model.apply(source: source)
  }

  func setInteractionEnabled(_ enabled: Bool) {
    model.interactionEnabled = enabled
  }

  func setScaleBarEnabled(_ enabled: Bool) {
    model.scaleBarEnabled = enabled
  }

  func setGrid(_ value: String) {
    model.grid = makeGrid(from: value)
  }

  func setLocationDisplay(_ record: LocationDisplayRecord?) {
    model.setLocationDisplay(record)
  }

  /// Animates (or jumps) to a viewpoint; resolves once applied.
  func setViewpoint(_ record: ViewpointRecord, animation: ViewpointAnimationRecord?) async {
    await model.setViewpoint(record, animation: animation)
  }

  /// Hit-tests layers/graphics at a screen point; returns serializable results.
  func identify(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    await model.identify(options)
  }

  /// Identifies features at a screen point and returns their evaluated popups.
  func showPopup(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    await model.showPopup(options)
  }

  /// Identifies features at a screen point and returns their editing forms.
  func showFeatureForm(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    await model.showFeatureForm(options)
  }

  /// Identifies features at a screen point and evaluates an Arcade expression.
  func evaluateArcade(_ options: ArcadeEvaluationOptionsRecord) async -> [[String: Any]] {
    await model.evaluateArcade(options)
  }

  /// Starts the interactive geometry editor with the given tool/type.
  func startGeometryEditor(_ options: GeometryEditorRecord) {
    model.startGeometryEditor(options)
  }

  /// Stops the geometry editor and returns the drawn geometry (WGS 84) or nil.
  func stopGeometryEditor() -> [String: Any]? {
    model.stopGeometryEditor()
  }

  /// Starts turn-by-turn navigation along a route through the given stops.
  func startNavigation(_ options: StartNavigationRecord) async throws {
    try await model.startNavigation(options.stops, reroute: options.reroute)
  }

  /// Stops navigation and the simulated location display.
  func stopNavigation() {
    model.stopNavigation()
  }

  /// Queries features from a feature layer by where clause.
  func queryFeatures(_ options: FeatureQueryOptionsRecord) async throws -> [[String: Any]] {
    try await model.queryFeatures(options)
  }

  func selectFeatures(_ options: LayerWhereRecord) async throws -> Int {
    try await model.selectFeatures(options)
  }

  func clearSelection(_ layerId: String) {
    model.clearSelection(layerId)
  }

  func controlKmlTour(_ options: KmlTourOptionsRecord) async throws {
    try await model.controlKmlTour(layerId: options.layerId, action: options.action)
  }

  func queryFeatureExtent(_ options: LayerWhereRecord) async throws -> [String: Any] {
    try await model.queryFeatureExtent(options)
  }

  func queryRelatedFeatures(_ options: RelatedFeaturesOptionsRecord) async throws -> [[String: Any]] {
    try await model.queryRelatedFeatures(options)
  }

  func queryStatistics(_ options: StatisticsQueryOptionsRecord) async throws -> [[String: Any]] {
    try await model.queryStatistics(options)
  }

  /// Applies feature adds/updates/deletes to a layer's service table.
  func applyEdits(_ options: ApplyEditsOptionsRecord) async throws -> [String: Any] {
    try await model.applyEdits(options)
  }

  /// Exports the current map view as a PNG; returns its file URI + pixel size.
  func exportImage() async throws -> [String: Any] {
    try await model.exportImage()
  }

  /// Full teardown; invoked from the module's OnViewDestroys hook.
  func dispose() {
    model.dispose()
    hostingController?.view.removeFromSuperview()
    hostingController = nil
  }
}

// MARK: - 3D scene view (minimal foundation)

/// World elevation service (Terrain3D) used for the scene's base surface.
private let worldElevationURL = URL(
  string: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer"
)!

/// Owns the ArcGIS 3D `Scene` and drives loading off the JS thread. Mirrors
/// `MapViewModel` but for the initial 3D foundation (basemap + elevation +
/// scene layers + camera).
@MainActor
final class SceneViewModel: ObservableObject {
  @Published var scene: ArcGIS.Scene?
  @Published var atmosphereEffect: SceneView.AtmosphereEffect = .horizonOnly
  @Published var sunLighting: SceneView.SunLighting = .off
  @Published var cameraController: CameraController = GlobeCameraController()
  // Graphics overlays live on the `SceneView`, not the scene, so they are
  // published for `SceneContainerView` to pass into the view.
  @Published var graphicsOverlaysList: [GraphicsOverlay] = []
  // Analysis overlays (viewshed / line-of-sight) are likewise SceneView-level.
  @Published var analysisOverlaysList: [AnalysisOverlay] = []
  private var analysesSignature = ""
  // Viewsheds that track the scene camera / follow interactive taps; updated
  // outside the reconcile by `updateCameraViewsheds` / `handleSceneTap`.
  private var cameraViewsheds: [ExploratoryLocationViewshed] = []
  private var interactiveViewsheds: [ExploratoryLocationViewshed] = []
  // Animated image overlays (SceneView-level) plus their animation state.
  @Published var imageOverlaysList: [ImageOverlay] = []
  private var imageOverlaySignature = ""
  private var animatedOverlays: [(overlay: ImageOverlay, frames: [ImageFrame])] = []
  private var imageFrameIndex = 0
  private var imageAnimationTimer: Timer?

  var onLoad: ((Int) -> Void)?
  var onError: (([String: Any]) -> Void)?
  var onSceneTap: (([String: Any]) -> Void)?

  var sceneProxy: SceneViewProxy?
  private var loadTask: Task<Void, Never>?
  private var currentSceneKey: String?
  // Labels to apply to named layers once the current web scene finishes loading.
  private var webSceneLayerLabels: [WebSceneLayerLabelsRecord] = []
  private var sceneLayers: [String: Layer] = [:]
  private var sceneLayerURLs: [String: String] = [:]
  private var graphicsOverlays: [String: GraphicsOverlay] = [:]
  private var overlaySignatures: [String: String] = [:]
  private var sceneFeatureLayers: [String: FeatureLayer] = [:]
  private var sceneFeatureLayerSignatures: [String: String] = [:]

  func apply(source: SceneSourceRecord) {
    // Scene-view environment settings apply regardless of scene rebuild.
    switch source.atmosphereEffect {
    case "off": atmosphereEffect = .off
    case "realistic": atmosphereEffect = .realistic
    case "horizonOnly": atmosphereEffect = .horizonOnly
    default: break
    }
    switch source.sunLighting {
    case "light": sunLighting = .light
    case "lightAndShadows": sunLighting = .lightAndShadows
    case "off": sunLighting = .off
    default: break
    }
    if let controllerRecord = source.cameraController {
      let target = Point(
        latitude: controllerRecord.target.latitude, longitude: controllerRecord.target.longitude)
      cameraController = OrbitLocationCameraController(
        target: target, distance: controllerRecord.distanceMeters)
    } else {
      cameraController = GlobeCameraController()
    }

    // A mobile scene package or web scene is rebuilt when its path/item changes;
    // a basemap scene when its basemap or viewing mode changes.
    let mspkPath = source.mobileScenePackagePath?.isEmpty == false ? source.mobileScenePackagePath : nil
    let webSceneID = source.webSceneItemId?.isEmpty == false ? source.webSceneItemId : nil
    let sceneKey: String
    if let mspkPath {
      sceneKey = "mspk:\(mspkPath)"
    } else if let webSceneID {
      sceneKey = "item:\(webSceneID)"
    } else {
      sceneKey = "basemap:\(source.basemap):\(source.viewingMode ?? "global")"
    }

    if scene == nil || sceneKey != currentSceneKey {
      currentSceneKey = sceneKey
      sceneLayers.removeAll()
      sceneLayerURLs.removeAll()
      graphicsOverlays.removeAll()
      overlaySignatures.removeAll()
      graphicsOverlaysList = []
      sceneFeatureLayers.removeAll()
      sceneFeatureLayerSignatures.removeAll()
      analysisOverlaysList = []
      analysesSignature = ""

      if let mspkPath {
        // The package loads asynchronously; start with an empty scene and swap in
        // the package's first scene (which carries its own basemap, layers, and
        // camera) once loaded. `scene` is @Published, so the view updates.
        scene = ArcGIS.Scene()
        loadMobileScenePackage(path: mspkPath, key: sceneKey)
      } else {
        let newScene: ArcGIS.Scene
        if let webSceneID {
          guard let itemID = PortalItem.ID(webSceneID) else {
            onError?(arcgisErrorPayload(ArcgisErrorCode.invalidArgument, "Invalid webSceneItemId."))
            return
          }
          let item = PortalItem(portal: .arcGISOnline(connection: .anonymous), id: itemID)
          newScene = ArcGIS.Scene(item: item)
          webSceneLayerLabels = source.webSceneLayerLabels
        } else {
          webSceneLayerLabels = []
          guard let style = basemapStyle(from: source.basemap) else {
            onError?(
              arcgisErrorPayload(ArcgisErrorCode.invalidArgument, "Unsupported basemap style."))
            return
          }
          let viewingMode: ArcGIS.Scene.ViewingMode =
            source.viewingMode == "local" ? .local : .global
          newScene = ArcGIS.Scene(viewingMode: viewingMode, basemap: Basemap(style: style))
          // Explicit elevation sources replace the default world surface; each
          // is added in order. Otherwise fall back to world elevation.
          let explicitSources = source.elevationSources.compactMap(Self.makeElevationSource)
          if !explicitSources.isEmpty {
            let surface = Surface()
            explicitSources.forEach { surface.addElevationSource($0) }
            newScene.baseSurface = surface
          } else if source.elevationEnabled {
            let surface = Surface()
            surface.addElevationSource(ArcGISTiledElevationSource(url: worldElevationURL))
            newScene.baseSurface = surface
          }
          if let exaggeration = source.terrainExaggeration {
            newScene.baseSurface.elevationExaggeration = Float(exaggeration)
          }
          switch source.surfaceNavigationConstraint {
          case "stayAbove": newScene.baseSurface.navigationConstraint = .stayAbove
          case "none": newScene.baseSurface.navigationConstraint = .unconstrained
          default: break
          }
        }
        if let cameraRecord = source.initialCamera {
          let camera = makeCamera(cameraRecord)
          newScene.initialViewpoint = Viewpoint(boundingGeometry: camera.location, camera: camera)
        }
        scene = newScene
        load(newScene)
      }
    }
    // Only a basemap scene reconciles JS-declared scene layers; a web scene or
    // mobile scene package owns its operational layers.
    if let scene, webSceneID == nil, mspkPath == nil {
      reconcileSceneLayers(source.sceneLayers, on: scene)
      reconcileSceneFeatureLayers(source.featureLayers, on: scene)
      reconcileGraphicsOverlays(source.graphicsOverlays)
      reconcileAnalyses(source.analyses)
    }
    // Image overlays are SceneView-level and independent of the scene's layers,
    // so they reconcile for any scene source.
    reconcileImageOverlays(source.imageOverlays)
  }

  private func sceneFeatureLayerSignature(_ record: FeatureLayerRecord) -> String {
    var parts: [String] = [record.url, record.definitionExpression ?? "", record.renderingMode ?? ""]
    parts.append(record.renderer.map { "\($0.type):\($0.symbol?.type ?? ""):\($0.symbol?.color ?? "")" } ?? "")
    parts.append(record.extrusion.map { "\($0.expression):\($0.mode ?? "")" } ?? "")
    parts.append((record.labels ?? []).map { $0.expression }.joined(separator: ";"))
    return parts.joined(separator: "|")
  }

  private func reconcileSceneFeatureLayers(_ records: [FeatureLayerRecord], on scene: ArcGIS.Scene) {
    let incomingIDs = Set(records.map(\.id))
    for (id, layer) in sceneFeatureLayers where !incomingIDs.contains(id) {
      scene.removeOperationalLayer(layer)
      sceneFeatureLayers[id] = nil
      sceneFeatureLayerSignatures[id] = nil
    }
    for record in records {
      let signature = sceneFeatureLayerSignature(record)
      if sceneFeatureLayerSignatures[record.id] == signature, let existing = sceneFeatureLayers[record.id] {
        existing.isVisible = record.visible ?? true
        existing.opacity = Float(record.opacity ?? 1)
        continue
      }
      if let stale = sceneFeatureLayers[record.id] { scene.removeOperationalLayer(stale) }
      guard let url = URL(string: record.url) else { continue }
      let layer = FeatureLayer(featureTable: ServiceFeatureTable(url: url))
      layer.isVisible = record.visible ?? true
      layer.opacity = Float(record.opacity ?? 1)
      // Extrusion requires dynamic rendering; honour an explicit mode otherwise.
      switch record.renderingMode {
      case "static": layer.renderingMode = .static
      case "dynamic": layer.renderingMode = .dynamic
      case "automatic": layer.renderingMode = .automatic
      default: if record.extrusion != nil { layer.renderingMode = .dynamic }
      }
      if let renderer = makeRenderer(from: record.renderer) {
        if let extrusion = record.extrusion {
          renderer.sceneProperties.extrusionExpression = extrusion.expression
          renderer.sceneProperties.extrusionMode = extrusionMode(extrusion.mode)
        }
        layer.renderer = renderer
      }
      if let labels = record.labels, !labels.isEmpty {
        for label in labels { layer.addLabelDefinition(makeLabelDefinition(from: label)) }
        layer.labelsAreEnabled = true
      }
      if let definition = record.definitionExpression { layer.definitionExpression = definition }
      scene.addOperationalLayer(layer)
      sceneFeatureLayers[record.id] = layer
      sceneFeatureLayerSignatures[record.id] = signature
    }
  }

  private func analysisPoint(_ record: PointRecord) -> Point {
    Point(
      x: record.longitude, y: record.latitude, z: record.altitude ?? 0, spatialReference: .wgs84)
  }

  private func reconcileAnalyses(_ records: [SceneAnalysisRecord]) {
    let signature = records.map { r in
      "\(r.type):\(r.location.map { "\($0.latitude),\($0.longitude),\($0.altitude ?? 0)" } ?? "")"
        + ":\(r.headingDegrees):\(r.pitchDegrees):\(r.horizontalAngleDegrees ?? 0):\(r.verticalAngleDegrees ?? 0)"
        + ":\(r.minDistanceMeters ?? 0):\(r.maxDistanceMeters)"
        + ":\(r.observer.map { "\($0.latitude),\($0.longitude),\($0.altitude ?? 0)" } ?? "")"
        + ":\(r.target.map { "\($0.latitude),\($0.longitude),\($0.altitude ?? 0)" } ?? "")"
        + ":\(r.startLocation.map { "\($0.latitude),\($0.longitude),\($0.altitude ?? 0)" } ?? "")"
        + ":\(r.endLocation.map { "\($0.latitude),\($0.longitude),\($0.altitude ?? 0)" } ?? "")"
        + ":\(r.unitSystem ?? "")"
    }.joined(separator: "|")
    if signature == analysesSignature { return }
    analysesSignature = signature

    cameraViewsheds = []
    interactiveViewsheds = []
    if records.isEmpty {
      analysisOverlaysList = []
      return
    }
    let overlay = AnalysisOverlay()
    for record in records {
      switch record.type {
      case "viewshed":
        guard let location = record.location else { continue }
        overlay.addAnalysis(
          ExploratoryLocationViewshed(
            location: analysisPoint(location),
            heading: record.headingDegrees,
            pitch: record.pitchDegrees,
            horizontalAngle: record.horizontalAngleDegrees ?? 90,
            verticalAngle: record.verticalAngleDegrees ?? 90,
            minDistance: record.minDistanceMeters,
            maxDistance: record.maxDistanceMeters))
      case "lineOfSight":
        guard let observer = record.observer, let target = record.target else { continue }
        overlay.addAnalysis(
          ExploratoryLocationLineOfSight(
            observerLocation: analysisPoint(observer), targetLocation: analysisPoint(target)))
      case "geoElementViewshed":
        guard let location = record.location else { continue }
        // A plain backing graphic is level and facing north, so the desired look
        // direction is applied as heading/pitch offsets from that zero orientation.
        let graphic = Graphic(geometry: analysisPoint(location))
        overlay.addAnalysis(
          ExploratoryGeoElementViewshed(
            geoElement: graphic,
            horizontalAngle: record.horizontalAngleDegrees ?? 90,
            verticalAngle: record.verticalAngleDegrees ?? 90,
            headingOffset: record.headingDegrees,
            pitchOffset: record.pitchDegrees,
            minDistance: record.minDistanceMeters,
            maxDistance: record.maxDistanceMeters))
      case "geoElementLineOfSight":
        guard let observer = record.observer, let target = record.target else { continue }
        let observerGraphic = Graphic(geometry: analysisPoint(observer))
        let targetGraphic = Graphic(geometry: analysisPoint(target))
        overlay.addAnalysis(
          ExploratoryGeoElementLineOfSight(observer: observerGraphic, target: targetGraphic))
      case "distanceMeasurement":
        guard let start = record.startLocation, let end = record.endLocation else { continue }
        let measurement = ExploratoryLocationDistanceMeasurement(
          startLocation: analysisPoint(start), endLocation: analysisPoint(end))
        measurement.unitSystem = record.unitSystem == "imperial" ? .imperial : .metric
        overlay.addAnalysis(measurement)
      case "cameraViewshed":
        // Positioned at the origin until the first camera update re-aims it.
        let viewshed = ExploratoryLocationViewshed(
          location: Point(x: 0, y: 0, z: 0, spatialReference: .wgs84),
          heading: 0,
          pitch: 0,
          horizontalAngle: record.horizontalAngleDegrees ?? 90,
          verticalAngle: record.verticalAngleDegrees ?? 90,
          minDistance: record.minDistanceMeters,
          maxDistance: record.maxDistanceMeters)
        overlay.addAnalysis(viewshed)
        cameraViewsheds.append(viewshed)
      case "interactiveViewshed":
        guard let location = record.location else { continue }
        let viewshed = ExploratoryLocationViewshed(
          location: analysisPoint(location),
          heading: record.headingDegrees,
          pitch: record.pitchDegrees,
          horizontalAngle: record.horizontalAngleDegrees ?? 90,
          verticalAngle: record.verticalAngleDegrees ?? 90,
          minDistance: record.minDistanceMeters,
          maxDistance: record.maxDistanceMeters)
        overlay.addAnalysis(viewshed)
        interactiveViewsheds.append(viewshed)
      default: continue
      }
    }
    analysisOverlaysList = [overlay]
  }

  private func reconcileImageOverlays(_ records: [SceneImageOverlayRecord]) {
    let signature = records.map { r in
      "\(r.id):\(r.imagePaths.joined(separator: ","))"
        + ":\(r.extent.minLongitude),\(r.extent.minLatitude),\(r.extent.maxLongitude),\(r.extent.maxLatitude)"
        + ":\(r.framesPerSecond ?? 15):\(r.opacity ?? 1)"
    }.joined(separator: "|")
    if signature == imageOverlaySignature { return }
    imageOverlaySignature = signature

    imageAnimationTimer?.invalidate()
    imageAnimationTimer = nil
    animatedOverlays = []
    imageFrameIndex = 0

    if records.isEmpty {
      imageOverlaysList = []
      return
    }

    var overlays: [ImageOverlay] = []
    var maxFPS = 0.0
    for record in records {
      let extent = Envelope(
        xMin: record.extent.minLongitude, yMin: record.extent.minLatitude,
        xMax: record.extent.maxLongitude, yMax: record.extent.maxLatitude,
        spatialReference: .wgs84)
      let frames = record.imagePaths.map {
        ImageFrame(url: URL(fileURLWithPath: $0), extent: extent)
      }
      guard let first = frames.first else { continue }
      let overlay = ImageOverlay(imageFrame: first)
      overlay.opacity = Float(record.opacity ?? 1)
      overlays.append(overlay)
      let fps = record.framesPerSecond ?? 15
      // Only animate overlays with more than one frame and a positive rate.
      if frames.count > 1, fps > 0 {
        animatedOverlays.append((overlay, frames))
        maxFPS = max(maxFPS, fps)
      }
    }
    imageOverlaysList = overlays

    if !animatedOverlays.isEmpty, maxFPS > 0 {
      imageAnimationTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / maxFPS, repeats: true) {
        [weak self] _ in
        guard let self else { return }
        self.imageFrameIndex += 1
        for entry in self.animatedOverlays {
          entry.overlay.imageFrame = entry.frames[self.imageFrameIndex % entry.frames.count]
        }
      }
    }
  }

  private func loadMobileScenePackage(path: String, key: String) {
    loadTask?.cancel()
    loadTask = Task { [weak self] in
      let package = MobileScenePackage(fileURL: URL(fileURLWithPath: path))
      do {
        try await package.load()
        guard let self, self.currentSceneKey == key, !Task.isCancelled else { return }
        guard let packageScene = package.scenes.first else {
          self.onError?(
            arcgisErrorPayload(ArcgisErrorCode.mapLoadFailed, "The mobile scene package has no scenes."))
          return
        }
        self.scene = packageScene
        try await packageScene.load()
        guard self.currentSceneKey == key, !Task.isCancelled else { return }
        // Swapping the scene after load does not re-apply its authored viewpoint,
        // so apply it explicitly to frame the package's content.
        if let viewpoint = packageScene.initialViewpoint {
          await self.sceneProxy?.setViewpoint(viewpoint)
        }
        self.onLoad?(packageScene.spatialReference?.wkid?.rawValue ?? 0)
      } catch {
        guard let self, self.currentSceneKey == key, !Task.isCancelled else { return }
        self.onError?(
          arcgisErrorPayload(ArcgisErrorCode.mapLoadFailed, "The mobile scene package failed to load."))
      }
    }
  }

  private func reconcileSceneLayers(_ records: [SceneLayerRecord], on scene: ArcGIS.Scene) {
    let incomingIDs = Set(records.map(\.id))
    for (id, layer) in sceneLayers where !incomingIDs.contains(id) {
      scene.removeOperationalLayer(layer)
      sceneLayers[id] = nil
      sceneLayerURLs[id] = nil
    }
    for record in records {
      // A layer's source is its `url`, or (for a local point cloud) its `path`.
      let layerSource = record.url.isEmpty ? (record.path ?? "") : record.url
      if let existing = sceneLayers[record.id], sceneLayerURLs[record.id] == layerSource {
        existing.isVisible = record.visible ?? true
        existing.opacity = Float(record.opacity ?? 1)
        if let sceneLayer = existing as? ArcGISSceneLayer {
          sceneLayer.renderer = makeRenderer(from: record.renderer)
          sceneLayer.polygonFilter = Self.makePolygonFilter(record.polygonFilter)
        }
        continue
      }
      if let stale = sceneLayers[record.id] {
        scene.removeOperationalLayer(stale)
      }
      let layerURL: URL?
      if record.type == "pointCloud", let path = record.path, !path.isEmpty {
        layerURL = URL(fileURLWithPath: path)
      } else {
        layerURL = URL(string: record.url)
      }
      guard let url = layerURL else {
        onError?(
          arcgisErrorPayload(
            ArcgisErrorCode.invalidArgument,
            "Invalid scene layer url.",
            details: ["layerId": record.id]
          ))
        continue
      }
      let layer: Layer
      switch record.type {
      case "integratedMesh": layer = IntegratedMeshLayer(url: url)
      case "3dTiles": layer = OGC3DTilesLayer(url: url)
      case "pointCloud": layer = PointCloudLayer(url: url)
      case "building":
        let buildingLayer = BuildingSceneLayer(url: url)
        if let expression = record.buildingFilterExpression, !expression.isEmpty {
          buildingLayer.activeFilter = BuildingFilter(
            name: "filter", description: "",
            blocks: [BuildingFilterBlock(title: "solid", whereClause: expression, mode: .solid())])
        }
        layer = buildingLayer
      default:
        let sceneLayer = ArcGISSceneLayer(url: url)
        sceneLayer.renderer = makeRenderer(from: record.renderer)
        sceneLayer.polygonFilter = Self.makePolygonFilter(record.polygonFilter)
        layer = sceneLayer
      }
      layer.isVisible = record.visible ?? true
      layer.opacity = Float(record.opacity ?? 1)
      scene.addOperationalLayer(layer)
      sceneLayers[record.id] = layer
      sceneLayerURLs[record.id] = layerSource
    }
  }

  private func surfacePlacement(_ value: String?) -> SurfacePlacement {
    switch value {
    case "drapedFlat": return .drapedFlat
    case "absolute": return .absolute
    case "relative": return .relative
    case "relativeToScene": return .relativeToScene
    default: return .drapedBillboarded
    }
  }

  private func extrusionMode(_ value: String?) -> RendererSceneProperties.ExtrusionMode {
    switch value {
    case "absoluteHeight": return .absoluteHeight
    case "minimum": return .minimum
    case "maximum": return .maximum
    case "none": return .off
    default: return .baseHeight
    }
  }

  /// A signature capturing everything that would require an overlay to be
  /// rebuilt (placement, extrusion, renderer, and each graphic incl. attributes).
  private func overlaySignature(_ record: SceneGraphicsOverlayRecord) -> String {
    var parts: [String] = [record.surfacePlacement ?? ""]
    parts.append(record.extrusion.map { "\($0.expression):\($0.mode ?? "")" } ?? "")
    parts.append(
      record.orientationExpressions.map {
        "\($0.headingExpression ?? ""):\($0.pitchExpression ?? ""):\($0.rollExpression ?? "")"
      } ?? "")
    parts.append(record.renderer.map { "\($0.type):\($0.symbol?.type ?? ""):\($0.symbol?.color ?? "")" } ?? "")
    for graphic in record.graphics {
      parts.append(graphicSignature(graphic))
      if let attributes = graphic.attributes {
        parts.append(
          attributes.keys.sorted().map { "\($0)=\(String(describing: attributes[$0]!))" }
            .joined(separator: "&"))
      }
    }
    return parts.joined(separator: "|")
  }

  private func reconcileGraphicsOverlays(_ records: [SceneGraphicsOverlayRecord]) {
    let incomingIDs = Set(records.map(\.id))
    for id in graphicsOverlays.keys where !incomingIDs.contains(id) {
      graphicsOverlays[id] = nil
      overlaySignatures[id] = nil
    }
    for record in records {
      let signature = overlaySignature(record)
      if overlaySignatures[record.id] == signature, graphicsOverlays[record.id] != nil {
        continue
      }
      let overlay = GraphicsOverlay()
      overlay.sceneProperties = LayerSceneProperties(
        surfacePlacement: surfacePlacement(record.surfacePlacement))
      if let renderer = makeRenderer(from: record.renderer) {
        if let extrusion = record.extrusion {
          renderer.sceneProperties.extrusionExpression = extrusion.expression
          renderer.sceneProperties.extrusionMode = extrusionMode(extrusion.mode)
        }
        if let orientation = record.orientationExpressions {
          if let heading = orientation.headingExpression {
            renderer.sceneProperties.headingExpression = heading
          }
          if let pitch = orientation.pitchExpression {
            renderer.sceneProperties.pitchExpression = pitch
          }
          if let roll = orientation.rollExpression {
            renderer.sceneProperties.rollExpression = roll
          }
        }
        overlay.renderer = renderer
      }
      for graphicRecord in record.graphics {
        if let graphic = makeGraphic(from: graphicRecord) {
          overlay.addGraphic(graphic)
        }
      }
      graphicsOverlays[record.id] = overlay
      overlaySignatures[record.id] = signature
    }
    // Reassign so SwiftUI re-renders the SceneView with the reconciled overlays.
    graphicsOverlaysList = records.compactMap { graphicsOverlays[$0.id] }
  }

  private func makeCamera(_ record: CameraRecord) -> Camera {
    Camera(
      latitude: record.latitude,
      longitude: record.longitude,
      altitude: record.altitude,
      heading: record.heading ?? 0,
      pitch: record.pitch ?? 0,
      roll: record.roll ?? 0
    )
  }

  func setCamera(_ record: CameraRecord, animation: ViewpointAnimationRecord?) async {
    guard let proxy = sceneProxy else { return }
    let duration = (animation?.durationMs).map { $0 / 1000 } ?? 0
    _ = await proxy.setViewpointCamera(makeCamera(record), duration: duration)
  }

  /// Emits a single-tap event with the screen point and (when available) the
  /// tapped scene location in WGS 84.
  func handleSceneTap(screenPoint: CGPoint, scenePoint: Point?) {
    var payload: [String: Any] = ["screenPoint": ["x": screenPoint.x, "y": screenPoint.y]]
    if let scenePoint {
      // Move any interactive viewsheds to the tapped point.
      for viewshed in interactiveViewsheds {
        viewshed.location = scenePoint
      }
      let wgs84 = (GeometryEngine.project(scenePoint, into: .wgs84) as? Point) ?? scenePoint
      payload["mapPoint"] = ["latitude": wgs84.y, "longitude": wgs84.x]
    }
    onSceneTap?(payload)
  }

  /// Re-aims every camera-tracking viewshed to the scene's current camera.
  func updateCameraViewsheds(_ camera: Camera) {
    for viewshed in cameraViewsheds {
      viewshed.location = camera.location
      viewshed.heading = camera.heading
      viewshed.pitch = camera.pitch
    }
  }

  /// Identifies scene-layer features at a screen point and selects them; returns
  /// the number selected.
  func selectSceneFeatures(_ options: IdentifyOptionsRecord) async -> Int {
    guard let proxy = sceneProxy else { return 0 }
    let screenPoint = CGPoint(x: options.screenPoint.x, y: options.screenPoint.y)
    let tolerance = options.tolerance ?? 12
    guard
      let results = try? await proxy.identifyLayers(
        screenPoint: screenPoint, tolerance: tolerance, returnPopupsOnly: false,
        maximumResultsPerLayer: options.maximumResults)
    else { return 0 }
    var selected = 0
    for result in results {
      guard let layer = result.layerContent as? ArcGISSceneLayer else { continue }
      let features = result.geoElements.compactMap { $0 as? ArcGISFeature }
      layer.selectFeatures(features)
      selected += features.count
    }
    return selected
  }

  /// Clears the selection highlight on every scene layer.
  func clearSceneSelection() {
    for layer in sceneLayers.values {
      (layer as? ArcGISSceneLayer)?.clearSelection()
    }
  }

  /// Queries the base surface's elevation (metres above sea level) at a point.
  func getSurfaceElevation(_ point: PointRecord) async throws -> Double {
    guard let surface = scene?.baseSurface else {
      throw ArcgisException((
        code: ArcgisErrorCode.nativeFailure, message: "The scene has no elevation surface."))
    }
    let location = Point(x: point.longitude, y: point.latitude, spatialReference: .wgs84)
    do {
      return try await surface.elevation(at: location)
    } catch {
      throw serviceException(error, context: "elevation")
    }
  }

  /// Builds a scene-layer polygon filter from a JS record, or nil to clear it.
  private static func makePolygonFilter(
    _ record: ScenePolygonFilterRecord?
  ) -> SceneLayerPolygonFilter? {
    guard let record, !record.polygons.isEmpty else { return nil }
    let polygons = record.polygons.map { ring in
      ArcGIS.Polygon(
        points: ring.map { Point(x: $0.longitude, y: $0.latitude, spatialReference: .wgs84) })
    }
    let relationship: SceneLayerPolygonFilter.SpatialRelationship =
      record.spatialRelationship == "disjoint" ? .disjoint : .contains
    return SceneLayerPolygonFilter(polygons: polygons, spatialRelationship: relationship)
  }

  /// Builds an elevation source from a JS record, or nil for an unrecognized/
  /// incomplete one. A `tilePackage` loads a local `.tpk`/`.tpkx` via a tile
  /// cache; `raster` loads local DEM file(s); `tiled` loads a service URL.
  private static func makeElevationSource(_ record: ElevationSourceRecord) -> ElevationSource? {
    switch record.type {
    case "world":
      return ArcGISTiledElevationSource(url: worldElevationURL)
    case "tiled":
      return record.url.flatMap(URL.init(string:)).map(ArcGISTiledElevationSource.init(url:))
    case "raster":
      guard let path = record.path else { return nil }
      return RasterElevationSource(fileURLs: [URL(fileURLWithPath: path)])
    case "tilePackage":
      guard let path = record.path else { return nil }
      return ArcGISTiledElevationSource(tileCache: TileCache(fileURL: URL(fileURLWithPath: path)))
    default:
      return nil
    }
  }

  /// Applies the JS-declared web-scene layer labels once the scene has loaded:
  /// walks each `layerPath` from the operational layers through group layers to a
  /// feature layer, adds the label definitions, and enables labeling.
  private func applyWebSceneLayerLabels(on scene: ArcGIS.Scene) {
    for record in webSceneLayerLabels {
      guard let layer = Self.findFeatureLayer(path: record.layerPath, in: scene.operationalLayers)
      else { continue }
      for label in record.labels {
        layer.addLabelDefinition(makeLabelDefinition(from: label))
      }
      layer.labelsAreEnabled = !record.labels.isEmpty
    }
  }

  /// Resolves a name path (outermost group first) to a feature layer, descending
  /// through group layers. Returns nil if any segment is missing or the leaf is
  /// not a feature layer.
  private static func findFeatureLayer(path: [String], in layers: [Layer]) -> FeatureLayer? {
    guard let head = path.first, let match = layers.first(where: { $0.name == head })
    else { return nil }
    if path.count == 1 { return match as? FeatureLayer }
    guard let group = match as? GroupLayer else { return nil }
    return findFeatureLayer(path: Array(path.dropFirst()), in: group.layers)
  }

  private func load(_ scene: ArcGIS.Scene) {
    loadTask?.cancel()
    loadTask = Task { [weak self] in
      do {
        try await scene.load()
        guard !Task.isCancelled else { return }
        self?.applyWebSceneLayerLabels(on: scene)
        self?.onLoad?(scene.spatialReference?.wkid?.rawValue ?? 0)
      } catch {
        guard !Task.isCancelled else { return }
        self?.onError?(arcgisErrorPayload(ArcgisErrorCode.mapLoadFailed, "The scene failed to load."))
      }
    }
  }

  func dispose() {
    loadTask?.cancel()
    loadTask = nil
    scene = nil
    sceneProxy = nil
    graphicsOverlays.removeAll()
    overlaySignatures.removeAll()
    graphicsOverlaysList = []
    sceneFeatureLayers.removeAll()
    sceneFeatureLayerSignatures.removeAll()
    analysisOverlaysList = []
    analysesSignature = ""
    cameraViewsheds = []
    interactiveViewsheds = []
    imageAnimationTimer?.invalidate()
    imageAnimationTimer = nil
    animatedOverlays = []
    imageOverlaysList = []
    imageOverlaySignature = ""
  }
}

/// SwiftUI container hosting the ArcGIS `SceneView`.
struct SceneContainerView: View {
  @ObservedObject var model: SceneViewModel

  var body: some View {
    if let scene = model.scene {
      SceneViewReader { proxy in
        SceneView(
          scene: scene, graphicsOverlays: model.graphicsOverlaysList,
          analysisOverlays: model.analysisOverlaysList,
          imageOverlays: model.imageOverlaysList
        )
        .atmosphereEffect(model.atmosphereEffect)
          .sunLighting(model.sunLighting)
          .cameraController(model.cameraController)
          .onSingleTapGesture { screenPoint, scenePoint in
            model.handleSceneTap(screenPoint: screenPoint, scenePoint: scenePoint)
          }
          .onCameraChanged { camera in
            model.updateCameraViewsheds(camera)
          }
          .onAppear { model.sceneProxy = proxy }
      }
    } else {
      Color.clear
    }
  }
}

/// Hosts the SwiftUI ArcGIS `SceneView` inside the UIKit `ExpoView` and bridges
/// declarative props + load/error events + the `setCamera` view function.
class ExpoArcgisSceneView: ExpoView {
  let onSceneLoad = EventDispatcher()
  let onSceneError = EventDispatcher()
  let onSingleTap = EventDispatcher()

  private let model = SceneViewModel()
  private var hostingController: UIHostingController<SceneContainerView>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true

    model.onLoad = { [weak self] wkid in
      self?.onSceneLoad(["spatialReferenceWkid": wkid])
    }
    model.onError = { [weak self] payload in
      self?.onSceneError(payload)
    }
    model.onSceneTap = { [weak self] payload in
      self?.onSingleTap(payload)
    }

    let controller = UIHostingController(rootView: SceneContainerView(model: model))
    controller.view.frame = bounds
    controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    controller.view.backgroundColor = .clear
    addSubview(controller.view)
    hostingController = controller
  }

  func setSceneSource(_ source: SceneSourceRecord) {
    model.apply(source: source)
  }

  func setCamera(_ record: CameraRecord, animation: ViewpointAnimationRecord?) async {
    await model.setCamera(record, animation: animation)
  }

  func getSurfaceElevation(_ point: PointRecord) async throws -> Double {
    try await model.getSurfaceElevation(point)
  }

  func selectSceneFeatures(_ options: IdentifyOptionsRecord) async -> Int {
    await model.selectSceneFeatures(options)
  }

  func clearSceneSelection() {
    model.clearSceneSelection()
  }

  func dispose() {
    model.dispose()
    hostingController?.view.removeFromSuperview()
    hostingController = nil
  }
}
