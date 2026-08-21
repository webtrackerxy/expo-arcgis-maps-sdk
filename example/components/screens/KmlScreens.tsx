/**
 * KML depth screens — tour playback, ground-overlay opacity, network links,
 * feature identify, listing contents, and authoring KML (save + multi-track) —
 * mirroring the official KML samples.
 */
import {
  ArcgisMapView,
  createKmlFile,
  getKmlInfo,
  type ArcgisMapViewRef,
  type KmlNodeInfo,
  type KmlTourAction,
} from 'expo-arcgis-maps-sdk';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** The native SDKs expect a plain filesystem path, not a `file://` URI. */
function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

// The official "Play KML tour" sample's Esri campus tour KMZ (a portal item).
const TOUR_KML_URL =
  'https://www.arcgis.com/sharing/rest/content/items/f10b1d37fdd645c9bc9b189fb546307c/data';
const TOUR_LAYER_ID = 'kml-tour';

/** `Play KML tour` — play / pause / reset a KML tour via the view ref. */
export function KmlTourScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [status, setStatus] = useState('Tap “Play” to start the KML tour.');

  async function control(action: KmlTourAction) {
    try {
      await mapRef.current?.controlKmlTour({ layerId: TOUR_LAYER_ID, action });
      setStatus(`Tour ${action === 'reset' ? 'reset' : `${action}ing`}.`);
    } catch (error) {
      setStatus(`${action} failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImagery',
          initialViewpoint: { center: { latitude: 34.0, longitude: -117.2 }, scale: 20_000 },
          layers: [{ id: TOUR_LAYER_ID, type: 'kml', url: TOUR_KML_URL }],
        }}
      />
      <View style={styles.row}>
        <Button title="Play" onPress={() => control('play')} />
        <Button title="Pause" onPress={() => control('pause')} />
        <Button title="Reset" onPress={() => control('reset')} />
      </View>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

// The official "Set KML ground overlay properties" sample's 1944 Pacific
// theatre ground-overlay KMZ (a portal item).
const GROUND_OVERLAY_KML_URL =
  'https://www.arcgis.com/sharing/rest/content/items/1f3677c24b2c446e96eaf1099292e83e/data';

/** `Set KML ground overlay properties` — render the ground overlay at 50% opacity. */
export function KmlGroundOverlayScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImagery',
          initialViewpoint: { center: { latitude: 44.522, longitude: -85.982 }, scale: 250_000 },
          layers: [
            {
              id: 'kml-ground-overlay',
              type: 'kml',
              url: GROUND_OVERLAY_KML_URL,
              groundOverlayOpacity: 0.5,
            },
          ],
        }}
      />
      <Text style={screenStyles.status}>KML ground overlay at 50% opacity.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
});

// The official "Add KML layer with network links" sample's radar network-link KMZ.
const NETWORK_LINK_KML =
  'https://www.arcgis.com/sharing/rest/content/items/600748d4464442288f6db8a4ba27dc95/data';

/** `Add KML layer with network links` — a KML whose network links load remote content. */
export function KmlNetworkLinkScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading KML network links…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 30_000_000 },
          layers: [{ id: 'kml-network', type: 'kml', url: NETWORK_LINK_KML }],
        }}
        onMapLoad={() => setInfo('KML network links loaded (they refresh on their own interval).')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// The official "Identify KML features" sample's US weather forecast KML.
const IDENTIFY_KML =
  'https://www.arcgis.com/sharing/rest/content/items/600748d4464442288f6db8a4ba27dc95/data';

/** `Identify KML features` — tap a KML feature to identify it. */
export function KmlIdentifyScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [info, setInfo] = useState('Tap a KML feature to identify it.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 30_000_000 },
          layers: [{ id: 'kml-identify', type: 'kml', url: IDENTIFY_KML }],
        }}
        onSingleTap={async (e) => {
          try {
            const results = await mapRef.current?.identify({ screenPoint: e.nativeEvent.screenPoint });
            const kml = (results ?? []).filter((r) => r.sourceId === 'kml-identify');
            setInfo(kml.length ? `Identified ${kml.length} KML feature(s).` : 'No KML feature here.');
          } catch (error) {
            setInfo(`identify failed: ${(error as { code?: string }).code ?? 'error'}`);
          }
        }}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/** `List contents of KML file` — read a KML document's node tree. */
export function KmlContentsScreen({ ready }: ScreenProps) {
  const [nodes, setNodes] = useState<KmlNodeInfo[] | null>(null);
  const [status, setStatus] = useState('Reading KML contents…');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await getKmlInfo({ url: NETWORK_LINK_KML });
        if (!cancelled) {
          setNodes(info.nodes);
          setStatus(`${info.nodes.length} node(s).`);
        }
      } catch (error) {
        if (!cancelled) setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, { padding: 16 }]}>
      <Text style={screenStyles.status}>{status}</Text>
      {(nodes ?? []).slice(0, 40).map((node, i) => (
        <Text key={i} style={{ paddingLeft: 12 * node.depth }}>
          {node.type === 'folder' || node.type === 'document' ? '📁' : '•'} {node.name || '(unnamed)'}{' '}
          <Text style={{ color: '#888' }}>[{node.type}]</Text>
        </Text>
      ))}
    </View>
  );
}

// A path in the app cache to author KML/KMZ files into.
function authoredKmlPath(name: string): string {
  const dir = new Directory(Paths.cache, 'authored-kml');
  if (!dir.exists) dir.create();
  return toPath(new File(dir, name).uri);
}

/** `Create and save KML file` — author point placemarks, save, then display them. */
export function KmlSaveScreen({ ready }: ScreenProps) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Authoring KML…');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await createKmlFile({
          path: authoredKmlPath('places.kmz'),
          placemarks: [
            { name: 'Los Angeles', point: { latitude: 34.05, longitude: -118.24 } },
            { name: 'Denver', point: { latitude: 39.74, longitude: -104.99 } },
            { name: 'New York', point: { latitude: 40.71, longitude: -74.01 } },
          ],
        });
        if (!cancelled) {
          setPath(result.path);
          setStatus('Authored 3 placemarks; displaying the saved KML.');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      {path ? (
        <ArcgisMapView
          style={screenStyles.fill}
          map={{
            basemap: 'arcGISLightGray',
            initialViewpoint: { center: { latitude: 39, longitude: -96 }, scale: 40_000_000 },
            layers: [{ id: 'authored-kml', type: 'kml', url: path }],
          }}
        />
      ) : (
        <Centered text={status} />
      )}
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Create KML multi-track` — author a multi-track path, save, then display it. */
export function KmlMultiTrackScreen({ ready }: ScreenProps) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Authoring KML multi-track…');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await createKmlFile({
          path: authoredKmlPath('track.kmz'),
          tracks: [
            {
              points: [
                { latitude: 34.05, longitude: -118.24 },
                { latitude: 36.11, longitude: -115.17 },
                { latitude: 39.74, longitude: -104.99 },
                { latitude: 41.88, longitude: -87.63 },
              ],
            },
          ],
        });
        if (!cancelled) {
          setPath(result.path);
          setStatus('Authored a multi-track; displaying the saved KML.');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      {path ? (
        <ArcgisMapView
          style={screenStyles.fill}
          map={{
            basemap: 'arcGISLightGray',
            initialViewpoint: { center: { latitude: 38, longitude: -103 }, scale: 30_000_000 },
            layers: [{ id: 'authored-track', type: 'kml', url: path }],
          }}
        />
      ) : (
        <Centered text={status} />
      )}
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
