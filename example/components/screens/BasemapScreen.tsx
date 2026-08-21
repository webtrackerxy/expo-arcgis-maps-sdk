import { ArcgisMapView, type MapLoadEventPayload } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Renders a topographic basemap and reports load status. */
export function BasemapScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ basemap: 'arcGISTopographic', initialViewpoint: { center: LONDON, scale: 50_000 } }}
        onMapLoad={({ nativeEvent }: { nativeEvent: MapLoadEventPayload }) =>
          setStatus(`Loaded (WKID ${nativeEvent.spatialReferenceWkid})`)
        }
        onMapError={({ nativeEvent }) => setStatus(`Error: ${nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
