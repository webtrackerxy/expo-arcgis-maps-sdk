import {
  getTransformations,
  projectPoint,
  type GeographicPoint,
  type TransformationInfo,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';

// Royal Observatory, Greenwich — projecting WGS 84 → British National Grid
// (EPSG:27700) has several datum transformations whose results differ by metres.
const POINT: GeographicPoint = { latitude: 51.4778, longitude: -0.0014 };
const BNG_WKID = 27700;

export function TransformationsScreen({ ready }: ScreenProps) {
  const [transforms, setTransforms] = useState<TransformationInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [projected, setProjected] = useState<string>('');
  const [status, setStatus] = useState('Loading transformations…');

  useEffect(() => {
    if (!ready) return;
    getTransformations(4326, BNG_WKID)
      .then((list) => {
        setTransforms(list);
        setStatus(`${list.length} transformations (WGS 84 → British National Grid)`);
      })
      .catch((e) => setStatus((e as { message?: string })?.message ?? String(e)));
  }, [ready]);

  async function pick(t: TransformationInfo) {
    setSelected(t.name);
    try {
      const p = await projectPoint(POINT, BNG_WKID, t.name);
      setProjected(`E ${p.x.toFixed(1)}  N ${p.y.toFixed(1)}`);
    } catch (e) {
      setProjected((e as { message?: string })?.message ?? String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.fill}>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.coords}>
        {projected ? `Greenwich → ${projected}` : 'Tap a transformation to project the point.'}
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {transforms.map((t) => (
          <Pressable
            key={t.name}
            style={[styles.row, selected === t.name && styles.rowActive]}
            onPress={() => pick(t)}
          >
            <Text style={[styles.name, selected === t.name && styles.nameActive]} numberOfLines={2}>
              {t.name}
            </Text>
            {t.isMissingProjectionEngineFiles && <Text style={styles.warn}>needs PE files</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#FFFFFF' },
  status: { paddingHorizontal: 14, paddingTop: 12, fontSize: 13, fontWeight: '600', color: '#111827' },
  coords: { paddingHorizontal: 14, paddingVertical: 6, fontSize: 13, color: '#2563EB', fontVariant: ['tabular-nums'] },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  row: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowActive: { backgroundColor: '#EFF6FF' },
  name: { flex: 1, fontSize: 13, color: '#374151' },
  nameActive: { color: '#1D4ED8', fontWeight: '600' },
  warn: { fontSize: 11, color: '#B45309' },
});
