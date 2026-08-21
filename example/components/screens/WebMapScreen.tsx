import { ArcgisMapView, type MapLoadEventPayload } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { WEB_MAP_ITEM_ID, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Loads a web map from an ArcGIS portal item id (its own basemap + layers). */
export function WebMapScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading web map…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ webMapItemId: WEB_MAP_ITEM_ID }}
        onMapLoad={({ nativeEvent }: { nativeEvent: MapLoadEventPayload }) =>
          setStatus(`Web map loaded (WKID ${nativeEvent.spatialReferenceWkid})`)
        }
        onMapError={({ nativeEvent }) => setStatus(`Error ${nativeEvent.code}: ${nativeEvent.message}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
