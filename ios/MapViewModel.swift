import ArcGIS
import ArcGISToolkit
import SwiftUI
import UIKit

/// Owns the ArcGIS `Map` and drives loading off the JS thread.
///
/// Lifecycle & threading (CLAUDE.md "Native view rules"):
/// - `@MainActor` keeps map mutation on the main thread.
/// - `load()` runs in a `Task` that is cancelled on disposal / re-apply.
/// - `Task.isCancelled` guards against emitting events after disposal.
@MainActor
final class MapViewModel: ObservableObject {
  @Published var map: Map?
  @Published var interactionEnabled: Bool = true
  /// Whether to overlay the ArcGIS Toolkit scale bar.
  @Published var scaleBarEnabled: Bool = false
  /// Coordinate grid drawn over the map (nil = none). Qualified because SwiftUI
  /// also declares a `Grid` type.
  @Published var grid: ArcGIS.Grid?
  /// Solid background color drawn behind the map (nil = SDK default). Like
  /// Android, this is a view-level (`MapView`) setting, not a `Map` property.
  @Published var backgroundColor: UIColor?

  /// Emits the map's spatial-reference WKID on successful load.
  var onLoad: ((Int) -> Void)?
  /// Emits a stable `{ code, message }` payload on failure.
  var onError: (([String: Any]) -> Void)?
  /// Emits `{ center, scale, rotation }` when the viewpoint changes (throttled).
  var onViewpointChange: (([String: Any]) -> Void)?
  /// Emits `{ mapPoint, screenPoint }` on a single tap.
  var onSingleTap: (([String: Any]) -> Void)?
  /// Emits `{ status }` when the map view draw status changes.
  var onDrawStatusChange: (([String: Any]) -> Void)?
  /// Emits `{ layerId?, layerName, statuses, error? }` on a layer view-state change.
  var onLayerViewStateChange: (([String: Any]) -> Void)?

  /// Proxy for imperative viewpoint control; captured from the MapViewReader.
  var mapProxy: MapViewProxy?
  private var lastViewpointEmit = Date.distantPast

  /// Interactive geometry editor, attached to the map view; active only between
  /// `startGeometryEditor` and `stopGeometryEditor`.
  let geometryEditor = GeometryEditor()

  private var loadTask: Task<Void, Never>?
  private var currentBasemapKey: String?
  private var currentBasemapParamsKey: String?
  private var currentBasemapLayerKey: String?
  private var currentWebMapItemID: String?
  private var currentMobileMapPackagePath: String?

  // Feature layers currently on the map, keyed by their stable id, plus the URL
  // each was created from — used to reconcile add / update / remove.
  private var featureLayers: [String: FeatureLayer] = [:]
  private var featureLayerURLs: [String: String] = [:]

  // Non-feature operational layers, keyed by id, with a content signature used
  // to rebuild only when the layer's definition (not just visibility) changes.
  private var layers: [String: Layer] = [:]
  private var layerSignatures: [String: String] = [:]
  // KML tour controllers, created lazily per KML layer id on first `controlKmlTour`.
  private var kmlTourControllers: [String: KMLTourController] = [:]

  /// Device-location display, always attached to the MapView; its data source is
  /// started/stopped by the `locationDisplay` prop so nothing shows when disabled.
  let locationDisplay = LocationDisplay()
  private var locationTask: Task<Void, Never>?
  private var lastLocationEmit = Date.distantPast
  /// Emits `{ position, horizontalAccuracy, speed, course }` on location updates.
  var onLocationUpdate: (([String: Any]) -> Void)?

  /// Floor-aware level to show once the map loads, and geotrigger state.
  private var floorLevel: Int?
  private var geotriggerRecords: [GeotriggerRecord] = []
  private var geotriggerTasks: [Task<Void, Never>] = []
  private var nmeaReplayTask: Task<Void, Never>?
  /// Emits `{ geotriggerId, action, message }` on fence enter/exit.
  var onGeotrigger: (([String: Any]) -> Void)?

  /// Turn-by-turn navigation state; active only between start/stopNavigation.
  var onNavigationStatus: (([String: Any]) -> Void)?
  private var routeTracker: RouteTracker?
  private var navigationRoute: Route?
  private var navigationTask: Task<Void, Never>?

  /// The single overlay holding all graphics; lives on the MapView, so it
  /// survives basemap/map rebuilds. Read by `MapContainerView`.
  let graphicsOverlay = GraphicsOverlay()
  private var graphics: [String: Graphic] = [:]
  private var graphicSignatures: [String: String] = [:]

  /// Applies a declarative map source, rebuilding the map only when its identity
  /// changes (minimal diff), then reconciling feature layers by id.
  private var currentSpatialReferenceWkid: Int?

  func apply(source: MapSourceRecord) {
    let webMapItemID = source.webMapItemId
    let basemapKey = source.basemap
    // Style parameters and spatial reference are baked into the map at creation,
    // so a change to either requires a fresh map.
    let basemapParamsKey = source.basemapStyleParameters?.worldview
    let mmpkPath = source.mobileMapPackagePath
    let basemapLayerKey = source.basemapLayer.map { "\($0.type):\($0.url ?? $0.itemId ?? "")" }
    let needsNewMap =
      webMapItemID != currentWebMapItemID || basemapKey != currentBasemapKey
      || basemapParamsKey != currentBasemapParamsKey || mmpkPath != currentMobileMapPackagePath
      || basemapLayerKey != currentBasemapLayerKey
      || source.spatialReferenceWkid != currentSpatialReferenceWkid || map == nil

    if needsNewMap {
      currentWebMapItemID = webMapItemID
      currentMobileMapPackagePath = mmpkPath
      currentBasemapKey = basemapKey
      currentBasemapParamsKey = basemapParamsKey
      currentBasemapLayerKey = basemapLayerKey
      currentSpatialReferenceWkid = source.spatialReferenceWkid
      // The new map starts with no operational layers; drop the reconcile cache.
      featureLayers.removeAll()
      featureLayerURLs.removeAll()
      layers.removeAll()
      layerSignatures.removeAll()

      let newMap: Map
      if let mmpkPath {
        // The package loads asynchronously; start with an empty map and swap in
        // the package's first map (which carries its own basemap + layers) once
        // loaded. `map` is @Published, so the view updates on the swap.
        newMap = Map()
        Task { [weak self] in
          let package = MobileMapPackage(fileURL: URL(fileURLWithPath: mmpkPath))
          do {
            try await package.load()
            guard let self, self.currentMobileMapPackagePath == mmpkPath else { return }
            if let packageMap = package.maps.first {
              self.map = packageMap
            }
          } catch {
            self?.onError?(
              arcgisErrorPayload(
                ArcgisErrorCode.mapLoadFailed, "The mobile map package failed to load."))
          }
        }
      } else if let webMapItemID {
        guard let itemID = PortalItem.ID(webMapItemID) else {
          onError?(arcgisErrorPayload(ArcgisErrorCode.invalidArgument, "Invalid web map item id."))
          return
        }
        let item = PortalItem(portal: .arcGISOnline(connection: .anonymous), id: itemID)
        newMap = Map(item: item)
      } else if let baseLayerRecord = source.basemapLayer,
        let baseLayer = makeBasemapLayer(baseLayerRecord)
      {
        // A tiled / vector-tiled layer used as the basemap.
        newMap = Map(basemap: Basemap(baseLayer: baseLayer))
      } else if let key = basemapKey {
        guard let style = basemapStyle(from: key) else {
          onError?(arcgisErrorPayload(ArcgisErrorCode.invalidArgument, "Unsupported basemap style."))
          return
        }
        let basemap = Basemap(style: style, parameters: makeStyleParameters(source.basemapStyleParameters))
        newMap = Map(basemap: basemap)
      } else if let wkid = source.spatialReferenceWkid,
        let code = WKID(rawValue: wkid), let sr = SpatialReference(wkid: code)
      {
        // No basemap: a blank map in a specific spatial reference so operational
        // layers reproject into it.
        newMap = Map(spatialReference: sr)
      } else {
        // No basemap: an empty map whose content comes from the feature layers.
        newMap = Map()
      }
      if let viewpoint = source.initialViewpoint {
        newMap.initialViewpoint = makeViewpoint(from: viewpoint)
      }
      map = newMap
      load(newMap)
    }

    // A web map defines its own layers, scale limits and extent; only apply the
    // props-provided constraints and feature layers when not showing a web map.
    // Graphics ride the overlay regardless.
    if let map, webMapItemID == nil {
      applyConstraints(source, to: map)
      reconcileLayers(source.layers, on: map)
      reconcileFeatureLayers(source.featureLayers, on: map)
    }
    reconcileGraphics(source.graphics)
    // A renderer on the overlay symbolizes every graphic (overrides symbols).
    graphicsOverlay.renderer = makeRenderer(from: source.graphicsRenderer)

    floorLevel = source.floorLevel
    geotriggerRecords = source.geotriggers
    // If the map is already loaded (a prop update, not a fresh map), apply the
    // floor level and (re)start geotriggers now; otherwise `load` applies them.
    if let map, map.loadStatus == .loaded {
      applyFloorLevel(to: map)
      setupGeotriggers()
    }
  }

