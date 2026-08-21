import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type GeographicPoint,
  type NavigationStatusEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, View, Text } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const STOP_A: GeographicPoint = { latitude: 34.056, longitude: -118.237 };
const STOP_B: GeographicPoint = { latitude: 34.14, longitude: -118.29 };

/**
 * Turn-by-turn navigation: solves a route and drives the map's location display
 * along it from a simulated location, showing the live maneuver and remaining
 * distance/time from `onNavigationStatus`. `reroute` toggles automatic
 * re-solving when the tracked location leaves the route.
 */
function NavigationDemo({ ready, reroute }: ScreenProps & { reroute: boolean }) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [navigating, setNavigating] = useState(false);
  const [status, setStatus] = useState('Tap “Start” to begin navigation.');

  async function start() {
    setStatus('Solving route…');
    try {
      await mapRef.current?.startNavigation([STOP_A, STOP_B], { reroute });
      setNavigating(true);
    } catch (error) {
      setStatus(`start failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function stop() {
    try {
      await mapRef.current?.stopNavigation();
    } finally {
      setNavigating(false);
      setStatus('Stopped.');
    }
  }

  function onNav(e: NavigationStatusEventPayload) {
    const km = (e.distanceRemainingMeters / 1000).toFixed(1);
    const min = Math.round(e.timeRemainingMinutes);
    setStatus(
      `${e.maneuver || 'Proceed'} · ${km} km, ${min} min left${e.isOnRoute ? '' : ' (off route)'}`
    );
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="Start" onPress={start} disabled={navigating} />
        <Button title="Stop" onPress={stop} disabled={!navigating} />
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{ basemap: 'arcGISNavigation', initialViewpoint: { center: STOP_A, scale: 100_000 } }}
        onNavigationStatus={({ nativeEvent }: { nativeEvent: NavigationStatusEventPayload }) =>
          onNav(nativeEvent)
        }
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Navigate route` — turn-by-turn navigation along a solved route. */
export function NavigateRouteScreen(props: ScreenProps) {
  return <NavigationDemo {...props} reroute={false} />;
}

/**
 * `Navigate route with rerouting` — as above, with automatic rerouting enabled.
 * The online route service reports rerouting as unsupported (a stable
 * `E_UNSUPPORTED`); it works with an offline transportation-network dataset.
 */
export function NavigateRerouteScreen(props: ScreenProps) {
  return <NavigationDemo {...props} reroute />;
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
