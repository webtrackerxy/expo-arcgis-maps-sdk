import {
  ArcgisMapView,
  bufferGeometry,
  planarBufferGeometry,
  clipGeometry,
  combineGeometries,
  convexHull,
  cutGeometry,
  geometryRelationships,
  projectPoint,
  type ArcgisGeometry,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Two overlapping squares and a scatter of points around Santa Monica.
const RING_A = [
  { latitude: 34.1, longitude: -118.75 },
  { latitude: 34.1, longitude: -118.68 },
  { latitude: 34.05, longitude: -118.68 },
  { latitude: 34.05, longitude: -118.75 },
];
const RING_B = [
  { latitude: 34.12, longitude: -118.71 },
  { latitude: 34.12, longitude: -118.63 },
  { latitude: 34.07, longitude: -118.63 },
  { latitude: 34.07, longitude: -118.71 },
];
const POINTS = [
  { latitude: 34.14, longitude: -118.77 },
  { latitude: 34.13, longitude: -118.61 },
  { latitude: 34.03, longitude: -118.6 },
  { latitude: 34.02, longitude: -118.79 },
];
const polyA: ArcgisGeometry = { type: 'polygon', ring: RING_A };
const polyB: ArcgisGeometry = { type: 'polygon', ring: RING_B };
const cutter: ArcgisGeometry = {
  type: 'polyline',
  path: [
    { latitude: 34.13, longitude: -118.72 },
    { latitude: 34.02, longitude: -118.66 },
  ],
};

const resultLine = { type: 'simpleLine', color: '#16A34A', width: 3 } as const;
const resultFill = {
  type: 'simpleFill',
  color: '#16A34A55',
  outline: resultLine,
} as const;

function toGraphics(geometries: ArcgisGeometry[]): GraphicSource[] {
  return geometries.map((geometry, i) => ({
    id: `result-${i}`,
    geometry,
    symbol: geometry.type === 'polyline' ? resultLine : resultFill,
  }));
}

const OPS: {
  key: string;
  run: () => Promise<{ status: string; result?: ArcgisGeometry[]; graphics?: GraphicSource[] }>;
}[] = [
  {
    key: 'Buffer',
    run: async () => ({
      status: 'Buffer 4km around center',
      result: [await bufferGeometry({ type: 'point', point: SANTA_MONICA }, 4000)],
    }),
  },
  {
    key: 'Planar vs geo',
    run: async () => {
      const center: ArcgisGeometry = { type: 'point', point: SANTA_MONICA };
      const [geodesic, planar] = await Promise.all([
        bufferGeometry(center, 4000),
        planarBufferGeometry(center, 4000),
      ]);
      return {
        status: 'Planar (orange) is larger than geodesic (green) — Web Mercator distortion',
        graphics: [
          { id: 'planar', geometry: planar, symbol: { type: 'simpleFill', color: '#F9731633', outline: { type: 'simpleLine', color: '#EA580C', width: 2 } } },
          { id: 'geodesic', geometry: geodesic, symbol: { type: 'simpleFill', color: '#16A34A55', outline: { type: 'simpleLine', color: '#16A34A', width: 2 } } },
        ],
      };
    },
  },
  {
    key: 'Convex hull',
    run: async () => ({ status: 'Convex hull of points', result: [await convexHull(POINTS.map((p) => ({ type: 'point', point: p })))] }),
  },
  { key: 'Union', run: async () => ({ status: 'A ∪ B', result: [await combineGeometries('union', polyA, polyB)] }) },
  {
    key: 'Intersect',
    run: async () => ({ status: 'A ∩ B', result: [await combineGeometries('intersection', polyA, polyB)] }),
  },
  {
    key: 'Difference',
    run: async () => ({ status: 'A − B', result: [await combineGeometries('difference', polyA, polyB)] }),
  },
  {
    key: 'Clip',
    run: async () => ({
      status: 'Clip A to a box',
      result: [
        await clipGeometry(polyA, {
          minLatitude: 34.06,
          minLongitude: -118.73,
          maxLatitude: 34.11,
          maxLongitude: -118.7,
        }),
      ],
    }),
  },
  { key: 'Cut', run: async () => ({ status: 'Cut A with a line', result: await cutGeometry(polyA, cutter) }) },
  {
    key: 'Project',
    run: async () => {
      const p = await projectPoint(SANTA_MONICA, 3857);
      return { status: `Web Mercator: ${p.x.toFixed(0)}, ${p.y.toFixed(0)}` };
    },
  },
  {
    key: 'Relate A,B',
    run: async () => {
      const r = await geometryRelationships(polyA, polyB);
      const yes = Object.entries(r)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ');
      return { status: `True: ${yes || 'none'}` };
    },
  },
];

/** Runs GeometryEngine operations on two polygons + points and draws the result. */
export function GeometryOpsScreen({ ready }: ScreenProps) {
  const [result, setResult] = useState<GraphicSource[]>([]);
  const [status, setStatus] = useState('Run a geometry operation.');

  async function run(op: (typeof OPS)[number]) {
    try {
      const { status: s, result: geometries, graphics } = await op.run();
      setStatus(s);
      setResult(graphics ?? (geometries ? toGraphics(geometries) : []));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
      setResult([]);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ScrollView horizontal style={styles.barScroll} contentContainerStyle={styles.bar} showsHorizontalScrollIndicator={false}>
        {OPS.map((op) => (
          <Pressable key={op.key} onPress={() => run(op)} style={styles.chip}>
            <Text style={styles.chipText}>{op.key}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.status}>{status}</Text>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: SANTA_MONICA, scale: 400_000 },
          graphics: [
            { id: 'a', geometry: polyA, symbol: { type: 'simpleFill', color: '#DC262622', outline: { type: 'simpleLine', color: '#DC2626', width: 2 } } },
            { id: 'b', geometry: polyB, symbol: { type: 'simpleFill', color: '#2563EB22', outline: { type: 'simpleLine', color: '#2563EB', width: 2 } } },
            ...result,
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScroll: { flexGrow: 0, flexShrink: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  status: { paddingHorizontal: 10, paddingBottom: 6, fontSize: 12, color: '#374151' },
});
