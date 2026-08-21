/**
 * `Apply function to raster from service` — applies a hillshade raster-function
 * chain to an image-service raster (the official sample's NLCD land-cover
 * service), producing shaded relief on the fly.
 */
import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const NLCD_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer';

// The official sample's raster-function chain: a hillshade over the service raster.
const HILLSHADE_FUNCTION = JSON.stringify({
  raster_function_arguments: {
    z_factor: { double: 25.0, type: 'Raster_function_variable' },
    slope_type: { raster_slope_type: 'none', type: 'Raster_function_variable' },
    azimuth: { double: 315, type: 'Raster_function_variable' },
    altitude: { double: 45, type: 'Raster_function_variable' },
    type: 'Raster_function_arguments',
    raster: { name: 'raster', is_raster: true, type: 'Raster_function_variable' },
    nbits: { int: 8, type: 'Raster_function_variable' },
  },
  raster_function: { type: 'Hillshade_function' },
  type: 'Raster_function_template',
});

// `Apply map algebra` — a raster-function chain that does arithmetic on the
// service raster (here, an Arithmetic function scaling the land-cover values).
// Map algebra rides the same `rasterFunction` binding as the hillshade above.
const MAP_ALGEBRA_FUNCTION = JSON.stringify({
  raster_function_arguments: {
    raster: { name: 'raster', is_raster: true, type: 'Raster_function_variable' },
    raster2: { double: 256.0, type: 'Raster_function_variable' },
    // ArithmeticFunction operation 3 = Multiply (1 Plus, 2 Minus, 3 Multiply, 4 Divide).
    operation: 3,
    type: 'Raster_function_arguments',
  },
  raster_function: { type: 'Arithmetic_function' },
  type: 'Raster_function_template',
});

/** `Apply map algebra` — an arithmetic raster-function chain on a service raster. */
export function MapAlgebraScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 43.7, longitude: -114.5 }, scale: 3_000_000 },
          layers: [{ id: 'nlcd-algebra', type: 'raster', url: NLCD_URL, rasterFunction: MAP_ALGEBRA_FUNCTION }],
        }}
      />
    </View>
  );
}

/** `Apply function to raster from service` — a hillshade raster function on a service raster. */
export function RasterFunctionServiceScreen({ ready }: ScreenProps) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 43.7, longitude: -114.5 }, scale: 3_000_000 },
          layers: [{ id: 'nlcd-hillshade', type: 'raster', url: NLCD_URL, rasterFunction: HILLSHADE_FUNCTION }],
        }}
      />
    </View>
  );
}
