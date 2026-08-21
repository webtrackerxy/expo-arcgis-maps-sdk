/**
 * Augmented-reality screens — the toolkit's three AR scene views (world-scale,
 * tabletop, flyover) exposed through {@link ArcgisArView}. AR needs ARKit / a
 * physical iPhone (it does not run in the iOS Simulator) or an ARCore device /
 * emulator, so these are gated with {@link isArSupported}: on an incapable
 * device they show a notice instead of the camera view.
 *
 * Scene data mirrors the official ArcGIS Maps SDK Toolkit AR examples.
 */
import {
  ArcgisArView,
  isArSupported,
  type ArcgisArViewRef,
  type ArTrackingState,
  type GraphicSource,
  type SceneGraphicsOverlay,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Portland, OR — the official tabletop example's building-shells anchor.
const PORTLAND = { latitude: 45.53257485106716, longitude: -122.68350326165559 };
const BUILDINGS_SCENE_LAYER =
  'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/DevA_BuildingShells/SceneServer';
// Rotterdam — the official flyover example's web scene + start location.
const FLYOVER_WEB_SCENE = '7558ee942b2547019f66885c44d4f0b1';
const ROTTERDAM = { latitude: 51.9244, longitude: 4.4777, altitude: 1000 };

/** Shared chrome: a status line plus an AR-unsupported notice. */
function useArSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    isArSupported()
      .then((result) => active && setSupported(result.supported))
      .catch(() => active && setSupported(false));
    return () => {
      active = false;
    };
  }, []);
  return supported;
}

/** Human-readable label for a tracking-state event. */
function trackingLabel(state: ArTrackingState): string {
  switch (state) {
    case 'tracking':
      return 'Tracking';
    case 'initializing':
      return 'Initializing…';
    case 'paused':
      return 'Paused';
    default:
      return 'Unavailable';
  }
}

/** `Augment reality to show tabletop scene` — buildings on a detected surface. */
export function ArTabletopScreen({ ready }: ScreenProps) {
  const supported = useArSupport();
  const [status, setStatus] = useState('Point the camera at a flat surface.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (supported === false) {
    return <Centered text="Augmented reality is not available on this device." />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisArView
        style={screenStyles.fill}
        mode="tabletop"
        anchor={PORTLAND}
        translationFactor={1000}
        clippingDistanceMeters={400}
        scene={{
          basemap: 'arcGISImagery',
          elevationEnabled: true,
          sceneLayers: [{ id: 'buildings', type: 'scene', url: BUILDINGS_SCENE_LAYER }],
        }}
        onTrackingStateChange={(e) => setStatus(trackingLabel(e.nativeEvent.state))}
        onArError={(e) => setStatus(`AR error: ${e.nativeEvent.code}`)}
      />
      <StatusBar text={status} />
    </View>
  );
}

/** `Augment reality to fly over scene` — a motion-driven fly-through of Rotterdam. */
export function ArFlyoverScreen({ ready }: ScreenProps) {
  const supported = useArSupport();
  const [status, setStatus] = useState('Move the device to fly over the scene.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (supported === false) {
    return <Centered text="Augmented reality is not available on this device." />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisArView
        style={screenStyles.fill}
        mode="flyover"
        initialCamera={ROTTERDAM}
        translationFactor={1000}
        scene={{ webSceneItemId: FLYOVER_WEB_SCENE }}
        onTrackingStateChange={(e) => setStatus(trackingLabel(e.nativeEvent.state))}
        onArError={(e) => setStatus(`AR error: ${e.nativeEvent.code}`)}
      />
      <StatusBar text={status} />
    </View>
  );
}

/** `Augment reality to collect data` — tap the world to drop a collected point. */
export function ArCollectScreen({ ready }: ScreenProps) {
  const supported = useArSupport();
  const [graphics, setGraphics] = useState<GraphicSource[]>([]);
  const [status, setStatus] = useState('Tap the ground to collect a point.');

  const overlay: SceneGraphicsOverlay = {
    id: 'collected',
    surfacePlacement: 'relative',
    graphics,
  };

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (supported === false) {
    return <Centered text="Augmented reality is not available on this device." />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisArView
        style={screenStyles.fill}
        mode="worldScale"
        scene={{ basemap: 'arcGISImagery', elevationEnabled: true, graphicsOverlays: [overlay] }}
        onSingleTap={(e) => {
          const point = e.nativeEvent.mapPoint;
          if (!point) return;
          setGraphics((prev) => [
            ...prev,
            {
              id: `pt-${prev.length}`,
              geometry: { type: 'point', point: { ...point, altitude: 1 } },
              symbol: {
                type: 'simpleMarkerScene',
                style: 'sphere',
                color: '#E4572E',
                height: 0.5,
                width: 0.5,
                depth: 0.5,
              },
            },
          ]);
          setStatus(`Collected ${graphics.length + 1} point(s).`);
        }}
        onTrackingStateChange={(e) => setStatus(trackingLabel(e.nativeEvent.state))}
        onArError={(e) => setStatus(`AR error: ${e.nativeEvent.code}`)}
      />
      <StatusBar text={status} />
    </View>
  );
}

