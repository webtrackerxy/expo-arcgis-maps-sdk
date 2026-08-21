/**
 * `Apply class breaks renderer to sublayer` — applies a class-breaks renderer to
 * one sublayer (Counties) of the Census dynamic map image service, colouring
 * counties by population (matches the official sample's data and field).
 */
import { ArcgisMapView, type ArcgisColor } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const CENSUS_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer';

/** A graduated fill symbol for one population class break. */
function fill(color: ArcgisColor) {
  return {
    type: 'simpleFill' as const,
    style: 'solid' as const,
    color,
    outline: {
      type: 'simpleLine' as const,
      style: 'solid' as const,
      color: '#80808080',
      width: 0.5,
    },
  };
}

/** `Apply class breaks renderer to sublayer` — colour counties by population. */
export function SublayerClassBreaksScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -96 }, scale: 70_000_000 },
          layers: [
            {
              id: 'census',
              type: 'mapImage',
              url: CENSUS_URL,
              // Sublayer 2 is Counties; colour them by 2007 population.
              sublayerRenderers: [
                {
                  sublayerId: 2,
                  renderer: {
                    type: 'classBreaks',
                    field: 'POP2007',
                    classBreaks: [
                      { minValue: -99, maxValue: 8_560, symbol: fill('#FFFFB2'), label: '< 8.6k' },
                      { minValue: 8_561, maxValue: 18_109, symbol: fill('#FECC5C'), label: '8.6k–18k' },
                      { minValue: 18_110, maxValue: 35_501, symbol: fill('#FD8D3C'), label: '18k–36k' },
                      { minValue: 35_502, maxValue: 86_100, symbol: fill('#F03B20'), label: '36k–86k' },
                      { minValue: 86_101, maxValue: 10_110_975, symbol: fill('#BD0026'), label: '> 86k' },
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
