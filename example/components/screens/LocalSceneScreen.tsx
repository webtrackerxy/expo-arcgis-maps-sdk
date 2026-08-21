import { ArcgisSceneView, type SceneViewingMode } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SF_BUILDINGS_SCENE_URL, SF_CAMERA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Displays a scene in local (planar) viewing mode and lets you switch to global
 * (globe) mode via `scene.viewingMode`. Local mode draws the scene on a flat
 * plane — suited to small, localized areas.
 */
export function LocalSceneScreen({ ready }: ScreenProps) {
  const [mode, setMode] = useState<SceneViewingMode>('local');
  const [info, setInfo] = useState('Loading local scene…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="Local (flat)" onPress={() => setMode('local')} />
        <Button title="Global (globe)" onPress={() => setMode('global')} />
      </View>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          viewingMode: mode,
          elevationEnabled: true,
          sceneLayers: [{ id: 'sf-buildings', url: SF_BUILDINGS_SCENE_URL }],
          initialCamera: SF_CAMERA,
        }}
        onSceneLoad={() => setInfo(`Scene loaded in ${mode} viewing mode.`)}
        onSceneError={(e) => setInfo(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
