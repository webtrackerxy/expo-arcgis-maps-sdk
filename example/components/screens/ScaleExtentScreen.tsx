import { ArcgisMapView, type GeographicEnvelope, type GraphicSource } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The constraints applied in the "limits on" state.
const MIN_SCALE = 2_000_000; // most zoomed-out: can't zoom past ~all of SoCal
const MAX_SCALE = 2_000; // most zoomed-in
const REFERENCE_SCALE = 100_000;
// A bounding box around the Los Angeles basin. With `maxExtent` applied the map
// cannot be panned outside this box.
const LA_EXTENT: GeographicEnvelope = {
  minLatitude: 33.6,
  minLongitude: -118.9,
  maxLatitude: 34.4,
  maxLongitude: -118.0,
};

// Center of the extent box, used as the initial viewpoint so the whole red box
// is framed on load (at a scale just inside `minScale`).
const EXTENT_CENTER = {
  latitude: (LA_EXTENT.minLatitude + LA_EXTENT.maxLatitude) / 2,
  longitude: (LA_EXTENT.minLongitude + LA_EXTENT.maxLongitude) / 2,
};

// A red outline of the extent box, drawn so the pan boundary is visible on the
// map. A polygon ring of the four corners with a translucent fill + red stroke.
const EXTENT_OUTLINE: GraphicSource = {
  id: 'max-extent',
  geometry: {
    type: 'polygon',
    ring: [
      { latitude: LA_EXTENT.minLatitude, longitude: LA_EXTENT.minLongitude },
      { latitude: LA_EXTENT.minLatitude, longitude: LA_EXTENT.maxLongitude },
      { latitude: LA_EXTENT.maxLatitude, longitude: LA_EXTENT.maxLongitude },
      { latitude: LA_EXTENT.maxLatitude, longitude: LA_EXTENT.minLongitude },
    ],
  },
  symbol: {
    type: 'simpleFill',
    color: '#FF000014', // ~8% red wash
    outline: { type: 'simpleLine', color: '#D3212C', width: 2 },
  },
};

const fmt = (n: number) => `1:${Math.round(n).toLocaleString('en-US')}`;

/**
 * Toggles declarative map constraints and shows what is applied: the red box is
 * the `maxExtent` (the map cannot pan outside it), and the readout shows the
 * live scale against the `minScale`/`maxScale`/`referenceScale` limits.
 */
export function ScaleExtentScreen({ ready }: ScreenProps) {
  const [constrained, setConstrained] = useState(true);
  const [scale, setScale] = useState<number | null>(null);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={constrained ? 'Remove limits' : 'Apply limits'}
          onPress={() => setConstrained((on) => !on)}
        />
        <View style={styles.readout}>
          <Text style={styles.scale}>{scale === null ? 'Scale —' : `Scale ${fmt(scale)}`}</Text>
          <Text style={styles.limits}>
            {constrained
              ? `Limits: zoom ${fmt(MAX_SCALE)}–${fmt(MIN_SCALE)} · ref ${fmt(REFERENCE_SCALE)}`
              : 'Limits: none'}
          </Text>
          <Text style={styles.limits}>
            {constrained
              ? `Extent (red box): ${LA_EXTENT.minLatitude},${LA_EXTENT.minLongitude} → ${LA_EXTENT.maxLatitude},${LA_EXTENT.maxLongitude}`
              : 'Extent: unbounded'}
          </Text>
        </View>
      </View>
      <ArcgisMapView
        style={screenStyles.fill}
        onViewpointChange={({ nativeEvent }) => setScale(nativeEvent.scale)}
        map={{
          basemap: 'arcGISTopographic',
          // Frame the whole extent box on load (just inside the 1:2,000,000 min).
          initialViewpoint: { center: EXTENT_CENTER, scale: 1_800_000 },
          // The extent box is always drawn so you can see where the boundary is;
          // the constraints themselves are only applied when `constrained`.
          graphics: [EXTENT_OUTLINE],
          ...(constrained
            ? {
                minScale: MIN_SCALE,
                maxScale: MAX_SCALE,
                referenceScale: REFERENCE_SCALE,
                maxExtent: LA_EXTENT,
              }
            : {}),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readout: { flex: 1 },
  scale: { fontSize: 14, fontWeight: '600', color: '#111827' },
  limits: { fontSize: 11, color: '#374151' },
});
