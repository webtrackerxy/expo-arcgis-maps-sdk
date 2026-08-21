package expo.modules.arcgismapssdk.dto

import com.arcgismaps.Color
import com.arcgismaps.geometry.Geometry
import com.arcgismaps.geometry.GeometryEngine
import com.arcgismaps.geometry.Point
import com.arcgismaps.geometry.Polygon
import com.arcgismaps.geometry.Polyline
import com.arcgismaps.geometry.SpatialReference
import com.arcgismaps.mapping.PortalItem
import com.arcgismaps.mapping.view.Graphic
import com.arcgismaps.arcgisservices.LabelingPlacement
import com.arcgismaps.mapping.labeling.ArcadeLabelExpression
import com.arcgismaps.mapping.labeling.LabelDefinition
import com.arcgismaps.mapping.labeling.SimpleLabelExpression
import com.arcgismaps.mapping.reduction.ClusteringFeatureReduction
import com.arcgismaps.mapping.reduction.FeatureReduction
import com.arcgismaps.mapping.symbology.ClassBreak
import com.arcgismaps.mapping.symbology.DictionaryRenderer
import com.arcgismaps.mapping.symbology.DictionarySymbolStyle
import com.arcgismaps.mapping.symbology.ClassBreaksRenderer
import com.arcgismaps.mapping.symbology.ColorMixMode
import com.arcgismaps.mapping.symbology.MaterialFillSymbolLayer
import com.arcgismaps.mapping.symbology.DistanceCompositeSceneSymbol
import com.arcgismaps.mapping.symbology.DistanceSymbolRange
import com.arcgismaps.mapping.symbology.MultilayerMeshSymbol
import com.arcgismaps.mapping.symbology.MultilayerPolygonSymbol
import com.arcgismaps.mapping.symbology.MultilayerPolylineSymbol
import com.arcgismaps.mapping.symbology.MultilayerSymbol
import com.arcgismaps.mapping.symbology.Renderer
import com.arcgismaps.mapping.symbology.SolidFillSymbolLayer
import com.arcgismaps.mapping.symbology.SolidStrokeSymbolLayer
import com.arcgismaps.mapping.symbology.SymbolReferenceProperties
import com.arcgismaps.mapping.symbology.SimpleFillSymbol
import com.arcgismaps.mapping.symbology.SimpleFillSymbolStyle
import com.arcgismaps.mapping.symbology.SimpleLineSymbol
import com.arcgismaps.mapping.symbology.SimpleLineSymbolStyle
import com.arcgismaps.mapping.symbology.SceneSymbolAnchorPosition
import com.arcgismaps.mapping.symbology.SimpleMarkerSceneSymbol
import com.arcgismaps.mapping.symbology.SimpleMarkerSceneSymbolStyle
import com.arcgismaps.mapping.symbology.SimpleMarkerSymbol
import com.arcgismaps.mapping.symbology.SimpleMarkerSymbolStyle
import com.arcgismaps.mapping.symbology.SimpleRenderer
import com.arcgismaps.portal.Portal
import com.arcgismaps.mapping.symbology.Symbol
import com.arcgismaps.mapping.symbology.TextSymbol
import com.arcgismaps.mapping.symbology.UniqueValue
import com.arcgismaps.mapping.symbology.UniqueValueRenderer

/**
 * Pure conversions from graphics DTO records to ArcGIS geometry/symbol types,
 * plus a deterministic signature used to reconcile graphics by id.
 */

/** Parses `#RRGGBB` / `#RRGGBBAA` into an ArcGIS [Color]. Returns null if invalid. */
fun parseHexColor(hex: String): Color? {
  val s = hex.removePrefix("#")
  if (s.length != 6 && s.length != 8) return null
  val value = s.toLongOrNull(16) ?: return null
  return if (s.length == 6) {
    Color.fromRgba(
      ((value shr 16) and 0xff).toInt(),
      ((value shr 8) and 0xff).toInt(),
      (value and 0xff).toInt(),
      255,
    )
  } else {
    Color.fromRgba(
      ((value shr 24) and 0xff).toInt(),
      ((value shr 16) and 0xff).toInt(),
      ((value shr 8) and 0xff).toInt(),
      (value and 0xff).toInt(),
    )
  }
}

private fun point(record: PointRecord): Point =
  // Preserve altitude (z) when present so scene graphics can use absolute or
  // relative surface placement; harmless for 2D maps, which ignore z.
  record.altitude?.let { z -> Point(record.longitude, record.latitude, z, SpatialReference.wgs84()) }
    ?: Point(record.longitude, record.latitude, SpatialReference.wgs84())

