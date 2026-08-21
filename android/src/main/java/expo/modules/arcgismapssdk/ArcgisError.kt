package expo.modules.arcgismapssdk

/**
 * Stable, package-owned error codes mirroring `src/errors.ts`. Native failures
 * are converted to one of these before crossing to JavaScript; raw exception
 * text and credentials are never forwarded.
 */
object ArcgisErrorCode {
  const val NOT_CONFIGURED = "E_NOT_CONFIGURED"
  const val INVALID_ARGUMENT = "E_INVALID_ARGUMENT"
  const val MAP_LOAD_FAILED = "E_MAP_LOAD_FAILED"
  const val LAYER_LOAD_FAILED = "E_LAYER_LOAD_FAILED"
  const val AUTHENTICATION_FAILED = "E_AUTHENTICATION_FAILED"
  const val JOB_CANCELLED = "E_JOB_CANCELLED"
  const val UNSUPPORTED = "E_UNSUPPORTED"
  const val NATIVE_FAILURE = "E_NATIVE_FAILURE"
}

/** Serializable `{ code, message, details? }` payload for events and rejections. */
fun arcgisErrorPayload(
  code: String,
  message: String,
  details: Map<String, Any?>? = null,
): Map<String, Any?> =
  if (details != null) {
    mapOf("code" to code, "message" to message, "details" to details)
  } else {
    mapOf("code" to code, "message" to message)
  }

/**
 * Maps a load/operation failure to a stable error payload. A generic, safe
 * message is used so raw native text never becomes the public contract.
 */
fun mapLoadError(throwable: Throwable?): Map<String, Any?> {
  // `throwable?.message` from ArcGIS load failures is generally safe (service
  // status, not credentials), but we deliberately use a fixed message to avoid
  // leaking anything unexpected. Detail-rich mapping can be added later behind
  // a redaction pass.
  return arcgisErrorPayload(ArcgisErrorCode.MAP_LOAD_FAILED, "The map failed to load.")
}
