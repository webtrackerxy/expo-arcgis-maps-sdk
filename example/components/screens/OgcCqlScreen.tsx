import { ArcgisMapView } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// Esri's public OGC API - Features demo service (Daraa, Syria).
const OGC_URL = 'https://demo.ldproxy.net/daraa';

/** Toggles a CQL2 filter on an OGC API - Features layer. */
export function OgcCqlScreen({ ready }: ScreenProps) {
  const [cql, setCql] = useState(true);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        <Button
          title={cql ? 'Clear CQL filter' : "Filter F_CODE = 'AP030'"}
          onPress={() => setCql((on) => !on)}
        />
        <Text style={styles.status}>{cql ? 'Roads only (CQL2)' : 'All transport features'}</Text>
      </View>
      <ArcgisMapView
        // Remount so the collection repopulates with/without the CQL filter.
        key={cql ? 'cql' : 'all'}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 32.62, longitude: 36.1 }, scale: 30_000 },
          layers: [
            {
              id: 'ogc',
              type: 'ogcFeature',
              url: OGC_URL,
              collectionId: 'TransportationGroundCrv',
              ...(cql ? { cqlFilter: "F_CODE = 'AP030'" } : {}),
            },
          ],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  status: { flex: 1, fontSize: 13, color: '#374151' },
});
