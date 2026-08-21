/**
 * `Style point with distance composite scene symbol` — a point whose 3D marker
 * swaps by camera distance: a large red cone up close, an orange sphere at mid
 * range, and a small blue cube far away. Pinch-zoom the scene to move the camera
 * in and out and watch the marker change.
 */
import { ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const POINT = { latitude: 40.0, longitude: -105.0, altitude: 1700 }; // Front Range, CO.
const CAMERA: Camera = {
  latitude: 39.98,
  longitude: -105.0,
  altitude: 3500,
  heading: 0,
  pitch: 70,
};

export function DistanceCompositeScreen({ ready }: ScreenProps) {
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
          graphicsOverlays: [
            {
              id: 'distance-composite',
              surfacePlacement: 'absolute',
              graphics: [
                {
                  id: 'marker',
                  geometry: { type: 'point', point: POINT },
                  symbol: {
                    type: 'distanceCompositeScene',
                    ranges: [
                      {
                        symbol: {
                          type: 'simpleMarkerScene',
                          style: 'cone',
                          color: '#E4572E',
                          height: 700,
                          width: 400,
                          depth: 400,
                        },
                        minDistance: 0,
                        maxDistance: 2000,
                      },
                      {
                        symbol: {
                          type: 'simpleMarkerScene',
                          style: 'sphere',
                          color: '#F3A712',
                          height: 500,
                          width: 500,
                          depth: 500,
                        },
                        minDistance: 2000,
                        maxDistance: 8000,
                      },
                      {
                        symbol: {
                          type: 'simpleMarkerScene',
                          style: 'cube',
                          color: '#3D5A80',
                          height: 400,
                          width: 400,
                          depth: 400,
                        },
                        minDistance: 8000,
                        maxDistance: 40000,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }}
      />
    </View>
  );
}
