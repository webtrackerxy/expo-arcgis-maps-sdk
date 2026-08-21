/**
 * Location-subsystem screens — browse building floors, indoor positioning (IPS),
 * NMEA location, and location-driven geotriggers — mirroring the official Esri
 * samples' data.
 */
import {
  ArcgisMapView,
  type GeographicPoint,
  type GeotriggerNotificationEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedFile } from './provisioning';

// The official floor-aware / IPS web map (Esri Redlands "Building L").
const INDOOR_WEB_MAP = 'b4b599a43a474d33946cf0df526426f5';

/** `Browse building floors` — shows level 1 of a floor-aware web map. */
export function FloorsScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading floor-aware map…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ webMapItemId: INDOOR_WEB_MAP, floorLevel: 1 }}
        onMapLoad={() => setInfo('Showing floor level 1.')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/** `Show device location using indoor positioning` — IPS blue dot in a building. */
export function IndoorPositioningScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading IPS map…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ webMapItemId: INDOOR_WEB_MAP }}
        locationDisplay={{ enabled: true, dataSource: 'indoors', autoPanMode: 'recenter' }}
        onMapLoad={() => setInfo('IPS positioning started (needs an IPS-enabled venue).')}
        onLocationUpdate={(e) =>
          setInfo(
            `IPS: ${e.nativeEvent.position.latitude.toFixed(5)}, ` +
              `${e.nativeEvent.position.longitude.toFixed(5)}`
          )
        }
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

/** `Show device location with NMEA data sources` — replays a bundled NMEA file. */
export function NmeaScreen({ ready }: ScreenProps) {
  // The official sample's Redlands NMEA track (a portal item raw file).
  const { path, status } = useProvisionedFile('d5bad9f4fee9483791e405880fb466da', 'Redlands.nmea');
  const [info, setInfo] = useState('Loading NMEA source…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISNavigation',
          initialViewpoint: { center: { latitude: 34.056, longitude: -117.196 }, scale: 10_000 },
        }}
        locationDisplay={{
          enabled: true,
          dataSource: 'nmea',
          nmeaSentencesPath: path,
          autoPanMode: 'recenter',
        }}
        onLocationUpdate={(e) =>
          setInfo(
            `NMEA fix: ${e.nativeEvent.position.latitude.toFixed(5)}, ` +
              `${e.nativeEvent.position.longitude.toFixed(5)}`
          )
        }
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// `Set up location-driven geotriggers` fences a few points of interest that the
// device location is monitored against.
const POIS: { id: string; point: GeographicPoint }[] = [
  { id: 'garden-gate', point: { latitude: 34.056, longitude: -117.196 } },
  { id: 'visitor-center', point: { latitude: 34.057, longitude: -117.195 } },
];

/** `Set up location-driven geotriggers` — enter/exit fences around POIs. */
export function GeotriggerScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Move into a fence to trigger a notification.');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: POIS[0].point, scale: 5_000 },
          graphics: POIS.map((poi) => ({
            id: poi.id,
            geometry: { type: 'point', point: poi.point },
            symbol: { type: 'simpleMarker', style: 'circle', color: '#2E86DE', size: 12 },
          })),
          geotriggers: POIS.map((poi) => ({
            id: poi.id,
            bufferMeters: 50,
            ruleType: 'enterOrExit',
          })),
        }}
        locationDisplay={{ enabled: true, autoPanMode: 'recenter' }}
        onGeotriggerNotification={(e: { nativeEvent: GeotriggerNotificationEventPayload }) =>
          setInfo(`${e.nativeEvent.action} ${e.nativeEvent.geotriggerId}: ${e.nativeEvent.message}`)
        }
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}