  /// Applies declarative scale limits and max extent to the map. Absent props
  /// reset to the SDK's "unset" sentinels (`0` / `nil`) so props stay the source
  /// of truth. `Map.minScale`/`maxScale`/`referenceScale` treat `0` as no limit.
  private func applyConstraints(_ source: MapSourceRecord, to map: Map) {
    map.minScale = source.minScale ?? 0
    map.maxScale = source.maxScale ?? 0
    map.referenceScale = source.referenceScale ?? 0
    map.maxExtent = source.maxExtent.map(makeEnvelope)
    // Background is a view-level setting; the MapView applies it (see below).
    backgroundColor = source.backgroundColor.flatMap(parseHexColor)
  }

  /// Builds a WGS 84 `Envelope` from a serializable bounding box.
  private func makeEnvelope(_ record: EnvelopeRecord) -> Envelope {
    Envelope(
      xMin: record.minLongitude,
      yMin: record.minLatitude,
      xMax: record.maxLongitude,
      yMax: record.maxLatitude,
      spatialReference: .wgs84
    )
  }

  /// Adds, updates, and removes graphics so the overlay matches `records`,
  /// preserving graphics whose content signature is unchanged.
  private func reconcileGraphics(_ records: [GraphicRecord]) {
    let incomingIDs = Set(records.map(\.id))

    for (id, graphic) in graphics where !incomingIDs.contains(id) {
      graphicsOverlay.removeGraphic(graphic)
      graphics[id] = nil
      graphicSignatures[id] = nil
    }

    for record in records {
      let signature = graphicSignature(record)
      if graphicSignatures[record.id] == signature {
        continue
      }
      if let stale = graphics[record.id] {
        graphicsOverlay.removeGraphic(stale)
      }
      guard let geometry = makeGeometry(from: record.geometry),
        let symbol = makeSymbol(from: record.symbol)
      else {
        onError?(
          arcgisErrorPayload(
            ArcgisErrorCode.invalidArgument,
            "Invalid graphic geometry or symbol.",
            details: ["graphicId": record.id]
          ))
        graphics[record.id] = nil
        graphicSignatures[record.id] = nil
        continue
      }
      let graphic = Graphic(geometry: geometry, symbol: symbol)
      graphicsOverlay.addGraphic(graphic)
      graphics[record.id] = graphic
      graphicSignatures[record.id] = signature
      if record.symbol.type == "webStyle" {
        applyWebStyleSymbol(record.symbol, to: graphic)
      }
    }
  }

  /// Fetches a symbol from a web style (by name or portal item) and applies it to
  /// the graphic once loaded. Runs off the reconciliation path since it is async.
  private func applyWebStyleSymbol(_ record: SymbolRecord, to graphic: Graphic) {
    guard let key = record.symbolKey else { return }
    let symbolStyle: SymbolStyle
    if let stylxPath = record.stylxPath, !stylxPath.isEmpty {
      symbolStyle = SymbolStyle(url: URL(fileURLWithPath: stylxPath))
    } else if let portalItemId = record.portalItemId, let itemID = PortalItem.ID(portalItemId) {
      let item = PortalItem(portal: .arcGISOnline(connection: .anonymous), id: itemID)
      symbolStyle = SymbolStyle(portalItem: item)
    } else if let styleName = record.styleName {
      symbolStyle = SymbolStyle(styleName: styleName)
    } else {
      return
    }
    let keys = record.symbolKeys.isEmpty ? [key] : record.symbolKeys
    Task { [weak graphic] in
      if let symbol = try? await symbolStyle.symbol(forKeys: keys) {
        graphic?.symbol = symbol
      }
    }
  }

  /// Adds, updates, and removes feature layers so the map matches `records`,
  /// preserving unchanged native layer instances (CLAUDE.md "Source of truth").
  private func reconcileFeatureLayers(_ records: [FeatureLayerRecord], on map: Map) {
    let incomingIDs = Set(records.map(\.id))

    for (id, layer) in featureLayers where !incomingIDs.contains(id) {
      map.removeOperationalLayer(layer)
      featureLayers[id] = nil
      featureLayerURLs[id] = nil
    }

    for record in records {
      if let existing = featureLayers[record.id], featureLayerURLs[record.id] == record.url {
        applyProps(record, to: existing)
        continue
      }
      if let stale = featureLayers[record.id] {
        map.removeOperationalLayer(stale)
      }
      guard let url = URL(string: record.url) else {
        onError?(
          arcgisErrorPayload(
            ArcgisErrorCode.layerLoadFailed,
            "Invalid feature layer URL.",
            details: ["layerId": record.id]
          ))
        continue
      }
      let table = ServiceFeatureTable(url: url)
      if let mode = record.featureRequestMode {
        table.featureRequestMode = featureRequestMode(from: mode)
      }
      let layer = FeatureLayer(featureTable: table)
      applyProps(record, to: layer)
      map.addOperationalLayer(layer)
      featureLayers[record.id] = layer
      featureLayerURLs[record.id] = record.url
      loadFeatureLayer(layer, id: record.id)
    }
  }

  /// Adds, updates, and removes non-feature operational layers so the map matches
  /// `records`. Layers are rebuilt only when their definition signature changes;
  /// visibility/opacity update in place.
  private func reconcileLayers(_ records: [LayerRecord], on map: Map) {
    let incomingIDs = Set(records.map(\.id))
    for (id, layer) in layers where !incomingIDs.contains(id) {
      map.removeOperationalLayer(layer)
      layers[id] = nil
      layerSignatures[id] = nil
      kmlTourControllers[id] = nil
    }
    for record in records {
      let signature = layerSignature(record)
      if layerSignatures[record.id] == signature, let existing = layers[record.id] {
        existing.isVisible = record.visible ?? true
        existing.opacity = Float(record.opacity ?? 1)
        continue
      }
      if let stale = layers[record.id] {
        map.removeOperationalLayer(stale)
        // A rebuilt layer invalidates any tour controller bound to the old one.
        kmlTourControllers[record.id] = nil
      }
      guard let layer = makeLayer(from: record) else {
        onError?(
          arcgisErrorPayload(
            ArcgisErrorCode.layerLoadFailed, "Invalid layer.", details: ["layerId": record.id]))
        layers[record.id] = nil
        layerSignatures[record.id] = nil
        continue
      }
      map.addOperationalLayer(layer)
      layers[record.id] = layer
      layerSignatures[record.id] = signature
    }
  }

  /// Wraps a base raster in a raster-function chain (from its JSON), binding the
  /// chain's raster variable to the base raster. Returns the base raster
  /// unchanged when no function is set or the JSON is invalid.
  private func applyRasterFunction(_ json: String?, to base: Raster) -> Raster {
    guard let json, let data = json.data(using: .utf8),
      let function = try? RasterFunction.fromJSON(data),
      let arguments = function.arguments,
      let rasterName = arguments.rasterNames.first
    else { return base }
    arguments.setRaster(base, forArgumentNamed: rasterName)
    return Raster(rasterFunction: function)
  }

  /// Builds a `MosaicRule` from a JS record.
  private func makeMosaicRule(_ record: MosaicRuleRecord) -> MosaicRule {
    let rule = MosaicRule()
    switch record.method {
    case "objectID": rule.mosaicMethod = .objectID
    case "center": rule.mosaicMethod = .center
    case "northwest": rule.mosaicMethod = .northwest
    case "nadir": rule.mosaicMethod = .nadir
    case "viewpoint": rule.mosaicMethod = .viewpoint
    case "attribute": rule.mosaicMethod = .attribute
    case "lockRaster": rule.mosaicMethod = .lockRaster
    case "seamline": rule.mosaicMethod = .seamline
    default: break
    }
    switch record.operation {
    case "first": rule.mosaicOperation = .first
    case "last": rule.mosaicOperation = .last
    case "min": rule.mosaicOperation = .min
    case "max": rule.mosaicOperation = .max
    case "mean": rule.mosaicOperation = .mean
    case "blend": rule.mosaicOperation = .blend
    case "sum": rule.mosaicOperation = .sum
    default: break
    }
    if let ascending = record.ascending { rule.isAscending = ascending }
    if let sortField = record.sortField { rule.sortField = sortField }
    if let sortValue = record.sortValue { rule.sortValue = sortValue }
    return rule
  }

