/**
 * `Filter features in scene` — restricts which features of a 3D scene layer are
 * drawn to a polygon region. Loads the San Francisco buildings scene layer (the
 * official sample's data) and applies a `disjoint` polygon filter over a
 * downtown block, so the buildings inside that block are hidden.
 */
import { ArcgisSceneView, type Camera, type GeographicPoint } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const SF_BUILDINGS =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer';

const CAMERA: Camera = {
  latitude: 37.789,
  longitude: -122.4,
  altitude: 750,
  heading: 20,
  pitch: 65,
};

// A downtown block; buildings inside are removed by the `disjoint` filter.
const HOLE: GeographicPoint[] = [
  { latitude: 37.7955, longitude: -122.4035 },
  { latitude: 37.7955, longitude: -122.3975 },
  { latitude: 37.792, longitude: -122.3975 },
  { latitude: 37.792, longitude: -122.4035 },
];

export function FilterFeaturesScreen({ ready }: ScreenProps) {
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
          sceneLayers: [
            {
              id: 'sf-buildings',
              type: 'scene',
              url: SF_BUILDINGS,
              polygonFilter: { polygons: [HOLE], spatialRelationship: 'disjoint' },
            },
          ],
        }}
      />
    </View>
  );
}
