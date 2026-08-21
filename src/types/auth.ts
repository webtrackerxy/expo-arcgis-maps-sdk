/** Serializable authentication DTOs. */

/**
 * Options for {@link import('../auth').authenticate}. Token (named-user)
 * authentication against an ArcGIS portal using a username and password.
 *
 * Interactive OAuth (browser redirect) is not yet supported; see the roadmap.
 */
export type AuthenticateOptions = {
  /**
   * Portal URL to authenticate against. Defaults to ArcGIS Online
   * (`https://www.arcgis.com`).
   */
  portalUrl?: string;
  /** Named-user account username. */
  username: string;
  /** Named-user account password. Never logged, echoed, or stored in JS. */
  password: string;
};

/**
 * Options for {@link import('../auth').authenticateWithOAuth}. Interactive
 * OAuth 2.0 sign-in against an ArcGIS portal via the system browser.
 *
 * The `redirectUri` must match the one registered for your OAuth application and
 * be registered with the config plugin's `oauthRedirectUri` option so the
 * browser can redirect back into the app.
 */
export type OAuthAuthenticateOptions = {
  /**
   * Portal URL to authenticate against. Defaults to ArcGIS Online
   * (`https://www.arcgis.com`).
   */
  portalUrl?: string;
  /** The OAuth application's client id (registered in your ArcGIS account). */
  clientId: string;
  /** The redirect URI registered for the OAuth application, e.g. `myapp://auth`. */
  redirectUri: string;
};

/**
 * Options for {@link import('../auth').authenticateWithIWA}. Integrated Windows
 * Authentication (NTLM / Negotiate) against an on-premises ArcGIS Enterprise
 * portal using Windows credentials.
 */
export type IwaAuthenticateOptions = {
  /** The IWA-protected portal URL (e.g. `https://webadaptor.example.com/portal`). */
  portalUrl: string;
  /** Windows account username (may be `DOMAIN\\user`). */
  username: string;
  /** Windows account password. Never logged, echoed, or stored in JS. */
  password: string;
};

/**
 * Options for {@link import('../auth').authenticateWithPKI}. PKI (client
 * certificate) authentication against an ArcGIS Enterprise portal.
 *
 * The certificate source differs by platform (documented, per the project
 * contract): iOS reads a PKCS#12 file with {@link certificatePath} +
 * {@link password}; Android references a certificate already installed in the
 * system KeyChain by {@link certificateAlias}.
 */
export type PkiAuthenticateOptions = {
  /** The PKI-protected portal URL. */
  portalUrl: string;
  /** iOS: filesystem path to a PKCS#12 (`.pfx`/`.p12`) client certificate. */
  certificatePath?: string;
  /** iOS: password protecting the {@link certificatePath} file. */
  password?: string;
  /** Android: alias of a client certificate installed in the system KeyChain. */
  certificateAlias?: string;
};

/**
 * The authenticated portal user. Contains only non-sensitive profile fields;
 * tokens are held natively in the OS credential store and never surfaced to JS.
 */
export type PortalUser = {
  username: string;
  fullName?: string;
  email?: string;
};
