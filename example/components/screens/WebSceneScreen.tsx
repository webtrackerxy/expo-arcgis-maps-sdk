import { ArcgisSceneView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { WEB_SCENE_ITEM_ID, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Displays a 3D web scene loaded from an ArcGIS portal item
 * (`scene.webSceneItemId`). The web scene carries its own basemap, layers,
 * elevation, and initial camera.
 */
export function WebSceneScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading web scene…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{ webSceneItemId: WEB_SCENE_ITEM_ID }}
        onSceneLoad={() => setInfo('Web scene loaded (portal item).')}
        onSceneError={(e) => setInfo(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}
