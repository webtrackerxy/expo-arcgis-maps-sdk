import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const STATES_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3';

/**
 * Query & selection depth on a states layer: a `definitionExpression` filter,
 * `selectFeatures` highlighting, and `queryFeatureExtent` (count + extent).
 */
export function QueryDepthScreen({ ready }: ScreenProps) {
  const ref = useRef<ArcgisMapViewRef>(null);
  const [filtered, setFiltered] = useState(false);
  const [status, setStatus] = useState('Filter, select, or count features.');

  async function run(fn: () => Promise<string>) {
    try {
      setStatus(await fn());
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
        <Button
          title={filtered ? 'Show all' : 'Pop > 5M'}
          onPress={() => setFiltered((f) => !f)}
        />
        <Button
          title="Select West"
          onPress={() =>
            run(async () => {
              const n = await ref.current!.selectFeatures({
                layerId: 'states',
                whereClause: "SUB_REGION = 'Pacific' OR SUB_REGION = 'Mountain'",
              });
              return `Selected ${n} western states`;
            })
          }
        />
        <Button
          title="Count+extent"
          onPress={() =>
            run(async () => {
              const r = await ref.current!.queryFeatureExtent({
                layerId: 'states',
                whereClause: 'POP2007 > 5000000',
              });
              return r.extent
                ? `${r.count} states >5M · extent ${r.extent.minLatitude.toFixed(0)},${r.extent.minLongitude.toFixed(0)}…`
                : `${r.count} states`;
            })
          }
        />
      </View>
      <Text style={styles.status}>{status}</Text>
      <ArcgisMapView
        ref={ref}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 70_000_000 },
          featureLayers: [
            {
              id: 'states',
              url: STATES_URL,
              ...(filtered ? { definitionExpression: 'POP2007 > 5000000' } : {}),
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 8 },
  status: { paddingHorizontal: 10, paddingBottom: 6, fontSize: 12, color: '#374151' },
});
