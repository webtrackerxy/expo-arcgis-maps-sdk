/**
 * Demo screens for shipped capabilities that previously had no example screen —
 * layer types and feature-layer properties. Each mirrors the official sample's
 * data.
 */
import { ArcgisMapView, ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** `Add feature collection layer from query` — features copied from a service query. */
export function FeatureCollectionQueryScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading feature collection from a query…');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISOceans',
          initialViewpoint: { center: { latitude: 36.9, longitude: -120.5 }, scale: 12_000_000 },
          layers: [
            {
              id: 'fc-query',
              type: 'featureCollectionFromQuery',
              url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0',
              where: '1=1',
            },
          ],
        }}
        onMapLoad={() => setStatus('Feature collection built from a service query.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Set visibility of subtype sublayer` — a subtype feature layer's sublayers. */
export function SubtypeSublayerScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading subtype feature layer…');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISStreetsNight',
          initialViewpoint: { center: { latitude: 41.8, longitude: -88.15 }, scale: 8_000 },
          layers: [
            {
              id: 'subtype',
              type: 'subtypeFeature',
              url: 'https://sampleserver7.arcgisonline.com/server/rest/services/UtilityNetwork/NapervilleElectric/FeatureServer/0',
            },
          ],
        }}
        onMapLoad={() => setStatus('Subtype feature layer loaded (sublayers by subtype).')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Show WFS layer with XML query` — a WFS layer populated by an XML filter. */
export function WfsXmlQueryScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading WFS layer with an XML query…');
  const xmlQuery = `<?xml version="1.0" encoding="utf-8"?>
<wfs:GetFeature service="WFS" version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0">
  <wfs:Query typeNames="Seattle_Downtown_Features:Trees"/>
</wfs:GetFeature>`;
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISNavigation',
          initialViewpoint: { center: { latitude: 47.605, longitude: -122.335 }, scale: 60_000 },
          layers: [
            {
              id: 'wfs',
              type: 'wfs',
              url: 'https://dservices2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/services/Seattle_Downtown_Features/WFSServer',
              tableName: 'Seattle_Downtown_Features:Trees',
              xmlQuery,
            },
          ],
        }}
        onMapLoad={() => setStatus('WFS layer populated by the XML query.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Set feature layer rendering mode on map` — static vs dynamic rendering. */
export function FeatureRenderingModeMapScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Feature layer with static rendering mode.');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 39, longitude: -101 }, scale: 40_000_000 },
          featureLayers: [
            {
              id: 'geology',
              url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Energy/Geology/FeatureServer/8',
              renderingMode: 'static',
            },
          ],
        }}
        onMapLoad={() => setStatus('Feature layer rendering mode set on the map.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Set feature request mode` — manual cache request mode on a feature layer. */
export function FeatureRequestModeScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Feature layer using manual-cache request mode.');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: { latitude: 45.52, longitude: -122.68 }, scale: 30_000 },
          featureLayers: [
            {
              id: 'trees',
              url: 'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/Trees_of_Portland/FeatureServer/0',
              featureRequestMode: 'manualCache',
            },
          ],
        }}
        onMapLoad={() => setStatus('Feature request mode: manual cache.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Add feature layer with time offset` — the same layer shifted back in time. */
export function TimeOffsetScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Two hurricane layers, one offset by 10 days.');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  const url = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Hurricanes/MapServer/0';
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISOceans',
          initialViewpoint: { center: { latitude: 25, longitude: -60 }, scale: 60_000_000 },
          featureLayers: [
            { id: 'now', url },
            { id: 'offset', url, timeOffset: { value: 10, unit: 'days' } },
          ],
        }}
        onMapLoad={() => setStatus('Feature layer displayed with a 10-day time offset.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

const POINT_SCENE_CAMERA: Camera = {
  latitude: 40,
  longitude: -98,
  altitude: 3_500_000,
  heading: 0,
  pitch: 30,
};

/** `Add point scene layer` — a point scene layer of airports. */
export function PointSceneLayerScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Loading point scene layer…');
  if (!ready) return <Centered text="Waiting for configuration…" />;
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          initialCamera: POINT_SCENE_CAMERA,
          sceneLayers: [
            {
              id: 'airports',
              type: 'scene',
              url: 'https://tiles.arcgis.com/tiles/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Airports_PointSceneLayer/SceneServer/layers/0',
            },
          ],
        }}
        onSceneLoad={() => setStatus('Point scene layer loaded.')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
