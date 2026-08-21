package expo.modules.arcgismapssdk

import com.arcgismaps.mapping.BasemapStyle
import expo.modules.arcgismapssdk.dto.basemapStyleFromString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BasemapStyleConverterTest {
  @Test
  fun mapsKnownStyles() {
    assertEquals(BasemapStyle.ArcGISTopographic, basemapStyleFromString("arcGISTopographic"))
    assertEquals(BasemapStyle.ArcGISImagery, basemapStyleFromString("arcGISImagery"))
    assertEquals(BasemapStyle.ArcGISStreetsNight, basemapStyleFromString("arcGISStreetsNight"))
  }

  @Test
  fun returnsNullForUnknownOrMissing() {
    assertNull(basemapStyleFromString("notARealBasemap"))
    assertNull(basemapStyleFromString(null))
    assertNull(basemapStyleFromString(""))
  }
}
