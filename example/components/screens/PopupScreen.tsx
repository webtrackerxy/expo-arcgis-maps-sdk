import {
  ArcgisMapView,
  type ArcgisMapViewRef,
  type PopupInfo,
  type SingleTapEventPayload,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { SANTA_MONICA, TRAILHEADS_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Loads a feature layer, then taps a feature to show its popup — title and
 * formatted fields — via `showPopup`. When the layer has no configured popup,
 * a default popup is generated from the feature's fields.
 */
export function PopupScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [status, setStatus] = useState('Tap a feature to show its popup.');

  async function onTap(event: SingleTapEventPayload) {
    setStatus('Identifying…');
    setPopup(null);
    try {
      const popups = (await mapRef.current?.showPopup({ screenPoint: event.screenPoint })) ?? [];
      if (popups.length === 0) {
        setStatus('No popup here — tap a feature.');
        return;
      }
      setPopup(popups[0]);
      setStatus(`${popups.length} popup(s)`);
    } catch (error) {
      setStatus(`showPopup failed: ${(error as { code?: string }).code ?? 'error'}`);
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
      {popup ? (
        <View style={styles.card}>
          <Text style={styles.title}>{popup.title || 'Feature'}</Text>
          <ScrollView style={styles.fieldList}>
            {popup.fields.map((f, i) => (
              <View key={`${f.label}-${i}`} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <Text style={styles.fieldValue}>{f.value}</Text>
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
