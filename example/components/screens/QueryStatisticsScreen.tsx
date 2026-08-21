import { ArcgisMapView, type ArcgisMapViewRef, type StatisticsRow } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const STATES_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3';

/**
 * Query aggregate statistics ("Query table statistics" / "…group and sort"):
 * computes the total and average 2007 population per US census sub-region and
 * the state count, grouped by `SUB_REGION`.
 */
export function QueryStatisticsScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [rows, setRows] = useState<StatisticsRow[]>([]);
  const [status, setStatus] = useState('Tap “Compute” to aggregate by sub-region.');

  async function compute() {
    setStatus('Computing…');
    try {
      const result = await mapRef.current!.queryStatistics({
        layerId: 'states',
        statistics: [
          { field: 'POP2007', type: 'sum', outName: 'total_pop' },
          { field: 'POP2007', type: 'average', outName: 'avg_pop' },
          { field: 'STATE_NAME', type: 'count', outName: 'states' },
        ],
        groupByFields: ['SUB_REGION'],
      });
      result.sort((a, b) => Number(b.statistics.total_pop) - Number(a.statistics.total_pop));
      setRows(result);
      setStatus(`${result.length} sub-regions (sorted by population)`);
    } catch (e) {
      setStatus((e as { message?: string })?.message ?? String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button title="Compute" onPress={compute} />
        <Text style={styles.status}>{status}</Text>
      </View>
      {rows.length > 0 && (
        <ScrollView style={styles.table} contentContainerStyle={styles.tableInner}>
          {rows.map((r) => (
            <View key={String(r.group.SUB_REGION)} style={styles.row}>
              <Text style={styles.region}>{String(r.group.SUB_REGION)}</Text>
              <Text style={styles.stat}>
                {Number(r.statistics.states)} states ·{' '}
                {(Number(r.statistics.total_pop) / 1e6).toFixed(1)}M total
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 50_000_000 },
          featureLayers: [{ id: 'states', url: STATES_URL, opacity: 0.6 }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  status: { flex: 1, fontSize: 12, color: '#374151' },
  table: { maxHeight: 220, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D5DB' },
  tableInner: { paddingHorizontal: 12, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  region: { fontSize: 13, fontWeight: '600', color: '#111827' },
  stat: { fontSize: 12, color: '#374151' },
});
