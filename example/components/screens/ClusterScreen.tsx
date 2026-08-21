import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Toggles point clustering (feature reduction) on the Trailheads layer: nearby
 * points aggregate into sized bubbles; turning it off shows every point.
 */
export function ClusterScreen({ ready }: ScreenProps) {
  const [clusterOn, setClusterOn] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={clusterOn ? 'Disable clustering' : 'Enable clustering'}
          onPress={() => setClusterOn((on) => !on)}
        />
        <Text style={styles.status}>Zoom out to aggregate; zoom in to separate.</Text>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISNavigation',
          initialViewpoint: { center: SANTA_MONICA, scale: 400_000 },
          featureLayers: [
            {
              id: 'trailheads',
              url: TRAILHEADS_URL,
              clustering: { enabled: clusterOn, radius: 60, maxSymbolSize: 40, color: '#DB2777' },
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  status: { flex: 1, fontSize: 13, color: '#374151' },
});
