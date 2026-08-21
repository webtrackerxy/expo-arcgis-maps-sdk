import { ArcgisMapView, type ArcgisMapViewRef, type Viewpoint } from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

type Bookmark = { name: string; viewpoint: Viewpoint };

const INITIAL: Bookmark[] = [
  { name: 'Grand Canyon', viewpoint: { center: { latitude: 36.1, longitude: -112.1 }, scale: 500_000 } },
  { name: 'Guitar-shaped trees', viewpoint: { center: { latitude: -33.867, longitude: -63.987 }, scale: 100_000 } },
  { name: 'Mysterious circles', viewpoint: { center: { latitude: 27.38, longitude: 33.63 }, scale: 100_000 } },
];

/**
 * Manage bookmarks ("Manage bookmarks"): tap a saved bookmark to fly there, or
 * capture the current viewpoint as a new bookmark. Bookmarks are named
 * viewpoints held in JS state and applied via the ref's `setViewpoint`.
 */
export function BookmarksScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL);
  const [current, setCurrent] = useState<Viewpoint>(INITIAL[0].viewpoint);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ScrollView horizontal style={styles.barScroll} contentContainerStyle={styles.bar} showsHorizontalScrollIndicator={false}>
        {bookmarks.map((b) => (
          <Pressable
            key={b.name}
            style={styles.chip}
            onPress={() => mapRef.current?.setViewpoint(b.viewpoint, { durationMs: 1500 }).catch(() => undefined)}
          >
            <Text style={styles.chipText}>{b.name}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, styles.add]}
          onPress={() => setBookmarks((bs) => [...bs, { name: `Pin ${bs.length + 1}`, viewpoint: current }])}
        >
          <Text style={[styles.chipText, styles.addText]}>+ Add current</Text>
        </Pressable>
      </ScrollView>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{ basemap: 'arcGISImagery', initialViewpoint: INITIAL[0].viewpoint }}
        onViewpointChange={({ nativeEvent }) =>
          setCurrent({ center: nativeEvent.center, scale: nativeEvent.scale })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScroll: { flexGrow: 0, flexShrink: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  chipText: { fontSize: 13, color: '#111827', fontWeight: '600' },
  add: { backgroundColor: '#DBEAFE' },
  addText: { color: '#1D4ED8' },
});
