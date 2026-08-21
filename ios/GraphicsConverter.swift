import ArcGIS
import UIKit

/// Pure conversions from graphics DTO records to ArcGIS geometry/symbol/graphic
/// types, plus a deterministic signature used to reconcile graphics by id.

/// Parses `#RRGGBB` / `#RRGGBBAA` into a `UIColor` (the type ArcGIS symbols
/// expect). Returns nil if invalid.
func parseHexColor(_ hex: String) -> UIColor? {
  var string = hex
  if string.hasPrefix("#") { string.removeFirst() }
  guard string.count == 6 || string.count == 8, let value = UInt64(string, radix: 16) else {
    return nil
  }
  let r: CGFloat
  let g: CGFloat
  let b: CGFloat
  let a: CGFloat
  if string.count == 6 {
    r = CGFloat((value >> 16) & 0xff) / 255
    g = CGFloat((value >> 8) & 0xff) / 255
    b = CGFloat(value & 0xff) / 255
    a = 1
  } else {
    r = CGFloat((value >> 24) & 0xff) / 255
    g = CGFloat((value >> 16) & 0xff) / 255
    b = CGFloat((value >> 8) & 0xff) / 255
    a = CGFloat(value & 0xff) / 255
  }
  return UIColor(red: r, green: g, blue: b, alpha: a)
}

private func point(from record: PointRecord) -> Point {
  // Preserve altitude (z) when present so scene graphics can use absolute or
  // relative surface placement; harmless for 2D maps, which ignore z.
  if let altitude = record.altitude {
    return Point(x: record.longitude, y: record.latitude, z: altitude, spatialReference: .wgs84)
  }
  return Point(latitude: record.latitude, longitude: record.longitude)
}

/// Serializes an ArcGIS `Geometry` to a WGS 84 geometry DTO. Multi-part results
/// return their first part.
func serializeGeometry(_ geometry: Geometry?) -> [String: Any]? {
  guard let geometry else { return nil }
  let wgs = GeometryEngine.project(geometry, into: .wgs84) ?? geometry
  func latLong(_ points: some Sequence<Point>) -> [[String: Double]] {
    points.map { ["latitude": $0.y, "longitude": $0.x] }
  }
  switch wgs {
  case let point as Point:
    return ["type": "point", "point": ["latitude": point.y, "longitude": point.x]]
  case let polyline as Polyline:
    return ["type": "polyline", "path": polyline.parts.first.map { latLong($0.points) } ?? []]
  case let polygon as ArcGIS.Polygon:
    return ["type": "polygon", "ring": polygon.parts.first.map { latLong($0.points) } ?? []]
  default:
    return nil
  }
}

/// Builds an ArcGIS `Geometry` from a record, or nil if malformed.
func makeGeometry(from record: GeometryRecord) -> Geometry? {
  switch record.type {
  case "point":
    guard let p = record.point else { return nil }
    return point(from: p)
  case "polyline":
    return Polyline(points: record.path.map(point(from:)))
  case "polygon":
    return ArcGIS.Polygon(points: record.ring.map(point(from:)))
  default:
    return nil
  }
}

private func markerStyle(_ style: String?) -> SimpleMarkerSymbol.Style {
  switch style {
  case "cross": return .cross
  case "diamond": return .diamond
  case "square": return .square
  case "triangle": return .triangle
  case "x": return .x
  default: return .circle
  }
}

private func sceneMarkerStyle(_ style: String?) -> SimpleMarkerSceneSymbol.Style {
  switch style {
  case "cone": return .cone
  case "cube": return .cube
  case "cylinder": return .cylinder
  case "diamond": return .diamond
  case "tetrahedron": return .tetrahedron
  default: return .sphere
  }
}

private func lineStyle(_ style: String?) -> SimpleLineSymbol.Style {
  switch style {
  case "dash": return .dash
  case "dot": return .dot
  case "dashDot": return .dashDot
  default: return .solid
  }
}

private func fillStyle(_ style: String?) -> SimpleFillSymbol.Style {
  switch style {
  case "horizontal": return .horizontal
  case "vertical": return .vertical
  case "cross": return .cross
  default: return .solid
  }
}

