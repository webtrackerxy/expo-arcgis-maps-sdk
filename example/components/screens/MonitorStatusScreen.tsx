import {
  ArcgisMapView,
  type DrawStatus,
  type LayerViewStatus,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const LAYER_ID = 'parks';
const PARKS_URL =
  'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/AlaskaNationalParksPreservesSpecies_List/FeatureServer/0';

/**
 * Demonstrates the `onDrawStatusChange` and `onLayerViewStateChange` events
 * ("Monitor changes to draw status" / "Monitor changes to layer view state").
 * Pan/zoom to see the draw status flip to "Drawing…"; toggle the layer to see
 * its view state move between `active` and `notVisible`. Long-press the map to
 * see the magnifier ("Show magnifier").
 */
export function MonitorStatusScreen({ ready }: ScreenProps) {
  const [drawStatus, setDrawStatus] = useState<DrawStatus>('completed');
  const [layerStatuses, setLayerStatuses] = useState<LayerViewStatus[]>([]);
  const [visible, setVisible] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button title={visible ? 'Hide layer' : 'Show layer'} onPress={() => setVisible((v) => !v)} />
        <View style={styles.readout}>
          <Text style={styles.line}>
            Draw: {drawStatus === 'inProgress' ? 'Drawing…' : 'Idle'}
          </Text>
          <Text style={styles.line}>
            Layer state: {layerStatuses.length ? layerStatuses.join(', ') : '—'}
          </Text>
          <Text style={styles.hint}>Long-press the map for the magnifier.</Text>
        </View>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        onDrawStatusChange={({ nativeEvent }) => setDrawStatus(nativeEvent.status)}
        onLayerViewStateChange={({ nativeEvent }) => {
          if (nativeEvent.layerId === LAYER_ID) setLayerStatuses(nativeEvent.statuses);
        }}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 63.5, longitude: -150.0 }, scale: 12_000_000 },
          featureLayers: [{ id: LAYER_ID, url: PARKS_URL, visible }],
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
  readout: { flex: 1 },
  line: { fontSize: 13, fontWeight: '600', color: '#111827' },
  hint: { fontSize: 11, color: '#6B7280' },
});
