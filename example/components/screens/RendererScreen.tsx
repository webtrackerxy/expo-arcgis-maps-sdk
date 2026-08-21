import { ArcgisMapView, type ArcgisRenderer } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Esri's public US Census states layer (has SUB_REGION strings and POP2007
// numbers) — used by Esri's own renderer samples.
const STATES_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3';

const outline = { type: 'simpleLine', color: '#6B7280', width: 0.5 } as const;

const RENDERERS: { key: string; label: string; renderer: ArcgisRenderer }[] = [
  {
    key: 'simple',
    label: 'Simple',
    renderer: { type: 'simple', symbol: { type: 'simpleFill', color: '#F59E0B66', outline } },
  },
  {
    key: 'unique',
    label: 'By region',
    renderer: {
      type: 'uniqueValue',
      fields: ['SUB_REGION'],
      uniqueValues: [
        { values: ['Pacific'], label: 'Pacific', symbol: { type: 'simpleFill', color: '#2563EB99', outline } },
        { values: ['Mountain'], label: 'Mountain', symbol: { type: 'simpleFill', color: '#16A34A99', outline } },
        { values: ['W N Cen'], label: 'W North Central', symbol: { type: 'simpleFill', color: '#DC262699', outline } },
        { values: ['E N Cen'], label: 'E North Central', symbol: { type: 'simpleFill', color: '#9333EA99', outline } },
      ],
      defaultSymbol: { type: 'simpleFill', color: '#9CA3AF66', outline },
    },
  },
  {
    key: 'classes',
    label: 'By population',
    renderer: {
      type: 'classBreaks',
      field: 'POP2007',
      classBreaks: [
        { maxValue: 2_000_000, label: '< 2M', symbol: { type: 'simpleFill', color: '#FEE5D9', outline } },
        { minValue: 2_000_000, maxValue: 6_000_000, label: '2–6M', symbol: { type: 'simpleFill', color: '#FCAE91', outline } },
        { minValue: 6_000_000, maxValue: 12_000_000, label: '6–12M', symbol: { type: 'simpleFill', color: '#FB6A4A', outline } },
        { minValue: 12_000_000, maxValue: 40_000_000, label: '> 12M', symbol: { type: 'simpleFill', color: '#CB181D', outline } },
      ],
      defaultSymbol: { type: 'simpleFill', color: '#EEEEEE', outline },
    },
  },
];

/** Switches a feature layer's `renderer` between simple, unique-value, and class-breaks. */
export function RendererScreen({ ready }: ScreenProps) {
  const [key, setKey] = useState('simple');
  const active = RENDERERS.find((r) => r.key === key) ?? RENDERERS[0];

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        {RENDERERS.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => setKey(r.key)}
            style={[styles.chip, key === r.key && styles.chipOn]}
          >
            <Text style={[styles.chipText, key === r.key && styles.chipTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 70_000_000 },
          featureLayers: [{ id: 'states', url: STATES_URL, renderer: active.renderer }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipOn: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#111827' },
  chipTextOn: { color: '#FFFFFF', fontWeight: '600' },
});
