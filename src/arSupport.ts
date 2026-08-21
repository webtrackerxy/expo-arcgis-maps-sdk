import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { toArcgisError } from './errors';
import type { ArSupport } from './types/arView';

/**
 * Report whether this device can run augmented reality — ARKit on iOS, ARCore
 * on Android. Call this before mounting an {@link import('./ArcgisArView').ArcgisArView}
 * to gate the AR UI; on an incapable device the view itself emits `onArError`
 * with `E_UNSUPPORTED`.
 *
 * Resolves `{ supported: true }` on a capable device, or `{ supported: false,
 * reason }` otherwise (`reason` is a short code such as `unsupportedDevice` or
 * `needsUpdate`). Never rejects for an unsupported device — only for an
 * unexpected native failure.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_NATIVE_FAILURE`) if the
 *   capability check itself fails unexpectedly.
 */
export async function isArSupported(): Promise<ArSupport> {
  try {
    return await ExpoArcgisMapsSdkModule.isArSupported();
  } catch (error) {
    throw toArcgisError(error);
  }
}
