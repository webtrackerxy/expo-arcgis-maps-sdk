import { ArcgisMapView, type MapGrid } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const GRIDS: MapGrid[] = ['none', 'latitudeLongitude', 'mgrs', 'utm', 'usng'];
const LABELS: Record<MapGrid, string> = {
  none: 'None',
  latitudeLongitude: 'Lat/Long',
  mgrs: 'MGRS',
  utm: 'UTM',
  usng: 'USNG',
};

/** Cycles the declarative `grid` prop through the supported coordinate grids. */
export function GridScreen({ ready }: ScreenProps) {
  const [grid, setGrid] = useState<MapGrid>('latitudeLongitude');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        {GRIDS.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGrid(g)}
            style={[styles.chip, grid === g && styles.chipOn]}
          >
            <Text style={[styles.chipText, grid === g && styles.chipTextOn]}>{LABELS[g]}</Text>
          </Pressable>
        ))}
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        grid={grid}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 500_000 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  chipOn: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#111827' },
  chipTextOn: { color: '#FFFFFF', fontWeight: '600' },
});
