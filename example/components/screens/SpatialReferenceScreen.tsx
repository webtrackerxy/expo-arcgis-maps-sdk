import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// World Bonne — a pseudo-conic projection whose curved graticule makes the
// non-Web-Mercator reference obvious.
const WORLD_BONNE_WKID = 54024;
const WORLD_CITIES_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer';

/**
 * Set the map spatial reference ("Set spatial reference"): a basemap-less map is
 * created in the World Bonne projection (WKID 54024) and a map image layer is
 * reprojected into it, so the world draws with Bonne's curved shape rather than
 * Web Mercator. Toggle back to the default (Web Mercator) to compare.
 */
export function SpatialReferenceScreen({ ready }: ScreenProps) {
  const [bonne, setBonne] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button title={bonne ? 'Use Web Mercator' : 'Use World Bonne'} onPress={() => setBonne((b) => !b)} />
        <Text style={styles.status}>
          {bonne ? `Spatial reference: World Bonne (${WORLD_BONNE_WKID})` : 'Spatial reference: Web Mercator'}
        </Text>
      </View>
      <ArcgisMapView
        // Recreate the map when the reference changes (spatial reference is baked
        // in at creation).
        key={bonne ? 'bonne' : 'mercator'}
        style={screenStyles.fill}
        map={{
          ...(bonne
            ? { spatialReferenceWkid: WORLD_BONNE_WKID }
            : { basemap: 'arcGISLightGray' }),
          layers: [{ id: 'cities', type: 'mapImage', url: WORLD_CITIES_URL }],
          initialViewpoint: { center: { latitude: 20, longitude: 0 }, scale: 300_000_000 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  status: { flex: 1, fontSize: 12, color: '#374151' },
});