  private func layerSignature(_ record: LayerRecord) -> String {
    // Broken into local values so the type-checker can handle the expression.
    let visibilitySig = record.sublayerVisibility.map { "\($0.sublayerId):\($0.visible)" }
      .joined(separator: ";")
    let sublayerRendererSig = record.sublayerRenderers
      .map { "\($0.sublayerId):\($0.renderer?.type ?? "")" }.joined(separator: ";")
    let rendererSig = record.renderer.map { "\($0.type):\($0.symbol?.type ?? "")" } ?? ""
    let subSig = record.sublayers.map { layerSignature($0) }.joined(separator: ">")
    let hillshadeSig =
      record.hillshade.map { "\($0.altitudeDegrees ?? 45):\($0.azimuthDegrees ?? 315):\($0.zFactor ?? 1)" } ?? ""
    let stretchSig =
      record.stretch.map { "\($0.type):\($0.min ?? 0):\($0.max ?? 0):\($0.minPercent ?? 0):\($0.maxPercent ?? 0):\($0.factor ?? 0)" } ?? ""
    let rgbSig = record.rgb.map { "rgb:\($0.bandIndices.map(String.init).joined(separator: ","))" } ?? ""
    let colormapSig = record.colormap.map { "cmap:\($0.colors.joined(separator: ","))" } ?? ""
    let rasterFnSig = (record.rasterFunction ?? "") + "|" + (record.renderingRule ?? "")
    let blendSig =
      record.blend.map {
        "blend:\($0.elevationPath ?? "")\($0.elevationUrl ?? ""):\($0.altitudeDegrees ?? 45):\($0.azimuthDegrees ?? 315):\($0.zFactor ?? 1):\($0.colorRamp ?? "")"
      } ?? ""
    let parts: [String] = [
      record.type, record.url ?? "", record.urlTemplate ?? "",
      record.subDomains.joined(separator: ","), record.layerNames.joined(separator: ","),
      record.tableName ?? "", record.layerId ?? "",
      visibilitySig, sublayerRendererSig, rendererSig,
      record.collectionId ?? "", record.cqlFilter ?? "", record.portalItemId ?? "",
      subSig, record.styleName ?? "", record.xmlQuery ?? "",
      // Raster renderer markers so a renderer change rebuilds the layer.
      hillshadeSig, stretchSig, rgbSig, colormapSig, rasterFnSig, blendSig,
      record.groundOverlayOpacity.map { "kmlgo:\($0)" } ?? "",
      record.mosaicRule.map {
        "mosaic:\($0.method ?? ""):\($0.operation ?? ""):\($0.ascending ?? true):\($0.sortField ?? ""):\($0.sortValue ?? ""):\($0.lockRasterIds.map(String.init).joined(separator: ","))"
      } ?? "",
      record.sublayerVisibility.map { "\($0.name ?? ""):\($0.visible)" }.joined(separator: ","),
    ]
    return parts.joined(separator: "|")
  }

  /// Builds a base layer for a layer-backed basemap (tiled / vector-tiled),
  /// from a service URL or a portal item id. Returns nil if malformed.
  private func makeBasemapLayer(_ record: BasemapLayerRecord) -> Layer? {
    let item: PortalItem? = record.itemId
      .flatMap { PortalItem.ID($0) }
      .map { PortalItem(portal: .arcGISOnline(connection: .anonymous), id: $0) }
    let url = record.url.flatMap { URL(string: $0) }
    switch record.type {
    case "vectorTiled":
      if let item { return ArcGISVectorTiledLayer(item: item) }
      return url.map { ArcGISVectorTiledLayer(url: $0) }
    default:  // "tiled"
      if let item { return ArcGISTiledLayer(item: item) }
      return url.map { ArcGISTiledLayer(url: $0) }
    }
  }

  /// Builds an operational `Layer` from a record, or nil if malformed.
  private func makeLayer(from record: LayerRecord) -> Layer? {
    let url = record.url.flatMap { URL(string: $0) }
    let layer: Layer?
    switch record.type {
    case "tiled": layer = url.map { ArcGISTiledLayer(url: $0) }
    case "vectorTiled": layer = url.map { ArcGISVectorTiledLayer(url: $0) }
    case "openStreetMap": layer = OpenStreetMapLayer()
    case "webTiled":
      layer = record.urlTemplate.map { WebTiledLayer(urlTemplate: $0, subDomains: record.subDomains) }
    case "wms":
      layer = url.map { wmsURL in
        let wms = WMSLayer(url: wmsURL, layerNames: record.layerNames)
        if let style = record.styleName {
          Task {
            try? await wms.load()
            for sub in wms.sublayers { (sub as? WMSSublayer)?.currentStyle = style }
          }
        }
        return wms
      }
    case "wmts":
      if let url, let layerID = record.layerId {
        layer = WMTSLayer(url: url, layerID: layerID)
      } else {
        layer = nil
      }
    case "mapImage":
      if let url {
        let mapImageLayer = ArcGISMapImageLayer(url: url)
        applySublayerVisibility(record.sublayerVisibility, to: mapImageLayer)
        applySublayerRenderers(record.sublayerRenderers, to: mapImageLayer)
        layer = mapImageLayer
      } else {
        layer = nil
      }
    case "wfs":
      if let url, let tableName = record.tableName {
        let table = WFSFeatureTable(url: url, tableName: tableName)
        table.featureRequestMode = .manualCache
        let featureLayer = FeatureLayer(featureTable: table)
        let xml = record.xmlQuery
        Task {
          if let xml {
            try? await table.populateFromService(usingXMLRequest: xml, clearCache: true)
          } else {
            try? await table.populateFromService(
              using: QueryParameters(), clearCache: true, outFields: ["*"])
          }
        }
        layer = featureLayer
      } else {
        layer = nil
      }
    case "ogcFeature":
      if let url, let collectionID = record.collectionId {
        let table = OGCFeatureCollectionTable(url: url, collectionID: collectionID)
        table.featureRequestMode = .manualCache
        let featureLayer = FeatureLayer(featureTable: table)
        let cql = record.cqlFilter
        Task {
          let parameters = QueryParameters()
          if let cql { parameters.whereClause = cql }
          try? await table.populateFromService(
            using: parameters, clearCache: true, outFields: ["*"],
            queryLanguage: cql != nil ? .cql2Text : nil)
        }
        layer = featureLayer
      } else {
        layer = nil
      }
    case "featureCollection":
      if let portalItemId = record.portalItemId, let itemID = PortalItem.ID(portalItemId) {
        let item = PortalItem(portal: .arcGISOnline(connection: .anonymous), id: itemID)
        layer = FeatureCollectionLayer(featureCollection: FeatureCollection(item: item))
      } else {
        layer = nil
      }
    case "featureCollectionFromTable":
      let fields = record.fields.map {
        Field(type: fieldType(from: $0.type), name: $0.name, alias: $0.name)
      }
      let table = FeatureCollectionTable(
        fields: fields, geometryType: Point.self, spatialReference: .wgs84)
      table.renderer = SimpleRenderer(
        symbol: SimpleMarkerSymbol(style: .circle, color: .red, size: 10))
      let featureRecords = record.features
      Task {
        for featureRecord in featureRecords {
          let point = Point(
            latitude: featureRecord.point.latitude, longitude: featureRecord.point.longitude)
          let feature = table.makeFeature(
            attributes: inputAttributes(featureRecord.attributes), geometry: point)
          try? await table.add(feature)
        }
      }
      layer = FeatureCollectionLayer(
        featureCollection: FeatureCollection(featureCollectionTables: [table]))
    case "kml":
      layer = url.map { kmlURL -> KMLLayer in
        let kmlLayer = KMLLayer(dataset: KMLDataset(url: kmlURL))
        if let opacity = record.groundOverlayOpacity {
          applyGroundOverlayOpacity(opacity, to: kmlLayer)
        }
        return kmlLayer
      }
    case "raster":
      // Base raster: an image service (url, optionally with a server rendering
      // rule) or a local file (path).
      let baseRaster: Raster? =
        url.map { serviceURL -> Raster in
          let isr = ImageServiceRaster(url: serviceURL)
          if let ruleName = record.renderingRule, !ruleName.isEmpty {
            isr.renderingRule = RenderingRule(info: RenderingRuleInfo(name: ruleName))
          }
          if let ruleRecord = record.mosaicRule {
            isr.mosaicRule = makeMosaicRule(ruleRecord)
          }
          return isr
        }
        ?? record.path.map { Raster(fileURL: URL(fileURLWithPath: $0)) }
      // Optionally wrap the base raster in a raster-function chain.
      let raster = baseRaster.flatMap { applyRasterFunction(record.rasterFunction, to: $0) }
      let rasterLayer = raster.map { RasterLayer(raster: $0) }
      if let rasterLayer {
        // Precedence: blend, rgb, colormap, stretch, hillshade.
        if let blend = record.blend {
          let elevationRaster: Raster? =
            blend.elevationUrl.flatMap { $0.isEmpty ? nil : URL(string: $0) }
            .map { ImageServiceRaster(url: $0) }
            ?? blend.elevationPath.flatMap {
              $0.isEmpty ? nil : Raster(fileURL: URL(fileURLWithPath: $0))
            }
          let colorRamp: ColorRamp? = blend.colorRamp.flatMap { name in
            switch name {
            case "elevation": return ColorRamp(preset: .elevation, size: 256)
            case "demScreen": return ColorRamp(preset: .demScreen, size: 256)
            case "demLight": return ColorRamp(preset: .demLight, size: 256)
            default: return nil
            }
          }
          rasterLayer.renderer = BlendRenderer(
            elevationRaster: elevationRaster,
            outputMinValues: [9], outputMaxValues: [255],
            sourceMinValues: [], sourceMaxValues: [],
            noDataValues: [], gammas: [],
            colorRamp: colorRamp,
            altitude: blend.altitudeDegrees ?? 45,
            azimuth: blend.azimuthDegrees ?? 315,
            slopeType: nil,
            zFactor: blend.zFactor ?? 1)
        } else if let rgb = record.rgb {
          let parameters =
            rgb.stretch.flatMap(stretchParameters)
            ?? PercentClipStretchParameters(min: 0.5, max: 0.5)
          let bands = rgb.bandIndices.isEmpty ? [0, 1, 2] : rgb.bandIndices
          rasterLayer.renderer = RGBRenderer(
            stretchParameters: parameters, bandIndexes: bands, gammas: [],
            estimatesStatistics: true)
        } else if let colormap = record.colormap, !colormap.colors.isEmpty {
          let colors = colormap.colors.compactMap(parseHexColor)
          rasterLayer.renderer = ColormapRenderer(colormap: Colormap(colors: colors))
        } else if let stretch = record.stretch, let parameters = stretchParameters(stretch) {
          rasterLayer.renderer = StretchRenderer(
            parameters: parameters, gammas: [], estimatesStatistics: true, colorRamp: nil)
        } else if let hillshade = record.hillshade {
          rasterLayer.renderer = HillshadeRenderer(
            altitude: hillshade.altitudeDegrees ?? 45,
            azimuth: hillshade.azimuthDegrees ?? 315,
            slopeType: nil,
            zFactor: hillshade.zFactor ?? 1)
        }
      }
      layer = rasterLayer
    case "shapefile":
      if let path = record.path {
        let featureLayer = FeatureLayer(
          featureTable: ShapefileFeatureTable(fileURL: URL(fileURLWithPath: path)))
        if let renderer = makeRenderer(from: record.renderer) {
          featureLayer.renderer = renderer
        }
        layer = featureLayer
      } else {
        layer = nil
      }
    case "geoPackage":
      if let path = record.path {
        // GeoPackage tables load asynchronously; use a group as a placeholder and
        // add the feature layer once the package has loaded.
        let group = GroupLayer()
        let index = record.tableIndex ?? 0
        Task {
          let package = GeoPackage(fileURL: URL(fileURLWithPath: path))
          try? await package.load()
          if index >= 0, index < package.featureTables.count {
            group.addLayer(FeatureLayer(featureTable: package.featureTables[index]))
          }
        }
        layer = group
      } else {
        layer = nil
      }
    case "annotation":
      layer = url.map { annotationURL -> AnnotationLayer in
        let annotationLayer = AnnotationLayer(url: annotationURL)
        if !record.sublayerVisibility.isEmpty {
          let wanted = record.sublayerVisibility
          Task { [weak annotationLayer] in
            try? await annotationLayer?.load()
            guard let contents = annotationLayer?.subLayerContents else { return }
            for entry in wanted {
              guard let name = entry.name else { continue }
              contents.first { $0.name == name }?.isVisible = entry.visible
            }
          }
        }
        return annotationLayer
      }
    case "dimension":
      layer = url.map { DimensionLayer(url: $0) }
    case "enc":
      layer = record.path.map { path -> Layer in
        // ENC needs process-wide hydrography resources; set them before loading.
        if let resource = record.resourcePath {
          ENCEnvironmentSettings.shared.resourceURL = URL(fileURLWithPath: resource)
        }
        if let senc = record.sencPath {
          ENCEnvironmentSettings.shared.sencDataURL = URL(fileURLWithPath: senc)
        }
        // An exchange set may hold several cells; load asynchronously and add
        // each cell's ENC layer to a group used as the reconciled layer.
        let group = GroupLayer()
        let exchangeSet = ENCExchangeSet(fileURLs: [URL(fileURLWithPath: path)])
        Task {
          try? await exchangeSet.load()
          for dataset in exchangeSet.datasets {
            group.addLayer(ENCLayer(cell: ENCCell(dataset: dataset)))
          }
        }
        return group
      }
    case "dynamicEntity":
      if let feed = record.customFeed {
        // A custom feed replays a local JSONL file through a custom data source.
        layer = makeCustomDynamicEntityLayer(feed)
      } else {
        layer = url.map { streamURL -> DynamicEntityLayer in
          let service = ArcGISStreamService(url: streamURL)
          let entityLayer = DynamicEntityLayer(dataSource: service)
          // Connect the stream so observations start flowing once the layer is shown.
          Task { [weak service] in try? await service?.connect() }
          return entityLayer
        }
      }
    case "subtypeFeature":
      layer = url.map { SubtypeFeatureLayer(featureTable: ServiceFeatureTable(url: $0)) }
    case "featureCollectionFromQuery":
      if let url {
        let collection = FeatureCollection()
        let whereClause = record.`where` ?? "1=1"
        Task {
          let serviceTable = ServiceFeatureTable(url: url)
          try? await serviceTable.load()
          let parameters = QueryParameters()
          parameters.whereClause = whereClause
          if let result = try? await serviceTable.queryFeatures(using: parameters) {
            collection.addTable(FeatureCollectionTable(featureSet: result))
          }
        }
        layer = FeatureCollectionLayer(featureCollection: collection)
      } else {
        layer = nil
      }
    case "group":
      // Build each sublayer with the same converter; nested groups are rejected
      // in JS validation, so sublayers are always leaf layers here.
      layer = GroupLayer(layers: record.sublayers.compactMap { makeLayer(from: $0) })
    default: layer = nil
    }
    guard let layer else { return nil }
    layer.isVisible = record.visible ?? true
    layer.opacity = Float(record.opacity ?? 1)
    return layer
  }

