import ExpoArcgisMapsSdkModule from './ExpoArcgisMapsSdkModule';
import { ArcgisSdkError, toArcgisError } from './errors';
import type {
  AuthenticateOptions,
  IwaAuthenticateOptions,
  OAuthAuthenticateOptions,
  PkiAuthenticateOptions,
  PortalUser,
} from './types/auth';
import { validateAuthenticateOptions } from './validation';

/**
 * Authenticate a named user against an ArcGIS portal with a username and
 * password. On success the credential is stored in the OS credential store so
 * subsequent secured layer and service requests are authorized; the returned
 * {@link PortalUser} contains only non-sensitive profile fields.
 *
 * The password is used natively for the token exchange and is never logged,
 * echoed, or retained in JavaScript.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   missing credentials, `E_AUTHENTICATION_FAILED` when the portal rejects them).
 */
export async function authenticate(options: AuthenticateOptions): Promise<PortalUser> {
  const validated = validateAuthenticateOptions(options);
  try {
    return await ExpoArcgisMapsSdkModule.authenticate(validated);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Sign in interactively with OAuth 2.0: the system browser opens the ArcGIS
 * sign-in page, and on success the credential is stored in the OS credential
 * store (so secured layer/service requests are authorized) and the non-sensitive
 * {@link PortalUser} profile is returned.
 *
 * Requires the OAuth application's `clientId` and a `redirectUri` that is both
 * registered for that application and declared to the config plugin via its
 * `oauthRedirectUri` option (so the browser can redirect back into the app).
 * Tokens are held natively and never surfaced to JS.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   missing options, `E_AUTHENTICATION_FAILED` when sign-in is cancelled or the
 *   portal rejects it).
 */
export async function authenticateWithOAuth(
  options: OAuthAuthenticateOptions
): Promise<PortalUser> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'authenticateWithOAuth requires options.');
  }
  if (typeof options.clientId !== 'string' || options.clientId.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'authenticateWithOAuth requires a clientId.');
  }
  if (typeof options.redirectUri !== 'string' || options.redirectUri.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'authenticateWithOAuth requires a redirectUri.');
  }
  const normalized: OAuthAuthenticateOptions = {
    clientId: options.clientId,
    redirectUri: options.redirectUri,
    portalUrl: options.portalUrl ?? 'https://www.arcgis.com',
  };
  try {
    return await ExpoArcgisMapsSdkModule.authenticateWithOAuth(normalized);
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Authenticate against an on-premises ArcGIS Enterprise portal protected by
 * Integrated Windows Authentication (NTLM / Negotiate), using Windows
 * credentials. Installs a network authentication challenge handler scoped to the
 * portal host, then loads the portal to complete the handshake; the credential
 * is used natively and never surfaced to JS.
 *
 * Requires an IWA-protected portal, so it cannot be exercised against ArcGIS
 * Online.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   missing fields, `E_AUTHENTICATION_FAILED` when the portal rejects the
 *   credentials).
 */
export async function authenticateWithIWA(options: IwaAuthenticateOptions): Promise<PortalUser> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'authenticateWithIWA requires options.');
  }
  const portalUrl = requireField(options.portalUrl, 'authenticateWithIWA', 'portalUrl');
  const username = requireField(options.username, 'authenticateWithIWA', 'username');
  const password = requireField(options.password, 'authenticateWithIWA', 'password');
  try {
    return await ExpoArcgisMapsSdkModule.authenticateWithIWA({ portalUrl, username, password });
  } catch (error) {
    throw toArcgisError(error);
  }
}

/**
 * Authenticate against an ArcGIS Enterprise portal protected by PKI (client
 * certificate). The certificate source differs by platform (a documented
 * platform difference): on iOS provide a PKCS#12 file via `certificatePath` (and
 * its `password`); on Android provide a `certificateAlias` naming a certificate
 * already installed in the system KeyChain. Installs a network challenge handler
 * scoped to the portal host, then loads the portal.
 *
 * Requires a PKI-protected portal and a provisioned client certificate, so it
 * cannot be exercised against ArcGIS Online.
 *
 * @throws An {@link import('./errors').ArcgisError} (`E_INVALID_ARGUMENT` for
 *   missing fields, `E_AUTHENTICATION_FAILED` when the certificate is rejected).
 */
export async function authenticateWithPKI(options: PkiAuthenticateOptions): Promise<PortalUser> {
  if (typeof options !== 'object' || options === null) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', 'authenticateWithPKI requires options.');
  }
  const portalUrl = requireField(options.portalUrl, 'authenticateWithPKI', 'portalUrl');
  if (
    (options.certificatePath === undefined || options.certificatePath.trim().length === 0) &&
    (options.certificateAlias === undefined || options.certificateAlias.trim().length === 0)
  ) {
    throw new ArcgisSdkError(
      'E_INVALID_ARGUMENT',
      'authenticateWithPKI requires "certificatePath" (iOS) or "certificateAlias" (Android).'
    );
  }
  try {
    return await ExpoArcgisMapsSdkModule.authenticateWithPKI({
      portalUrl,
      certificatePath: options.certificatePath ?? null,
      password: options.password ?? null,
      certificateAlias: options.certificateAlias ?? null,
    });
  } catch (error) {
    throw toArcgisError(error);
  }
}

/** Requires a non-empty string field, throwing a stable `E_INVALID_ARGUMENT`. */
function requireField(value: unknown, fn: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ArcgisSdkError('E_INVALID_ARGUMENT', `${fn} requires a "${field}".`);
  }
  return value;
}

/**
 * Sign out by removing all stored ArcGIS credentials. Safe to call when no user
 * is signed in.
 *
 * @throws An {@link import('./errors').ArcgisError}.
 */
export async function signOut(): Promise<void> {
  try {
    await ExpoArcgisMapsSdkModule.signOut();
  } catch (error) {
    throw toArcgisError(error);
  }
}
