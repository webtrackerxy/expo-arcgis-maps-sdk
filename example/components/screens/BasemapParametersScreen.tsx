import { ArcgisMapView, type BasemapWorldview } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Kashmir: a region whose boundaries differ by worldview, so the change is
// visible when you switch between China / India / Pakistan.
const KASHMIR = { latitude: 34.0, longitude: 76.5 };
const WORLDVIEWS: (BasemapWorldview | 'default')[] = ['default', 'china', 'india', 'pakistan'];

/**
 * Configure basemap style parameters ("Configure basemap style parameters"):
 * switch the basemap `worldview` and watch disputed boundaries redraw. Language
 * strategy is intentionally not exposed (iOS 300.0 has no such parameter).
 */
export function BasemapParametersScreen({ ready }: ScreenProps) {
  const [worldview, setWorldview] = useState<BasemapWorldview | 'default'>('default');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ScrollView horizontal style={styles.barScroll} contentContainerStyle={styles.bar} showsHorizontalScrollIndicator={false}>
        {WORLDVIEWS.map((w) => (
          <Pressable
            key={w}
            style={[styles.chip, worldview === w && styles.chipActive]}
            onPress={() => setWorldview(w)}
          >
            <Text style={[styles.chipText, worldview === w && styles.chipTextActive]}>{w}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.status}>Worldview: {worldview}</Text>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: KASHMIR, scale: 12_000_000 },
          ...(worldview === 'default' ? {} : { basemapStyleParameters: { worldview } }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScroll: { flexGrow: 0, flexShrink: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  status: { paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#374151' },
});
