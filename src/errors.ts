/**
 * Stable, package-owned error contract.
 *
 * Every public failure — thrown from an async function, rejected from a ref
 * command, or delivered via `onMapError` — is expressed as an {@link ArcgisError}
 * with one of the {@link ArcgisErrorCode} values below. Raw native exception
 * text is never the public contract; useful native detail is preserved in
 * `details` after being scrubbed of secrets.
 */

/** Stable error codes owned by this package. */
export type ArcgisErrorCode =
  | 'E_NOT_CONFIGURED'
  | 'E_INVALID_ARGUMENT'
  | 'E_MAP_LOAD_FAILED'
  | 'E_LAYER_LOAD_FAILED'
  | 'E_AUTHENTICATION_FAILED'
  | 'E_JOB_CANCELLED'
  | 'E_UNSUPPORTED'
  | 'E_NATIVE_FAILURE';

/** All error codes, for exhaustiveness checks and tests. */
export const ARCGIS_ERROR_CODES: readonly ArcgisErrorCode[] = [
  'E_NOT_CONFIGURED',
  'E_INVALID_ARGUMENT',
  'E_MAP_LOAD_FAILED',
  'E_LAYER_LOAD_FAILED',
  'E_AUTHENTICATION_FAILED',
  'E_JOB_CANCELLED',
  'E_UNSUPPORTED',
  'E_NATIVE_FAILURE',
];

/**
 * The public shape of every failure surfaced by this package.
 *
 * `details` may carry additional, already-redacted context (never access
 * tokens, API keys or private URLs).
 */
export type ArcgisError = {
  code: ArcgisErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

/**
 * An `Error` subclass that also satisfies {@link ArcgisError}, so callers can
 * both `catch` it and read `.code` without unwrapping.
 */
export class ArcgisSdkError extends Error implements ArcgisError {
  readonly code: ArcgisErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ArcgisErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ArcgisSdkError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    // Restore the prototype chain when targeting ES5-ish runtimes.
    Object.setPrototypeOf(this, ArcgisSdkError.prototype);
  }

  /** The plain, serializable {@link ArcgisError} view of this error. */
  toArcgisError(): ArcgisError {
    return this.details !== undefined
      ? { code: this.code, message: this.message, details: this.details }
      : { code: this.code, message: this.message };
  }
}

/** Type guard for a well-formed {@link ArcgisError} value. */
export function isArcgisError(value: unknown): value is ArcgisError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { code?: unknown; message?: unknown };
  return (
    typeof candidate.message === 'string' &&
    typeof candidate.code === 'string' &&
    (ARCGIS_ERROR_CODES as readonly string[]).includes(candidate.code)
  );
}

/**
 * Normalize an unknown thrown/rejected value into a stable {@link ArcgisError}.
 *
 * The native layers are expected to reject with `{ code, message, details }`
 * already, but JavaScript can throw anything; this guarantees callers always
 * receive the documented shape. Unrecognized values map to
 * `E_NATIVE_FAILURE` with a generic message so raw native text never becomes
 * the contract.
 *
 * @param value The caught value.
 * @param fallbackCode Code to use when `value` is not already an ArcgisError.
 */
export function toArcgisError(
  value: unknown,
  fallbackCode: ArcgisErrorCode = 'E_NATIVE_FAILURE'
): ArcgisError {
  if (isArcgisError(value)) {
    return value.details !== undefined
      ? { code: value.code, message: value.message, details: value.details }
      : { code: value.code, message: value.message };
  }

  // Expo/native rejections commonly surface as { code, message } where code is
  // a native string; only adopt it when it is one of ours.
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { code?: unknown; message?: unknown };
    const message =
      typeof candidate.message === 'string' ? candidate.message : 'ArcGIS operation failed';
    const code =
      typeof candidate.code === 'string' &&
      (ARCGIS_ERROR_CODES as readonly string[]).includes(candidate.code)
        ? (candidate.code as ArcgisErrorCode)
        : fallbackCode;
    return { code, message };
  }

  return { code: fallbackCode, message: 'ArcGIS operation failed' };
}
