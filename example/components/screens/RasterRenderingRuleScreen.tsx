/**
 * `Apply raster rendering rule` — requests a named server-side rendering rule
 * from an image service (the official sample's CharlotteLAS elevation service),
 * so the service returns a pre-processed image (here, a hillshade).
 */
import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const CHARLOTTE_LAS =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer';

/** `Apply raster rendering rule` — a server-side hillshade rule on the CharlotteLAS service. */
export function RasterRenderingRuleScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 35.22, longitude: -80.84 }, scale: 40_000 },
          // The service advertises RFTHillshade / RFTAspectColor / RFTShadedRelief…; request the hillshade.
          layers: [{ id: 'charlotte-rule', type: 'raster', url: CHARLOTTE_LAS, renderingRule: 'RFTHillshade' }],
        }}
      />
    </View>
  );
}
