import ExpoModulesCore

/// Stable, package-owned error codes mirroring `src/errors.ts`. Native failures
/// are converted to one of these before crossing to JavaScript; raw exception
/// text and credentials are never forwarded.
enum ArcgisErrorCode {
  static let notConfigured = "E_NOT_CONFIGURED"
  static let invalidArgument = "E_INVALID_ARGUMENT"
  static let mapLoadFailed = "E_MAP_LOAD_FAILED"
  static let layerLoadFailed = "E_LAYER_LOAD_FAILED"
  static let authenticationFailed = "E_AUTHENTICATION_FAILED"
  static let jobCancelled = "E_JOB_CANCELLED"
  static let unsupported = "E_UNSUPPORTED"
  static let nativeFailure = "E_NATIVE_FAILURE"
}

/// An Expo exception carrying a stable `{ code, message }`. Promises rejected
/// with this surface `error.code` on the JavaScript side, where
/// `toArcgisError` maps it to the public `ArcgisError`.
///
/// TODO(verify): confirm `code`/`reason` overrides against the installed
/// ExpoModulesCore version during the first iOS build.
final class ArcgisException: GenericException<(code: String, message: String)> {
  override var code: String { param.code }
  override var reason: String { param.message }
}

/// Builds a stable, serializable `{ code, message, details? }` payload for events.
func arcgisErrorPayload(
  _ code: String,
  _ message: String,
  details: [String: Any]? = nil
) -> [String: Any] {
  var payload: [String: Any] = ["code": code, "message": message]
  if let details {
    payload["details"] = details
  }
  return payload
}

/// Maps a load/operation failure to a stable payload. A fixed, safe message is
/// used so raw native text never becomes the public contract.
func mapLoadErrorPayload() -> [String: Any] {
  arcgisErrorPayload(ArcgisErrorCode.mapLoadFailed, "The map failed to load.")
}

/// Chooses a stable error code by inspecting a native error for authorization
/// signals (HTTP 401/403, token / permission / licence / privilege problems).
/// The native text is only read internally to classify the failure — it never
/// becomes the public message, and no secrets are surfaced.
func isAuthorizationError(_ error: Error) -> Bool {
  let text = (String(describing: error) + " " + error.localizedDescription).lowercased()
  let markers = [
    "forbidden", "unauthor", "not authorized", "token", "permission",
    "authentication", "licen", "privilege", "api key", "does not have access",
    "403", "401", "498", "499",
  ]
  return markers.contains(where: text.contains)
}

/// Wraps a native service error as a stable exception with an actionable,
/// secret-free message. Authorization failures map to `E_AUTHENTICATION_FAILED`
/// so callers can distinguish "not permitted" from a generic native failure.
func serviceException(_ error: Error, context: String) -> ArcgisException {
  if isAuthorizationError(error) {
    return ArcgisException((
      code: ArcgisErrorCode.authenticationFailed,
      message:
        "Not authorized for the ArcGIS \(context) service. Ensure the API key or signed-in user has the required privilege."
    ))
  }
  return ArcgisException((
    code: ArcgisErrorCode.nativeFailure,
    message: "The ArcGIS \(context) request failed."
  ))
}
