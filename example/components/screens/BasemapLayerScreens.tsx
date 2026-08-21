/**
 * Basemap-from-layer screens — a basemap built from a single base layer rather
 * than a named style: a tiled map service, and a vector tile layer with a custom
 * style loaded from a portal item.
 */
import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A tiled ArcGIS map service used directly as the basemap.
const WORLD_IMAGERY_TILED =
  'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer';
// The official "custom style" sample's vector tile layer portal item.
const CUSTOM_VTL_ITEM = 'f4b742a57af344988b02227e2824ca5f';

/** `Add tiled layer as basemap` — a tiled map service as the basemap. */
export function TiledBasemapScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading tiled basemap…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemapLayer: { type: 'tiled', url: WORLD_IMAGERY_TILED },
          initialViewpoint: { center: { latitude: 34.05, longitude: -118.24 }, scale: 600_000 },
        }}
        onMapLoad={() => setStatus('Basemap from a tiled map service.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Add vector tiled layer from custom style` — a custom-styled VTL basemap. */
export function VectorTiledCustomStyleScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading custom vector tile style…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemapLayer: { type: 'vectorTiled', itemId: CUSTOM_VTL_ITEM },
          initialViewpoint: { center: { latitude: 37.78, longitude: -122.42 }, scale: 500_000 },
        }}
        onMapLoad={() => setStatus('Basemap from a custom vector tile style.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
