/**
 * `Match viewpoint of geo views` — keeps a 2D map and a 3D scene framed on the
 * same place. Panning/zooming the map (top) emits `onViewpointChange`, which
 * drives the scene's camera (bottom) to the same centre, with an altitude
 * derived from the map scale.
 *
 * This mirrors the official sample's map→scene direction. Driving the map from
 * the scene would need a scene camera-change event, which the scene view does
 * not yet emit, so the sync here is one-way.
 */
import {
  ArcgisMapView,
  ArcgisSceneView,
  type ArcgisSceneViewRef,
  type ViewpointChangeEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef } from 'react';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const START = { latitude: 45.4408, longitude: 12.3155 }; // Venice.

export function MatchViewpointScreen({ ready }: ScreenProps) {
  const sceneRef = useRef<ArcgisSceneViewRef>(null);

  function onViewpointChange({ center, scale }: ViewpointChangeEventPayload) {
    // Camera altitude scales with the map's scale denominator so zooming the map
    // pulls the scene camera in and out too.
    const altitude = Math.max(800, scale * 0.5);
    sceneRef.current
      ?.setCamera({ latitude: center.latitude, longitude: center.longitude, altitude, pitch: 65 })
      .catch(() => {});
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={styles.half}
        map={{ basemap: 'arcGISImagery', initialViewpoint: { center: START, scale: 25_000 } }}
        onViewpointChange={({ nativeEvent }) => onViewpointChange(nativeEvent)}
      />
      <ArcgisSceneView
        ref={sceneRef}
        style={styles.half}
        scene={{
          basemap: 'arcGISImagery',
          initialCamera: { latitude: START.latitude, longitude: START.longitude, altitude: 12500, pitch: 65 },
        }}
      />
    </View>
  );
}

const styles = { half: { flex: 1 } };
