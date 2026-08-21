package expo.modules.arcgismapssdk.dto

import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.mapping.Viewpoint

/**
 * Builds an ArcGIS [Viewpoint] from a [ViewpointRecord]. Coordinates are
 * interpreted in the point's `spatialReferenceWkid` or WGS 84 when absent.
 *
 * A viewpoint requires a scale; when the caller omits it we fall back to a
 * reasonable city-level default so a bare `center` still frames the map.
 */
fun viewpointFromRecord(record: ViewpointRecord): Viewpoint {
  val wkid = record.center.spatialReferenceWkid
  val spatialReference = if (wkid != null) SpatialReference(wkid) else SpatialReference.wgs84()
  val center =
    Point(x = record.center.longitude, y = record.center.latitude, spatialReference = spatialReference)
  val scale = record.scale ?: DEFAULT_SCALE
  val rotation = record.rotation ?: 0.0
  return Viewpoint(center = center, scale = scale, rotation = rotation)
}

/** City-level default scale used when a viewpoint omits `scale`. */
private const val DEFAULT_SCALE = 100_000.0
