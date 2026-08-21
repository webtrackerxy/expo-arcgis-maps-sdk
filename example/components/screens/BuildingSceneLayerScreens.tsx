/**
 * Building scene layer screens — display a BIM building scene layer, and apply a
 * solid building filter to it. Uses the official Redlands administration
 * building scene layer.
 */
import { ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const BUILDING_SCENE_LAYER =
  'https://tiles.arcgis.com/tiles/ZQgQTuoyBrtmoGdP/arcgis/rest/services/Redlands_Admin_Building_2020/SceneServer';
// Framed on the Redlands administration building.
const CAMERA: Camera = { latitude: 34.0503, longitude: -117.1948, altitude: 250, heading: 343, pitch: 64 };

/** `Add building scene layer` — a BIM building scene layer in a local scene. */
export function BuildingSceneLayerScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading building scene layer…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISTopographic',
          viewingMode: 'local',
          elevationEnabled: true,
          initialCamera: CAMERA,
          sceneLayers: [{ id: 'building', type: 'building', url: BUILDING_SCENE_LAYER }],
        }}
        onSceneLoad={() => setStatus('Building scene layer loaded.')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Filter building scene layer` — show only a chosen floor via a solid filter. */
export function FilterBuildingSceneLayerScreen({ ready }: ScreenProps) {
  const [level, setLevel] = useState<number | null>(null);
  const [status, setStatus] = useState('Whole building. Pick a level to filter.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISTopographic',
          viewingMode: 'local',
          elevationEnabled: true,
          initialCamera: CAMERA,
          sceneLayers: [
            {
              id: 'building',
              type: 'building',
              url: BUILDING_SCENE_LAYER,
              // A solid building filter: only the parts matching the where clause draw.
              ...(level !== null ? { buildingFilterExpression: `BldgLevel = ${level}` } : {}),
            },
          ],
        }}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <View style={styles.bar}>
        {[null, 1, 2, 3].map((lvl) => (
          <Pressable
            key={String(lvl)}
            style={[styles.chip, level === lvl && styles.chipOn]}
            onPress={() => {
              setLevel(lvl);
              setStatus(lvl === null ? 'Whole building.' : `Filtered to level ${lvl}.`);
            }}
          >
            <Text style={styles.chipText}>{lvl === null ? 'All' : `Lvl ${lvl}`}</Text>
          </Pressable>
        ))}
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  chip: { backgroundColor: '#eef2f0', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  chipOn: { backgroundColor: '#2f7d6e' },
  chipText: { color: '#111827', fontWeight: '600' },
  status: { flex: 1, fontSize: 12, color: '#111827' },
});
