import ArcGIS

/// City-level default scale used when a viewpoint omits `scale`.
private let defaultScale = 100_000.0

/// Builds an ArcGIS `Viewpoint` from a `ViewpointRecord`. Coordinates are
/// interpreted as WGS 84 (lat/long) for the v0.1 subset.
///
/// TODO(verify): confirm the `Viewpoint(center:scale:rotation:)` initializer and
/// the `Point(latitude:longitude:)` default spatial reference during the first
/// iOS build.
func makeViewpoint(from record: ViewpointRecord) -> Viewpoint {
  let center = Point(latitude: record.center.latitude, longitude: record.center.longitude)
  let scale = record.scale ?? defaultScale
  let rotation = record.rotation ?? 0
  return Viewpoint(center: center, scale: scale, rotation: rotation)
}
