import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const CENTER = { latitude: 34.056, longitude: -117.196 }; // San Bernardino
const ANGLES = [0, 45, 90, 180, 270];

/**
 * Demonstrates viewpoint rotation ("Set viewpoint rotation"): each button
 * animates the map to a fixed heading via the ref's `setViewpoint` `rotation`,
 * and the live heading is read back from `onViewpointChange`.
 */
export function RotationScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [rotation, setRotation] = useState(0);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        {ANGLES.map((deg) => (
          <Button
            key={deg}
            title={`${deg}°`}
            onPress={() =>
              mapRef.current
                ?.setViewpoint({ center: CENTER, scale: 100_000, rotation: deg }, { durationMs: 1000 })
                .catch(() => undefined)
            }
          />
        ))}
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{ basemap: 'arcGISTopographic', initialViewpoint: { center: CENTER, scale: 100_000 } }}
        onViewpointChange={({ nativeEvent }) => setRotation(nativeEvent.rotation)}
      />
      <Text style={screenStyles.status}>Heading: {Math.round(rotation)}° clockwise from north</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
