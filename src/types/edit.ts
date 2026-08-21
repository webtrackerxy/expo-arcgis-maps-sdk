import type { GeographicPoint } from './common';

/** A feature to add or update. */
export type FeatureEdit = {
  /** For updates: the target feature's object id. Omit for adds. */
  objectId?: number;
  /** Attribute values to set (serializable primitives only). */
  attributes?: Record<string, string | number | boolean | null>;
  /** Point geometry to set (adds, or moving a feature). */
  point?: GeographicPoint;
};

/**
 * Edits to apply to a feature layer's service table via
 * {@link import('./view').ArcgisMapViewRef.applyEdits}. The layer must be backed
 * by an editable feature service, and the API key must have editing privileges.
 */
export type ApplyEditsOptions = {
  /** Id of the feature layer to edit (a {@link import('./map').FeatureLayerSource.id}). */
  layerId: string;
  /** Features to add (geometry + attributes). */
  adds?: FeatureEdit[];
  /** Features to update (`objectId` required). */
  updates?: FeatureEdit[];
  /** Object ids of features to delete. */
  deleteObjectIds?: number[];
};

/** Summary of an {@link ApplyEditsOptions} operation. */
export type ApplyEditsResult = {
  /** Server-assigned object ids of successfully added features. */
  addedObjectIds: number[];
  /** Count of successfully updated features. */
  updatedCount: number;
  /** Count of successfully deleted features. */
  deletedCount: number;
};