/// Coerces serializable unique-value inputs (`String`/`NSNumber`) to `Sendable`
/// so they match ArcGIS feature attribute values.
private func sendableValues(_ values: [Any]) -> [any Sendable] {
  values.compactMap { value in
    switch value {
    case let string as String: return string
    case let number as NSNumber: return number
    default: return nil
    }
  }
}

/// Builds an ArcGIS `Renderer` from a record, or nil if malformed / absent.
func makeRenderer(from record: RendererRecord?) -> Renderer? {
  guard let record else { return nil }
  switch record.type {
  case "simple":
    guard let symbol = record.symbol.flatMap(makeSymbol(from:)) else { return nil }
    return SimpleRenderer(symbol: symbol)
  case "uniqueValue":
    let uniqueValues = record.uniqueValues.compactMap { uv -> UniqueValue? in
      guard let symbol = makeSymbol(from: uv.symbol) else { return nil }
      return UniqueValue(
        label: uv.label ?? "", symbol: symbol, values: sendableValues(uv.values),
        alternateSymbols: makeAlternateSymbols(uv.alternateSymbols))
    }
    return UniqueValueRenderer(
      fieldNames: record.fields,
      uniqueValues: uniqueValues,
      defaultSymbol: record.defaultSymbol.flatMap(makeSymbol(from:))
    )
  case "classBreaks":
    let classBreaks = record.classBreaks.compactMap { cb -> ClassBreak? in
      guard let symbol = makeSymbol(from: cb.symbol) else { return nil }
      return ClassBreak(
        label: cb.label ?? "",
        minValue: cb.minValue ?? -.greatestFiniteMagnitude,
        maxValue: cb.maxValue,
        symbol: symbol
      )
    }
    let renderer = ClassBreaksRenderer(fieldName: record.field ?? "", classBreaks: classBreaks)
    renderer.defaultSymbol = record.defaultSymbol.flatMap(makeSymbol(from:))
    return renderer
  case "dictionary":
    let dictionaryStyle: DictionarySymbolStyle
    if let stylxPath = record.stylxPath, !stylxPath.isEmpty {
      dictionaryStyle = DictionarySymbolStyle(url: URL(fileURLWithPath: stylxPath))
    } else if let portalItemId = record.portalItemId, let itemID = PortalItem.ID(portalItemId) {
      let item = PortalItem(portal: .arcGISOnline(connection: .anonymous), id: itemID)
      dictionaryStyle = DictionarySymbolStyle(portalItem: item)
    } else {
      return nil
    }
    // The style loads lazily when the renderer is applied to a layer.
    return DictionaryRenderer(dictionarySymbolStyle: dictionaryStyle)
  default:
    return nil
  }
}

/// Converts any supported symbol to a multilayer symbol so scale-based reference
/// properties can be applied.
private func toMultilayer(_ symbol: Symbol) -> MultilayerSymbol? {
  switch symbol {
  case let multilayer as MultilayerSymbol: return multilayer
  case let marker as SimpleMarkerSymbol: return marker.toMultilayerSymbol()
  case let line as SimpleLineSymbol: return line.toMultilayerSymbol()
  case let fill as SimpleFillSymbol: return fill.toMultilayerSymbol()
  default: return nil
  }
}

/// Builds alternate symbols for a unique value, each realized as a multilayer
/// symbol so its scale range (`SymbolReferenceProperties`) can be applied.
private func makeAlternateSymbols(_ records: [ScaledSymbolRecord]) -> [Symbol] {
  records.compactMap { record in
    guard let base = makeSymbol(from: record.symbol), let multilayer = toMultilayer(base)
    else { return nil }
    multilayer.referenceProperties = SymbolReferenceProperties(
      minScale: record.minScale, maxScale: record.maxScale)
    return multilayer
  }
}