  private func stretchParameters(_ record: StretchRecord) -> StretchParameters? {
    switch record.type {
    case "minMax":
      return MinMaxStretchParameters(minValues: [record.min ?? 0], maxValues: [record.max ?? 255])
    case "percentClip":
      return PercentClipStretchParameters(min: record.minPercent ?? 0, max: record.maxPercent ?? 0)
    case "standardDeviation":
      return StandardDeviationStretchParameters(factor: record.factor ?? 2)
    default:
      return nil
    }
  }

  private func fieldType(from value: String) -> FieldType {
    switch value {
    case "integer": return .int32
    case "double": return .float64
    default: return .text
    }
  }

  /// Converts Expo-decoded attribute values to feature-table attributes.
  private func inputAttributes(_ attributes: [String: Any]) -> [String: any Sendable] {
    var result: [String: any Sendable] = [:]
    for (key, value) in attributes {
      switch value {
      case let string as String: result[key] = string
      case let number as NSNumber: result[key] = number.doubleValue
      default: result[key] = String(describing: value)
      }
    }
    return result
  }

  /// Applies sublayer visibility once a map image layer has loaded.
  private func applySublayerVisibility(
    _ records: [SublayerVisibilityRecord], to layer: ArcGISMapImageLayer
  ) {
    guard !records.isEmpty else { return }
    Task {
      try? await layer.load()
      for record in records {
        layer.mapImageSublayers.first(where: { $0.id == record.sublayerId })?.isVisible =
          record.visible
      }
    }
  }

  /// Applies per-sublayer renderers once a map image layer has loaded.
  private func applySublayerRenderers(
    _ records: [SublayerRendererRecord], to layer: ArcGISMapImageLayer
  ) {
    guard !records.isEmpty else { return }
    Task {
      try? await layer.load()
      for record in records {
        guard let renderer = makeRenderer(from: record.renderer) else { continue }
        layer.mapImageSublayers.first(where: { $0.id == record.sublayerId })?.renderer = renderer
      }
    }
  }

  private func applyProps(_ record: FeatureLayerRecord, to layer: FeatureLayer) {
    layer.isVisible = record.visible ?? true
    layer.opacity = Float(record.opacity ?? 1.0)
    if let renderer = makeRenderer(from: record.renderer) {
      layer.renderer = renderer
    }
    if let definitionExpression = record.definitionExpression {
      layer.definitionExpression = definitionExpression
    }
    if let labels = record.labels {
      layer.removeAllLabelDefinitions()
      for label in labels {
        layer.addLabelDefinition(makeLabelDefinition(from: label))
      }
      layer.labelsAreEnabled = !labels.isEmpty
    }
    if let clustering = record.clustering {
      layer.featureReduction = makeClustering(from: clustering)
    }
    if let offset = record.timeOffset {
      layer.timeOffset = TimeValue(duration: offset.value, unit: timeUnit(from: offset.unit))
    } else {
      layer.timeOffset = nil
    }
    switch record.renderingMode {
    case "static": layer.renderingMode = .static
    case "dynamic": layer.renderingMode = .dynamic
    case "automatic": layer.renderingMode = .automatic
    default: break
    }
  }

  private func timeUnit(from value: String) -> TimeValue.Unit {
    switch value {
    case "centuries": return .centuries
    case "decades": return .decades
    case "years": return .years
    case "months": return .months
    case "weeks": return .weeks
    case "days": return .days
    case "hours": return .hours
    case "minutes": return .minutes
    case "seconds": return .seconds
    case "milliseconds": return .milliseconds
    default: return .years
    }
  }

  private func loadFeatureLayer(_ layer: FeatureLayer, id: String) {
    Task { [weak self] in
      do {
        try await layer.load()
      } catch is CancellationError {
        // Disposed mid-load; nothing to report.
      } catch {
        self?.onError?(
          arcgisErrorPayload(
            ArcgisErrorCode.layerLoadFailed,
            "A feature layer failed to load.",
            details: ["layerId": id]
          ))
      }
    }
  }

