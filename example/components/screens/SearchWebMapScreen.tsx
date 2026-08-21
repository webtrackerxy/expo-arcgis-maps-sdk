import {
  ArcgisMapView,
  searchWebMaps,
  type WebMapSearchResult,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Search ArcGIS Online for public web maps, then tap a result to open it in the
 * map view (via `webMapItemId`).
 */
export function SearchWebMapScreen({ ready }: ScreenProps) {
  const [query, setQuery] = useState('watersheds');
  const [results, setResults] = useState<WebMapSearchResult[]>([]);
  const [status, setStatus] = useState('Search for a web map.');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  async function search() {
    setStatus('Searching…');
    setResults([]);
    setOpenItemId(null);
    try {
      const found = await searchWebMaps(query);
      setResults(found);
      setStatus(found.length ? `${found.length} result(s) — tap to open` : 'No matches.');
    } catch (error) {
      setStatus(`search failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (openItemId) {
    return (
      <View style={screenStyles.fill}>
        <View style={styles.bar}>
          <Button title="← Back to results" onPress={() => setOpenItemId(null)} />
        </View>
        <ArcgisMapView style={screenStyles.fill} map={{ webMapItemId: openItemId }} />
      </View>
    );
  }
  return (
    <View style={[screenStyles.fill, styles.pad]}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search web maps"
        autoCapitalize="none"
      />
      <Button title="Search" onPress={search} />
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.itemId}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => setOpenItemId(item.itemId)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {item.snippet || 'No description'} · {item.owner}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  bar: { padding: 8, alignItems: 'flex-start' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  status: { fontSize: 13, color: '#374151' },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