/// Builds an ArcGIS `LabelDefinition` from a record.
func makeLabelDefinition(from record: LabelRecord) -> LabelDefinition {
  let expression: LabelExpression =
    (record.arcade ?? false)
    ? ArcadeLabelExpression(arcadeString: record.expression)
    : SimpleLabelExpression(simpleExpression: record.expression)
  let symbol = TextSymbol(
    color: record.color.flatMap(parseHexColor) ?? .black,
    size: record.size ?? 11
  )
  if let haloColor = record.haloColor.flatMap(parseHexColor) {
    symbol.haloColor = haloColor
    symbol.haloWidth = record.haloWidth ?? 1
  }
  let definition = LabelDefinition(labelExpression: expression, textSymbol: symbol)
  if let placement = labelPlacement(record.placement) {
    definition.placement = placement
  }
  return definition
}

/// Maps a public label-placement string to the ArcGIS placement enum.
private func labelPlacement(_ value: String?) -> LabelingInfo.LabelPlacement? {
  switch value {
  case "lineAboveAlong": return .lineAboveAlong
  case "lineBelowAlong": return .lineBelowAlong
  case "lineCenterAlong": return .lineCenterAlong
  case "pointAboveCenter": return .pointAboveCenter
  case "pointBelowCenter": return .pointBelowCenter
  case "pointCenterCenter": return .pointCenterCenter
  case "pointAboveRight": return .pointAboveRight
  case "polygonAlwaysHorizontal": return .polygonAlwaysHorizontal
  default: return nil
  }
}

/// Builds a clustering `FeatureReduction` from a record, or nil when disabled.
func makeClustering(from record: ClusteringRecord?) -> FeatureReduction? {
  guard let record, record.enabled else { return nil }
  let color = record.color.flatMap(parseHexColor) ?? .systemBlue
  let symbol = SimpleMarkerSymbol(style: .circle, color: color, size: 18)
  let reduction = ClusteringFeatureReduction(renderer: SimpleRenderer(symbol: symbol))
  if let radius = record.radius { reduction.radius = radius }
  if let maxSymbolSize = record.maxSymbolSize { reduction.maxSymbolSize = maxSymbolSize }
  return reduction
}

private func makeLineSymbol(from record: SymbolRecord) -> SimpleLineSymbol? {
  guard let color = parseHexColor(record.color) else { return nil }
  return SimpleLineSymbol(style: lineStyle(record.style), color: color, width: record.width ?? 1)
}

/// Builds the stacked stroke symbol layers of a multilayer symbol.
private func makeStrokeLayers(_ records: [StrokeLayerRecord]) -> [SolidStrokeSymbolLayer] {
  records.compactMap { record in
    guard let color = parseHexColor(record.color) else { return nil }
    return SolidStrokeSymbolLayer(width: record.widthPoints, color: color)
  }
}

/// Builds an ArcGIS `Symbol` from a record, or nil if malformed. Web-style
/// symbols return a transparent placeholder here; the real symbol is fetched
/// asynchronously and applied to the graphic during reconciliation.
func makeSymbol(from record: SymbolRecord) -> Symbol? {
  switch record.type {
  case "webStyle":
    return SimpleMarkerSymbol(style: .circle, color: .clear, size: 1)
  case "multilayerPolyline":
    let layers = makeStrokeLayers(record.strokeLayers)
    return layers.isEmpty ? nil : MultilayerPolylineSymbol(symbolLayers: layers)
  case "multilayerPolygon":
    guard let fill = record.fillColor.flatMap(parseHexColor) else { return nil }
    var layers: [SymbolLayer] = [SolidFillSymbolLayer(color: fill)]
    layers.append(contentsOf: makeStrokeLayers(record.strokeLayers))
    return MultilayerPolygonSymbol(symbolLayers: layers)
  case "distanceCompositeScene":
    return makeDistanceComposite(from: record)
  default:
    break
  }
  guard let color = parseHexColor(record.color) else { return nil }
  switch record.type {
  case "simpleMarker":
    return SimpleMarkerSymbol(style: markerStyle(record.style), color: color, size: record.size ?? 8)
  case "simpleLine":
    return makeLineSymbol(from: record)
  case "simpleFill":
    let outline = record.outline.flatMap(makeLineSymbol(from:))
    return SimpleFillSymbol(style: fillStyle(record.style), color: color, outline: outline)
  case "simpleMarkerScene":
    return SimpleMarkerSceneSymbol(
      style: sceneMarkerStyle(record.style),
      color: color,
      height: record.height ?? 100,
      width: record.width ?? 100,
      depth: record.depth ?? 100,
      anchorPosition: .center
    )
  case "meshFill":
    // Tints an ArcGIS scene layer's 3D building meshes a single colour.
    let fillLayer = MaterialFillSymbolLayer(color: color)
    fillLayer.colorMixMode = .tint
    return MultilayerMeshSymbol(symbolLayer: fillLayer)
  default:
    return nil
  }
}

