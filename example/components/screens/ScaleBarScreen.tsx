import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Toggles the declarative `scaleBar` overlay (ArcGIS Toolkit scale bar). */
export function ScaleBarScreen({ ready }: ScreenProps) {
  const [scaleBar, setScaleBar] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={scaleBar ? 'Hide scale bar' : 'Show scale bar'}
          onPress={() => setScaleBar((on) => !on)}
        />
        <Text style={styles.status}>Pan/zoom to see the scale update.</Text>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        scaleBar={scaleBar}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 200_000 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  status: { flex: 1, fontSize: 13, color: '#374151' },
});
