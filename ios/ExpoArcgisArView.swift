import ARKit
import ArcGIS
import ArcGISToolkit
import ExpoModulesCore
import SwiftUI

/// Holds the augmented-reality parameters (mode + per-mode options) that drive
/// which toolkit AR view is rendered, plus the AR-specific event callbacks and
/// the last observed camera (for `getCurrentCamera`). The scene content itself
/// is owned by a reused `SceneViewModel`, keeping all scene/layer/graphics
/// reconciliation shared with the plain 3D scene view.
final class ArViewModel: ObservableObject {
  @Published var mode: String = "worldScale"
  @Published var trackingMode: String = "world"
  @Published var anchor: PointRecord?
  @Published var initialCamera: CameraRecord?
  @Published var translationFactor: Double = 1
  /// Clipping distance in metres; `nil` means no clipping.
  @Published var clippingDistance: Double?
  @Published var calibrationVisible: Bool = true

  /// The most recent camera reported by the scene view, cached for the
  /// `getCurrentCamera` view function. `nil` until AR begins tracking.
  var lastCamera: ArcGIS.Camera?

  /// Reports `(state, reason)` — `reason` is the `ArTrackingReason` string when
  /// tracking is limited, or `nil` when tracking is stable/unavailable.
  var onTrackingStateChange: ((String, String?) -> Void)?

  /// Map ARKit's tracking state (and limited-tracking reason) onto the public
  /// `ArTrackingState` / `ArTrackingReason` unions.
  func report(_ state: ARCamera.TrackingState) {
    switch state {
    case .normal:
      onTrackingStateChange?("tracking", nil)
    case .limited(let reason):
      onTrackingStateChange?("initializing", Self.reasonString(reason))
    case .notAvailable:
      onTrackingStateChange?("unavailable", nil)
    @unknown default:
      onTrackingStateChange?("initializing", "unknown")
    }
  }

  private static func reasonString(_ reason: ARCamera.TrackingState.Reason) -> String {
    switch reason {
    case .initializing: return "initializing"
    case .excessiveMotion: return "excessiveMotion"
    case .insufficientFeatures: return "insufficientFeatures"
    case .relocalizing: return "relocalizing"
    @unknown default: return "unknown"
    }
  }
}

/// SwiftUI container that renders the ArcGIS scene inside one of the toolkit's
/// three augmented-reality views, selected by `ar.mode`. Each toolkit AR view
/// takes a builder that returns the same `SceneView` the plain scene view
/// builds, so the scene reconciliation in `SceneViewModel` is fully reused.
struct ArContainerView: View {
  @ObservedObject var sceneModel: SceneViewModel
  @ObservedObject var ar: ArViewModel

  var body: some View {
    if let scene = sceneModel.scene {
      switch ar.mode {
      case "tabletop":
        tabletop(scene)
      case "flyover":
        flyover(scene)
      default:
        worldScale(scene)
      }
    } else {
      Color.clear
    }
  }

  /// Builds the scene view handed to every AR mode. The AR view overrides the
  /// camera controller and background for AR, so this only wires the scene,
  /// overlays, tap handling, and camera caching.
  private func sceneView(_ scene: ArcGIS.Scene) -> SceneView {
    SceneView(
      scene: scene,
      graphicsOverlays: sceneModel.graphicsOverlaysList,
      analysisOverlays: sceneModel.analysisOverlaysList,
      imageOverlays: sceneModel.imageOverlaysList
    )
    .onSingleTapGesture { screenPoint, scenePoint in
      sceneModel.handleSceneTap(screenPoint: screenPoint, scenePoint: scenePoint)
    }
    .onCameraChanged { camera in
      ar.lastCamera = camera
    }
  }

  @ViewBuilder
  private func worldScale(_ scene: ArcGIS.Scene) -> some View {
    let mode: WorldScaleSceneView.TrackingMode = ar.trackingMode == "geo" ? .geoTracking : .worldTracking
    WorldScaleSceneView(clippingDistance: ar.clippingDistance, trackingMode: mode) { _ in
      sceneView(scene)
    }
    .calibrationViewHidden(!ar.calibrationVisible)
    .onCameraTrackingStateChanged { state in
      ar.report(state)
    }
  }

  @ViewBuilder
  private func tabletop(_ scene: ArcGIS.Scene) -> some View {
    if let anchor = ar.anchor {
      TableTopSceneView(
        anchorPoint: Point(latitude: anchor.latitude, longitude: anchor.longitude),
        translationFactor: ar.translationFactor,
        clippingDistance: ar.clippingDistance
      ) { _ in
        sceneView(scene)
      }
    } else {
      Color.clear
    }
  }

