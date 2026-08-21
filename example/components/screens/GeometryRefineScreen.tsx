import {
  ArcgisMapView,
  densifyGeometry,
  generalizeGeometry,
  nearestVertex,
  simplifyGeometry,
  type ArcgisGeometry,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A coarse, jagged polyline across the US whose vertex count visibly changes
// under densify / generalize.
const LINE: ArcgisGeometry = {
  type: 'polyline',
  path: [
    { latitude: 34, longitude: -118 },
    { latitude: 39, longitude: -112 },
    { latitude: 36, longitude: -105 },
    { latitude: 41, longitude: -98 },
    { latitude: 38, longitude: -90 },
    { latitude: 42, longitude: -83 },
  ],
};
// A bow-tie (self-intersecting) polygon that `simplify` repairs.
const BOWTIE: ArcgisGeometry = {
  type: 'polygon',
  ring: [
    { latitude: 30, longitude: -100 },
    { latitude: 34, longitude: -94 },
    { latitude: 30, longitude: -94 },
    { latitude: 34, longitude: -100 },
  ],
};
const TAP_POINT: GeographicPoint = { latitude: 37, longitude: -100 };

const orig = { type: 'simpleLine', color: '#9CA3AF', width: 2 } as const;
const result = { type: 'simpleLine', color: '#2563EB', width: 3 } as const;
const fill = {
  type: 'simpleFill',
  color: '#2563EB22',
  outline: { type: 'simpleLine', color: '#2563EB', width: 2 },
} as const;

function vertices(geometry: ArcgisGeometry, color: string): GraphicSource[] {
  const pts = geometry.type === 'polyline' ? geometry.path : geometry.type === 'polygon' ? geometry.ring : [];
  return pts.map((p, i) => ({
    id: `v-${i}`,
    geometry: { type: 'point', point: p },
    symbol: { type: 'simpleMarker', color, size: 8, style: 'circle' },
  }));
}

/** Simplify / densify / generalize a geometry, and find the nearest vertex. */
export function GeometryRefineScreen({ ready }: ScreenProps) {
  const [graphics, setGraphics] = useState<GraphicSource[]>([
    { id: 'orig', geometry: LINE, symbol: orig },
    ...vertices(LINE, '#6B7280'),
  ]);
  const [status, setStatus] = useState('Pick an operation.');

  const OPS = [
    {
      key: 'Densify',
      run: async () => {
        const g = await densifyGeometry(LINE, 1.5);
        const n = g.type === 'polyline' ? g.path.length : 0;
        setStatus(`Densify: 6 → ${n} vertices`);
        return [{ id: 'orig', geometry: LINE, symbol: orig }, { id: 'res', geometry: g, symbol: result }, ...vertices(g, '#2563EB')];
      },
    },
    {
      key: 'Generalize',
      run: async () => {
        const g = await generalizeGeometry(LINE, 3);
        const n = g.type === 'polyline' ? g.path.length : 0;
        setStatus(`Generalize: 6 → ${n} vertices`);
        return [{ id: 'orig', geometry: LINE, symbol: orig }, { id: 'res', geometry: g, symbol: result }, ...vertices(g, '#2563EB')];
      },
    },
    {
      key: 'Simplify',
      run: async () => {
        const g = await simplifyGeometry(BOWTIE);
        setStatus('Simplify: repaired the self-intersecting polygon.');
        return [{ id: 'res', geometry: g, symbol: fill }];
      },
    },
    {
      key: 'Nearest vertex',
      run: async () => {
        const r = await nearestVertex(LINE, TAP_POINT);
        setStatus(`Nearest vertex: ${r.point.latitude.toFixed(1)}, ${r.point.longitude.toFixed(1)}`);
        return [
          { id: 'orig', geometry: LINE, symbol: orig },
          ...vertices(LINE, '#9CA3AF'),
          { id: 'query', geometry: { type: 'point' as const, point: TAP_POINT }, symbol: { type: 'simpleMarker' as const, color: '#DC2626', size: 12, style: 'x' as const } },
          { id: 'near', geometry: { type: 'point' as const, point: r.point }, symbol: { type: 'simpleMarker' as const, color: '#16A34A', size: 14, style: 'circle' as const } },
        ];
      },
    },
  ];

  async function run(op: (typeof OPS)[number]) {
    try {
      setGraphics(await op.run());
    } catch (e) {
      setStatus((e as { message?: string })?.message ?? String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ScrollView horizontal style={styles.barScroll} contentContainerStyle={styles.bar} showsHorizontalScrollIndicator={false}>
        {OPS.map((op) => (
          <Pressable key={op.key} style={styles.chip} onPress={() => run(op)}>
            <Text style={styles.chipText}>{op.key}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.status}>{status}</Text>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ basemap: 'arcGISLightGray', initialViewpoint: { center: { latitude: 37, longitude: -100 }, scale: 30_000_000 }, graphics }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScroll: { flexGrow: 0, flexShrink: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  status: { paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#374151' },
});
