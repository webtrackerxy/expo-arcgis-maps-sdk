import {
  ArcgisMapView,
  type ArcgisGeometry,
  type ArcgisMapViewRef,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const resultFill = {
  type: 'simpleFill',
  color: '#2563EB44',
  outline: { type: 'simpleLine', color: '#1D4ED8', width: 2 },
} as const;
const resultLine = { type: 'simpleLine', color: '#1D4ED8', width: 3 } as const;

/**
 * Interactively draw a geometry with the geometry editor: pick a type, tap the
 * map to place vertices (snapping to the trailheads layer), then finish to get
 * the geometry back and draw it as a graphic.
 */
export function GeometryEditorScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<GraphicSource[]>([]);
  const [info, setInfo] = useState('Pick a geometry type, then tap the map to draw.');

  async function start(geometryType: 'polyline' | 'polygon') {
    setResult([]);
    try {
      await mapRef.current?.startGeometryEditor({ geometryType, tool: 'vertex', snapEnabled: true });
      setEditing(true);
      setInfo(`Drawing a ${geometryType}. Tap the map to add vertices, then Finish.`);
    } catch (error) {
      setInfo(`start failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function finish() {
    try {
      const geometry = (await mapRef.current?.stopGeometryEditor()) ?? null;
      setEditing(false);
      if (!geometry) {
        setInfo('Nothing drawn.');
        return;
      }
      setResult([
        {
          id: 'drawn',
          geometry: geometry as ArcgisGeometry,
          symbol: geometry.type === 'polyline' ? resultLine : resultFill,
        },
      ]);
      setInfo(`Finished — drew a ${geometry.type}.`);
    } catch (error) {
      setEditing(false);
      setInfo(`finish failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.buttons}>
        <Button title="Polyline" onPress={() => start('polyline')} disabled={editing} />
        <Button title="Polygon" onPress={() => start('polygon')} disabled={editing} />
        <Button title="Finish" onPress={finish} disabled={!editing} />
      </View>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 100_000 },
          featureLayers: [{ id: 'trailheads', url: TRAILHEADS_URL }],
          graphics: result,
        }}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
