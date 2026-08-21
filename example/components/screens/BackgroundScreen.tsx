import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The background grid draws behind the basemap; zooming out past the edges of
// the Web Mercator world makes it visible above and below the map.
const COLORS = ['#0B1F3A', '#1B4332', '#4A1F1F', '#3A2E0B'];

/** Sets the map's `backgroundColor`, visible behind an empty (no-basemap) map. */
export function BackgroundScreen({ ready }: ScreenProps) {
  const [color, setColor] = useState(COLORS[0]);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Text style={styles.label}>Background:</Text>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}
          />
        ))}
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          backgroundColor: color,
          // Zoomed far out and centered on the equator, so the background shows
          // above and below the Web Mercator world.
          initialViewpoint: { center: { latitude: 0, longitude: 0 }, scale: 250_000_000 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  label: { fontSize: 13, color: '#374151' },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  swatchOn: { borderWidth: 3, borderColor: '#2563EB' },
});
