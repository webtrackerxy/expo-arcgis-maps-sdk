import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const START: GeographicPoint = { latitude: 48.8566, longitude: 2.3522 }; // Paris
const OVERVIEW_FACTOR = 20;

/**
 * A simple overview map ("Display overview map"): a small inset map in the
 * corner follows the main map's viewpoint (via `onViewpointChange` driving the
 * inset's `setViewpoint`), zoomed further out with a marker at the main map's
 * center. Built purely by composing two `ArcgisMapView`s — no native change.
 */
export function OverviewMapScreen({ ready }: ScreenProps) {
  const insetRef = useRef<ArcgisMapViewRef>(null);
  const [center, setCenter] = useState<GeographicPoint>(START);
  const [scale, setScale] = useState(100_000);

  const marker: GraphicSource = {
    id: 'here',
    geometry: { type: 'point', point: center },
    symbol: { type: 'simpleMarker', color: '#DC2626', size: 10, style: 'circle' },
  };

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ basemap: 'arcGISTopographic', initialViewpoint: { center: START, scale: 100_000 } }}
        onViewpointChange={({ nativeEvent }) => {
          setCenter(nativeEvent.center);
          setScale(nativeEvent.scale);
          insetRef.current
            ?.setViewpoint({ center: nativeEvent.center, scale: nativeEvent.scale * OVERVIEW_FACTOR })
            .catch(() => undefined);
        }}
      />
      <View style={styles.inset}>
        <ArcgisMapView
          ref={insetRef}
          style={screenStyles.fill}
          interactionEnabled={false}
          map={{
            basemap: 'arcGISLightGray',
            initialViewpoint: { center: START, scale: 100_000 * OVERVIEW_FACTOR },
            graphics: [marker],
          }}
        />
      </View>
      <Text style={styles.badge}>Overview · 1:{Math.round(scale * OVERVIEW_FACTOR).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inset: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 130,
    height: 130,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#111827',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 16,
    backgroundColor: '#111827CC',
    color: '#fff',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
