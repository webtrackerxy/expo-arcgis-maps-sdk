/**
 * `Animate 3D graphic` — moves a graphic through the scene over time. A marker
 * orbits a fixed centre at a constant altitude; JS advances the angle on an
 * interval and updates the graphic's geometry, which the native view reconciles
 * by id (so only the moved graphic is updated, not the whole overlay).
 */
import { ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const CENTER = { latitude: 36.6, longitude: -118.29 }; // Mount Whitney, Sierra Nevada.
const RADIUS_DEG = 0.03;
const ALTITUDE = 4200;
const CAMERA: Camera = {
  latitude: 36.52,
  longitude: -118.29,
  altitude: 9000,
  heading: 0,
  pitch: 65,
};

export function AnimateGraphicScreen({ ready }: ScreenProps) {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    // ~15 fps orbit; the graphic is reconciled by id each tick.
    const timer = setInterval(() => setAngle((a) => (a + 4) % 360), 66);
    return () => clearInterval(timer);
  }, []);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  const rad = (angle * Math.PI) / 180;
  const point = {
    latitude: CENTER.latitude + RADIUS_DEG * Math.cos(rad),
    longitude: CENTER.longitude + RADIUS_DEG * Math.sin(rad),
    altitude: ALTITUDE,
  };
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          initialCamera: CAMERA,
          graphicsOverlays: [
            {
              id: 'orbit',
              surfacePlacement: 'absolute',
              graphics: [
                {
                  id: 'mover',
                  geometry: { type: 'point', point },
                  symbol: {
                    type: 'simpleMarkerScene',
                    style: 'cone',
                    color: '#E4572E',
                    height: 400,
                    width: 200,
                    depth: 200,
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
