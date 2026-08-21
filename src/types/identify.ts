import type { GeographicPoint, ScreenPoint } from './common';

/** Options for an `identify` operation initiated through the imperative ref. */
export type IdentifyOptions = {
  /** Location to identify at, in view coordinates (e.g. from a single tap). */
  screenPoint: ScreenPoint;
  /**
   * Search radius around `screenPoint`, in points. Defaults to a small native
   * value suitable for touch input. Negative values are rejected with
   * `E_INVALID_ARGUMENT`.
   */
  tolerance?: number;
  /**
   * Maximum number of results to return across all identified layers/overlays.
   * Defaults to a native cap. Must be a positive integer when provided.
   */
  maximumResults?: number;
};

/**
 * A single geoelement found by `identify`.
 *
 * Attribute values are limited to JSON-serializable primitives; native
 * geometry and feature objects are not passed across the boundary. When the
 * result corresponds to a tappable location, `location` is populated.
 */
export type IdentifyResult = {
  /**
   * The source of the result: the {@link FeatureLayerSource.id} of a feature
   * layer, or `'graphics'` for the graphics overlay.
   */
  sourceId: string;
  /** Serializable attributes of the identified element. */
  attributes: Record<string, string | number | boolean | null>;
  /** Representative location of the element, when available. */
  location?: GeographicPoint;
};

/**
 * Options for {@link ArcgisMapViewRef.evaluateArcade}. Extends the identify
 * options with the Arcade expression to run against each identified feature.
 */
export type ArcadeEvaluationOptions = IdentifyOptions & {
  /**
   * The Arcade expression to evaluate. Each identified feature is bound to
   * `$feature` and the map to `$map` (form-calculation profile), so an
   * expression such as `"$feature.POP2000 / AreaGeodetic($feature, 'square-kilometers')"`
   * computes a value from the tapped feature. Must be a non-empty string.
   */
  expression: string;
};

/**
 * One feature's Arcade evaluation — from {@link ArcgisMapViewRef.evaluateArcade}.
 */
export type ArcadeEvaluationResult = {
  /**
   * The source of the evaluated feature: the {@link FeatureLayerSource.id} of a
   * feature layer, or `'layer'` when the layer has no stable id.
   */
  sourceId: string;
  /**
   * The expression's result rendered as text. Numbers use default formatting
   * (a whole-number double like `5.0` becomes `"5"`); booleans are `"true"` /
   * `"false"`. Expressions returning no value yield an empty string.
   */
  value: string;
};

/** One label/value row of a feature's popup, as it should be displayed. */
export type PopupField = {
  /** The field's display label. */
  label: string;
  /** The field's formatted display value (respecting the popup's formatting). */
  value: string;
};

/**
 * A feature's popup — its title and formatted field rows — from
 * {@link ArcgisMapViewRef.showPopup}. Populated from the layer's popup
 * definition when popups are enabled.
 */
export type PopupInfo = {
  /**
   * The source of the popup: the {@link FeatureLayerSource.id} of a feature
   * layer, or `'graphics'` for the graphics overlay.
   */
  sourceId: string;
  /** The popup title (may be empty). */
  title: string;
  /** The popup's label/value field rows, in display order. */
  fields: PopupField[];
};

/**
 * A feature's editing form — its title and field rows (label + current
 * formatted value) — from {@link ArcgisMapViewRef.showFeatureForm}. Uses the
 * layer's form definition when configured, else a default form built from the
 * feature's fields. This is a read-only view of the form; submitting edits is
 * not exposed.
 */
export type FeatureFormInfo = {
  /** The source layer's {@link FeatureLayerSource.id}. */
  sourceId: string;
  /** The form title (may be empty). */
  title: string;
  /** The form's editable field rows (label + current value), in display order. */
  fields: PopupField[];
};
