/**
 * `Show shapefile metadata` — reads a local shapefile's descriptive metadata
 * (credits, description, summary, tags) via `getShapefileInfo`, without adding
 * it to a map. Uses the official sample's Aurora, CO shapefile, provisioned from
 * its portal-item `.zip`.
 */
import { getShapefileInfo, type ShapefileInfo } from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedZip } from './provisioning';

export function ShapefileMetadataScreen({ ready }: ScreenProps) {
  const { path } = useProvisionedZip('d98b3e5293834c5f852f13c569930caa', 'aurora-shp', 'Subdivisions.shp');
  const [info, setInfo] = useState<ShapefileInfo | null>(null);
  const [status, setStatus] = useState('Preparing data…');

  useEffect(() => {
    if (!path) return;
    setStatus('Reading metadata…');
    getShapefileInfo(path)
      .then((result) => {
        setInfo(result);
        setStatus('Metadata read.');
      })
      .catch((error: { code?: string }) => setStatus(`getShapefileInfo failed: ${error.code ?? 'error'}`));
  }, [path]);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!info) {
    return <Centered text={status} />;
  }
  const rows: [string, string][] = [
    ['Summary', info.summary || '—'],
    ['Description', info.description || '—'],
    ['Credits', info.credits || '—'],
    ['Copyright', info.copyrightText || '—'],
    ['Tags', info.tags.length ? info.tags.join(', ') : '—'],
  ];
  return (
    <View style={screenStyles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  row: { gap: 3 },
  label: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 15, color: '#111827' },
});
