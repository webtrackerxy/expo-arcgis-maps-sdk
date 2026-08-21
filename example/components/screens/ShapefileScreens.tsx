/**
 * Screens that display a local shapefile, matching the official "Apply symbology
 * to shapefile" sample. The Aurora, CO shapefile ships in a `.zip` portal item,
 * provisioned via {@link useProvisionedZip}.
 */
import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedZip } from './provisioning';

// The Subdivisions shapefile covers Aurora, Colorado (matching the official sample).
const AURORA_VIEWPOINT = {
  center: { latitude: 39.69, longitude: -104.75 },
  scale: 200_000,
};

/** `Apply symbology to shapefile` — a yellow fill with a red outline over a local shapefile. */
export function ShapefileSymbologyScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedZip(
    'd98b3e5293834c5f852f13c569930caa',
    'aurora-shp',
    'Subdivisions.shp'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISStreets',
          initialViewpoint: AURORA_VIEWPOINT,
          layers: [
            {
              id: 'subdivisions',
              type: 'shapefile',
              path,
              renderer: {
                type: 'simple',
                symbol: {
                  type: 'simpleFill',
                  style: 'solid',
                  color: '#FFFF00',
                  outline: { type: 'simpleLine', style: 'solid', color: '#FF0000', width: 1 },
                },
              },
            },
          ],
        }}
        onMapLoad={() => setStatus('Shapefile loaded.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
