import { createMobileGeodatabase, type MobileGeodatabaseResult } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';

/**
 * Create a mobile geodatabase ("Create mobile geodatabase"): builds a new local
 * `.geodatabase` file with a point feature table (name / date fields), adds a
 * few sample features, and reports the file path and feature count. Fully local
 * — no network or API key needed.
 */
export function CreateGeodatabaseScreen({ ready }: ScreenProps) {
  const [result, setResult] = useState<MobileGeodatabaseResult | null>(null);
  const [status, setStatus] = useState('Tap “Create” to build a mobile geodatabase.');

  async function create() {
    setStatus('Creating…');
    setResult(null);
    try {
      const r = await createMobileGeodatabase({
        tableName: 'LocationHistory',
        geometryType: 'point',
        fields: [
          { name: 'name', type: 'text' },
          { name: 'collected', type: 'date' },
          { name: 'count', type: 'integer' },
        ],
      });
      setResult(r);
      setStatus(`Created “${r.tableName}” with ${r.featureCount} features.`);
    } catch (e) {
      setStatus((e as { message?: string })?.message ?? String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.fill}>
      <View style={styles.bar}>
        <Button title="Create" onPress={create} />
      </View>
      <Text style={styles.status}>{status}</Text>
      {result && (
        <View style={styles.card}>
          <Text style={styles.label}>Table</Text>
          <Text style={styles.value}>{result.tableName}</Text>
          <Text style={styles.label}>Features</Text>
          <Text style={styles.value}>{result.featureCount}</Text>
          <Text style={styles.label}>File</Text>
          <Text style={styles.path} numberOfLines={3}>
            {result.path}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#FFFFFF' },
  bar: { padding: 12 },
  status: { paddingHorizontal: 14, fontSize: 14, color: '#111827', fontWeight: '600' },
  card: { margin: 14, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 12, gap: 2 },
  label: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginTop: 8,
  },
  value: { fontSize: 16, color: '#111827', fontWeight: '600' },
  path: { fontSize: 12, color: '#374151', fontFamily: 'monospace' },
});
