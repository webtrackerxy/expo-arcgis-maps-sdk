import type { ArcgisGeometry } from './geometry';
import type { ArcgisSymbol } from './symbol';

/**
 * A graphic: a geometry drawn with a symbol on the map's graphics overlay.
 *
 * Graphics are reconciled by `id` (add / update / remove), like feature layers.
 * They live in a single overlay above all operational layers.
 */
export type GraphicSource = {
  /** Stable, caller-assigned id; unique within a single `graphics` array. */
  id: string;
  geometry: ArcgisGeometry;
  /**
   * Per-graphic symbol. Optional: omit it to let the graphics overlay's shared
   * renderer (a map's `graphicsRenderer`, or a scene overlay's `renderer`) style
   * the graphic instead.
   */
  symbol?: ArcgisSymbol;
  /**
   * Feature-like attributes carried by the graphic. Referenced by a renderer's
   * expressions — e.g. a scene graphics overlay's `extrusion.expression` of
   * `"[height]"` reads the `height` attribute here. Values are serializable
   * scalars.
   */
  attributes?: Record<string, string | number | boolean>;
};
