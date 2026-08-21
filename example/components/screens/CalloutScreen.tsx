import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

type Callout = { x: number; y: number; latitude: number; longitude: number };

/**
 * A callout built purely in React over `onSingleTap` — no native callout API.
 * Tapping the map positions an absolutely-placed bubble at the tap location.
 */
export function CalloutScreen({ ready }: ScreenProps) {
  const [callout, setCallout] = useState<Callout | null>(null);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        onSingleTap={({ nativeEvent }) =>
          setCallout({
            x: nativeEvent.screenPoint.x,
            y: nativeEvent.screenPoint.y,
            latitude: nativeEvent.mapPoint.latitude,
            longitude: nativeEvent.mapPoint.longitude,
          })
        }
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 100_000 },
        }}
      />
      {callout && (
        <View
          pointerEvents="none"
          style={[styles.callout, { left: callout.x - 90, top: callout.y - 74 }]}
        >
          <Text style={styles.title}>Tapped location</Text>
          <Text style={styles.body}>
            {callout.latitude.toFixed(5)}, {callout.longitude.toFixed(5)}
          </Text>
          <View style={styles.pointer} />
        </View>
      )}
      <Text style={styles.hint}>Tap the map to place a callout.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  title: { color: '#9CA3AF', fontSize: 11 },
  body: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  pointer: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: '#111827',
    transform: [{ rotate: '45deg' }],
  },
  hint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontSize: 13,
    color: '#374151',
  },
});
