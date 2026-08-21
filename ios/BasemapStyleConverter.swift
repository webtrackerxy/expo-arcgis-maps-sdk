import ArcGIS

/// Converts the TypeScript `BasemapStyle` string-union values to the ArcGIS
/// `Basemap.Style` enum. Returns nil for unknown values so callers can raise a
/// stable `E_INVALID_ARGUMENT` rather than crashing. Pure, so it is unit-testable.
func basemapStyle(from value: String?) -> Basemap.Style? {
  switch value {
  case "arcGISStreets": return .arcGISStreets
  case "arcGISTopographic": return .arcGISTopographic
  case "arcGISNavigation": return .arcGISNavigation
  case "arcGISStreetsNight": return .arcGISStreetsNight
  case "arcGISDarkGray": return .arcGISDarkGray
  case "arcGISLightGray": return .arcGISLightGray
  case "arcGISImagery": return .arcGISImagery
  case "arcGISImageryStandard": return .arcGISImageryStandard
  case "arcGISOceans": return .arcGISOceans
  case "arcGISTerrain": return .arcGISTerrain
  default: return nil
  }
}

/// Derives a human-readable name from a service style path, e.g.
/// `arcgis/streets-night` → `Streets Night`. The service provides no display
/// name, so both platforms derive it identically for a consistent gallery.
func basemapDisplayName(from styleName: String) -> String {
  let last = styleName.split(separator: "/").last.map(String.init) ?? styleName
  return
    last
    .split(whereSeparator: { $0 == "-" || $0 == "_" })
    .map { $0.prefix(1).uppercased() + $0.dropFirst() }
    .joined(separator: " ")
}

/// Converts a `BasemapWorldview` string-union value to an ArcGIS `Worldview`.
func worldview(from value: String?) -> Worldview? {
  switch value {
  case "china": return .china()
  case "india": return .india()
  case "israel": return .israel()
  case "japan": return .japan()
  case "morocco": return .morocco()
  case "pakistan": return .pakistan()
  case "southKorea": return .southKorea()
  case "unitedArabEmirates": return .unitedArabEmirates()
  case "unitedStatesOfAmerica": return .unitedStatesOfAmerica()
  default: return nil
  }
}

/// Builds `BasemapStyleParameters` from the DTO, or nil when no tuning is set.
func makeStyleParameters(_ record: BasemapStyleParametersRecord?) -> BasemapStyleParameters? {
  guard let record, let view = worldview(from: record.worldview) else { return nil }
  let params = BasemapStyleParameters()
  params.worldview = view
  return params
}
