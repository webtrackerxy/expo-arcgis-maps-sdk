import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import type { ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Exercises the stable error contract deterministically: an unsupported basemap
 * fails TypeScript validation with `E_INVALID_ARGUMENT`, reported via
 * `onMapError` regardless of key or network.
 */
export function ErrorScreen(_props: ScreenProps) {
  const [error, setError] = useState('Waiting for error…');
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ basemap: 'notARealBasemap' as never }}
        onMapError={({ nativeEvent }) => setError(`${nativeEvent.code}: ${nativeEvent.message}`)}
      />
      <Text style={screenStyles.status}>{error}</Text>
    </View>
  );
}
