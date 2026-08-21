/** Serializable long-running job DTOs shared across job types. */

/**
 * Lifecycle status of a long-running native job. Mirrors the ArcGIS job status
 * on both platforms, normalised to a stable string union.
 */
export type JobStatus =
  'notStarted' | 'started' | 'paused' | 'succeeded' | 'failed' | 'canceling' | 'canceled';

/**
 * A progress update for a running job, delivered via the module `onJobProgress`
 * event. Subscribe through a job handle's `onProgress` rather than the raw
 * event so updates are pre-filtered to that job.
 */
export type JobProgressEvent = {
  /** Opaque id of the job this update belongs to. */
  jobId: string;
  /** Current lifecycle status. */
  status: JobStatus;
  /**
   * Completed fraction as an integer percent (0–100), or `-1` when the native
   * SDK reports indeterminate progress.
   */
  progress: number;
};

/**
 * A handle to a running long-running native job, keyed by its opaque {@link id}.
 * The concrete result type varies per job kind.
 */
export type Job<TResult> = {
  /** Opaque, package-owned job id. */
  readonly id: string;
  /**
   * Settles exactly once: resolves with the result on success, rejects with an
   * {@link import('../errors').ArcgisError} on failure (`E_JOB_CANCELLED` when
   * the job was cancelled).
   */
  readonly result: Promise<TResult>;
  /**
   * Subscribe to progress updates for this job. Returns a subscription with a
   * `remove()` method; always remove it when done.
   */
  onProgress: (listener: (event: JobProgressEvent) => void) => { remove: () => void };
  /**
   * Request cancellation. Cancellation is a normal outcome: {@link result} will
   * reject with `E_JOB_CANCELLED`.
   */
  cancel: () => Promise<void>;
};
