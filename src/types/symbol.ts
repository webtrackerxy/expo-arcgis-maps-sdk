import type { ArcgisColor } from './color';

/**
 * Serializable symbols for graphics. Mirrors the ArcGIS "simple" symbol family,
 * which is available identically on iOS and Android.
 */

export type SimpleMarkerSymbolStyle = 'circle' | 'cross' | 'diamond' | 'square' | 'triangle' | 'x';

/** A simple marker for point geometries. */
export type SimpleMarkerSymbol = {
  type: 'simpleMarker';
  color: ArcgisColor;
  /** Diameter in points. Defaults to a small native value. */
  size?: number;
  /** Marker shape. Defaults to `circle`. */
  style?: SimpleMarkerSymbolStyle;
};

export type SimpleLineSymbolStyle = 'solid' | 'dash' | 'dot' | 'dashDot' | 'null';

/** A simple stroke for polyline geometries and polygon outlines. */
export type SimpleLineSymbol = {
  type: 'simpleLine';
  color: ArcgisColor;
  /** Stroke width in points. Defaults to `1`. */
  width?: number;
  /** Line style. Defaults to `solid`. */
  style?: SimpleLineSymbolStyle;
};

export type SimpleFillSymbolStyle = 'solid' | 'null' | 'horizontal' | 'vertical' | 'cross';

/** A simple fill for polygon geometries. */
export type SimpleFillSymbol = {
  type: 'simpleFill';
  color: ArcgisColor;
  /** Fill style. Defaults to `solid`. */
  style?: SimpleFillSymbolStyle;
  /** Optional outline stroke. */
  outline?: SimpleLineSymbol;
};

/** One solid stroke layer of a multilayer symbol, drawn in array order (bottom first). */
export type MultilayerStrokeLayer = {
  color: ArcgisColor;
  /** Stroke width in points. */
  widthPoints: number;
};

/**
 * A multilayer polyline symbol composed of stacked stroke layers — e.g. a wide
 * casing under a thin center line. Layers draw bottom-to-top.
 */
export type MultilayerPolylineSymbol = {
  type: 'multilayerPolyline';
  strokeLayers: MultilayerStrokeLayer[];
};

/**
 * A multilayer polygon symbol: a solid fill with optional stacked stroke layers
 * for the outline. Stroke layers draw bottom-to-top.
 */
export type MultilayerPolygonSymbol = {
  type: 'multilayerPolygon';
  fillColor: ArcgisColor;
  strokeLayers?: MultilayerStrokeLayer[];
};

/**
 * A symbol fetched from a **symbol style** by its key. The style is a
 * portal-hosted web style (Esri's 2D point symbols, referenced by well-known
 * `styleName` or `portalItemId`) **or** a local `.stylx` mobile style file
 * (`stylxPath`) — provide exactly one source. The symbol is fetched
 * asynchronously and applied to the graphic once loaded.
 */
export type WebStyleSymbol = {
  type: 'webStyle';
  /** Key of the symbol within the style (e.g. `"esri-pin-1"`). */
  symbolKey: string;
  /**
   * Multiple keys composed into one multilayer symbol, in order (e.g. a mobile
   * style file's `["Face1", "Hat-cowboy"]`). When set, these are used instead of
   * {@link symbolKey}; omit for a single-key symbol.
   */
  symbolKeys?: string[];
  /** Well-known name of an Esri web style (e.g. `"Esri2DPointSymbolsStyle"`). */
  styleName?: string;
  /** Portal item id of the style. */
  portalItemId?: string;
  /** Local filesystem path to a `.stylx` mobile style file. */
  stylxPath?: string;
};

/** The 3D primitive shape of a {@link SimpleMarkerSceneSymbol}. */
export type SimpleMarkerSceneSymbolStyle =
  'cone' | 'cube' | 'cylinder' | 'diamond' | 'sphere' | 'tetrahedron';

/**
 * A 3D marker symbol for point geometries, usable **only in a scene**
 * ({@link ArcgisSceneView}) — a solid primitive (cube, sphere, cone, …) sized in
 * metres. Ignored by the 2D {@link ArcgisMapView}, which cannot render volumetric
 * symbols.
 */
export type SimpleMarkerSceneSymbol = {
  type: 'simpleMarkerScene';
  /** The primitive shape. */
  style: SimpleMarkerSceneSymbolStyle;
  color: ArcgisColor;
  /** Height in metres. Defaults to `100`. */
  height?: number;
  /** Width in metres. Defaults to `100`. */
  width?: number;
  /** Depth in metres. Defaults to `100`. */
  depth?: number;
};

/**
 * A solid-colour 3D mesh fill, usable **only in a scene** to re-symbolize an
 * ArcGIS scene layer's 3D objects (e.g. tint every building one colour). The
 * colour tints the existing mesh material. Ignored by the 2D
 * {@link ArcgisMapView} and by non-mesh geometries.
 */
export type MeshFillSymbol = {
  type: 'meshFill';
  color: ArcgisColor;
};

/**
 * One camera-distance range of a {@link DistanceCompositeSceneSymbol}: the
 * `symbol` is drawn while the camera-to-graphic distance is within
 * `[minDistance, maxDistance]` metres.
 */
export type DistanceSymbolRange = {
  /** The 3D marker drawn within this range. */
  symbol: SimpleMarkerSceneSymbol;
  /** Nearest camera distance (metres) this symbol applies to. Omit for 0. */
  minDistance?: number;
  /** Farthest camera distance (metres). Omit for unbounded. */
  maxDistance?: number;
};

/**
 * A 3D point symbol that swaps between marker symbols by camera distance, usable
 * **only in a scene** ({@link ArcgisSceneView}) — e.g. a large cone up close and
 * a small sphere far away. Each {@link DistanceSymbolRange}'s symbol is a
 * {@link SimpleMarkerSceneSymbol}; the one whose `[minDistance, maxDistance]`
 * contains the current camera distance is drawn.
 */
export type DistanceCompositeSceneSymbol = {
  type: 'distanceCompositeScene';
  /** The ranges, evaluated by camera distance. */
  ranges: DistanceSymbolRange[];
};

/** A symbol usable to render a graphic. */
export type ArcgisSymbol =
  | SimpleMarkerSymbol
  | SimpleLineSymbol
  | SimpleFillSymbol
  | MultilayerPolylineSymbol
  | MultilayerPolygonSymbol
  | WebStyleSymbol
  | SimpleMarkerSceneSymbol
  | MeshFillSymbol
  | DistanceCompositeSceneSymbol;