  private func load(_ map: Map) {
    loadTask?.cancel()
    loadTask = Task { [weak self] in
      do {
        try await map.load()
        if Task.isCancelled { return }
        self?.applyFloorLevel(to: map)
        self?.setupGeotriggers()
        // WKID is RawRepresentable over Int (ArcGIS Maps SDK for Swift 300.0).
        let wkid = map.spatialReference?.wkid?.rawValue ?? 0
        self?.onLoad?(wkid)
      } catch is CancellationError {
        // Disposed mid-load; nothing to report.
      } catch {
        if Task.isCancelled { return }
        self?.onError?(mapLoadErrorPayload())
      }
    }
  }

  /// Starts/stops the device-location data source per the `locationDisplay` prop
  /// and streams location updates to JS. Starting triggers the OS permission
  /// prompt; if permission is denied, `start()` throws and nothing is shown.
  func setLocationDisplay(_ record: LocationDisplayRecord?) {
    locationTask?.cancel()
    locationTask = nil
    nmeaReplayTask?.cancel()
    nmeaReplayTask = nil
    guard let record, record.enabled else {
      Task { await locationDisplay.dataSource.stop() }
      return
    }
    locationDisplay.autoPanMode = autoPanMode(record.autoPanMode)
    locationDisplay.showsAccuracy = record.showAccuracy ?? true

    // Choose the data source: system GPS (default), replayed NMEA sentences, or
    // the map's indoor positioning (IPS).
    switch record.dataSource {
    case "nmea":
      let nmea = NMEALocationDataSource()
      locationDisplay.dataSource = nmea
      if let path = record.nmeaSentencesPath {
        startNmeaReplay(nmea, path: path)
      }
    case "indoors":
      if let definition = map?.indoorPositioningDefinition {
        locationDisplay.dataSource = IndoorsLocationDataSource(definition: definition)
      }
    default:
      locationDisplay.dataSource = SystemLocationDataSource()
    }

    locationTask = Task { [weak self] in
      guard let self else { return }
      do {
        try await self.locationDisplay.dataSource.start()
      } catch {
        return  // Permission denied or unavailable; show nothing.
      }
      for await location in self.locationDisplay.dataSource.locations {
        if Task.isCancelled { return }
        self.emitLocation(location)
      }
    }
  }

  /// Replays a file of newline-separated NMEA sentences into an
  /// `NMEALocationDataSource` at ~2 Hz, looping so the blue dot keeps moving.
  private func startNmeaReplay(_ nmea: NMEALocationDataSource, path: String) {
    guard let content = try? String(contentsOfFile: path, encoding: .utf8) else { return }
    let sentences = content.split(whereSeparator: \.isNewline).map(String.init)
    guard !sentences.isEmpty else { return }
    nmeaReplayTask = Task {
      var index = 0
      while !Task.isCancelled {
        if let data = (sentences[index % sentences.count] + "\n").data(using: .utf8) {
          nmea.pushData(data)
        }
        index += 1
        try? await Task.sleep(nanoseconds: 500_000_000)
      }
    }
  }

  /// Shows only the requested floor level on a floor-aware map.
  private func applyFloorLevel(to map: Map) {
    guard let level = floorLevel, let floorManager = map.floorManager else { return }
    Task {
      try? await floorManager.load()
      for lvl in floorManager.levels {
        lvl.isVisible = lvl.levelNumber == level
      }
    }
  }

  /// (Re)creates geotrigger monitors that fence the map's graphics against the
  /// device location, emitting enter/exit notifications to JS.
  private func setupGeotriggers() {
    for task in geotriggerTasks { task.cancel() }
    geotriggerTasks = []
    guard !geotriggerRecords.isEmpty else { return }
    let feed = LocationGeotriggerFeed(locationDataSource: locationDisplay.dataSource)
    for record in geotriggerRecords {
      let ruleType: FenceGeotrigger.RuleType
      switch record.ruleType {
      case "enter": ruleType = .enter
      case "exit": ruleType = .exit
      default: ruleType = .enterOrExit
      }
      let fenceParameters = GraphicsOverlayFenceParameters(
        graphicsOverlay: graphicsOverlay, bufferDistance: record.bufferMeters ?? 0)
      let geotrigger = FenceGeotrigger(
        feed: feed, ruleType: ruleType, fenceParameters: fenceParameters, name: record.id)
      let monitor = GeotriggerMonitor(geotrigger: geotrigger)
      let task = Task { [weak self] in
        do { try await monitor.start() } catch { return }
        for await info in monitor.notifications {
          guard let self, let fenceInfo = info as? FenceGeotriggerNotificationInfo else { continue }
          let action = fenceInfo.fenceNotificationType == .entered ? "entered" : "exited"
          self.onGeotrigger?([
            "geotriggerId": record.id,
            "action": action,
            "message": fenceInfo.message,
          ])
        }
      }
      geotriggerTasks.append(task)
    }
  }

  private func autoPanMode(_ value: String?) -> LocationDisplay.AutoPanMode {
    switch value {
    case "off": return .off
    case "navigation": return .navigation
    case "compassNavigation": return .compassNavigation
    default: return .recenter
    }
  }

  /// Throttled emit of a device location (projected to WGS 84).
  private func emitLocation(_ location: Location) {
    let now = Date()
    guard now.timeIntervalSince(lastLocationEmit) >= 0.5 else { return }
    lastLocationEmit = now
    let point = (GeometryEngine.project(location.position, into: .wgs84) as? Point) ?? location.position
    onLocationUpdate?([
      "position": ["latitude": point.y, "longitude": point.x],
      "horizontalAccuracy": location.horizontalAccuracy,
      "speed": location.speed,
      "course": location.course,
    ])
  }

  /// Animates (or jumps) to `record`; resolves once the transition is applied.
  func setViewpoint(_ record: ViewpointRecord, animation: ViewpointAnimationRecord?) async {
    let viewpoint = makeViewpoint(from: record)
    let durationMs = animation?.durationMs ?? 0
    if durationMs > 0 {
      _ = await mapProxy?.setViewpoint(viewpoint, duration: durationMs / 1000)
    } else {
      _ = await mapProxy?.setViewpoint(viewpoint)
    }
  }

  /// Emits a single-tap event with the tapped location (WGS 84) and screen point.
  func handleSingleTap(screenPoint: CGPoint, mapPoint: Point?) {
    guard let mapPoint else { return }
    let center = (GeometryEngine.project(mapPoint, into: .wgs84) as? Point) ?? mapPoint
    onSingleTap?([
      "mapPoint": ["latitude": center.y, "longitude": center.x],
      "screenPoint": ["x": screenPoint.x, "y": screenPoint.y],
    ])
  }

  /// Emits the current draw status as a stable string union.
  func handleDrawStatusChanged(_ status: DrawStatus) {
    onDrawStatusChange?(["status": status == .inProgress ? "inProgress" : "completed"])
  }

  /// Emits a layer's view-state change, mapping the native layer back to the
  /// caller-assigned id when it is one we added via `map.layers`.
  func handleLayerViewStateChanged(_ layer: Layer, _ state: LayerViewState) {
    let id =
      layers.first(where: { $0.value === layer })?.key
      ?? featureLayers.first(where: { $0.value === layer })?.key
    var statuses: [String] = []
    if state.status.contains(.active) { statuses.append("active") }
    if state.status.contains(.notVisible) { statuses.append("notVisible") }
    if state.status.contains(.outOfScale) { statuses.append("outOfScale") }
    if state.status.contains(.loading) { statuses.append("loading") }
    if state.status.contains(.error) { statuses.append("error") }
    if state.status.contains(.warning) { statuses.append("warning") }
    var payload: [String: Any] = [
      "layerName": layer.name,
      "statuses": statuses,
    ]
    if let id { payload["layerId"] = id }
    if state.status.contains(.error) {
      // A fixed, safe message — never surface raw native error text.
      payload["error"] = "The layer failed to load or draw."
    }
    onLayerViewStateChange?(payload)
  }

  /// Hit-tests feature layers and the graphics overlay at a screen point.
  func identify(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    guard let proxy = mapProxy else { return [] }
    let screenPoint = CGPoint(x: options.screenPoint.x, y: options.screenPoint.y)
    let tolerance = options.tolerance ?? 12
    var results: [[String: Any]] = []

    if let layerResults = try? await proxy.identifyLayers(
      screenPoint: screenPoint,
      tolerance: tolerance,
      returnPopupsOnly: false,
      maximumResultsPerLayer: options.maximumResults
    ) {
      for layerResult in layerResults {
        let source = sourceID(for: layerResult.layerContent)
        results.append(contentsOf: collectIdentifyResults(layerResult, sourceID: source))
      }
    }

    if let overlayResults = try? await proxy.identifyGraphicsOverlays(
      screenPoint: screenPoint,
      tolerance: tolerance,
      returnPopupsOnly: false,
      maximumResultsPerOverlay: options.maximumResults
    ) {
      for overlayResult in overlayResults {
        for graphic in overlayResult.graphics {
          results.append(identifyResult(sourceID: "graphics", element: graphic))
        }
      }
    }

    return results
  }

