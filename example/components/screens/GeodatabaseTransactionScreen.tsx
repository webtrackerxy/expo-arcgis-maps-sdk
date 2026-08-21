import { applyGeodatabaseTransaction, createMobileGeodatabase } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';

const TABLE = 'LocationHistory';

/**
 * Edit a mobile geodatabase inside a transaction. Creates a fresh geodatabase
 * (3 seed features), then adds 3 more inside a transaction and either commits
 * (persists → 6) or rolls back (discards → 3). Fully local — no network or key.
 */
export function GeodatabaseTransactionScreen({ ready }: ScreenProps) {
  const [path, setPath] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState('Tap “Create” to build a geodatabase.');

  async function create() {
    setStatus('Creating…');
    try {
      const r = await createMobileGeodatabase({
        tableName: TABLE,
        geometryType: 'point',
        fields: [{ name: 'name', type: 'text' }],
      });
      setPath(r.path);
      setCount(r.featureCount);
      setStatus(`Created with ${r.featureCount} features.`);
    } catch (e) {
      setStatus((e as { code?: string })?.code ?? String(e));
    }
  }

  async function run(commit: boolean) {
    if (!path) {
      return;
    }
    setStatus(`Adding 3 features and ${commit ? 'committing' : 'rolling back'}…`);
    try {
      const r = await applyGeodatabaseTransaction(path, TABLE, 3, commit);
      setCount(r.featureCount);
      setStatus(
        r.committed
          ? `Committed → ${r.featureCount} features (persisted).`
          : `Rolled back → ${r.featureCount} features (discarded).`
      );
    } catch (e) {
      setStatus((e as { code?: string })?.code ?? String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.fill}>
      <View style={styles.bar}>
        <Button title="Create" onPress={create} />
        <Button title="Add 3 + commit" onPress={() => run(true)} disabled={!path} />
        <Button title="Add 3 + rollback" onPress={() => run(false)} disabled={!path} />
      </View>
      <Text style={styles.count}>{count === null ? '—' : `${count} features`}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#FFFFFF' },
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, justifyContent: 'center' },
  count: { fontSize: 30, fontWeight: '700', color: '#111827', textAlign: 'center', paddingVertical: 16 },
  status: { paddingHorizontal: 14, fontSize: 14, color: '#374151', textAlign: 'center' },
});
