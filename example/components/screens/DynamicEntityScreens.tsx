/**
 * Dynamic-entity (real-time) screens — show a dynamic entity layer streaming
 * from a stream service, query its current entities, and replay a custom feed
 * from a local file.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ArcgisMapView, queryDynamicEntities } from 'expo-arcgis-maps-sdk';
import { useMemo, useState } from 'react';
import { Button, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The official real-time samples' vehicle stream service.
const STREAM_SERVICE =
  'https://realtimegis2016.esri.com:6443/arcgis/rest/services/SandyVehicles/StreamServer';

/** `Add dynamic entity layer` — live vehicle observations from a stream service. */
export function DynamicEntityLayerScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Connecting to the stream service…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 40.559, longitude: -74.15 }, scale: 150_000 },
          layers: [{ id: 'vehicles', type: 'dynamicEntity', url: STREAM_SERVICE }],
        }}
        onMapLoad={() => setInfo('Streaming live vehicle positions.')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/**
 * Writes a small newline-delimited JSON (JSONL) file of moving "vessels" to the
 * app cache and returns its path — a self-contained stand-in for the official
 * custom-feed sample's bundled observations file.
 */
function writeObservationsFile(): string {
  const lines: string[] = [];
  const vessels = [
    { id: 'A1', lon: -74.045, lat: 40.69, name: 'Ferry' },
    { id: 'B2', lon: -74.02, lat: 40.7, name: 'Tug' },
    { id: 'C3', lon: -74.06, lat: 40.66, name: 'Barge' },
  ];
  // 40 timesteps, each vessel drifting north-east, so tracks animate on replay.
  for (let t = 0; t < 40; t++) {
    for (const v of vessels) {
      lines.push(
        JSON.stringify({
          MMSI: v.id,
          name: v.name,
          longitude: v.lon + t * 0.0015,
          latitude: v.lat + t * 0.001,
        })
      );
    }
  }
  const dir = new Directory(Paths.cache, 'dynamic-entities');
  if (!dir.exists) dir.create();
  const file = new File(dir, 'observations.jsonl');
  if (file.exists) file.delete();
  file.write(lines.join('\n'));
  return toPath(file.uri);
}

function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/**
 * `Add custom dynamic entity data source` — replays a local JSONL observations
 * file through a custom data source (no live service). The file is written to
 * the cache on mount, then a dynamic entity layer animates the tracks.
 */
export function CustomDynamicEntityScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Replaying local observations…');
  const observationsPath = useMemo(() => {
    try {
      return writeObservationsFile();
    } catch (error) {
      setInfo(`Could not write observations file: ${String(error)}`);
      return null;
    }
  }, []);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!observationsPath) {
    return <Centered text={info} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 40.69, longitude: -74.04 }, scale: 120_000 },
          layers: [
            {
              id: 'custom-vessels',
              type: 'dynamicEntity',
              customFeed: {
                observationsPath,
                entityIdField: 'MMSI',
                longitudeField: 'longitude',
                latitudeField: 'latitude',
                observationsPerSecond: 15,
              },
            },
          ],
        }}
        onMapLoad={() => setInfo('Replaying vessel tracks from a local file.')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/** `Query dynamic entities` — snapshot the current entities of a stream service. */
export function QueryDynamicEntitiesScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Tap “Query” to snapshot current entities.');

  async function run() {
    setStatus('Querying stream service…');
    try {
      const result = await queryDynamicEntities({ url: STREAM_SERVICE });
      const first = result.entities[0];
      setStatus(
        `${result.entities.length} entit${result.entities.length === 1 ? 'y' : 'ies'}` +
          (first ? ` · first at ${first.latitude?.toFixed(3)}, ${first.longitude?.toFixed(3)}` : '')
      );
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text style={screenStyles.status}>{status}</Text>
      <View style={{ padding: 12 }}>
        <Button title="Query" onPress={run} />
      </View>
    </View>
  );
}
