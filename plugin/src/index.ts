import { ConfigPlugin, createRunOncePlugin, withPlugins } from 'expo/config-plugins';

import { withArcgisAndroid } from './withArcgisAndroid';
import { withArcgisIos } from './withArcgisIos';
import { ArcgisPluginProps, withArcgisOAuth } from './withArcgisOAuth';
import { withArcgisPodfile } from './withArcgisPodfile';

export type { ArcgisPluginProps } from './withArcgisOAuth';

/**
 * Config plugin for `expo-arcgis-maps-sdk`.
 *
 * Applies the consumer-project requirements that autolinking cannot express:
 * Android SDK levels + Esri's Maven repo, the iOS deployment target (plus an
 * actionable notice for the ArcGIS Swift Package), and — when `oauthRedirectUri`
 * is set — the OAuth redirect URL scheme on both platforms. Wrapped in
 * `createRunOncePlugin` so repeated application is a no-op.
 */
const withArcgisMapsSdk: ConfigPlugin<ArcgisPluginProps | void> = (config, props) =>
  withPlugins(config, [
    withArcgisAndroid,
    withArcgisIos,
    (cfg) => withArcgisOAuth(cfg, props ?? {}),
    withArcgisPodfile,
  ]);

// Keep name/version in sync with package.json.
export default createRunOncePlugin(withArcgisMapsSdk, 'expo-arcgis-maps-sdk', '0.1.0');
