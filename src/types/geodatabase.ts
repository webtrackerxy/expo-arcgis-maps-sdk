/** Serializable DTOs for geodatabase generation and synchronisation. */

import type { Job } from './job';
import type { GeographicEnvelope } from './offline';

/** Options for {@link import('../geodatabase').startGenerateGeodatabaseJob}. */
export type GenerateGeodatabaseOptions = {
  /** URL of a sync-enabled feature service (the `FeatureServer` endpoint). */
  featureServiceUrl: string;
  /** The area of interest to replicate into the local geodatabase. */
  areaOfInterest: GeographicEnvelope;
};

/** The result of a successful generate-geodatabase job. */
export type GenerateGeodatabaseResult = {
  /** Absolute filesystem path to the generated `.geodatabase` file. */
  path: string;
  /** Non-fatal per-layer messages; empty when every layer replicated cleanly. */
  layerErrors: string[];
};

/** A handle to a running generate-geodatabase job. */
export type GenerateGeodatabaseJob = Job<GenerateGeodatabaseResult>;

/** Options for {@link import('../geodatabase').startSyncGeodatabaseJob}. */
export type SyncGeodatabaseOptions = {
  /** URL of the same sync-enabled feature service the geodatabase came from. */
  featureServiceUrl: string;
  /** Absolute path to the local `.geodatabase` file to synchronise. */
  path: string;
};

/** The result of a successful sync-geodatabase job. */
export type SyncGeodatabaseResult = {
  /** Non-fatal per-layer sync messages; empty when the sync fully succeeded. */
  layerErrors: string[];
};

/** A handle to a running sync-geodatabase job. */
export type SyncGeodatabaseJob = Job<SyncGeodatabaseResult>;

/** A field in a new mobile geodatabase table. */
export type GeodatabaseFieldType = 'text' | 'integer' | 'double' | 'date';

/** One field description for {@link CreateMobileGeodatabaseOptions}. */
export type GeodatabaseFieldDescription = {
  /** Field name. */
  name: string;
  /** Field data type. */
  type: GeodatabaseFieldType;
};

/** Options for {@link import('../createMobileGeodatabase').createMobileGeodatabase}. */
export type CreateMobileGeodatabaseOptions = {
  /** Name of the feature table to create in the new geodatabase. */
  tableName: string;
  /** Geometry type of the table's features. */
  geometryType: 'point' | 'polyline' | 'polygon';
  /** The attribute fields to add to the table. */
  fields: GeodatabaseFieldDescription[];
};

/** The result of creating a mobile geodatabase. */
export type MobileGeodatabaseResult = {
  /** Absolute filesystem path to the created `.geodatabase` file. */
  path: string;
  /** The created table's name. */
  tableName: string;
  /** Number of sample features added to the table. */
  featureCount: number;
};

/**
 * The outcome of an {@link import('../geodatabase').applyGeodatabaseTransaction}
 * call.
 */
export type GeodatabaseTransactionResult = {
  /** Whether the transaction was committed (`true`) or rolled back (`false`). */
  committed: boolean;
  /** The table's feature count after the transaction settled. */
  featureCount: number;
};

/**
 * The outcome of
 * {@link import('../geodatabase').addFeatureWithContingentValues}: whether the
 * feature satisfied the table's contingent-value constraints and was added, plus
 * the names of any violated field groups.
 */
export type ContingentValidationResult = {
  /** `true` if the attributes were valid and the feature was added. */
  added: boolean;
  /** Names of the field groups whose contingent-value constraints were violated. */
  violations: string[];
};
