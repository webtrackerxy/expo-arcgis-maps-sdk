/**
 * `Set surface placement mode` — draws the same marker at the same altitude
 * under each {@link SurfacePlacement} mode so their vertical placement can be
 * compared: `drapedFlat`/`drapedBillboarded` sit on the terrain, `relative`
 * floats above the surface, and `absolute` floats at a fixed height above sea
 * level. Each mode is a separate graphics overlay (placement is per-overlay).
 */
import { ArcgisSceneView, type Camera, type SurfacePlacement } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A mountainous location (the Alps near Zermatt) so terrain relief makes the
// draped vs. relative vs. absolute placement visibly different.
const CENTER = { latitude: 46.0, longitude: 7.75 };
const CAMERA: Camera = {
  latitude: 45.99,
  longitude: 7.75,
  altitude: 3200,
  heading: 0,
  pitch: 75,
};

const MODES: { placement: SurfacePlacement; color: string }[] = [
  { placement: 'drapedBillboarded', color: '#E4572E' },
  { placement: 'drapedFlat', color: '#F3A712' },
  { placement: 'relative', color: '#2F7D6E' },
  { placement: 'absolute', color: '#3D5A80' },
];

export function SurfacePlacementScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          initialCamera: CAMERA,
          // One overlay per placement mode, each a sphere at the same location
          // and altitude (2500 m) — the mode decides where the sphere ends up.
          graphicsOverlays: MODES.map(({ placement, color }, i) => ({
            id: `placement-${placement}`,
            surfacePlacement: placement,
            graphics: [
              {
                id: `marker-${placement}`,
                geometry: {
                  type: 'point',
                  point: {
                    latitude: CENTER.latitude,
                    longitude: CENTER.longitude + 0.004 * i,
                    altitude: 2500,
                  },
                },
                symbol: {
                  type: 'simpleMarkerScene',
                  style: 'sphere',
                  color,
                  height: 120,
                  width: 120,
                  depth: 120,
                },
              },
            ],
          })),
        }}
      />
    </View>
  );
}
