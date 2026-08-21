package expo.modules.arcgismapssdk.dto

import com.arcgismaps.mapping.BasemapStyle
import com.arcgismaps.mapping.BasemapStyleParameters
import com.arcgismaps.mapping.Worldview

/**
 * Converts the TypeScript `BasemapStyle` string-union values to the ArcGIS
 * [BasemapStyle] enum. Returns null for unknown values so callers can raise a
 * stable `E_INVALID_ARGUMENT` rather than crashing.
 *
 * Kept as a pure function so it is unit-testable in isolation.
 */
fun basemapStyleFromString(value: String?): BasemapStyle? =
  when (value) {
    "arcGISStreets" -> BasemapStyle.ArcGISStreets
    "arcGISTopographic" -> BasemapStyle.ArcGISTopographic
    "arcGISNavigation" -> BasemapStyle.ArcGISNavigation
    "arcGISStreetsNight" -> BasemapStyle.ArcGISStreetsNight
    "arcGISDarkGray" -> BasemapStyle.ArcGISDarkGray
    "arcGISLightGray" -> BasemapStyle.ArcGISLightGray
    "arcGISImagery" -> BasemapStyle.ArcGISImagery
    "arcGISImageryStandard" -> BasemapStyle.ArcGISImageryStandard
    "arcGISOceans" -> BasemapStyle.ArcGISOceans
    "arcGISTerrain" -> BasemapStyle.ArcGISTerrain
    else -> null
  }

/** Converts a `BasemapWorldview` string-union value to an ArcGIS [Worldview]. */
fun worldviewFromString(value: String?): Worldview? =
  when (value) {
    "china" -> Worldview.china()
    "india" -> Worldview.india()
    "israel" -> Worldview.israel()
    "japan" -> Worldview.japan()
    "morocco" -> Worldview.morocco()
    "pakistan" -> Worldview.pakistan()
    "southKorea" -> Worldview.southKorea()
    "unitedArabEmirates" -> Worldview.unitedArabEmirates()
    "unitedStatesOfAmerica" -> Worldview.unitedStatesOfAmerica()
    else -> null
  }

/** Builds [BasemapStyleParameters] from the DTO, or null when no tuning is set. */
fun makeStyleParameters(record: BasemapStyleParametersRecord?): BasemapStyleParameters? {
  val view = worldviewFromString(record?.worldview) ?: return null
  return BasemapStyleParameters().apply { worldview = view }
}

/**
 * Derives a human-readable name from a service style path, e.g.
 * `arcgis/streets-night` -> `Streets Night`. The service provides no display
 * name, so both platforms derive it identically for a consistent gallery.
 */
fun basemapDisplayName(styleName: String): String =
  styleName
    .substringAfterLast('/')
    .split('-', '_')
    .filter { it.isNotEmpty() }
    .joinToString(" ") { it.replaceFirstChar(Char::uppercase) }
