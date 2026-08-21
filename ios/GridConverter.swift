import ArcGIS

/// Maps a serializable `MapGrid` string to an ArcGIS `Grid`, or nil for `none`
/// / any unrecognized value. `ArcGIS.Grid` is qualified because SwiftUI also
/// declares a `Grid` type.
func makeGrid(from value: String?) -> ArcGIS.Grid? {
  switch value {
  case "latitudeLongitude": return LatitudeLongitudeGrid()
  case "mgrs": return MGRSGrid()
  case "utm": return UTMGrid()
  case "usng": return USNGGrid()
  default: return nil
  }
}
