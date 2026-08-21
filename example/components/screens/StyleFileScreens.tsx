/**
 * Screens that style features/graphics from a local `.stylx` style file. The
 * style file is provisioned like the official ArcGIS samples app: downloaded
 * once from its ArcGIS Online portal item into the app cache, then passed to the
 * native view as a filesystem path.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

function itemDataUrl(itemId: string): string {
  return `https://www.arcgis.com/sharing/rest/content/items/${itemId}/data`;
}

/** The native SDKs expect a plain filesystem path, not a `file://` URI. */
function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/** Downloads a portal item's data to the app cache once; returns its local path. */
function useProvisionedFile(itemId: string, filename: string) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing style…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, 'arcgis-style-data');
        if (!dir.exists) dir.create();
        const file = new File(dir, filename);
        if (!file.exists) {
          setStatus('Downloading style file…');
          await File.downloadFileAsync(itemDataUrl(itemId), file);
        }
        if (!cancelled) {
          setPath(toPath(file.uri));
          setStatus('Loading…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not download style: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, filename]);

  return { path, status, setStatus };
}

/** `Style features with custom dictionary` — a dictionary renderer from a local `.stylx`. */
export function CustomDictionaryScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedFile(
    '751138a2e0844e06853522d54103222a',
    'Restaurant.stylx'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 34.0543, longitude: -117.1963 }, scale: 10000 },
          featureLayers: [
            {
              id: 'restaurants',
              url: 'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/Redlands_Restaurants/FeatureServer/0',
              renderer: { type: 'dictionary', stylxPath: path },
            },
          ],
        }}
        onMapLoad={() => setStatus('Map loaded.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Style symbols from mobile style file` — a symbol composed from a local `.stylx`. */
export function MobileStyleSymbolScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedFile(
    '1bd036f221f54a99abc9e46ff3511cbf',
    'emoji-mobile.stylx'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImagery',
          initialViewpoint: { center: { latitude: 34.05, longitude: -117.19 }, scale: 5000 },
          graphics: [
            {
              id: 'emoji',
              geometry: { type: 'point', point: { latitude: 34.05, longitude: -117.19 } },
              // A cowboy-hatted, frowning emoji composed from the mobile style file.
              symbol: {
                type: 'webStyle',
                symbolKey: 'Face1',
                symbolKeys: ['Face1', 'Eyes-crossed', 'Hat-cowboy', 'Mouth-frown'],
                stylxPath: path,
              },
            },
          ],
        }}
        onMapLoad={() => setStatus('Map loaded.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
