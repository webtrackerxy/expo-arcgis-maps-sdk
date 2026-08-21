import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import { makeJobHandle } from './jobs';
import type {
  ContingentValidationResult,
  GenerateGeodatabaseJob,
  GenerateGeodatabaseOptions,
  GenerateGeodatabaseResult,
  GeodatabaseTransactionResult,
  SyncGeodatabaseJob,
  SyncGeodatabaseOptions,
  SyncGeodatabaseResult,
} from './types/geodatabase';
import { validateGenerateGeodatabaseOptions, validateSyncGeodatabaseOptions } from './validation';

/**
 * Create and start a job that replicates a sync-enabled feature service into a
 * local geodatabase over the given area.
 *
 * The returned {@link GenerateGeodatabaseJob} exposes the job's id, a
 * settle-once `result` (with the local `.geodatabase` path), per-job
 * `onProgress`, and `cancel()`.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options; the job's own failures surface on `result`).
 */
export async function startGenerateGeodatabaseJob(
  options: GenerateGeodatabaseOptions
): Promise<GenerateGeodatabaseJob> {
  const validated = validateGenerateGeodatabaseOptions(options);
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startGenerateGeodatabaseJob(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<GenerateGeodatabaseResult>(id);
}

/**
 * Create and start a job that synchronises a local geodatabase's edits with its
 * originating feature service (bidirectional when the replica supports it).
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options; the job's own failures surface on `result`).
 */
export async function startSyncGeodatabaseJob(
  options: SyncGeodatabaseOptions
): Promise<SyncGeodatabaseJob> {
  const validated = validateSyncGeodatabaseOptions(options);
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startSyncGeodatabaseJob(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<SyncGeodatabaseResult>(id);
}

/**
 * Add features to a table of a local mobile geodatabase inside a transaction,
 * then commit or roll back. Committing persists the added features; rolling back
 * discards them atomically. Returns the table's feature count afterwards.
 *
 * Fully local — no network or credentials. Use with a geodatabase created by
 * {@link import('./createMobileGeodatabase').createMobileGeodatabase}.
 *
 * @param path Absolute path to the `.geodatabase` file.
 * @param tableName The feature table to edit.
 * @param addCount How many features to add inside the transaction (> 0).
 * @param commit `true` to commit, `false` to roll back.
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for bad
 *   input, `E_NATIVE_FAILURE` when the table/geodatabase cannot be edited).
 */
export async function applyGeodatabaseTransaction(
  path: string,
  tableName: string,
  addCount: number,
  commit: boolean
): Promise<GeodatabaseTransactionResult> {
  if (typeof path !== 'string' || path.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'applyGeodatabaseTransaction requires a non-empty path.'
    );
  }
  if (typeof tableName !== 'string' || tableName.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'applyGeodatabaseTransaction requires a non-empty tableName.'
    );
  }
  if (!Number.isInteger(addCount) || addCount <= 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'applyGeodatabaseTransaction requires a positive integer addCount.'
    );
  }
  if (typeof commit !== 'boolean') {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'applyGeodatabaseTransaction requires a boolean commit.'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.applyGeodatabaseTransaction(
      path,
      tableName,
      addCount,
      commit
    );
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Validate a set of attributes against a local geodatabase table's
 * contingent-value constraints and, when valid, add a feature with those
 * attributes. Contingent values restrict which field combinations are allowed
 * (e.g. a "status" that constrains the permitted "protection" values).
 *
 * Fully local — no network or credentials. The geodatabase must define
 * contingent values on the named table.
 *
 * @param geodatabasePath Absolute path to the `.geodatabase` file.
 * @param tableName The feature table to add to.
 * @param attributes Field name → value for the new feature.
 * @returns `{ added, violations }` — when `added` is `false`, `violations` lists
 *   the field groups whose constraints were not satisfied.
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad input, `E_NATIVE_FAILURE` when the table cannot be opened).
 */
export async function addFeatureWithContingentValues(
  geodatabasePath: string,
  tableName: string,
  attributes: Record<string, string | number | boolean | null>
): Promise<ContingentValidationResult> {
  if (typeof geodatabasePath !== 'string' || geodatabasePath.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'addFeatureWithContingentValues requires a geodatabasePath.'
    );
  }
  if (typeof tableName !== 'string' || tableName.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'addFeatureWithContingentValues requires a tableName.'
    );
  }
  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'addFeatureWithContingentValues requires an attributes object.'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.addFeatureWithContingentValues({
      geodatabasePath,
      tableName,
      attributes,
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}
