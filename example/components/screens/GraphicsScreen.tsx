import { ArcgisMapView, type MapLoadEventPayload } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Renders point / polyline / polygon graphics with simple symbols. */
export function GraphicsScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading…');

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: LONDON, scale: 40_000 },
          graphics: [
            {
              id: 'poly',
              geometry: {
                type: 'polygon',
                ring: [
                  { latitude: 51.5011, longitude: -0.1391 },
                  { latitude: 51.5141, longitude: -0.1391 },
                  { latitude: 51.5141, longitude: -0.1171 },
                  { latitude: 51.5011, longitude: -0.1171 },
                ],
              },
              symbol: {
                type: 'simpleFill',
                color: '#12965940',
                outline: { type: 'simpleLine', color: '#129659', width: 2 },
              },
            },
            {
              id: 'line',
              geometry: {
                type: 'polyline',
                path: [
                  { latitude: 51.4991, longitude: -0.1451 },
                  { latitude: 51.5091, longitude: -0.1221 },
                  { latitude: 51.5161, longitude: -0.1321 },
                ],
              },
              symbol: { type: 'simpleLine', color: '#005ea2', width: 3, style: 'dash' },
            },
            {
              id: 'pt',
              geometry: { type: 'point', point: LONDON },
              symbol: { type: 'simpleMarker', color: '#d83933', size: 14, style: 'circle' },
            },
            {
              // Multilayer polyline: a wide dark casing under a thin white center line.
              id: 'multiline',
              geometry: {
                type: 'polyline',
                path: [
                  { latitude: 51.5031, longitude: -0.1451 },
                  { latitude: 51.5031, longitude: -0.1171 },
                ],
              },
              symbol: {
                type: 'multilayerPolyline',
                strokeLayers: [
                  { color: '#1b1b1b', widthPoints: 10 },
                  { color: '#ffffff', widthPoints: 3 },
                ],
              },
            },
          ],
        }}
        onMapLoad={({ nativeEvent }: { nativeEvent: MapLoadEventPayload }) =>
          setStatus(`Loaded (WKID ${nativeEvent.spatialReferenceWkid}); marker + line + polygon`)
        }
        onMapError={({ nativeEvent }) => setStatus(`Error ${nativeEvent.code}: ${nativeEvent.message}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
