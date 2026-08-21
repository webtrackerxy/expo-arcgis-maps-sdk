import {
  ArcgisMapView,
  BASEMAP_STYLES,
  getBasemapStyles,
  type BasemapStyle,
  type BasemapStyleInfo,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// The service reports a style's name (e.g. "ArcGIS Imagery"); match it to the
// supported BasemapStyle union by comparing letters-only, case-insensitively
// ("ArcGIS Imagery" → "arcgisimagery" ≡ "arcGISImagery").
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
function toBasemapStyle(styleName: string): BasemapStyle | undefined {
  const n = norm(styleName);
  return BASEMAP_STYLES.find((s) => norm(s) === n);
}

/**
 * Dynamic basemap gallery ("Create dynamic basemap gallery"): fetches the
 * available basemap styles from the ArcGIS basemap-styles service via
 * `getBasemapStyles`, shows them with thumbnails, and applies a supported
 * selection to the map.
 */
export function BasemapGalleryScreen({ ready }: ScreenProps) {
  const [styles_, setStyles] = useState<BasemapStyleInfo[]>([]);
  const [selected, setSelected] = useState<BasemapStyle>('arcGISTopographic');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    getBasemapStyles()
      .then(setStyles)
      .catch((e) => setError(e?.message ?? String(e)));
  }, [ready]);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{ basemap: selected, initialViewpoint: { center: { latitude: 40, longitude: -100 }, scale: 50_000_000 } }}
      />
      <View style={styles.tray}>
        <Text style={styles.title}>
          {error ? `Error: ${error}` : `${styles_.length} styles · tap a supported one to apply`}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {styles_.map((s) => {
            const mapped = toBasemapStyle(s.styleName);
            return (
              <Pressable
                key={s.styleName}
                disabled={!mapped}
                onPress={() => mapped && setSelected(mapped)}
                style={[styles.cell, !mapped && styles.disabled, mapped === selected && styles.active]}
              >
                {s.thumbnailUri ? (
                  <Image source={{ uri: s.thumbnailUri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.noThumb]} />
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#111827E6', paddingVertical: 8 },
  title: { color: '#fff', fontSize: 12, paddingHorizontal: 12, paddingBottom: 6 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  cell: { width: 72, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  active: { opacity: 1 },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#374151' },
  noThumb: { borderWidth: 1, borderColor: '#6B7280' },
  name: { color: '#E5E7EB', fontSize: 10, marginTop: 3, width: 72, textAlign: 'center' },
});