  func showPopup(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    guard let proxy = mapProxy else { return [] }
    let screenPoint = CGPoint(x: options.screenPoint.x, y: options.screenPoint.y)
    let tolerance = options.tolerance ?? 12
    var results: [[String: Any]] = []

    guard
      let layerResults = try? await proxy.identifyLayers(
        screenPoint: screenPoint,
        tolerance: tolerance,
        returnPopupsOnly: false,
        maximumResultsPerLayer: options.maximumResults
      )
    else { return results }

    for layerResult in layerResults {
      let sourceID = featureLayerID(for: layerResult.layerContent) ?? "layer"
      let layer = layerResult.layerContent as? FeatureLayer
      for element in layerResult.geoElements {
        // Use the layer's configured popup when it has one; otherwise a nil
        // definition makes ArcGIS generate a default popup from the feature's
        // fields, so any feature layer produces a usable popup.
        let popup = Popup(geoElement: element, definition: layer?.popupDefinition)
        _ = try? await popup.evaluateExpressions()
        var fields: [[String: String]] = []
        for popupElement in popup.evaluatedElements {
          guard let fieldsElement = popupElement as? FieldsPopupElement else { continue }
          for (label, value) in zip(fieldsElement.labels, fieldsElement.formattedValues) {
            fields.append(["label": label, "value": value])
          }
        }
        results.append(["sourceId": sourceID, "title": popup.title, "fields": fields])
      }
    }
    return results
  }

  func showFeatureForm(_ options: IdentifyOptionsRecord) async -> [[String: Any]] {
    guard let proxy = mapProxy else { return [] }
    let screenPoint = CGPoint(x: options.screenPoint.x, y: options.screenPoint.y)
    let tolerance = options.tolerance ?? 12
    var results: [[String: Any]] = []

    guard
      let layerResults = try? await proxy.identifyLayers(
        screenPoint: screenPoint,
        tolerance: tolerance,
        returnPopupsOnly: false,
        maximumResultsPerLayer: options.maximumResults
      )
    else { return results }

    for layerResult in layerResults {
      let sourceID = featureLayerID(for: layerResult.layerContent) ?? "layer"
      for element in layerResult.geoElements {
        guard let feature = element as? ArcGISFeature else { continue }
        let form = FeatureForm(feature: feature)
        var fields: [[String: String]] = []
        collectFieldFormElements(form.elements, into: &fields)
        results.append(["sourceId": sourceID, "title": form.title, "fields": fields])
      }
    }
    return results
  }

  /// Flattens field form elements (including those nested in groups) into
  /// serializable `{ label, value }` rows.
  private func collectFieldFormElements(
    _ elements: [FormElement], into fields: inout [[String: String]]
  ) {
    for element in elements {
      if let field = element as? FieldFormElement {
        fields.append(["label": field.label, "value": field.formattedValue])
      } else if let group = element as? GroupFormElement {
        collectFieldFormElements(group.elements, into: &fields)
      }
    }
  }

  /// Identifies features at a screen point and evaluates an Arcade expression
  /// against each, with the feature bound to `$feature` and the map to `$map`.
  func evaluateArcade(_ options: ArcadeEvaluationOptionsRecord) async -> [[String: Any]] {
    guard let proxy = mapProxy else { return [] }
    let screenPoint = CGPoint(x: options.screenPoint.x, y: options.screenPoint.y)
    let tolerance = options.tolerance ?? 12
    var results: [[String: Any]] = []

    guard
      let layerResults = try? await proxy.identifyLayers(
        screenPoint: screenPoint,
        tolerance: tolerance,
        returnPopupsOnly: false,
        maximumResultsPerLayer: options.maximumResults
      )
    else { return results }

    let expression = ArcadeExpression(expression: options.expression)
    for layerResult in layerResults {
      let sourceID = featureLayerID(for: layerResult.layerContent) ?? "layer"
      for element in layerResult.geoElements {
        guard let feature = element as? ArcGISFeature else { continue }
        // A fresh evaluator per feature; the form-calculation profile exposes
        // `$feature` and `$map`.
        let evaluator = ArcadeEvaluator(expression: expression, profile: .formCalculation)
        var variables: [String: any Sendable] = ["$feature": feature]
        if let map { variables["$map"] = map }
        guard
          let evaluation = try? await evaluator.evaluate(withProfileVariables: variables)
        else { continue }
        results.append(["sourceId": sourceID, "value": Self.stringifyArcade(evaluation.result)])
      }
    }
    return results
  }

  /// Renders an Arcade result value as display text (whole doubles lose the
  /// trailing `.0`; booleans become `true`/`false`; nil becomes an empty string).
  private static func stringifyArcade(_ value: Any?) -> String {
    switch value {
    case let number as Double:
      return number == number.rounded() ? String(Int(number)) : String(number)
    case let bool as Bool:
      return bool ? "true" : "false"
    case let string as String:
      return string
    case let some?:
      return String(describing: some)
    default:
      return ""
    }
  }

  func startGeometryEditor(_ options: GeometryEditorRecord) {
    switch options.tool {
    case "freehand": geometryEditor.tool = FreehandTool()
    case "reticle": geometryEditor.tool = ReticleVertexTool()
    default: geometryEditor.tool = VertexTool()
    }
    if options.snapEnabled {
      geometryEditor.snapSettings.isEnabled = true
      // Sync snap sources from the connected map's operational layers; a no-op
      // when there are no snappable layers.
      try? geometryEditor.snapSettings.syncSourceSettings()
    }
    let geometryType: Geometry.Type
    switch options.geometryType {
    case "point": geometryType = Point.self
    case "polyline": geometryType = Polyline.self
    default: geometryType = ArcGIS.Polygon.self
    }
    geometryEditor.start(withType: geometryType)
  }

  func stopGeometryEditor() -> [String: Any]? {
    guard let geometry = geometryEditor.stop() else { return nil }
    let wgs = GeometryEngine.project(geometry, into: .wgs84) ?? geometry
    return serializeGeometry(wgs)
  }

