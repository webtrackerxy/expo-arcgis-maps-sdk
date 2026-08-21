/**
 * Layers-depth screens — apply a mosaic rule to an image-service raster,
 * identify a raster cell, and control annotation sublayer visibility.
 */
import { ArcgisMapView, type ArcgisMapViewRef } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The official "Apply mosaic rule to rasters" sample's mosaic image service.
const MOSAIC_SERVICE =
  'https://sampleserver7.arcgisonline.com/server/rest/services/amberg_germany/ImageServer';

/** `Apply mosaic rule to rasters` — orders overlapping rasters north-west first. */
export function MosaicRasterScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading mosaicked raster…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImageryStandard',
          initialViewpoint: { center: { latitude: 49.44, longitude: 11.85 }, scale: 20_000 },
          layers: [
            {
              id: 'mosaic',
              type: 'raster',
              url: MOSAIC_SERVICE,
              mosaicRule: { method: 'northwest', operation: 'first' },
            },
          ],
        }}
        onMapLoad={() => setInfo('Mosaic rule applied (north-west ordering).')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// The official "Identify raster cell" sample's elevation image service.
const RASTER_CELL_SERVICE =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer';

/** `Identify raster cell` — tap the raster to read the cell's pixel value(s). */
export function IdentifyRasterCellScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [info, setInfo] = useState('Tap the raster to identify a cell.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 35.24, longitude: -80.83 }, scale: 30_000 },
          layers: [{ id: 'raster-cell', type: 'raster', url: RASTER_CELL_SERVICE }],
        }}
        onSingleTap={async (e) => {
          try {
            const results = await mapRef.current?.identify({ screenPoint: e.nativeEvent.screenPoint });
            const cell = (results ?? []).find((r) => r.sourceId === 'raster-cell');
            const values = cell ? Object.entries(cell.attributes ?? {}) : [];
            setInfo(
              values.length
                ? `Cell: ${values.map(([k, v]) => `${k}=${v}`).join(', ')}`
                : 'No raster cell here.'
            );
          } catch (error) {
            setInfo(`identify failed: ${(error as { code?: string }).code ?? 'error'}`);
          }
        }}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// The official "Control annotation sublayer visibility" annotation feature layer,
// which carries scale-ranged "Open" / "Closed" sublayers.
const ANNOTATION_SERVICE =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/EastLothianRivers/FeatureServer/0';

/** `Control annotation sublayer visibility` — hides the "Closed" annotation sublayer. */
export function AnnotationSublayerScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading annotation layer…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 55.94, longitude: -2.83 }, scale: 40_000 },
          layers: [
            {
              id: 'annotation',
              type: 'annotation',
              url: ANNOTATION_SERVICE,
              sublayerVisibility: [
                { name: 'Open', visible: true },
                { name: 'Closed', visible: false },
              ],
            },
          ],
        }}
        onMapLoad={() => setInfo('Annotation layer loaded; "Closed" sublayer hidden.')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}
