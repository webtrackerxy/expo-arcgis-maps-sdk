import {
  ArcgisMapView,
  type ArcadeEvaluationResult,
  type ArcgisMapViewRef,
  type SingleTapEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * `Query features with Arcade expression` — loads the official sample's Portland
 * "RPD Beats" web map, then evaluates an Arcade expression against the tapped
 * beat to count the crimes in the last 60 days that intersect it. The feature is
 * bound to `$feature` and the map (with its crime layer) to `$map`.
 */
const CRIME_WEB_MAP_ITEM_ID = '539d93de54c7422f88f69bfac2aebf7d';
const CRIMES_EXPRESSION =
  "var crimes = FeatureSetByName($map, 'Crime in the last 60 days');\n" +
  'return Count(Intersects($feature, crimes));';
// Portland, OR — the extent of the RPD Beats web map.
const PORTLAND = { latitude: 45.5231, longitude: -122.6765 };

/** `Query features with Arcade expression` — count crimes intersecting a tapped police beat. */
export function ArcadeExpressionScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [result, setResult] = useState<ArcadeEvaluationResult | null>(null);
  const [status, setStatus] = useState('Tap a police beat to count its recent crimes.');

  async function onTap(event: SingleTapEventPayload) {
    setStatus('Evaluating…');
    setResult(null);
    try {
      const results =
        (await mapRef.current?.evaluateArcade({
          screenPoint: event.screenPoint,
          expression: CRIMES_EXPRESSION,
        })) ?? [];
      if (results.length === 0) {
        setStatus('No beat here — tap a police-beat polygon.');
        return;
      }
      setResult(results[0]);
      setStatus(`${results.length} beat(s) evaluated`);
    } catch (error) {
      setStatus(`evaluateArcade failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{ webMapItemId: CRIME_WEB_MAP_ITEM_ID, initialViewpoint: { center: PORTLAND, scale: 200_000 } }}
        onSingleTap={({ nativeEvent }: { nativeEvent: SingleTapEventPayload }) => onTap(nativeEvent)}
      />
      {result ? (
        <View style={styles.card}>
          <Text style={styles.count}>{result.value}</Text>
          <Text style={styles.caption}>crimes in the last 60 days in this beat</Text>
        </View>
      ) : (
        <Text style={screenStyles.status}>{status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 16,
    alignItems: 'center',
  },
  count: { fontSize: 32, fontWeight: '700', color: '#B91C1C' },
  caption: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
