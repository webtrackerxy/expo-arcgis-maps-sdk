import {
  queryMapImageSublayer,
  type FeatureQueryResult,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { USA_MAP_SERVICE_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** The USA service's queryable sublayers and a demo where clause for each. */
const SUBLAYERS = [
  { id: 2, label: 'States (pop > 10M)', where: 'pop2000 > 10000000', field: 'state_name' },
  { id: 3, label: 'Counties (pop > 2M)', where: 'pop2000 > 2000000', field: 'name' },
  { id: 0, label: 'Cities (pop > 500k)', where: 'pop2000 > 500000', field: 'areaname' },
];

/**
 * Queries a sublayer of the USA map image (dynamic) service by attribute
 * expression and lists the matching feature names.
 */
export function MapImageSublayerScreen({ ready }: ScreenProps) {
  const [rows, setRows] = useState<FeatureQueryResult[]>([]);
  const [field, setField] = useState('STATE_NAME');
  const [status, setStatus] = useState('Pick a sublayer to query.');

  async function run(sub: (typeof SUBLAYERS)[number]) {
    setStatus(`Querying ${sub.label}…`);
    setRows([]);
    setField(sub.field);
    try {
      const results = await queryMapImageSublayer(USA_MAP_SERVICE_URL, sub.id, sub.where);
      setRows(results);
      setStatus(`${results.length} feature(s) in sublayer ${sub.id}`);
    } catch (error) {
      setStatus(`query failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, styles.pad]}>
      <View style={styles.buttons}>
        {SUBLAYERS.map((sub) => (
          <Button key={sub.id} title={sub.label} onPress={() => run(sub)} />
        ))}
      </View>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Text style={styles.row}>{String(item.attributes[field] ?? '—')}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 10 },
  buttons: { gap: 8 },
  status: { fontSize: 13, color: '#374151', paddingVertical: 4 },
  row: { fontSize: 15, color: '#111827', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