/**
 * Serializes an ArcGIS [Geometry] to a WGS 84 geometry DTO. Multi-part results
 * return their first part.
 */
fun serializeGeometry(geometry: Geometry?): Map<String, Any?>? {
  geometry ?: return null
  val wgs = (GeometryEngine.projectOrNull(geometry, SpatialReference.wgs84())) ?: geometry
  fun latLong(points: Iterable<Point>) =
    points.map { mapOf("latitude" to it.y, "longitude" to it.x) }
  return when (wgs) {
    is Point -> mapOf("type" to "point", "point" to mapOf("latitude" to wgs.y, "longitude" to wgs.x))
    is Polyline ->
      mapOf("type" to "polyline", "path" to latLong(wgs.parts.firstOrNull()?.points ?: emptyList()))
    is Polygon ->
      mapOf("type" to "polygon", "ring" to latLong(wgs.parts.firstOrNull()?.points ?: emptyList()))
    else -> null
  }
}

/** Builds an ArcGIS [Geometry] from a record, or null if malformed. */
fun makeGeometry(record: GeometryRecord): Geometry? =
  when (record.type) {
    "point" -> record.point?.let { point(it) }
    "polyline" -> Polyline(record.path.map { point(it) })
    "polygon" -> Polygon(record.ring.map { point(it) })
    else -> null
  }

private fun markerStyle(style: String?): SimpleMarkerSymbolStyle =
  when (style) {
    "cross" -> SimpleMarkerSymbolStyle.Cross
    "diamond" -> SimpleMarkerSymbolStyle.Diamond
    "square" -> SimpleMarkerSymbolStyle.Square
    "triangle" -> SimpleMarkerSymbolStyle.Triangle
    "x" -> SimpleMarkerSymbolStyle.X
    else -> SimpleMarkerSymbolStyle.Circle
  }

private fun sceneMarkerStyle(style: String?): SimpleMarkerSceneSymbolStyle =
  when (style) {
    "cone" -> SimpleMarkerSceneSymbolStyle.Cone
    "cube" -> SimpleMarkerSceneSymbolStyle.Cube
    "cylinder" -> SimpleMarkerSceneSymbolStyle.Cylinder
    "diamond" -> SimpleMarkerSceneSymbolStyle.Diamond
    "tetrahedron" -> SimpleMarkerSceneSymbolStyle.Tetrahedron
    else -> SimpleMarkerSceneSymbolStyle.Sphere
  }

private fun lineStyle(style: String?): SimpleLineSymbolStyle =
  when (style) {
    "dash" -> SimpleLineSymbolStyle.Dash
    "dot" -> SimpleLineSymbolStyle.Dot
    "dashDot" -> SimpleLineSymbolStyle.DashDot
    else -> SimpleLineSymbolStyle.Solid
  }

private fun fillStyle(style: String?): SimpleFillSymbolStyle =
  when (style) {
    "horizontal" -> SimpleFillSymbolStyle.Horizontal
    "vertical" -> SimpleFillSymbolStyle.Vertical
    "cross" -> SimpleFillSymbolStyle.Cross
    else -> SimpleFillSymbolStyle.Solid
  }

private fun makeLineSymbol(record: SymbolRecord): SimpleLineSymbol? {
  val color = parseHexColor(record.color) ?: return null
  return SimpleLineSymbol(lineStyle(record.style), color, (record.width ?: 1.0).toFloat())
}

/** Converts a supported symbol to a multilayer symbol, or null if unsupported. */
private fun toMultilayer(symbol: Symbol): MultilayerSymbol? =
  when (symbol) {
    is MultilayerSymbol -> symbol
    is SimpleMarkerSymbol -> symbol.toMultilayerSymbol()
    is SimpleLineSymbol -> symbol.toMultilayerSymbol()
    is SimpleFillSymbol -> symbol.toMultilayerSymbol()
    else -> null
  }

/**
 * Builds alternate symbols for a unique value, each realized as a multilayer
 * symbol so its scale range ([SymbolReferenceProperties]) can be applied.
 */
private fun makeAlternateSymbols(records: List<ScaledSymbolRecord>): List<Symbol> =
  records.mapNotNull { record ->
    val multilayer = makeSymbol(record.symbol)?.let { toMultilayer(it) } ?: return@mapNotNull null
    multilayer.referenceProperties = SymbolReferenceProperties(record.minScale, record.maxScale)
    multilayer
  }

