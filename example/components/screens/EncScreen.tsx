/**
 * `Configure electronic navigational charts` — displays an S-57/ENC layer from
 * a local ENC exchange set, with the process-wide hydrography resources the ENC
 * renderer requires.
 *
 * The ENC exchange set and the S-57/S-52 hydrography resources are large data
 * packages that ship with ArcGIS, not with this repo, so they must be placed on
 * the device first (the official sample bundles them as on-demand resources).
 * Put them under the app document directory as documented below; until then the
 * screen shows the oceans basemap and a provisioning notice.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ArcgisMapView, type EncLayerSource } from 'expo-arcgis-maps-sdk';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/**
 * Resolves the expected local ENC paths and whether the data is present.
 * Mirrors the official sample's layout: an `ExchangeSetwithoutUpdates` exchange
 * set (whose catalog is `.../ENC_ROOT/CATALOG.031`) and a `hydrography` resource
 * directory, both under the app document directory.
 */
function resolveEncData(): { layer: EncLayerSource | null; note: string } {
  const encDir = new Directory(Paths.document, 'enc');
  const catalog = new File(
    encDir,
    'ExchangeSetwithoutUpdates/ExchangeSetwithoutUpdates/ENC_ROOT/CATALOG.031'
  );
  const hydrography = new Directory(encDir, 'hydrography');
  const senc = new Directory(Paths.cache, 'enc-senc');

  if (!catalog.exists || !hydrography.exists) {
    return {
      layer: null,
      note:
        'ENC data not found. Place an ENC exchange set at ' +
        '“Documents/enc/ExchangeSetwithoutUpdates/…/ENC_ROOT/CATALOG.031” and the ' +
        'S-57/S-52 “hydrography” resource folder at “Documents/enc/hydrography”, ' +
        'then reopen this screen.',
    };
  }
  if (!senc.exists) senc.create();
  return {
    layer: {
      id: 'enc',
      type: 'enc',
      path: toPath(catalog.uri),
      resourcePath: toPath(hydrography.uri),
      sencPath: toPath(senc.uri),
    },
    note: 'Electronic navigational chart loaded from a local exchange set.',
  };
}

/** `Configure electronic navigational charts` — an S-57/ENC layer. */
export function EncScreen({ ready }: ScreenProps) {
  const resolved = useMemo(resolveEncData, []);
  const [status, setStatus] = useState(resolved.note);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          // The official sample's oceans basemap + viewpoint over the ENC cells.
          basemap: 'arcGISOceans',
          initialViewpoint: { center: { latitude: -32.5, longitude: 60.95 }, scale: 67_000 },
          layers: resolved.layer ? [resolved.layer] : [],
        }}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