/// Builds a distance-composite scene symbol whose ranges swap by camera distance.
/// Handled separately from `makeSymbol` because a composite has no top-level colour.
private func makeDistanceComposite(from record: SymbolRecord) -> Symbol {
  let composite = DistanceCompositeSceneSymbol()
  for rangeRecord in record.ranges {
    let range = DistanceSymbolRange()
    range.symbol = rangeRecord.symbol.flatMap(makeSymbol(from:))
    range.minDistance = rangeRecord.minDistance
    range.maxDistance = rangeRecord.maxDistance
    composite.addRange(range)
  }
  return composite
}

/// Builds a `Graphic` from a record, including its attributes. Used by scene
/// graphics overlays whose renderer expressions read attribute values (e.g. an
/// extrusion expression of `[height]`).
func makeGraphic(from record: GraphicRecord) -> Graphic? {
  guard let geometry = makeGeometry(from: record.geometry) else { return nil }
  let graphic = Graphic(geometry: geometry, symbol: makeSymbol(from: record.symbol))
  if let attributes = record.attributes {
    for (key, value) in attributes {
      // `Sendable` is a marker protocol and can't be used in a conditional cast,
      // so coerce the serializable scalar types (string/number/bool) explicitly.
      let sendable: (any Sendable)?
      switch value {
      case let string as String: sendable = string
      case let bool as Bool: sendable = bool
      case let number as NSNumber: sendable = number
      case let double as Double: sendable = double
      case let int as Int: sendable = int
      default: sendable = nil
      }
      graphic.setAttributeValue(sendable, forKey: key)
    }
  }
  return graphic
}

private func symbolSignature(_ record: SymbolRecord) -> String {
  var parts: [String] = [record.type, record.color]
  parts.append(record.size.map { "\($0)" } ?? "")
  parts.append(record.width.map { "\($0)" } ?? "")
  parts.append(record.style ?? "")
  if let outline = record.outline {
    parts.append(symbolSignature(outline))
  } else {
    parts.append("")
  }
  parts.append(record.fillColor ?? "")
  parts.append(record.strokeLayers.map { "\($0.color):\($0.widthPoints)" }.joined(separator: ";"))
  parts.append(record.symbolKey ?? "")
  parts.append(record.symbolKeys.joined(separator: "+"))
  parts.append(record.styleName ?? "")
  parts.append(record.portalItemId ?? "")
  parts.append(record.stylxPath ?? "")
  parts.append(record.height.map { "\($0)" } ?? "")
  parts.append(record.depth.map { "\($0)" } ?? "")
  parts.append(
    record.ranges.map {
      "\($0.minDistance ?? 0):\($0.maxDistance ?? 0):\($0.symbol.map(symbolSignature) ?? "")"
    }.joined(separator: "|"))
  return parts.joined(separator: ",")
}

private func coordsSignature(_ points: [PointRecord]) -> String {
  var parts: [String] = []
  for p in points {
    parts.append("\(p.latitude),\(p.longitude)")
  }
  return parts.joined(separator: ";")
}

/// A deterministic signature of a graphic's geometry + symbol; identical inputs
/// produce identical strings so unchanged graphics can be preserved.
func graphicSignature(_ record: GraphicRecord) -> String {
  let g = record.geometry
  var pointPart = ""
  if let p = g.point {
    pointPart = "\(p.latitude),\(p.longitude)"
  }
  let geometry = [g.type, pointPart, coordsSignature(g.path), coordsSignature(g.ring)]
    .joined(separator: "|")
  return geometry + "#" + symbolSignature(record.symbol)
}
