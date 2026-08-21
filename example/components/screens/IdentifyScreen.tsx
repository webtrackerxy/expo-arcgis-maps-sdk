import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type SingleTapEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Taps the map, then `identify`s features/graphics at the tapped point. */
export function IdentifyScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [info, setInfo] = useState('Tap a trailhead to identify…');

  async function onTap(event: SingleTapEventPayload) {
    const { latitude, longitude } = event.mapPoint;
    try {
      const results =
        (await mapRef.current?.identify({
          screenPoint: event.screenPoint,
          tolerance: 12,
          maximumResults: 5,
        })) ?? [];
      if (results.length === 0) {
        setInfo(`No features at ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        return;
      }
      const first = results[0];
      const name = first.attributes.TRL_NAME ?? first.attributes.name ?? JSON.stringify(first.attributes).slice(0, 48);
      setInfo(`${results.length} result(s) · ${first.sourceId}: ${String(name)}`);
    } catch {
      setInfo('identify failed');
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
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 100_000 },
          featureLayers: [{ id: 'trailheads', url: TRAILHEADS_URL }],
          // A client-side marker at the center — identifiable without network.
          graphics: [
            {
              id: 'pin',
              geometry: { type: 'point', point: SANTA_MONICA },
              symbol: { type: 'simpleMarker', color: '#d83933', size: 18 },
            },
          ],
        }}
        onSingleTap={({ nativeEvent }: { nativeEvent: SingleTapEventPayload }) => onTap(nativeEvent)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}
