import {
  ArcgisMapView,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Shows the device location (the blue dot) and, as it moves, accumulates the
 * positions from `onLocationUpdate` into a polyline — a location *history* drawn
 * with a graphic (no native trail API needed).
 */
export function LocationScreen({ ready }: ScreenProps) {
  const [on, setOn] = useState(false);
  const [trail, setTrail] = useState<GeographicPoint[]>([]);
  const [last, setLast] = useState<GeographicPoint | null>(null);
  const [denied, setDenied] = useState(false);

  async function start() {
    // Android requires the runtime permission before the data source starts; iOS
    // prompts automatically when the ArcGIS data source starts.
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        setDenied(true);
        return;
      }
    }
    setDenied(false);
    setTrail([]);
    setLast(null);
    setOn(true);
  }

  const graphics: GraphicSource[] =
    trail.length >= 2
      ? [
          {
            id: 'trail',
            geometry: { type: 'polyline', path: trail },
            symbol: { type: 'simpleLine', color: '#2563EB', width: 3 },
          },
        ]
      : [];

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={on ? 'Stop' : 'Start location'}
          onPress={() => (on ? setOn(false) : start())}
        />
        <Text style={styles.status}>
          {denied
            ? 'Location permission denied.'
            : last
              ? `${last.latitude.toFixed(5)}, ${last.longitude.toFixed(5)} · ${trail.length} pts`
              : on
                ? 'Waiting for a fix…'
                : 'Off'}
        </Text>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        locationDisplay={{ enabled: on, autoPanMode: 'recenter', showAccuracy: true }}
        onLocationUpdate={({ nativeEvent }) => {
          setLast(nativeEvent.position);
          setTrail((t) => [...t, nativeEvent.position].slice(-200));
        }}
        map={{ basemap: 'arcGISNavigation', graphics }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  status: { flex: 1, fontSize: 13, color: '#374151', fontVariant: ['tabular-nums'] },
});
