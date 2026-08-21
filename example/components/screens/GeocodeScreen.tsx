import { geocode, reverseGeocode } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { Centered } from '../Centered';
import { LONDON, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** Forward + reverse geocoding via the module's `geocode` / `reverseGeocode`. */
export function GeocodeScreen({ ready }: ScreenProps) {
  const [address, setAddress] = useState('Redlands, CA');
  const [result, setResult] = useState('Enter an address and tap Search.');

  async function search() {
    setResult('Searching…');
    try {
      const results = await geocode(address);
      if (results.length === 0) {
        setResult('No matches.');
        return;
      }
      const r = results[0];
      const score = r.score != null ? ` (score ${Math.round(r.score)})` : '';
      setResult(
        `${r.label}\n${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}${score}`
      );
    } catch (error) {
      setResult(`geocode failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function reverse() {
    setResult('Reverse geocoding London…');
    try {
      const results = await reverseGeocode(LONDON);
      setResult(results.length ? `Reverse London →\n${results[0].label}` : 'No address found.');
    } catch (error) {
      setResult(`reverse failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, styles.pad]}>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Address or place"
        autoCapitalize="words"
      />
      <View style={styles.row}>
        <Button title="Search" onPress={search} />
        <Button title="Reverse London" onPress={reverse} />
      </View>
      <Text style={styles.result}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  result: { fontSize: 15, color: '#111827', lineHeight: 22 },
});
