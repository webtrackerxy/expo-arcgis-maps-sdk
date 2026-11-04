import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import { makeJobHandle } from './jobs';
import type {
  ExportVectorTilesJob,
  ExportVectorTilesOptions,
  ExportVectorTilesResult,
  OfflineMapJob,
  OfflineMapJobOptions,
  OfflineMapResult,
} from './types/offline';
import { validateExportVectorTilesOptions, validateOfflineMapJobOptions } from './validation';

/**
 * Create and start a job that takes a web map offline over the given area.
 *
 * The returned {@link OfflineMapJob} exposes the job's opaque id, a `result`
 * promise that settles exactly once, per-job `onProgress` updates, and
 * `cancel()`. Cancellation is a normal outcome — `result` rejects with
 * `E_JOB_CANCELLED`.
 *
 * Requires {@link import('./configureArcgis').configureArcgis} first, and a web
 * map whose layers support offline use.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options; the job's own failures surface on `result`).
 */
export async function startOfflineMapJob(options: OfflineMapJobOptions): Promise<OfflineMapJob> {
  const validated = validateOfflineMapJobOptions(options);
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startOfflineMapJob(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<OfflineMapResult>(id);
}

/**
 * Create and start a job that downloads a **preplanned** offline map area
 * (packaged ahead of time on the web map) by index. Returns an
 * {@link OfflineMapJob} whose `result` settles with the downloaded package path.
 *
 * Preplanned areas must be configured on the web map; use index `0` for the
 * first. Requires {@link import('./configureArcgis').configureArcgis} first.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   bad item id / area index; the job's own failures surface on `result`).
 */
export async function startPreplannedMapAreaJob(
  webMapItemId: string,
  areaIndex = 0
): Promise<OfflineMapJob> {
  if (typeof webMapItemId !== 'string' || webMapItemId.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'startPreplannedMapAreaJob requires a webMapItemId.'
    );
  }
  if (!Number.isInteger(areaIndex) || areaIndex < 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'startPreplannedMapAreaJob requires a non-negative integer areaIndex.'
    );
  }
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startPreplannedMapAreaJob(webMapItemId, areaIndex);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<OfflineMapResult>(id);
}

/**
 * Create and start a job that applies **scheduled updates** to a preplanned
 * offline map area already on disk, syncing server-side changes into the local
 * mobile map package without re-downloading it.
 *
 * `mobileMapPackagePath` is the directory returned by a prior
 * {@link startPreplannedMapAreaJob} whose web map was configured for scheduled
 * updates. The returned {@link OfflineMapJob} `result` settles with the same
 * package path (updated in place); `layerErrors` lists any tables that failed to
 * sync.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for an
 *   empty path; the job's own failures surface on `result`).
 */
export async function startScheduledUpdatesJob(
  mobileMapPackagePath: string
): Promise<OfflineMapJob> {
  if (typeof mobileMapPackagePath !== 'string' || mobileMapPackagePath.trim().length === 0) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'startScheduledUpdatesJob requires a mobileMapPackagePath.'
    );
  }
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startScheduledUpdatesJob(mobileMapPackagePath);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<OfflineMapResult>(id);
}

/**
 * Create and start a job that exports vector tiles from a vector tile service to
 * a local `.vtpk` package over the given area.
 *
 * The returned {@link ExportVectorTilesJob} exposes the job's opaque id, a
 * `result` promise that settles exactly once (with the `.vtpk` path), per-job
 * `onProgress` updates, and `cancel()`.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   bad options; the job's own failures surface on `result`).
 */
export async function startExportVectorTilesJob(
  options: ExportVectorTilesOptions
): Promise<ExportVectorTilesJob> {
  const validated = validateExportVectorTilesOptions(options);
  let id: string;
  try {
    id = await ExpoArcgisMapsSdkModule.startExportVectorTilesJob(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
  return makeJobHandle<ExportVectorTilesResult>(id);
}

/**
 * Delete a previously generated offline map package directory to reclaim
 * storage.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for an
 *   empty path).
 */
export async function deleteOfflineMap(path: string): Promise<void> {
  if (typeof path !== 'string' || path.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'deleteOfflineMap requires a non-empty path.');
  }
  try {
    await ExpoArcgisMapsSdkModule.deleteOfflineMap(path);
  } catch (error) {
    throw toArcgisError(error);
  }
}
