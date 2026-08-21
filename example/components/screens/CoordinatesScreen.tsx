import { ArcgisMapView, formatCoordinates, type CoordinateFormats } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const ROWS: { key: keyof CoordinateFormats; label: string }[] = [
  { key: 'decimalDegrees', label: 'Decimal degrees' },
  { key: 'degreesMinutesSeconds', label: 'DMS' },
  { key: 'usng', label: 'USNG' },
  { key: 'mgrs', label: 'MGRS' },
  { key: 'utm', label: 'UTM' },
];

/** Taps the map and shows the point in every notation via `formatCoordinates`. */
export function CoordinatesScreen({ ready }: ScreenProps) {
  const [formats, setFormats] = useState<CoordinateFormats | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        onSingleTap={async ({ nativeEvent }) => {
          try {
            setError(null);
            setFormats(await formatCoordinates(nativeEvent.mapPoint));
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
        }}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 100_000 },
        }}
      />
      <View style={styles.panel}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!formats && !error && <Text style={styles.hint}>Tap the map to read coordinates.</Text>}
        {formats &&
          ROWS.map((r) => (
            <View key={r.key} style={styles.row}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{formats[r.key]}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 12, gap: 4, backgroundColor: '#F9FAFB' },
  hint: { fontSize: 13, color: '#6B7280' },
  error: { fontSize: 13, color: '#B91C1C' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 12, color: '#6B7280' },
  rowValue: { fontSize: 12, color: '#111827', fontVariant: ['tabular-nums'] },
});
