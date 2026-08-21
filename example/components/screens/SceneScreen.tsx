import { ArcgisSceneView, type ArcgisSceneViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import {
  SF_BUILDINGS_SCENE_URL,
  SF_CAMERA,
  SF_CAMERA_WIDE,
  type ScreenProps,
} from '../constants';
import { screenStyles } from '../styles';

/**
 * Renders the 3D `ArcgisSceneView`: an imagery basemap over world elevation with
 * San Francisco's 3D buildings scene layer, plus imperative camera moves.
 */
export function SceneScreen({ ready }: ScreenProps) {
  const sceneRef = useRef<ArcgisSceneViewRef>(null);
  const [info, setInfo] = useState('Loading 3D scene…');

  async function flyTo(camera: typeof SF_CAMERA, label: string) {
    try {
      await sceneRef.current?.setCamera(camera, { durationMs: 2000 });
      setInfo(`Camera: ${label}`);
    } catch (error) {
      setInfo(`setCamera failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="Street level" onPress={() => flyTo(SF_CAMERA, 'street level')} />
        <Button title="Bird’s eye" onPress={() => flyTo(SF_CAMERA_WIDE, 'bird’s eye')} />
      </View>
      <ArcgisSceneView
        ref={sceneRef}
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          elevationEnabled: true,
          sceneLayers: [{ id: 'sf-buildings', url: SF_BUILDINGS_SCENE_URL }],
          initialCamera: SF_CAMERA,
        }}
        onSceneLoad={() => setInfo('Scene loaded. Tap a button to move the camera.')}
        onSceneError={(e) => setInfo(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
