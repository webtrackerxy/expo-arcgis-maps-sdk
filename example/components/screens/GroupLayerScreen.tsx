import { ArcgisMapView, type ArcgisLayerSource } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A group of two tiled reference layers over the continental US, toggled as one.
const GROUP: ArcgisLayerSource = {
  id: 'reference',
  type: 'group',
  sublayers: [
    {
      id: 'census',
      type: 'mapImage',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
      opacity: 0.7,
    },
    {
      id: 'hurricanes',
      type: 'mapImage',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Hurricanes/MapServer',
    },
  ],
};

/**
 * Group layers together ("Group layers together"): two operational layers are
 * combined into one `group` layer, so toggling the group's `visible` shows or
 * hides both at once.
 */
export function GroupLayerScreen({ ready }: ScreenProps) {
  const [visible, setVisible] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button title={visible ? 'Hide group' : 'Show group'} onPress={() => setVisible((v) => !v)} />
        <Text style={styles.status}>Group “Reference”: {visible ? 'shown' : 'hidden'} (2 sublayers)</Text>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 50_000_000 },
          layers: [{ ...GROUP, visible }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  status: { flex: 1, fontSize: 12, color: '#374151' },
});