  private let navigationRouteURL = URL(
    string:
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World")!

  func startNavigation(_ stops: [PointRecord], reroute: Bool = false) async throws {
    stopNavigation()
    let routeTask = RouteTask(url: navigationRouteURL)
    try await routeTask.load()
    let parameters = try await routeTask.makeDefaultParameters()
    parameters.returnsDirections = true
    parameters.returnsRoutes = true
    // RouteTracker requires the solved result to include its stops; without this
    // the tracker initializer returns nil and navigation cannot start.
    parameters.returnsStops = true
    parameters.setStops(
      stops.map { Stop(point: Point(latitude: $0.latitude, longitude: $0.longitude)) })
    let routeResult = try await routeTask.solveRoute(using: parameters)
    guard let route = routeResult.routes.first, let geometry = route.geometry,
      let tracker = RouteTracker(
        routeResult: routeResult, routeIndex: 0, skipsCoincidentStops: true)
    else {
      throw ArcgisException((code: ArcgisErrorCode.nativeFailure, message: "No route to navigate."))
    }
    // When requested, let the tracker re-solve automatically if the location
    // leaves the route. Rerouting reuses the same task/parameters and requires a
    // route source that supports it (an offline transportation-network dataset);
    // the online World Route service does not, and reports that here.
    if reroute {
      guard let reroutingParameters = ReroutingParameters(
        routeTask: routeTask, routeParameters: parameters) else {
        throw ArcgisException((
          code: ArcgisErrorCode.unsupported,
          message: "Rerouting is not supported for this route source."))
      }
      do {
        try await tracker.enableRerouting(using: reroutingParameters)
      } catch {
        throw ArcgisException((
          code: ArcgisErrorCode.unsupported,
          message: "Rerouting is not supported for this route source."))
      }
    }
    navigationRoute = route
    routeTracker = tracker

    let simulated = SimulatedLocationDataSource(polyline: geometry)
    locationDisplay.dataSource = simulated
    locationDisplay.autoPanMode = .navigation
    try await locationDisplay.dataSource.start()

    navigationTask = Task { [weak self] in
      guard let self else { return }
      for await location in self.locationDisplay.dataSource.locations {
        if Task.isCancelled { break }
        try? await tracker.track(location)
        guard let status = tracker.trackingStatus else { continue }
        let maneuvers = route.directionManeuvers
        let index = status.currentManeuverIndex
        let maneuver = (index >= 0 && index < maneuvers.count) ? maneuvers[index].text : ""
        self.onNavigationStatus?([
          "maneuver": maneuver,
          "distanceRemainingMeters": status.routeProgress.remainingDistance.distance
            .converted(to: .meters).value,
          "timeRemainingMinutes": status.routeProgress.remainingTime / 60,
          "isOnRoute": status.isOnRoute,
        ])
      }
    }
  }

  func stopNavigation() {
    navigationTask?.cancel()
    navigationTask = nil
    routeTracker = nil
    navigationRoute = nil
    Task { await locationDisplay.dataSource.stop() }
  }

  private func featureLayerID(for layerContent: LayerContent) -> String? {
    guard let layer = layerContent as? FeatureLayer else { return nil }
    return featureLayers.first(where: { $0.value === layer })?.key
  }

  /// Resolves a stable source id for any identified layer — feature layers first,
  /// then operational layers (WMS, etc.) tracked by id.
  private func sourceID(for layerContent: LayerContent) -> String {
    if let id = featureLayerID(for: layerContent) { return id }
    if let layer = layerContent as? Layer,
      let id = layers.first(where: { $0.value === layer })?.key {
      return id
    }
    return "layer"
  }

  /// Flattens an identify result and its sublayer results (WMS/map-image feature
  /// info arrives nested) into serialized geo-element rows tagged with `sourceID`.
  private func collectIdentifyResults(_ layerResult: IdentifyLayerResult, sourceID: String)
    -> [[String: Any]]
  {
    var rows: [[String: Any]] = []
    for element in layerResult.geoElements {
      rows.append(identifyResult(sourceID: sourceID, element: element))
    }
    for sublayerResult in layerResult.sublayerResults {
      rows.append(contentsOf: collectIdentifyResults(sublayerResult, sourceID: sourceID))
    }
    return rows
  }

  private func identifyResult(sourceID: String, element: GeoElement) -> [String: Any] {
    var result = geoElementResult(element)
    result["sourceId"] = sourceID
    return result
  }

  /// Serializable `{ attributes, location? }` for a geo-element (feature/graphic).
  private func geoElementResult(_ element: GeoElement) -> [String: Any] {
    var result: [String: Any] = ["attributes": serializeAttributes(element.attributes)]
    let point = (element.geometry as? Point) ?? element.geometry?.extent.center
    if let point, let wgs = GeometryEngine.project(point, into: .wgs84) as? Point {
      result["location"] = ["latitude": wgs.y, "longitude": wgs.x]
    }
    return result
  }

  /// Queries features from a feature layer already on the map, by where clause.
  func queryFeatures(_ options: FeatureQueryOptionsRecord) async throws -> [[String: Any]] {
    guard let layer = featureLayers[options.layerId] else {
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "No feature layer with id \"\(options.layerId)\"."
      ))
    }
    let parameters = QueryParameters()
    parameters.whereClause = options.whereClause ?? "1=1"
    if let maxResults = options.maxResults {
      parameters.maxFeatures = maxResults
    }
    guard let table = layer.featureTable else { return [] }
    let queryResult = try await table.queryFeatures(using: parameters)
    let features = Array(queryResult.features())
    // Optionally highlight the matches on the layer, clearing any prior selection.
    if options.select {
      layer.clearSelection()
      layer.selectFeatures(features)
    }
    return features.map { geoElementResult($0) }
  }

  /// Highlights (selects) the features matching a where clause; returns the count.
  func selectFeatures(_ options: LayerWhereRecord) async throws -> Int {
    let layer = try requireFeatureLayer(options.layerId)
    let parameters = QueryParameters()
    parameters.whereClause = options.whereClause ?? "1=1"
    let result = try await layer.selectFeatures(using: parameters, mode: .new)
    return Array(result.features()).count
  }

  /// Clears the selection highlight on a feature layer.
  func clearSelection(_ layerId: String) {
    featureLayers[layerId]?.clearSelection()
  }

  /// Loads the KML dataset, then sets every ground overlay's colour to white at
  /// the requested alpha so the overlay images render at that opacity.
  private func applyGroundOverlayOpacity(_ opacity: Double, to layer: KMLLayer) {
    let alpha = max(0, min(1, opacity))
    Task { [weak layer] in
      try? await layer?.dataset.load()
      guard let nodes = layer?.dataset.rootNodes else { return }
      for overlay in Self.kmlGroundOverlays(in: nodes) {
        overlay.color = UIColor(white: 1, alpha: CGFloat(alpha))
      }
    }
  }

  /// Recursively collects every `KMLGroundOverlay` under the given nodes.
  private static func kmlGroundOverlays(in nodes: [KMLNode]) -> [KMLGroundOverlay] {
    var result: [KMLGroundOverlay] = []
    for node in nodes {
      if let overlay = node as? KMLGroundOverlay { result.append(overlay) }
      if let container = node as? KMLContainer {
        result.append(contentsOf: kmlGroundOverlays(in: container.childNodes))
      }
    }
    return result
  }

  /// Recursively finds the first `KMLTour` under the given nodes.
  private static func firstKmlTour(in nodes: [KMLNode]) -> KMLTour? {
    for node in nodes {
      if let tour = node as? KMLTour { return tour }
      if let container = node as? KMLContainer,
        let tour = firstKmlTour(in: container.childNodes) {
        return tour
      }
    }
    return nil
  }

  /// Plays / pauses / resets the KML tour in a KML layer, creating the tour
  /// controller lazily on first use.
  func controlKmlTour(layerId: String, action: String) async throws {
    guard let kmlLayer = layers[layerId] as? KMLLayer else {
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "No KML layer with id \"\(layerId)\"."
      ))
    }
    let controller: KMLTourController
    if let existing = kmlTourControllers[layerId] {
      controller = existing
    } else {
      try? await kmlLayer.dataset.load()
      guard let tour = Self.firstKmlTour(in: kmlLayer.dataset.rootNodes) else {
        throw ArcgisException((
          code: ArcgisErrorCode.unsupported,
          message: "The KML layer has no tour."
        ))
      }
      controller = KMLTourController()
      controller.tour = tour
      kmlTourControllers[layerId] = controller
    }
    switch action {
    case "play": controller.play()
    case "pause": controller.pause()
    case "reset": controller.reset()
    default:
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "Unknown KML tour action \"\(action)\"."
      ))
    }
  }

  /// Returns `{ count, extent? }` for the features matching a where clause.
  func queryFeatureExtent(_ options: LayerWhereRecord) async throws -> [String: Any] {
    let layer = try requireFeatureLayer(options.layerId)
    guard let table = layer.featureTable else { return ["count": 0] }
    let parameters = QueryParameters()
    parameters.whereClause = options.whereClause ?? "1=1"
    let count = try await table.queryFeatureCount(using: parameters)
    var result: [String: Any] = ["count": count]
    if count > 0 {
      let extent = try await table.queryExtent(using: parameters)
      if let wgs = GeometryEngine.project(extent, into: .wgs84) as? Envelope {
        result["extent"] = [
          "minLatitude": wgs.yMin, "minLongitude": wgs.xMin,
          "maxLatitude": wgs.yMax, "maxLongitude": wgs.xMax,
        ]
      }
    }
    return result
  }

  /// Computes aggregate statistics over a feature layer's field(s), optionally
  /// grouped, returning one row per group.
  func queryStatistics(_ options: StatisticsQueryOptionsRecord) async throws -> [[String: Any]] {
    let layer = try requireFeatureLayer(options.layerId)
    guard let table = layer.featureTable else { return [] }
    try await table.load()
    let defs = options.statistics.map {
      StatisticDefinition(
        fieldName: $0.field, statisticType: statisticType(from: $0.type),
        outputAlias: $0.outName ?? "")
    }
    let parameters = StatisticsQueryParameters(statisticDefinitions: defs)
    if let whereClause = options.whereClause { parameters.whereClause = whereClause }
    parameters.addGroupByFieldNames(options.groupByFields)
    let result = try await table.queryStatistics(using: parameters)
    return result.statisticRecords().map { record in
      [
        "group": record.group.mapValues { statValue($0) },
        "statistics": record.statistics.mapValues { statValue($0) },
      ]
    }
  }

  private func featureRequestMode(from value: String) -> FeatureRequestMode {
    switch value {
    case "onInteractionNoCache": return .onInteractionNoCache
    case "manualCache": return .manualCache
    default: return .onInteractionCache
    }
  }

  private func statisticType(from value: String) -> StatisticDefinition.StatisticType {
    switch value {
    case "sum": return .sum
    case "average": return .average
    case "min": return .minimum
    case "max": return .maximum
    case "standardDeviation": return .standardDeviation
    case "variance": return .variance
    default: return .count
    }
  }

  /// Coerces a statistic value (Double / Int / String / …) to a JSON-safe value.
  private func statValue(_ value: any Sendable) -> Any {
    if let d = value as? Double { return d }
    if let i = value as? Int { return i }
    if let n = value as? NSNumber { return n.doubleValue }
    return String(describing: value)
  }

  /// Queries features related to the origin feature (by object id) through the
  /// layer's relationships.
  func queryRelatedFeatures(_ options: RelatedFeaturesOptionsRecord) async throws -> [[String: Any]]
  {
    let layer = try requireFeatureLayer(options.layerId)
    guard let table = layer.featureTable as? ServiceFeatureTable else {
      throw ArcgisException((
        code: ArcgisErrorCode.unsupported,
        message: "Feature layer \"\(options.layerId)\" does not support related queries."
      ))
    }
    let parameters = QueryParameters()
    parameters.whereClause = "\(table.objectIDField) = \(options.objectId)"
    let queried = try await table.queryFeatures(using: parameters)
    guard let origin = Array(queried.features()).first as? ArcGISFeature else { return [] }
    let relatedResults = try await table.queryRelatedFeatures(to: origin)
    var out: [[String: Any]] = []
    for relatedResult in relatedResults {
      for feature in relatedResult.features() {
        out.append(geoElementResult(feature))
      }
    }
    return out
  }

  private func requireFeatureLayer(_ layerId: String) throws -> FeatureLayer {
    guard let layer = featureLayers[layerId] else {
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "No feature layer with id \"\(layerId)\"."
      ))
    }
    return layer
  }

  /// Adds/updates/deletes features on a layer's service table, then pushes the
  /// edits to the service. Updates and deletes are resolved by querying the
  /// table for the target object ids first.
  func applyEdits(_ options: ApplyEditsOptionsRecord) async throws -> [String: Any] {
    guard let layer = featureLayers[options.layerId] else {
      throw ArcgisException((
        code: ArcgisErrorCode.invalidArgument,
        message: "No feature layer with id \"\(options.layerId)\"."
      ))
    }
    guard let table = layer.featureTable as? ServiceFeatureTable else {
      throw ArcgisException((
        code: ArcgisErrorCode.unsupported,
        message: "Feature layer \"\(options.layerId)\" is not backed by an editable service table."
      ))
    }

    // Adds: build local features, remember them so we can read back their
    // server-assigned object ids after applyEdits.
    var addedFeatures: [ArcGISFeature] = []
    for add in options.adds {
      guard let feature = table.makeFeature() as? ArcGISFeature else { continue }
      applyAttributes(add.attributes, to: feature)
      if let point = add.point {
        feature.geometry = projectToTable(point, table)
      }
      try await table.add(feature)
      addedFeatures.append(feature)
    }

    // Updates and deletes operate on existing features fetched by object id.
    let updateIds = options.updates.compactMap { $0.objectId }
    let targetIds = Array(Set(updateIds + options.deleteObjectIds))
    var byObjectId: [Int: ArcGISFeature] = [:]
    if !targetIds.isEmpty {
      let params = QueryParameters()
      let idList = targetIds.map(String.init).joined(separator: ",")
      params.whereClause = "\(table.objectIDField) IN (\(idList))"
      let queried = try await table.queryFeatures(using: params)
      for case let feature as ArcGISFeature in queried.features() {
        if let oid = intValue(feature.attributes[table.objectIDField]) {
          byObjectId[oid] = feature
        }
      }
    }

    var updatedCount = 0
    for update in options.updates {
      guard let oid = update.objectId, let feature = byObjectId[oid] else { continue }
      applyAttributes(update.attributes, to: feature)
      if let point = update.point {
        feature.geometry = projectToTable(point, table)
      }
      try await table.update(feature)
      updatedCount += 1
    }

    var deletedCount = 0
    for oid in options.deleteObjectIds {
      guard let feature = byObjectId[oid] else { continue }
      try await table.delete(feature)
      deletedCount += 1
    }

    // Push the edits and surface any per-edit failure the service reports —
    // otherwise a rejected edit (e.g. an unauthorized token) would look like a
    // silent success with a temporary local object id.
    let results = try await table.applyEdits()
    for result in results {
      if let error = result.error {
        throw serviceException(error, context: "feature editing")
      }
    }

    let addedObjectIds = addedFeatures.compactMap { intValue($0.attributes[table.objectIDField]) }
    // A synced add receives a positive server object id; a negative id means the
    // service did not accept the edit (e.g. it rejects this API key), which the
    // SDK does not always surface as a per-edit error.
    if addedObjectIds.contains(where: { $0 < 0 }) {
      throw ArcgisException((
        code: ArcgisErrorCode.authenticationFailed,
        message:
          "The service did not accept the edit. Ensure the API key or signed-in user is authorized to edit this feature service."
      ))
    }
    return [
      "addedObjectIds": addedObjectIds,
      "updatedCount": updatedCount,
      "deletedCount": deletedCount,
    ]
  }

  /// Applies caller-supplied attribute values to a feature, treating `NSNull` as
  /// an explicit clear.
  private func applyAttributes(_ attributes: [String: Any]?, to feature: ArcGISFeature) {
    guard let attributes else { return }
    for (key, value) in attributes {
      if value is NSNull {
        feature.setAttributeValue(nil, forKey: key)
      } else {
        feature.setAttributeValue(value, forKey: key)
      }
    }
  }

  /// Projects a WGS 84 input point into the table's spatial reference so edits
  /// land in the coordinate system the service expects.
  private func projectToTable(_ point: PointRecord, _ table: ServiceFeatureTable) -> Point {
    let wgs = Point(x: point.longitude, y: point.latitude, spatialReference: .wgs84)
    if let sr = table.spatialReference, let projected = GeometryEngine.project(wgs, into: sr) as? Point {
      return projected
    }
    return wgs
  }

  private func intValue(_ value: Any?) -> Int? {
    (value as? NSNumber)?.intValue
  }

  private func serializeAttributes(_ attributes: [String: Any?]) -> [String: Any] {
    var out: [String: Any] = [:]
    for (key, value) in attributes {
      guard let value else {
        out[key] = NSNull()
        continue
      }
      switch value {
      case let string as String: out[key] = string
      case let number as NSNumber: out[key] = number
      default: out[key] = String(describing: value)
      }
    }
    return out
  }

  /// Throttled handler for viewpoint changes; emits center (WGS 84), scale, rotation.
  func handleViewpointChanged(_ viewpoint: Viewpoint) {
    let now = Date()
    guard now.timeIntervalSince(lastViewpointEmit) >= 0.1 else { return }
    lastViewpointEmit = now
    guard let target = viewpoint.targetGeometry as? Point else { return }
    let center = (GeometryEngine.project(target, into: .wgs84) as? Point) ?? target
    onViewpointChange?([
      "center": ["latitude": center.y, "longitude": center.x],
      "scale": viewpoint.targetScale,
      "rotation": viewpoint.rotation,
    ])
  }

  /// Exports the current map view as a PNG in the temporary directory; returns a
  /// serializable `{ uri, width, height }` (pixels). The caller owns the file.
  func exportImage() async throws -> [String: Any] {
    guard let proxy = mapProxy else {
      throw ArcgisException((
        code: ArcgisErrorCode.nativeFailure,
        message: "The map view is not ready to export an image."
      ))
    }
    // MapViewProxy.exportImage() renders the current visible area (ArcGIS Maps
    // SDK for Swift 300.0).
    let image = try await proxy.exportImage()
    guard let data = image.pngData() else {
      throw ArcgisException((
        code: ArcgisErrorCode.nativeFailure,
        message: "Could not encode the map image as PNG."
      ))
    }
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("map-\(UUID().uuidString).png")
    try data.write(to: url)
    return [
      // `size` is in points; multiply by scale for the pixel dimensions.
      "uri": url.absoluteString,
      "width": Int((image.size.width * image.scale).rounded()),
      "height": Int((image.size.height * image.scale).rounded()),
    ]
  }

  func dispose() {
    loadTask?.cancel()
    loadTask = nil
    locationTask?.cancel()
    locationTask = nil
    nmeaReplayTask?.cancel()
    nmeaReplayTask = nil
    for task in geotriggerTasks { task.cancel() }
    geotriggerTasks = []
    Task { [locationDisplay] in await locationDisplay.dataSource.stop() }
    map = nil
    mapProxy = nil
  }

  deinit {
    // Cancel any in-flight load when the owning view is released. `Task.cancel()`
    // is safe to call from a nonisolated deinit. (Expo iOS has no OnViewDestroys
    // hook — teardown rides the view/model deallocation.)
    loadTask?.cancel()
  }
}

