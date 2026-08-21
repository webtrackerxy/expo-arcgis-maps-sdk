/**
 * Scene screens that build the base surface from an explicit local elevation
 * source, mirroring the official samples. Both provision the official Monterey
 * elevation data from its ArcGIS Online portal item and frame it with the
 * sample's own camera; the surface then shows real terrain relief.
 */
import { ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedFile, useProvisionedZip } from './provisioning';

// The camera both official samples use to frame the Monterey terrain.
const MONTEREY_CAMERA: Camera = {
  latitude: 36.525,
  longitude: -121.8,
  altitude: 300,
  heading: 180,
  pitch: 80,
};

/** `Add elevation source from raster` — a local `.dt2` DEM as the surface. */
export function RasterElevationScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedZip(
    '98092369c4ae4d549bbbd45dba993ebc',
    'monterey-elevation-raster',
    'MontereyElevation.dt2'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          elevationSources: [{ type: 'raster', path }],
          initialCamera: MONTEREY_CAMERA,
        }}
        onSceneLoad={() => setStatus('Scene loaded (raster elevation).')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Add elevation source from tile package` — a local `.tpkx` as the surface. */
export function TilePackageElevationScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedFile(
    '52ca74b4ba8042b78b3c653696f34a9c',
    'MontereyElevation.tpkx'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          elevationSources: [{ type: 'tilePackage', path }],
          initialCamera: MONTEREY_CAMERA,
        }}
        onSceneLoad={() => setStatus('Scene loaded (tile-package elevation).')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
