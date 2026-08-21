/**
 * Demo screens for shipped capabilities that had no example screen — geometry
 * ops, graphics renderers, operational-layer management, and a styled WMS layer.
 */
import {
  ArcgisMapView,
  geodesicEllipse,
  geodesicSector,
  type ArcgisLayerSource,
  type ArcgisMapViewRef,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const CENTER = { latitude: 34.028, longitude: -118.805 };

/** `Show geodesic sector and ellipse` — a geodesic ellipse and sector as graphics. */
export function GeodesicSectorEllipseScreen({ ready }: ScreenProps) {
  const [graphics, setGraphics] = useState<GraphicSource[]>([]);
  const [status, setStatus] = useState('Computing geodesic ellipse and sector…');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ellipse = await geodesicEllipse({
          center: CENTER,
          semiAxis1LengthMeters: 30_000,
          semiAxis2LengthMeters: 15_000,
          axisDirectionDegrees: 45,
        });
        const sector = await geodesicSector({
          center: CENTER,
          semiAxis1LengthMeters: 25_000,
          semiAxis2LengthMeters: 25_000,
          sectorAngleDegrees: 70,
          startDirectionDegrees: 10,
        });
        if (!active) return;
        setGraphics([
          {
            id: 'ellipse',
            geometry: ellipse,
            symbol: { type: 'simpleFill', color: '#2f7d6e40', outline: { type: 'simpleLine', color: '#2f7d6e', width: 2 } },
          },
          {
            id: 'sector',
            geometry: sector,
            symbol: { type: 'simpleFill', color: '#e4572e55', outline: { type: 'simpleLine', color: '#e4572e', width: 2 } },
          },
        ]);
        setStatus('Geodesic ellipse (green) and sector (orange).');
      } catch (error) {
        if (active) setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: CENTER, scale: 800_000 },
          graphics,
        }}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Style graphics with renderer` — one renderer styles all symbol-less graphics. */
export function StyleGraphicsWithRendererScreen({ ready }: ScreenProps) {
  if (!ready) return <Centered text="Waiting for configuration…" />;
  // The graphics carry no symbol; the overlay's shared renderer styles them all.
  const points: GraphicSource[] = [
    { latitude: 34.05, longitude: -118.8 },
    { latitude: 34.02, longitude: -118.77 },
    { latitude: 34.0, longitude: -118.83 },
    { latitude: 34.04, longitude: -118.86 },
  ].map((point, i) => ({ id: `p${i}`, geometry: { type: 'point', point } }));
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: CENTER, scale: 400_000 },
          graphicsRenderer: {
            type: 'simple',
            symbol: { type: 'simpleMarker', style: 'diamond', color: '#8a3ffc', size: 16 },
          },
          graphics: points,
        }}
      />
      <Text style={screenStyles.status}>One renderer styles every (symbol-less) overlay graphic.</Text>
    </View>
  );
}

/** `Identify features in WMS layer` — tap a WMS layer to identify its features. */
export function IdentifyWmsScreen({ ready }: ScreenProps) {
  const ref = useRef<ArcgisMapViewRef>(null);
  const [status, setStatus] = useState('Tap the map to identify WMS features.');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={ref}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39, longitude: -98 }, scale: 40_000_000 },
          layers: [
            {
              id: 'wms',
              type: 'wms',
              url: 'https://watersgeo.epa.gov/arcgis/services/OWPROGRAM/SDWIS_WMERC/MapServer/WMSServer?request=GetCapabilities&service=WMS',
              layerNames: ['4'],
            },
          ],
        }}
        onSingleTap={async (e) => {
          try {
            const results = await ref.current?.identify({ screenPoint: e.nativeEvent.screenPoint });
            const wms = (results ?? []).filter((r) => r.sourceId === 'wms');
            setStatus(`${wms.length} WMS feature(s) at the tapped point.`);
          } catch (error) {
            setStatus(`identify failed: ${(error as { code?: string }).code ?? 'error'}`);
          }
        }}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Manage operational layers` — add / remove / reorder operational layers at runtime. */
export function ManageOperationalLayersScreen({ ready }: ScreenProps) {
  const censusLayer: ArcgisLayerSource = {
    id: 'census',
    type: 'mapImage',
    url: 'https://sampleserver5.arcgisonline.com/arcgis/rest/services/Census/MapServer',
  };
  const damageLayer: ArcgisLayerSource = {
    id: 'damage',
    type: 'mapImage',
    url: 'https://sampleserver5.arcgisonline.com/arcgis/rest/services/DamageAssessment/MapServer',
  };
  const [layers, setLayers] = useState<ArcgisLayerSource[]>([censusLayer, damageLayer]);
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 39, longitude: -96 }, scale: 90_000_000 },
          // Reordering the declarative array reorders the operational layers.
          layers,
        }}
      />
      <View style={styles.bar}>
        <Pressable style={styles.btn} onPress={() => setLayers((l) => [...l].reverse())}>
          <Text style={styles.btnText}>Swap order</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => setLayers([censusLayer, damageLayer])}>
          <Text style={styles.btnText}>Reset</Text>
        </Pressable>
        <Text style={styles.status}>Top layer: {layers[layers.length - 1]?.id}</Text>
      </View>
    </View>
  );
}

/** `Apply style to WMS layer` — a WMS layer displayed with a named style. */
export function WmsStyleScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading WMS layer with a style…');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 46.3, longitude: -94.3 }, scale: 12_000_000 },
          layers: [
            {
              id: 'wms',
              type: 'wms',
              url: 'https://imageserver.gisdata.mn.gov/cgi-bin/mncomp?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities',
              layerNames: ['mncomp'],
              styleName: 'default',
            },
          ],
        }}
        onMapLoad={() => setStatus('WMS layer displayed with a named style.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
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
  btn: { backgroundColor: '#2f7d6e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  status: { flex: 1, fontSize: 12, color: '#111827' },
});
