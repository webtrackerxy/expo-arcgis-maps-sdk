import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withInfoPlist,
} from 'expo/config-plugins';

/** Options accepted by the `expo-arcgis-maps-sdk` config plugin. */
export type ArcgisPluginProps = {
  /**
   * The OAuth redirect URI registered for your ArcGIS OAuth application, e.g.
   * `"my-arcgis-app://auth"`. When set, the plugin registers its URL scheme so
   * the OAuth sign-in browser can redirect back into the app (iOS
   * `CFBundleURLTypes`; Android intent-filter on the main activity).
   */
  oauthRedirectUri?: string;
};

/** Parsed pieces of a redirect URI needed to register a deep link. */
export type RedirectParts = {
  /** The URL scheme (before `://`), e.g. `my-arcgis-app`. */
  scheme: string;
  /** The host, when the redirect uses one (e.g. `auth` in `x://auth`). */
  host?: string;
  /** The path, when present (e.g. `/oauth` in `x://auth/oauth`). */
  path?: string;
};

/**
 * Split a redirect URI into scheme / host / path. Throws for a value without a
 * scheme so the misconfiguration surfaces at prebuild rather than at runtime.
 */
export function parseRedirectUri(redirectUri: string): RedirectParts {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)?([^?#]*)?/.exec(redirectUri.trim());
  if (!match || !match[1]) {
    throw new Error(
      `[expo-arcgis-maps-sdk] oauthRedirectUri "${redirectUri}" must include a URL scheme, e.g. "my-app://auth".`
    );
  }
  const [, scheme, host, rawPath] = match;
  const path = rawPath && rawPath !== '/' ? rawPath : undefined;
  return { scheme, host: host || undefined, path };
}

/** Registers the redirect URI's scheme in the iOS `CFBundleURLTypes`. */
const withOAuthInfoPlist: (redirectUri: string) => ConfigPlugin = (redirectUri) => (config) =>
  withInfoPlist(config, (cfg) => {
    const { scheme } = parseRedirectUri(redirectUri);
    cfg.modResults.CFBundleURLTypes ??= [];
    const urlTypes = cfg.modResults.CFBundleURLTypes;
    const already = urlTypes.some((entry) => (entry.CFBundleURLSchemes ?? []).includes(scheme));
    if (!already) {
      urlTypes.push({ CFBundleURLSchemes: [scheme] });
    }
    return cfg;
  });

/**
 * Registers an intent-filter for the redirect URI on the Android main activity
 * so the OAuth Custom Tab can redirect back into the app. Idempotent.
 */
const withOAuthAndroidManifest: (redirectUri: string) => ConfigPlugin = (redirectUri) => (config) =>
  withAndroidManifest(config, (cfg) => {
    const { scheme, host, path } = parseRedirectUri(redirectUri);
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    activity['intent-filter'] ??= [];

    const dataMatches = (data: { $: Record<string, string | undefined> }) =>
      data.$['android:scheme'] === scheme &&
      data.$['android:host'] === host &&
      data.$['android:path'] === path;

    const exists = activity['intent-filter'].some((filter) =>
      (filter.data ?? []).some(dataMatches)
    );
    if (exists) {
      return cfg;
    }

    const data: { $: Record<string, string> } = { $: { 'android:scheme': scheme } };
    if (host) {
      data.$['android:host'] = host;
    }
    if (path) {
      data.$['android:path'] = path;
    }
    activity['intent-filter'].push({
      $: { 'android:autoVerify': 'false' } as Record<string, string>,
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [data],
    });
    return cfg;
  });

/**
 * When an `oauthRedirectUri` is configured, register its scheme on both
 * platforms so ArcGIS OAuth sign-in can redirect back into the app.
 */
export const withArcgisOAuth: ConfigPlugin<ArcgisPluginProps> = (config, props) => {
  const redirectUri = props?.oauthRedirectUri;
  if (!redirectUri) {
    return config;
  }
  config = withOAuthInfoPlist(redirectUri)(config);
  config = withOAuthAndroidManifest(redirectUri)(config);
  return config;
};
