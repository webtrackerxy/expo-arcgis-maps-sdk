import ArcGIS
import XCTest

@testable import ExpoArcgisMapsSdk

/// Unit tests for the pure conversion/error helpers.
///
/// NOTE: This requires an XCTest target linked against ArcGIS + ExpoModulesCore.
/// That target is added alongside the config plugin (Phase 3) / CI, since the
/// ArcGIS Swift Package is not resolvable from the podspec alone.
final class ArcgisConversionTests: XCTestCase {
  func testBasemapStyleMapsKnownValues() {
    XCTAssertEqual(basemapStyle(from: "arcGISTopographic"), .arcGISTopographic)
    XCTAssertEqual(basemapStyle(from: "arcGISImagery"), .arcGISImagery)
  }

  func testBasemapStyleReturnsNilForUnknown() {
    XCTAssertNil(basemapStyle(from: "notARealBasemap"))
    XCTAssertNil(basemapStyle(from: nil))
    XCTAssertNil(basemapStyle(from: ""))
  }

  func testLoadErrorPayloadUsesStableCodeAndSafeMessage() {
    let payload = mapLoadErrorPayload()
    XCTAssertEqual(payload["code"] as? String, ArcgisErrorCode.mapLoadFailed)
    XCTAssertEqual(payload["message"] as? String, "The map failed to load.")
  }
}
