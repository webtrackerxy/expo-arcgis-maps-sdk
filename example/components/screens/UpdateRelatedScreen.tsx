import { updateFeatureAttributes } from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { EDITABLE_LAYER_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const OBJECT_ID = 2474019;

/** Reads the feature's current typdamage via the public REST endpoint (no SDK). */
async function readTypDamage(): Promise<string | null> {
  const res = await fetch(`${EDITABLE_LAYER_URL}/${OBJECT_ID}?f=json`);
  const json = (await res.json()) as { feature?: { attributes?: Record<string, unknown> } };
  const value = json.feature?.attributes?.typdamage;
  return value == null ? null : String(value);
}

/**
 * Updates a feature's attribute and applies the edit. `updateFeatureAttributes`
 * works on any editable feature service layer — including a related table — so
 * combined with `queryRelatedFeatures` it covers editing related records. Here
 * it toggles the damage type on an editable sample feature and re-reads to
 * confirm the write persisted.
 */
export function UpdateRelatedScreen({ ready }: ScreenProps) {
  const [current, setCurrent] = useState<string | null>(null);
  const [status, setStatus] = useState('Tap “Read” to load the feature.');

  async function read() {
    setStatus('Reading feature…');
    try {
      const value = await readTypDamage();
      setCurrent(value);
      setStatus(`Current typdamage: ${value ?? '—'}`);
    } catch (error) {
      setStatus(`read failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function toggle() {
    const next = current === 'Minor' ? 'Affected' : 'Minor';
    setStatus(`Updating to “${next}”…`);
    try {
      await updateFeatureAttributes(EDITABLE_LAYER_URL, OBJECT_ID, { typdamage: next });
      await read();
    } catch (error) {
      setStatus(`update failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, styles.pad]}>
      <View style={styles.buttons}>
        <Button title="Read" onPress={read} />
        <Button title="Toggle damage type" onPress={toggle} disabled={current === null} />
      </View>
      <Text style={styles.value}>{current ?? '—'}</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around' },
  value: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center', paddingVertical: 12 },
  status: { fontSize: 13, color: '#374151', textAlign: 'center' },
});
