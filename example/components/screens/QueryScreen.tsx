import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Queries a feature layer by attribute expression via the ref's `queryFeatures`. */
export function QueryScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [info, setInfo] = useState('Tap a button to query the trailheads layer.');

  async function runQuery(whereClause: string, label: string) {
    try {
      const results =
        (await mapRef.current?.queryFeatures({
          layerId: 'trailheads',
          whereClause,
          maxResults: 100,
          select: true,
        })) ?? [];
      const first = results[0]?.attributes.TRL_NAME;
      setInfo(`${label}: ${results.length} feature(s)${first ? ` · e.g. ${String(first)}` : ''}`);
    } catch (error) {
      setInfo(`query failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="All" onPress={() => runQuery('1=1', 'All')} />
        <Button title="‘Canyon’" onPress={() => runQuery("TRL_NAME LIKE '%Canyon%'", 'Canyon')} />
        <Button title="‘Park’" onPress={() => runQuery("TRL_NAME LIKE '%Park%'", 'Park')} />
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 120_000 },
          featureLayers: [{ id: 'trailheads', url: TRAILHEADS_URL }],
        }}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
