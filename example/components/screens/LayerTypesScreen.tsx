import { ArcgisMapView, type ArcgisLayerSource } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

type Viewpoint = { center: { latitude: number; longitude: number }; scale: number };
type Entry = { key: string; label: string; layer: ArcgisLayerSource; viewpoint: Viewpoint };
const WORLD: Viewpoint = { center: { latitude: 20, longitude: 0 }, scale: 160_000_000 };

const LAYERS: Entry[] = [
  {
    key: 'tiled',
    label: 'Tiled',
    layer: {
      id: 'l',
      type: 'tiled',
      // Matches the official "Add tiled layer" sample.
      url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
    },
    viewpoint: { center: { latitude: 39, longitude: -98 }, scale: 50_000_000 },
  },
  {
    key: 'osm',
    label: 'OpenStreetMap',
    layer: { id: 'l', type: 'openStreetMap' },
    viewpoint: WORLD,
  },
  {
    key: 'web',
    label: 'Web tiled',
    layer: {
      id: 'l',
      type: 'webTiled',
      urlTemplate: 'https://{subDomain}.tile.openstreetmap.org/{level}/{col}/{row}.png',
      subDomains: ['a', 'b', 'c'],
    },
    viewpoint: WORLD,
  },
  {
    key: 'vector',
    label: 'Vector tiled',
    layer: {
      id: 'l',
      type: 'vectorTiled',
      url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer',
    },
    viewpoint: { center: SANTA_MONICA, scale: 80_000 },
  },
  {
    key: 'wms',
    label: 'WMS',
    layer: {
      id: 'l',
      type: 'wms',
      // Matches the official "Add WMS layer" sample: NOAA weather-radar mosaic over CONUS.
      url: 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms',
      layerNames: ['conus_base_reflectivity_mosaic'],
    },
    viewpoint: { center: { latitude: 39, longitude: -98 }, scale: 55_000_000 },
  },
  {
    key: 'wfs',
    label: 'WFS',
    layer: {
      id: 'l',
      type: 'wfs',
      url: 'https://dservices2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/services/Seattle_Downtown_Features/WFSServer?service=wfs&request=getcapabilities',
      tableName: 'Seattle_Downtown_Features:Buildings',
    },
    viewpoint: { center: { latitude: 47.606, longitude: -122.335 }, scale: 7_000 },
  },
  {
    key: 'wmts',
    label: 'WMTS',
    layer: {
      id: 'l',
      type: 'wmts',
      // Matches the official "Add WMTS layer" sample.
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS',
      layerId: 'WorldTimeZones',
    },
    viewpoint: WORLD,
  },
  {
    key: 'mapImage',
    label: 'Map image',
    layer: {
      id: 'l',
      type: 'mapImage',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer',
      // Hide the "cities" sublayer (0) to demonstrate sublayer visibility.
      sublayerVisibility: [{ sublayerId: 0, visible: false }],
    },
    viewpoint: { center: { latitude: 20, longitude: 0 }, scale: 200_000_000 },
  },
  {
    key: 'kml',
    label: 'KML',
    layer: {
      id: 'l',
      type: 'kml',
      // Esri-hosted sample KML (US states / world features).
      url: 'https://www.arcgis.com/sharing/rest/content/items/324e4742820e46cfbe5029ff2c32cb1f/data',
    },
    viewpoint: WORLD,
  },
  {
    key: 'raster',
    label: 'Raster (image svc)',
    layer: {
      id: 'l',
      type: 'raster',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer',
    },
    viewpoint: { center: { latitude: 35.22, longitude: -80.84 }, scale: 40_000 },
  },
  {
    key: 'hillshade',
    label: 'Raster (hillshade)',
    layer: {
      id: 'l',
      type: 'raster',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/CharlotteLAS/ImageServer',
      hillshade: { altitudeDegrees: 45, azimuthDegrees: 315, zFactor: 3 },
    },
    viewpoint: { center: { latitude: 35.22, longitude: -80.84 }, scale: 40_000 },
  },
  // The RGB and colormap raster renderers have their own screens (RgbRasterScreen /
  // ColormapRasterScreen), which apply them to the official local Shasta GeoTIFFs.
];

/** Switches the map's `layers` between all supported non-feature layer types. */
export function LayerTypesScreen({ ready }: ScreenProps) {
  const [key, setKey] = useState('tiled');
  const active = LAYERS.find((l) => l.key === key) ?? LAYERS[0];

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ScrollView
        horizontal
        style={styles.barScroll}
        contentContainerStyle={styles.bar}
        showsHorizontalScrollIndicator={false}
      >
        {LAYERS.map((l) => (
          <Pressable
            key={l.key}
            onPress={() => setKey(l.key)}
            style={[styles.chip, key === l.key && styles.chipOn]}
          >
            <Text style={[styles.chipText, key === l.key && styles.chipTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ArcgisMapView
        // Remount per selection so the layer's viewpoint is applied.
        key={active.key}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: active.viewpoint,
          layers: [active.layer],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScroll: { flexGrow: 0, flexShrink: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  chipOn: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#111827' },
  chipTextOn: { color: '#FFFFFF', fontWeight: '600' },
});
