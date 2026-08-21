import ArcGIS
import Foundation

/// A {@link CustomDynamicEntityFeed} that replays observations from a local
/// newline-delimited JSON (JSONL) file. Each line is a flat JSON object of
/// attributes that must include the entity-id, longitude, and latitude fields.
/// Field types are inferred from the first observation.
struct LocalFileDynamicEntityFeed: CustomDynamicEntityFeed {
  let observations: [[String: Any]]
  let longitudeField: String
  let latitudeField: String
  let interval: TimeInterval

  /// Emits each observation as a `newObservation` event, spaced by `interval`,
  /// looping back to the start so the layer keeps animating.
  var events: AsyncStream<CustomDynamicEntityFeedEvent> {
    AsyncStream { continuation in
      let task = Task {
        guard !observations.isEmpty else {
          continuation.finish()
          return
        }
        var index = 0
        while !Task.isCancelled {
          let attributes = observations[index % observations.count]
          if let point = makePoint(attributes) {
            continuation.yield(.newObservation(geometry: point, attributes: sendableAttributes(attributes)))
          }
          index += 1
          try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
        }
        continuation.finish()
      }
      continuation.onTermination = { _ in task.cancel() }
    }
  }

  /// Converts a JSON attribute dictionary to concrete `Sendable` values (numbers
  /// to Double, strings to String), dropping the coordinate fields (they live in
  /// the geometry) and any values of other types.
  private func sendableAttributes(_ attributes: [String: Any]) -> [String: any Sendable] {
    var result: [String: any Sendable] = [:]
    for (key, value) in attributes where key != longitudeField && key != latitudeField {
      if let string = value as? String {
        result[key] = string
      } else if let number = value as? NSNumber {
        result[key] = number.doubleValue
      }
    }
    return result
  }

  private func makePoint(_ attributes: [String: Any]) -> Point? {
    guard let lon = numeric(attributes[longitudeField]),
      let lat = numeric(attributes[latitudeField])
    else { return nil }
    return Point(x: lon, y: lat, spatialReference: .wgs84)
  }
}

/// Coerce a JSON value to a Double (numbers arrive as NSNumber; numeric strings
/// are also accepted).
private func numeric(_ value: Any?) -> Double? {
  if let number = value as? NSNumber { return number.doubleValue }
  if let string = value as? String { return Double(string) }
  return nil
}

/// Builds a `DynamicEntityLayer` backed by a `CustomDynamicEntityDataSource`
/// that replays a local JSONL file. Returns nil if the file can't be read or is
/// empty. The data source's field schema is inferred from the first observation.
func makeCustomDynamicEntityLayer(_ feed: CustomDynamicEntityFeedRecord) -> DynamicEntityLayer? {
  guard let data = FileManager.default.contents(atPath: feed.observationsPath) else { return nil }
  let observations = parseJSONL(data)
  guard let first = observations.first else { return nil }

  let fields = inferFields(from: first)
  let info = DynamicEntityDataSourceInfo(entityIDFieldName: feed.entityIdField, fields: fields)
  info.spatialReference = .wgs84

  let perSecond = feed.observationsPerSecond ?? 10
  let interval = perSecond > 0 ? 1 / perSecond : 0.1

  let source = CustomDynamicEntityDataSource(info: info) {
    LocalFileDynamicEntityFeed(
      observations: observations,
      longitudeField: feed.longitudeField,
      latitudeField: feed.latitudeField,
      interval: interval)
  }
  let layer = DynamicEntityLayer(dataSource: source)
  Task { [weak source] in try? await source?.connect() }
  return layer
}

/// Parses newline-delimited JSON into an array of flat attribute dictionaries.
private func parseJSONL(_ data: Data) -> [[String: Any]] {
  guard let text = String(data: data, encoding: .utf8) else { return [] }
  var result: [[String: Any]] = []
  for line in text.split(whereSeparator: \.isNewline) {
    let trimmed = line.trimmingCharacters(in: .whitespaces)
    guard !trimmed.isEmpty, let lineData = trimmed.data(using: .utf8),
      let object = try? JSONSerialization.jsonObject(with: lineData) as? [String: Any]
    else { continue }
    result.append(object)
  }
  return result
}

/// Infers an ArcGIS field schema from the first observation: numeric values
/// become `float64` fields, everything else `text`.
private func inferFields(from observation: [String: Any]) -> [Field] {
  observation.map { key, value in
    let type: FieldType = value is NSNumber ? .float64 : .text
    return Field(type: type, name: key, alias: key, length: 0)
  }
}
