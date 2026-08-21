import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type FeatureFormInfo,
  type SingleTapEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Taps a feature and shows its editing form — title and field rows with current
 * values — via `showFeatureForm`. When the layer has no configured form, a
 * default form is generated from the feature's fields. Read-only view.
 */
export function FeatureFormScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [form, setForm] = useState<FeatureFormInfo | null>(null);
  const [status, setStatus] = useState('Tap a feature to show its form.');

  async function onTap(event: SingleTapEventPayload) {
    setStatus('Identifying…');
    setForm(null);
    try {
      const forms = (await mapRef.current?.showFeatureForm({ screenPoint: event.screenPoint })) ?? [];
      if (forms.length === 0) {
        setStatus('No form here — tap a feature.');
        return;
      }
      setForm(forms[0]);
      setStatus(`${forms[0].fields.length} field(s)`);
    } catch (error) {
      setStatus(`showFeatureForm failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISTopographic',
          initialViewpoint: { center: SANTA_MONICA, scale: 100_000 },
          featureLayers: [{ id: 'trailheads', url: TRAILHEADS_URL }],
        }}
        onSingleTap={({ nativeEvent }: { nativeEvent: SingleTapEventPayload }) => onTap(nativeEvent)}
      />
      {form ? (
        <View style={styles.card}>
          <Text style={styles.title}>{form.title || 'Edit feature'}</Text>
          <ScrollView style={styles.fieldList}>
            {form.fields.map((f, i) => (
              <View key={`${f.label}-${i}`} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <Text style={styles.fieldValue}>{f.value || '—'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={screenStyles.status}>{status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { maxHeight: 260, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd', padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  fieldList: { flexGrow: 0 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 },
  fieldLabel: { fontSize: 13, color: '#6B7280', flexShrink: 1 },
  fieldValue: { fontSize: 13, color: '#111827', fontWeight: '500', flexShrink: 1, textAlign: 'right' },
});
