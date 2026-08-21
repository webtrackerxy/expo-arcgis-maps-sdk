/**
 * `Select features in scene layer` — tap a building in the Brest buildings scene
 * layer (the official sample's data) to select it. `onSingleTap` gives the
 * screen point; `selectSceneFeatures` identifies the scene-layer features there
 * and highlights them. "Clear" removes the selection.
 */
import {
  ArcgisSceneView,
  type ArcgisSceneViewRef,
  type Camera,
  type SingleTapEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const BREST_BUILDINGS =
  'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Buildings_Brest/SceneServer/layers/0';
const CAMERA: Camera = {
  latitude: 48.398,
  longitude: -4.503,
  altitude: 250,
  heading: 20,
  pitch: 70,
};

export function SceneSelectionScreen({ ready }: ScreenProps) {
  const sceneRef = useRef<ArcgisSceneViewRef>(null);
  const [status, setStatus] = useState('Tap a building to select it.');

  async function onTap(event: SingleTapEventPayload) {
    try {
      const count = await sceneRef.current?.selectSceneFeatures({ screenPoint: event.screenPoint });
      setStatus(count ? `${count} feature(s) selected` : 'No feature here — tap a building.');
    } catch (error) {
      setStatus(`selectSceneFeatures failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function clear() {
    try {
      await sceneRef.current?.clearSceneSelection();
      setStatus('Selection cleared.');
    } catch {
      setStatus('clearSceneSelection failed.');
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
        scene={{
          basemap: 'arcGISImagery',
          initialCamera: CAMERA,
          sceneLayers: [{ id: 'brest', type: 'scene', url: BREST_BUILDINGS }],
        }}
        onSingleTap={({ nativeEvent }: { nativeEvent: SingleTapEventPayload }) => onTap(nativeEvent)}
      />
      <View style={styles.bar}>
        <Pressable style={styles.button} onPress={clear}>
          <Text style={styles.buttonText}>Clear</Text>
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