/// SwiftUI host for the ArcGIS `MapView`, embedded in the UIKit `ExpoView` via a
/// `UIHostingController`.
struct MapContainerView: View {
  @ObservedObject var model: MapViewModel

  /// A solid-color background grid (no visible lines), or the SDK default when
  /// no color is set.
  private func backgroundGrid(for color: UIColor?) -> BackgroundGrid {
    guard let color else { return BackgroundGrid() }
    return BackgroundGrid(backgroundColor: color, lineColor: color, lineWidth: 0, size: 20)
  }

  // State bridged from the MapView to the Toolkit Scalebar (see the ArcGIS Maps
  // SDK for Swift "Show scale bar" sample). Only used when `scaleBarEnabled`.
  @State private var scaleBarSpatialReference: SpatialReference?
  @State private var scaleBarUnitsPerPoint: Double?
  @State private var scaleBarViewpoint: Viewpoint?

  var body: some View {
    if let map = model.map {
      MapViewReader { proxy in
        MapView(map: map, graphicsOverlays: [model.graphicsOverlay])
          .onViewpointChanged(kind: .centerAndScale) { viewpoint in
            model.handleViewpointChanged(viewpoint)
            scaleBarViewpoint = viewpoint
          }
          .onSpatialReferenceChanged { scaleBarSpatialReference = $0 }
          .onUnitsPerPointChanged { scaleBarUnitsPerPoint = $0 }
          .onSingleTapGesture { screenPoint, mapPoint in
            model.handleSingleTap(screenPoint: screenPoint, mapPoint: mapPoint)
          }
          .geometryEditor(model.geometryEditor)
          .onDrawStatusChanged { model.handleDrawStatusChanged($0) }
          .onLayerViewStateChanged { model.handleLayerViewStateChanged($0, $1) }
          .grid(model.grid)
          .backgroundGrid(backgroundGrid(for: model.backgroundColor))
          .locationDisplay(model.locationDisplay)
          .allowsHitTesting(model.interactionEnabled)
          .overlay(alignment: .bottomLeading) {
            if model.scaleBarEnabled {
              Scalebar(
                maxWidth: 175,
                spatialReference: scaleBarSpatialReference,
                unitsPerPoint: scaleBarUnitsPerPoint,
                viewpoint: scaleBarViewpoint
              )
              .padding(.leading, 10)
              .padding(.bottom, 10)
            }
          }
          .onAppear { model.mapProxy = proxy }
      }
    } else {
      Color.clear
    }
  }
}
