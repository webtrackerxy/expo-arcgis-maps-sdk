import {
  getServiceLayers,
  type BrowsableServiceType,
  type ServiceLayerInfo,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const SERVICES: { type: BrowsableServiceType; label: string; url: string }[] = [
  {
    type: 'wms',
    label: 'WMS',
    // Matches the official "Browse WMS layers" sample.
    url: 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/wms?SERVICE=WMS&REQUEST=GetCapabilities',
  },
  {
    type: 'wfs',
    label: 'WFS',
    url: 'https://dservices2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/services/Seattle_Downtown_Features/WFSServer?service=wfs&request=getcapabilities',
  },
  { type: 'ogcFeature', label: 'OGC API', url: 'https://demo.ldproxy.net/daraa' },
];

/**
 * Browse an OGC service's contents ("Browse WMS layers" / "Browse WFS layers" /
 * "Browse OGC API feature service"): pick a service kind and `getServiceLayers`
 * lists the layers/collections it advertises, with the `id` you would pass when
 * adding the layer.
 */
export function ServiceBrowserScreen({ ready }: ScreenProps) {
  const [selected, setSelected] = useState<BrowsableServiceType | null>(null);
  const [layers, setLayers] = useState<ServiceLayerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function browse(svc: (typeof SERVICES)[number]) {
    setSelected(svc.type);
    setLayers([]);
    setError(null);
    setLoading(true);
    try {
      setLayers(await getServiceLayers({ type: svc.type, url: svc.url }));
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <View style={styles.bar}>
        {SERVICES.map((svc) => (
          <Pressable
            key={svc.type}
            style={[styles.chip, selected === svc.type && styles.chipActive]}
            onPress={() => browse(svc)}
          >
            <Text style={[styles.chipText, selected === svc.type && styles.chipTextActive]}>
              {svc.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.status}>
        {loading
          ? 'Browsing…'
          : error
            ? `Error: ${error}`
            : selected
              ? `${layers.length} layers/collections`
              : 'Pick a service to browse.'}
      </Text>
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <ScrollView style={screenStyles.fill} contentContainerStyle={styles.list}>
          {layers.map((l) => (
            <View key={l.id} style={styles.row}>
              <Text style={styles.title}>{l.title}</Text>
              <Text style={styles.id}>{l.id}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  status: { paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#374151' },
  spinner: { marginTop: 24 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D5DB' },
  title: { fontSize: 14, color: '#111827', fontWeight: '500' },
  id: { fontSize: 11, color: '#6B7280' },
});