private fun makeStrokeLayers(records: List<StrokeLayerRecord>): List<SolidStrokeSymbolLayer> =
  records.mapNotNull { record ->
    parseHexColor(record.color)?.let { SolidStrokeSymbolLayer(record.widthPoints, it) }
  }

/** Builds an ArcGIS [Symbol] from a record, or null if malformed. Web-style
 * symbols return a transparent placeholder here; the real symbol is fetched
 * asynchronously and applied to the graphic during reconciliation. */
fun makeSymbol(record: SymbolRecord): Symbol? {
  when (record.type) {
    "webStyle" -> return SimpleMarkerSymbol(SimpleMarkerSymbolStyle.Circle, Color.transparent, 1f)
    "multilayerPolyline" -> {
      val layers = makeStrokeLayers(record.strokeLayers)
      return if (layers.isEmpty()) null else MultilayerPolylineSymbol(layers)
    }
    "multilayerPolygon" -> {
      val fill = record.fillColor?.let { parseHexColor(it) } ?: return null
      val layers = listOf(SolidFillSymbolLayer(fill)) + makeStrokeLayers(record.strokeLayers)
      return MultilayerPolygonSymbol(layers)
    }
    "distanceCompositeScene" -> return makeDistanceComposite(record)
  }
  val color = parseHexColor(record.color) ?: return null
  return when (record.type) {
    "simpleMarker" ->
      SimpleMarkerSymbol(markerStyle(record.style), color, (record.size ?: 8.0).toFloat())
    "simpleLine" -> makeLineSymbol(record)
    "simpleFill" ->
      SimpleFillSymbol(fillStyle(record.style), color, record.outline?.let { makeLineSymbol(it) })
    "simpleMarkerScene" ->
      SimpleMarkerSceneSymbol(
        sceneMarkerStyle(record.style),
        color,
        record.height ?: 100.0,
        record.width ?: 100.0,
        record.depth ?: 100.0,
        SceneSymbolAnchorPosition.Center,
      )
    "meshFill" ->
      // Tints an ArcGIS scene layer's 3D building meshes a single colour.
      MultilayerMeshSymbol(
        MaterialFillSymbolLayer(color).apply { colorMixMode = ColorMixMode.Tint }
      )
    else -> null
  }
}

/**
 * Builds a distance-composite scene symbol whose ranges swap by camera distance.
 * Handled separately from the colour-based cases because a composite has no
 * top-level colour.
 */
private fun makeDistanceComposite(record: SymbolRecord): Symbol {
  val composite = DistanceCompositeSceneSymbol()
  for (range in record.ranges) {
    val symbol = range.symbol?.let { makeSymbol(it) } ?: continue
    composite.ranges.add(DistanceSymbolRange(symbol, range.minDistance, range.maxDistance))
  }
  return composite
}

/**
 * Builds an ArcGIS [Graphic] from a record, including its attributes. Used by
 * scene graphics overlays whose renderer expressions read attribute values
 * (e.g. an extrusion expression of `[height]`).
 */
fun makeGraphic(record: GraphicRecord): Graphic? {
  val geometry = makeGeometry(record.geometry) ?: return null
  val graphic = Graphic(geometry, makeSymbol(record.symbol))
  record.attributes?.forEach { (key, value) -> if (value != null) graphic.attributes[key] = value }
  return graphic
}

private fun symbolSignature(record: SymbolRecord): String =
  listOf(
      record.type,
      record.color,
      record.size?.toString() ?: "",
      record.width?.toString() ?: "",
      record.style ?: "",
      record.outline?.let { symbolSignature(it) } ?: "",
      record.fillColor ?: "",
      record.strokeLayers.joinToString(";") { "${it.color}:${it.widthPoints}" },
      record.symbolKey ?: "",
      record.symbolKeys.joinToString("+"),
      record.styleName ?: "",
      record.portalItemId ?: "",
      record.stylxPath ?: "",
      record.height?.toString() ?: "",
      record.depth?.toString() ?: "",
      record.ranges.joinToString("|") {
        "${it.minDistance ?: 0.0}:${it.maxDistance ?: 0.0}:${it.symbol?.let(::symbolSignature) ?: ""}"
      },
    )
    .joinToString(",")

