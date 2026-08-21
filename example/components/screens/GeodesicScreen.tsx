import {
  ArcgisMapView,
  geodesicPath,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const TOKYO: GeographicPoint = { latitude: 35.68, longitude: 139.77 };

const endpoint = (id: string, point: GeographicPoint): GraphicSource => ({
  id,
  geometry: { type: 'point', point },
  symbol: { type: 'simpleMarker', color: '#DC2626', size: 12, style: 'circle' },
});

/**
 * Show the geodesic path between two points ("Show geodesic path between two
 * points"): `geodesicPath` returns the great-circle route (a curved polyline on
 * a Web Mercator map) between London and Tokyo, versus the straight screen line.
 */
export function GeodesicScreen({ ready }: ScreenProps) {
  const [graphics, setGraphics] = useState<GraphicSource[]>([endpoint('a', LONDON), endpoint('b', TOKYO)]);
  const [status, setStatus] = useState('Computing geodesic path…');

  useEffect(() => {
    if (!ready) return;
    geodesicPath(LONDON, TOKYO)
      .then((path) => {
        setGraphics([
          endpoint('a', LONDON),
          endpoint('b', TOKYO),
          { id: 'geodesic', geometry: path, symbol: { type: 'simpleLine', color: '#2563EB', width: 3 } },
          {
            id: 'straight',
            geometry: { type: 'polyline', path: [LONDON, TOKYO] },
            symbol: { type: 'simpleLine', color: '#9CA3AF', width: 2, style: 'dash' },
          },
        ]);
        setStatus('Blue: geodesic (great-circle). Grey dashes: straight line.');
      })
      .catch((e) => setStatus((e as { message?: string })?.message ?? String(e)));
  }, [ready]);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <Text style={styles.status}>{status}</Text>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 55, longitude: 65 }, scale: 120_000_000 },
          graphics,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  status: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#374151' },
});