/** `Augment reality to navigate route` — a route line overlaid on the world. */
export function ArNavigateScreen({ ready }: ScreenProps) {
  const supported = useArSupport();
  const [status, setStatus] = useState('Follow the route line ahead of you.');

  // A short demo route near the device's default location, drawn just above the
  // surface so it reads as an on-the-ground navigation line.
  const routeOverlay: SceneGraphicsOverlay = {
    id: 'route',
    surfacePlacement: 'relative',
    graphics: [
      {
        id: 'route-line',
        geometry: {
          type: 'polyline',
          path: [
            { latitude: 34.056, longitude: -117.195, altitude: 1 },
            { latitude: 34.057, longitude: -117.194, altitude: 1 },
            { latitude: 34.058, longitude: -117.1925, altitude: 1 },
          ],
        },
        symbol: { type: 'simpleLine', color: '#2F7D6E', width: 4 },
      },
    ],
  };

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (supported === false) {
    return <Centered text="Augmented reality is not available on this device." />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisArView
        style={screenStyles.fill}
        mode="worldScale"
        scene={{ basemap: 'arcGISImagery', elevationEnabled: true, graphicsOverlays: [routeOverlay] }}
        onTrackingStateChange={(e) => setStatus(trackingLabel(e.nativeEvent.state))}
        onArError={(e) => setStatus(`AR error: ${e.nativeEvent.code}`)}
      />
      <StatusBar text={status} />
    </View>
  );
}

/** `Augment reality to show hidden infrastructure` — a pipe drawn below ground. */
export function ArHiddenInfrastructureScreen({ ready }: ScreenProps) {
  const supported = useArSupport();
  const ref = useRef<ArcgisArViewRef>(null);
  const [status, setStatus] = useState('Look down to see the buried pipe.');

  // A buried utility line: absolute placement at negative altitude puts it below
  // the surface, so world-scale AR shows the "hidden" infrastructure underfoot.
  const pipeOverlay: SceneGraphicsOverlay = {
    id: 'pipe',
    surfacePlacement: 'absolute',
    graphics: [
      {
        id: 'pipe-line',
        geometry: {
          type: 'polyline',
          path: [
            { latitude: 34.056, longitude: -117.195, altitude: -2 },
            { latitude: 34.057, longitude: -117.1945, altitude: -2 },
          ],
        },
        symbol: { type: 'simpleLine', color: '#F3A712', width: 6 },
      },
    ],
  };

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (supported === false) {
    return <Centered text="Augmented reality is not available on this device." />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisArView
        ref={ref}
        style={screenStyles.fill}
        mode="worldScale"
        trackingMode="geo"
        scene={{
          basemap: 'arcGISImagery',
          elevationEnabled: true,
          surfaceNavigationConstraint: 'none',
          graphicsOverlays: [pipeOverlay],
        }}
        onTrackingStateChange={(e) => setStatus(trackingLabel(e.nativeEvent.state))}
        onArError={(e) => setStatus(`AR error: ${e.nativeEvent.code}`)}
      />
      <View style={styles.bar}>
        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              const camera = await ref.current?.getCurrentCamera();
              setStatus(
                camera
                  ? `Camera: ${camera.latitude.toFixed(4)}, ${camera.longitude.toFixed(4)}`
                  : 'No camera yet.'
              );
            } catch (error) {
              setStatus(`getCurrentCamera failed: ${(error as { code?: string }).code ?? 'error'}`);
            }
          }}
        >
          <Text style={styles.buttonText}>Where am I?</Text>
        </Pressable>
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

function StatusBar({ text }: { text: string }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.status}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: { backgroundColor: '#2f7d6e', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  status: { flex: 1, fontSize: 13, color: '#111827' },
});
