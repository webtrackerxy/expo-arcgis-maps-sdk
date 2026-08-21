import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { EDITABLE_LAYER_URL, SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Exercises the ref's `applyEdits` against an editable sample service. Success
 * requires a key/token with editing privileges; otherwise the service rejects
 * the edit and we surface the stable error code.
 */
export function EditScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [info, setInfo] = useState('Tap “Add feature” to push an edit to the service.');
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  async function addFeature() {
    try {
      const result = await mapRef.current?.applyEdits({
        layerId: 'damage',
        adds: [{ attributes: { typdamage: 'Minor' }, point: SANTA_MONICA }],
      });
      const added = result?.addedObjectIds ?? [];
      setLastAddedId(added[0] ?? null);
      setInfo(`Added ${added.length} feature(s)${added[0] ? ` · OBJECTID ${added[0]}` : ''}.`);
    } catch (error) {
      setInfo(`add failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function deleteFeature() {
    if (lastAddedId === null) {
      setInfo('Add a feature first, then delete it.');
      return;
    }
    try {
      const result = await mapRef.current?.applyEdits({
        layerId: 'damage',
        deleteObjectIds: [lastAddedId],
      });
      setInfo(`Deleted ${result?.deletedCount ?? 0} feature(s).`);
      setLastAddedId(null);
    } catch (error) {
      setInfo(`delete failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="Add feature" onPress={addFeature} />
        <Button title="Delete last" onPress={deleteFeature} />
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 120_000 },
          featureLayers: [{ id: 'damage', url: EDITABLE_LAYER_URL }],
        }}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
