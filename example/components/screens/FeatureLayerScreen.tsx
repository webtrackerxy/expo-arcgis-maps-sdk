import { ArcgisMapView, type MapLoadEventPayload } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Renders a basemap with an ArcGIS feature service layer (reconciled by id). */
export function FeatureLayerScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 120_000 },
          featureLayers: [{ id: 'trailheads', url: TRAILHEADS_URL }],
        }}
        onMapLoad={({ nativeEvent }: { nativeEvent: MapLoadEventPayload }) =>
          setStatus(`Map loaded (WKID ${nativeEvent.spatialReferenceWkid}); trailheads layer added`)
        }
        onMapError={({ nativeEvent }) => setStatus(`Error ${nativeEvent.code}: ${nativeEvent.message}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
