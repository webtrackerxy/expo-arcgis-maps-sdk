package expo.modules.arcgismapssdk

import org.junit.Assert.assertEquals
import org.junit.Test

class ArcgisErrorTest {
  @Test
  fun loadErrorUsesStableCodeAndSafeMessage() {
    val payload = mapLoadError(RuntimeException("HTTP 401 token=super-secret-key"))
    assertEquals(ArcgisErrorCode.MAP_LOAD_FAILED, payload["code"])
    // The raw throwable message (which could carry sensitive text) must not leak.
    assertEquals("The map failed to load.", payload["message"])
  }

  @Test
  fun payloadHasCodeAndMessageKeys() {
    val payload = arcgisErrorPayload(ArcgisErrorCode.INVALID_ARGUMENT, "bad")
    assertEquals(ArcgisErrorCode.INVALID_ARGUMENT, payload["code"])
    assertEquals("bad", payload["message"])
  }
}