  @ViewBuilder
  private func flyover(_ scene: ArcGIS.Scene) -> some View {
    if let camera = ar.initialCamera {
      FlyoverSceneView(
        initialLatitude: camera.latitude,
        initialLongitude: camera.longitude,
        initialAltitude: camera.altitude,
        translationFactor: ar.translationFactor,
        initialHeading: camera.heading
      ) { _ in
        sceneView(scene)
      }
    } else {
      Color.clear
    }
  }
}

/// Hosts the SwiftUI augmented-reality container inside the UIKit `ExpoView` and
/// bridges declarative props, scene load/error/tap events, AR tracking-state
/// events, and the `getCurrentCamera` view function.
///
/// The toolkit AR views are iOS-only; on any other platform this view renders an
/// empty container and reports `E_UNSUPPORTED` through `onArError`.
class ExpoArcgisArView: ExpoView {
  let onSceneLoad = EventDispatcher()
  let onSceneError = EventDispatcher()
  let onSingleTap = EventDispatcher()
  let onTrackingStateChange = EventDispatcher()
  let onArError = EventDispatcher()

  private let sceneModel = SceneViewModel()

  #if os(iOS)
  private var arModel: ArViewModel?
  private var hostingController: UIHostingController<ArContainerView>?
  #endif

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true

    sceneModel.onLoad = { [weak self] wkid in
      self?.onSceneLoad(["spatialReferenceWkid": wkid])
    }
    sceneModel.onError = { [weak self] payload in
      self?.onSceneError(payload)
    }
    sceneModel.onSceneTap = { [weak self] payload in
      self?.onSingleTap(payload)
    }

    #if os(iOS)
    if ARWorldTrackingConfiguration.isSupported {
      let ar = ArViewModel()
      ar.onTrackingStateChange = { [weak self] state, reason in
        var payload: [String: Any] = ["state": state]
        if let reason { payload["reason"] = reason }
        self?.onTrackingStateChange(payload)
      }
      let controller = UIHostingController(rootView: ArContainerView(sceneModel: sceneModel, ar: ar))
      controller.view.frame = bounds
      controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      controller.view.backgroundColor = .clear
      addSubview(controller.view)
      arModel = ar
      hostingController = controller
    } else {
      reportUnsupported()
    }
    #else
    reportUnsupported()
    #endif
  }

  private func reportUnsupported() {
    onArError([
      "code": "E_UNSUPPORTED",
      "message": "Augmented reality is not available on this device.",
    ])
  }

  func setSceneSource(_ source: SceneSourceRecord) {
    sceneModel.apply(source: source)
  }

  func setMode(_ mode: String) {
    #if os(iOS)
    arModel?.mode = mode
    #endif
  }

  func setTrackingMode(_ mode: String?) {
    #if os(iOS)
    arModel?.trackingMode = mode ?? "world"
    #endif
  }

  func setAnchor(_ anchor: PointRecord?) {
    #if os(iOS)
    arModel?.anchor = anchor
    #endif
  }

  func setInitialCamera(_ camera: CameraRecord?) {
    #if os(iOS)
    arModel?.initialCamera = camera
    #endif
  }

  func setTranslationFactor(_ factor: Double?) {
    #if os(iOS)
    arModel?.translationFactor = factor ?? 1
    #endif
  }

  func setClippingDistance(_ meters: Double?) {
    #if os(iOS)
    arModel?.clippingDistance = meters
    #endif
  }

  func setCalibrationVisible(_ visible: Bool?) {
    #if os(iOS)
    arModel?.calibrationVisible = visible ?? true
    #endif
  }

  /// The scene camera's current position, as a serializable dictionary. Throws
  /// when AR has not begun tracking yet (no camera observed).
  func getCurrentCamera() throws -> [String: Any] {
    #if os(iOS)
    guard let camera = arModel?.lastCamera else {
      throw Exception(name: "E_NATIVE_FAILURE", description: "The AR view is not tracking yet.")
    }
    let location = camera.location
    return [
      "latitude": location.y,
      "longitude": location.x,
      "altitude": location.z ?? 0,
      "heading": camera.heading,
      "pitch": camera.pitch,
      "roll": camera.roll,
    ]
    #else
    throw Exception(name: "E_UNSUPPORTED", description: "Augmented reality is not available.")
    #endif
  }

  func dispose() {
    sceneModel.dispose()
    #if os(iOS)
    hostingController?.view.removeFromSuperview()
    hostingController = nil
    arModel = nil
    #endif
  }
}
