import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type ViewpointChangeEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const PLACES = [
  { name: 'London', center: LONDON, scale: 50_000 },
  { name: 'New York', center: { latitude: 40.7128, longitude: -74.006 }, scale: 100_000 },
  { name: 'Tokyo', center: { latitude: 35.6762, longitude: 139.6503 }, scale: 100_000 },
];

/** Animates the camera via the ref's `setViewpoint`, showing `onViewpointChange`. */
export function ViewpointScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [viewpoint, setViewpoint] = useState('Pan/zoom or tap a city…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        {PLACES.map((place) => (
          <Button
            key={place.name}
            title={place.name}
            onPress={() => {
              mapRef.current
                ?.setViewpoint({ center: place.center, scale: place.scale }, { durationMs: 1500 })
                .catch(() => undefined);
            }}
          />
        ))}
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{ basemap: 'arcGISNavigation', initialViewpoint: { center: LONDON, scale: 50_000 } }}
        onViewpointChange={({ nativeEvent }: { nativeEvent: ViewpointChangeEventPayload }) =>
          setViewpoint(
            `lat ${nativeEvent.center.latitude.toFixed(3)}, ` +
              `lon ${nativeEvent.center.longitude.toFixed(3)}, ` +
              `1:${Math.round(nativeEvent.scale).toLocaleString()}`
          )
        }
      />
      <Text style={screenStyles.status}>{viewpoint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
