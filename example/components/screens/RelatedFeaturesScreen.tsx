import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Esri's public Alaska national parks service; its parks relate to a species table.
const PARKS_URL =
  'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/AlaskaNationalParksPreservesSpecies_List/FeatureServer/0';

/** Queries the records related to a park (by object id) via the layer's relationship. */
export function RelatedFeaturesScreen({ ready }: ScreenProps) {
  const ref = useRef<ArcgisMapViewRef>(null);
  const [status, setStatus] = useState('Tap "Related" to query species for park #1.');
  const [rows, setRows] = useState<string[]>([]);

  async function queryRelated() {
    try {
      const results = await ref.current!.queryRelatedFeatures({ layerId: 'parks', objectId: 1 });
      setRows(
        results
          .slice(0, 20)
          .map((r) => String(r.attributes.Common_Name ?? r.attributes.Category ?? '—'))
      );
      setStatus(`${results.length} related species records`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button title="Related species (park #1)" onPress={queryRelated} />
      </View>
      <Text style={styles.status}>{status}</Text>
      {rows.length > 0 && (
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner}>
          {rows.map((r, i) => (
            <Text key={i} style={styles.row}>
              • {r}
            </Text>
          ))}
        </ScrollView>
      )}
      <ArcgisMapView
        ref={ref}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 63, longitude: -150 }, scale: 25_000_000 },
          featureLayers: [{ id: 'parks', url: PARKS_URL }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  status: { paddingHorizontal: 10, paddingBottom: 6, fontSize: 12, color: '#374151' },
  list: { maxHeight: 140, backgroundColor: '#F9FAFB' },
  listInner: { padding: 10, gap: 2 },
  row: { fontSize: 12, color: '#111827' },
});
