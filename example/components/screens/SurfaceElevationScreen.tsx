/**
 * `Get elevation at point on surface` — queries the scene's base surface for the
 * elevation at a geographic point via the `getSurfaceElevation` ref method and
 * shows the result. Frames the Everest massif so the returned metres are
 * intuitively large.
 */
import { ArcgisSceneView, type ArcgisSceneViewRef, type Camera } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Mount Everest summit — the surface elevation here is ~8.8 km.
const EVEREST = { latitude: 27.9881, longitude: 86.925 };
const EVEREST_CAMERA: Camera = {
  latitude: 27.88,
  longitude: 86.925,
  altitude: 12000,
  heading: 0,
  pitch: 70,
};

export function SurfaceElevationScreen({ ready }: ScreenProps) {
  const sceneRef = useRef<ArcgisSceneViewRef>(null);
  const [status, setStatus] = useState('Tap "Get elevation" to query the surface at Everest.');

  async function query() {
    setStatus('Querying elevation…');
    try {
      const meters = await sceneRef.current?.getSurfaceElevation(EVEREST);
      setStatus(meters == null ? 'No elevation returned.' : `Elevation: ${Math.round(meters)} m`);
    } catch (error) {
      setStatus(`getSurfaceElevation failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        ref={sceneRef}
        style={screenStyles.fill}
        scene={{ basemap: 'arcGISImagery', initialCamera: EVEREST_CAMERA }}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <View style={styles.bar}>
        <Pressable style={styles.button} onPress={query}>
          <Text style={styles.buttonText}>Get elevation</Text>
        </Pressable>
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: { backgroundColor: '#2f7d6e', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  status: { flex: 1, fontSize: 13, color: '#111827' },
});
