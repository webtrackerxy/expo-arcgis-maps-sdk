package expo.modules.arcgismapssdk

import com.arcgismaps.data.Field
import com.arcgismaps.data.FieldType
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.mapping.layers.DynamicEntityLayer
import com.arcgismaps.realtime.CustomDynamicEntityDataSource
import com.arcgismaps.realtime.DynamicEntityDataSourceInfo
import expo.modules.arcgismapssdk.dto.CustomDynamicEntityFeedRecord
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * A [CustomDynamicEntityDataSource.EntityFeedProvider] that replays observations
 * from a local newline-delimited JSON (JSONL) file: each line is a flat object
 * of attributes that must include the entity-id, longitude, and latitude fields.
 * Field types are inferred from the first observation. Observations are emitted
 * on [onConnect] at [observationsPerSecond], looping so the layer keeps moving.
 */
class LocalFileEntityFeedProvider(
  private val record: CustomDynamicEntityFeedRecord,
  private val scope: CoroutineScope,
) : CustomDynamicEntityDataSource.EntityFeedProvider {
  private val observations: List<JSONObject> = parseJsonl(record.observationsPath)
  private val feedFlow =
    MutableSharedFlow<CustomDynamicEntityDataSource.FeedEvent>(extraBufferCapacity = 64)

  override val feed: SharedFlow<CustomDynamicEntityDataSource.FeedEvent>
    get() = feedFlow

  override suspend fun onLoad(): DynamicEntityDataSourceInfo {
    val first = observations.firstOrNull() ?: JSONObject()
    return DynamicEntityDataSourceInfo(record.entityIdField, inferFields(first)).apply {
      spatialReference = SpatialReference.wgs84()
    }
  }

  override suspend fun onConnect() {
    if (observations.isEmpty()) return
    val perSecond = record.observationsPerSecond ?: 10.0
    val periodMs = if (perSecond > 0) (1000.0 / perSecond).toLong().coerceAtLeast(1) else 100
    scope.launch(Dispatchers.Default) {
      var index = 0
      while (isActive) {
        val attributes = observations[index % observations.size]
        emitObservation(attributes)
        index++
        delay(periodMs)
      }
    }
  }

  override suspend fun onDisconnect() {}

  private suspend fun emitObservation(attributes: JSONObject) {
    val lon = attributes.optDouble(record.longitudeField, Double.NaN)
    val lat = attributes.optDouble(record.latitudeField, Double.NaN)
    if (lon.isNaN() || lat.isNaN()) return
    val point = Point(lon, lat, SpatialReference.wgs84())
    val map = mutableMapOf<String, Any>()
    for (key in attributes.keys()) {
      if (key == record.longitudeField || key == record.latitudeField) continue
      map[key] = attributes.get(key)
    }
    feedFlow.emit(CustomDynamicEntityDataSource.FeedEvent.NewObservation(point, map))
  }

  /** Numeric attributes become float64 fields; everything else text. */
  private fun inferFields(observation: JSONObject): List<Field> =
    observation.keys().asSequence().map { key ->
      val type = if (observation.get(key) is Number) FieldType.Float64 else FieldType.Text
      Field(type, key, key, 0)
    }.toList()

  private fun parseJsonl(path: String): List<JSONObject> {
    val file = File(path)
    if (!file.exists()) return emptyList()
    return file
      .readLines()
      .mapNotNull { line ->
        val trimmed = line.trim()
        if (trimmed.isEmpty()) null else runCatching { JSONObject(trimmed) }.getOrNull()
      }
  }
}

/**
 * Builds a [DynamicEntityLayer] backed by a [CustomDynamicEntityDataSource] that
 * replays a local JSONL file, and connects it. Returns null if the file is empty
 * or unreadable.
 */
fun makeCustomDynamicEntityLayer(
  feed: CustomDynamicEntityFeedRecord,
  scope: CoroutineScope,
): DynamicEntityLayer? {
  if (!File(feed.observationsPath).exists()) return null
  val provider = LocalFileEntityFeedProvider(feed, scope)
  val source = CustomDynamicEntityDataSource(provider)
  return DynamicEntityLayer(source).also { scope.launch { source.connect() } }
}
