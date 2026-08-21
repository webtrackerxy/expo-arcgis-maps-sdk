import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const STATES_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3';

/** Toggles feature-layer text labels (state abbreviations with a white halo). */
export function LabelsScreen({ ready }: ScreenProps) {
  const [labelsOn, setLabelsOn] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={labelsOn ? 'Hide labels' : 'Show labels'}
          onPress={() => setLabelsOn((on) => !on)}
        />
        <Text style={styles.status}>State abbreviations via `[STATE_ABBR]`.</Text>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 70_000_000 },
          featureLayers: [
            {
              id: 'states',
              url: STATES_URL,
              labels: labelsOn
                ? [
                    {
                      expression: '[STATE_ABBR]',
                      color: '#1F2937',
                      size: 12,
                      haloColor: '#FFFFFF',
                      haloWidth: 2,
                    },
                  ]
                : [],
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  status: { flex: 1, fontSize: 13, color: '#374151' },
});
