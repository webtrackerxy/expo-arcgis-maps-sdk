/**
 * `Show line of sight analysis in map` — computes the line of sight between an
 * observer and a target against a local elevation raster (the official Monterey
 * DEM) via `computeLineOfSight`, then draws the visible (green) and obstructed
 * (red) portions as graphics on a 2D map.
 */
import { ArcgisMapView, computeLineOfSight, type GraphicSource } from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedZip } from './provisioning';

// Two points over the Monterey terrain covered by the DEM.
const OBSERVER = { latitude: 36.52, longitude: -121.82, altitude: 300 };
const TARGET = { latitude: 36.51, longitude: -121.775, altitude: 30 };

export function LineOfSightMapScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedZip(
    '98092369c4ae4d549bbbd45dba993ebc',
    'monterey-elevation-raster',
    'MontereyElevation.dt2'
  );
  const [graphics, setGraphics] = useState<GraphicSource[]>([]);

  useEffect(() => {
    if (!path) return;
    let active = true;
    (async () => {
      try {
        const result = await computeLineOfSight({
          observer: OBSERVER,
          target: TARGET,
          elevationRasterPath: path,
        });
        if (!active) return;
        const next: GraphicSource[] = [];
        if (result.visibleLine) {
          next.push({
            id: 'visible',
            geometry: result.visibleLine,
            symbol: { type: 'simpleLine', color: '#2f9e44', width: 3 },
          });
        }
        if (result.obstructedLine) {
          next.push({
            id: 'obstructed',
            geometry: result.obstructedLine,
            symbol: { type: 'simpleLine', style: 'dash', color: '#e03131', width: 3 },
          });
        }
        setGraphics(next);
        setStatus(`Target ${Math.round(result.targetVisibility * 100)}% visible.`);
      } catch (error) {
        if (active) setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
      }
    })();
    return () => {
      active = false;
    };
  }, [path, setStatus]);

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
          basemap: 'arcGISImagery',
          initialViewpoint: { center: { latitude: 36.515, longitude: -121.8 }, scale: 40_000 },
          graphics,
        }}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
