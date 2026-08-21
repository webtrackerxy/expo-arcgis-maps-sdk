/**
 * `Query with time extent` — queries a time-aware feature service for the
 * features whose time falls within a window, via `queryFeaturesInTimeExtent`.
 * Mirrors the official sample: the Hurricanes service, September 2000.
 */
import { queryFeaturesInTimeExtent } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const HURRICANES = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Hurricanes/MapServer/0';
const START = Date.UTC(2000, 8, 1); // 2000-09-01
const END = Date.UTC(2000, 8, 22); // 2000-09-22

export function QueryTimeExtentScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Tap “Query” for hurricanes in Sept 2000.');

  async function run() {
    setStatus('Querying time extent…');
    try {
      const features = await queryFeaturesInTimeExtent({
        serviceUrl: HURRICANES,
        startTime: START,
        endTime: END,
      });
      setStatus(`${features.length} observation(s) in the time window.`);
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text style={screenStyles.status}>{status}</Text>
      <View style={{ padding: 12 }}>
        <Button title="Query" onPress={run} />
      </View>
    </View>
  );
}
