/**
 * Internal helper that turns a started native job id into a public
 * {@link Job} handle. Shared by every job type (offline generation, geodatabase
 * sync) so the settle-once / progress-filtering / cancel wiring lives in one
 * place.
 */
import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { Job, JobProgressEvent } from './types/job';

/**
 * Build a {@link Job} handle for an already-started native job.
 *
 * @param id Opaque job id returned by the native `start…` function.
 * @typeParam TResult The job's result payload shape.
 */
export function makeJobHandle<TResult>(id: string): Job<TResult> {
  const result = (async () => {
    try {
      return (await ExpoArcgisMapsSdkModule.awaitJob(id)) as TResult;
    } catch (error) {
      throw toArcgisError(error);
    }
  })();
  // Prevent an unhandled-rejection warning when a caller only watches progress
  // and never awaits `result`; the rejection is still delivered to any awaiter.
  result.catch(() => undefined);

  return {
    id,
    result,
    onProgress(listener) {
      const subscription = ExpoArcgisMapsSdkModule.addListener(
        'onJobProgress',
        (event: JobProgressEvent) => {
          if (event.jobId === id) {
            listener(event);
          }
        }
      );
      return { remove: () => subscription.remove() };
    },
    async cancel() {
      try {
        await ExpoArcgisMapsSdkModule.cancelJob(id);
      } catch (error) {
        throw toArcgisError(error);
      }
    },
  };
}
