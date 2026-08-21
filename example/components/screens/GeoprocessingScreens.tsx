/**
 * Geoprocessing screens — analyze hotspots and calculate a viewshed — using the
 * job abstraction (`startGeoprocessingJob`) against the official Esri sample
 * geoprocessing services.
 */
import {
  ArcgisMapView,
  startGeoprocessingJob,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, View, Text } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The official "Analyze hotspots" sample's 911-calls hotspot GP service + a
// month-long date-range query (the exact service and query shape).
const HOTSPOT_SERVICE =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/911CallsHotspot/GPServer/911%20Calls%20Hotspot';
const HOTSPOT_QUERY =
  "(\"DATE\" > date '1998-01-01 00:00:00' AND \"DATE\" < date '1998-01-31 00:00:00')";

/** `Analyze hotspots` — runs a GP job and adds its result hotspot map image. */
export function HotspotsScreen({ ready }: ScreenProps) {
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('Tap “Run analysis” to compute the hotspot map.');

  async function run() {
    setStatus('Running geoprocessing job…');
    try {
      const job = await startGeoprocessingJob({
        serviceUrl: HOTSPOT_SERVICE,
        inputs: [{ name: 'Query', type: 'string', value: HOTSPOT_QUERY }],
      });
      job.onProgress((e) => setStatus(`Job ${e.status} · ${Math.round(e.progress * 100)}%`));
      const result = await job.result;
      if (result.mapImageUrl) {
        setMapImageUrl(result.mapImageUrl);
        setStatus('Hotspot result map added.');
      } else {
        setStatus('Job finished but returned no result map image.');
      }
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISDarkGray',
          initialViewpoint: { center: { latitude: 38.85, longitude: -77.03 }, scale: 1_100_000 },
          layers: mapImageUrl ? [{ id: 'hotspot', type: 'mapImage', url: mapImageUrl }] : [],
        }}
      />
      <View style={{ padding: 6 }}>
        <Button title="Run analysis" onPress={run} />
      </View>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

// The official "Show viewshed from geoprocessing task" sample's viewshed GP
// service, with a fixed observer over the Alps.
const VIEWSHED_SERVICE =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/GPServer/Viewshed';
const VIEWSHED_OBSERVER: GeographicPoint = { latitude: 45.3697, longitude: 6.8462 };

/** `Show viewshed calculated from geoprocessing task` — runs a GP viewshed job and draws it. */
export function GeoprocessingViewshedScreen({ ready }: ScreenProps) {
  const [graphics, setGraphics] = useState<GraphicSource[]>([]);
  const [status, setStatus] = useState('Tap “Run viewshed” to compute the visible area.');

  async function run() {
    setStatus('Running viewshed job…');
    try {
      const job = await startGeoprocessingJob({
        serviceUrl: VIEWSHED_SERVICE,
        inputs: [
          { name: 'Input_Observation_Point', type: 'point', point: VIEWSHED_OBSERVER },
          { name: 'Viewshed_Distance', type: 'double', value: 5000 },
        ],
      });
      job.onProgress((e) => setStatus(`Job ${e.status} · ${Math.round(e.progress * 100)}%`));
      const result = await job.result;
      setGraphics(
        result.features.map((geometry, i) => ({
          id: `viewshed-${i}`,
          geometry,
          symbol: {
            type: 'simpleFill',
            color: '#FFA50066',
            outline: { type: 'simpleLine', color: '#FF8C00', width: 2 },
          },
        }))
      );
      setStatus(`Viewshed: ${result.features.length} polygon(s).`);
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImagery',
          initialViewpoint: { center: VIEWSHED_OBSERVER, scale: 120_000 },
          graphics,
        }}
      />
      <View style={{ padding: 6 }}>
        <Button title="Run viewshed" onPress={run} />
      </View>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
