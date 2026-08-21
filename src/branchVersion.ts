import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type {
  CreateServiceVersionOptions,
  CreateServiceVersionResult,
  ServiceVersionInfo,
} from './types/branchVersion';

/**
 * Create a new **branch version** on a branch-versioned feature service and
 * switch the service geodatabase to it, so subsequent edits are isolated in that
 * version. Returns the full version name the server assigned. Requires a
 * signed-in user with permission to create versions.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   missing options, `E_AUTHENTICATION_FAILED` without version privileges,
 *   `E_NATIVE_FAILURE` otherwise).
 */
export async function createServiceVersion(
  options: CreateServiceVersionOptions
): Promise<CreateServiceVersionResult> {
  const serviceUrl = options?.serviceUrl?.trim();
  const versionName = options?.versionName?.trim();
  if (!serviceUrl || !versionName) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'createServiceVersion requires a "serviceUrl" and a "versionName".'
    );
  }
  if (
    options.access !== undefined &&
    !['public', 'protected', 'private'].includes(options.access)
  ) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      "createServiceVersion access must be 'public', 'protected', or 'private'."
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.createServiceVersion({
      serviceUrl,
      versionName,
      description: options.description ?? null,
      access: options.access ?? 'private',
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * List the branch versions of a branch-versioned feature service. Loads the
 * service geodatabase and returns each version's name, access level,
 * description, and whether the signed-in user owns it. Requires a signed-in
 * user with access to the service.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for a
 *   missing url, `E_AUTHENTICATION_FAILED` without access, `E_NATIVE_FAILURE`
 *   otherwise).
 */
export async function getServiceVersions(serviceUrl: string): Promise<ServiceVersionInfo[]> {
  if (typeof serviceUrl !== 'string' || serviceUrl.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'getServiceVersions requires a "serviceUrl".');
  }
  try {
    return await ExpoArcgisMapsSdkModule.getServiceVersions(serviceUrl.trim());
  } catch (error) {
    throw toArcgisError(error);
  }
}