/** Builds an ArcGIS [Renderer] from a record, or null if malformed / absent. */
fun makeRenderer(record: RendererRecord?): Renderer? {
  record ?: return null
  return when (record.type) {
    "simple" -> record.symbol?.let { makeSymbol(it) }?.let { SimpleRenderer(it) }
    "uniqueValue" -> {
      val uniqueValues =
        record.uniqueValues.mapNotNull { uv ->
          val symbol = makeSymbol(uv.symbol) ?: return@mapNotNull null
          UniqueValue(
            label = uv.label ?: "",
            symbol = symbol,
            values = uv.values,
            alternateSymbols = makeAlternateSymbols(uv.alternateSymbols),
          )
        }
      UniqueValueRenderer(
        fieldNames = record.fields,
        uniqueValues = uniqueValues,
        defaultSymbol = record.defaultSymbol?.let { makeSymbol(it) },
      )
    }
    "classBreaks" -> {
      val breaks =
        record.classBreaks.mapNotNull { cb ->
          val symbol = makeSymbol(cb.symbol) ?: return@mapNotNull null
          ClassBreak(
            label = cb.label ?: "",
            minValue = cb.minValue ?: -Double.MAX_VALUE,
            maxValue = cb.maxValue,
            symbol = symbol,
          )
        }
      ClassBreaksRenderer(fieldName = record.field ?: "", classBreaks = breaks).apply {
        defaultSymbol = record.defaultSymbol?.let { makeSymbol(it) }
      }
    }
    "dictionary" -> {
      val stylxPath = record.stylxPath?.takeIf { it.isNotEmpty() }
      val dictionaryStyle =
        if (stylxPath != null) {
          DictionarySymbolStyle.createFromFile(stylxPath)
        } else {
          record.portalItemId?.let { itemId ->
            val portal = Portal("https://www.arcgis.com", Portal.Connection.Anonymous)
            DictionarySymbolStyle(PortalItem(portal, itemId))
          }
        }
      // The style loads lazily when the renderer is applied to a layer.
      dictionaryStyle?.let { DictionaryRenderer(it) }
    }
    else -> null
  }
}

/** Builds an ArcGIS [LabelDefinition] from a record. */
fun makeLabelDefinition(record: LabelRecord): LabelDefinition {
  val expression =
    if (record.arcade == true) ArcadeLabelExpression(record.expression)
    else SimpleLabelExpression(record.expression)
  val symbol =
    TextSymbol().apply {
      color = record.color?.let { parseHexColor(it) } ?: Color.black
      size = (record.size ?: 11.0).toFloat()
      record.haloColor?.let { parseHexColor(it) }?.let {
        haloColor = it
        haloWidth = (record.haloWidth ?: 1.0).toFloat()
      }
    }
  return LabelDefinition(expression, symbol).apply {
    labelPlacement(record.placement)?.let { placement = it }
  }
}

/** Maps a public label-placement string to the ArcGIS placement type. */
private fun labelPlacement(value: String?): LabelingPlacement? =
  when (value) {
    "lineAboveAlong" -> LabelingPlacement.LineAboveAlong
    "lineBelowAlong" -> LabelingPlacement.LineBelowAlong
    "lineCenterAlong" -> LabelingPlacement.LineCenterAlong
    "pointAboveCenter" -> LabelingPlacement.PointAboveCenter
    "pointBelowCenter" -> LabelingPlacement.PointBelowCenter
    "pointCenterCenter" -> LabelingPlacement.PointCenterCenter
    "pointAboveRight" -> LabelingPlacement.PointAboveRight
    "polygonAlwaysHorizontal" -> LabelingPlacement.PolygonAlwaysHorizontal
    else -> null
  }

/** Builds a clustering [FeatureReduction] from a record, or null when disabled. */
fun makeClustering(record: ClusteringRecord?): FeatureReduction? {
  if (record == null || !record.enabled) return null
  val color = record.color?.let { parseHexColor(it) } ?: parseHexColor("#2563EB")!!
  val symbol = SimpleMarkerSymbol(SimpleMarkerSymbolStyle.Circle, color, 18f)
  val reduction = ClusteringFeatureReduction(SimpleRenderer(symbol))
  record.radius?.let { reduction.radius = it }
  record.maxSymbolSize?.let { reduction.maxSymbolSize = it }
  return reduction
}

/**
 * A deterministic signature of a graphic's geometry + symbol; identical inputs
 * produce identical strings so unchanged graphics can be preserved.
 */
fun graphicSignature(record: GraphicRecord): String {
  fun coords(points: List<PointRecord>) =
    points.joinToString(";") { "${it.latitude},${it.longitude}" }
  val g = record.geometry
  val geometry =
    listOf(
        g.type,
        g.point?.let { "${it.latitude},${it.longitude}" } ?: "",
        coords(g.path),
        coords(g.ring),
      )
      .joinToString("|")
  return "$geometry#${symbolSignature(record.symbol)}"
}
