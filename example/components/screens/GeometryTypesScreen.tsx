import { ArcgisMapView } from 'expo-arcgis-maps-sdk';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Styles all three geometry types at once — a marker (point), a line (polyline),
 * and a filled area (polygon) — each with a distinct simple symbol.
 */
export function GeometryTypesScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  const { latitude, longitude } = SANTA_MONICA;
  return (
    <ArcgisMapView
      style={screenStyles.fill}
      map={{
        basemap: 'arcGISTopographic',
        initialViewpoint: { center: SANTA_MONICA, scale: 120_000 },
        graphics: [
          {
            id: 'point',
            geometry: { type: 'point', point: SANTA_MONICA },
            symbol: { type: 'simpleMarker', color: '#DC2626', size: 16, style: 'diamond' },
          },
          {
            id: 'line',
            geometry: {
              type: 'polyline',
              path: [
                { latitude: latitude + 0.03, longitude: longitude - 0.05 },
                { latitude: latitude + 0.01, longitude: longitude + 0.02 },
                { latitude: latitude + 0.04, longitude: longitude + 0.06 },
              ],
            },
            symbol: { type: 'simpleLine', color: '#2563EB', width: 4, style: 'dash' },
          },
          {
            id: 'polygon',
            geometry: {
              type: 'polygon',
              ring: [
                { latitude: latitude - 0.02, longitude: longitude - 0.05 },
                { latitude: latitude - 0.05, longitude: longitude - 0.03 },
                { latitude: latitude - 0.05, longitude: longitude + 0.03 },
                { latitude: latitude - 0.02, longitude: longitude + 0.05 },
              ],
            },
            symbol: {
              type: 'simpleFill',
              color: '#16A34A55',
              outline: { type: 'simpleLine', color: '#166534', width: 2 },
            },
          },
        ],
      }}
    />
  );
}
