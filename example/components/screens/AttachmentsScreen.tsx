import {
  queryFeatureAttachments,
  deleteFeatureAttachment,
  type AttachmentInfo,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { EDITABLE_LAYER_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

// A DamageAssessment feature that has attachments on the sample server.
const OBJECT_ID = 2474019;

/**
 * Lists a feature's attachments (read) and demonstrates deleting one (write).
 * The delete requires an editable layer; on the sample server it surfaces
 * `E_AUTHENTICATION_FAILED` (the API key is not accepted for edits there).
 */
export function AttachmentsScreen({ ready }: ScreenProps) {
  const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
  const [status, setStatus] = useState('Tap “List” to load attachments.');

  async function list() {
    setStatus('Loading attachments…');
    try {
      const result = await queryFeatureAttachments(EDITABLE_LAYER_URL, OBJECT_ID);
      setAttachments(result);
      setStatus(`${result.length} attachment(s) on feature ${OBJECT_ID}`);
    } catch (error) {
      setStatus(`list failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  async function removeFirst() {
    if (attachments.length === 0) {
      return;
    }
    setStatus('Deleting first attachment…');
    try {
      await deleteFeatureAttachment(EDITABLE_LAYER_URL, OBJECT_ID, attachments[0].id);
      setStatus('Deleted. Reloading…');
      await list();
    } catch (error) {
      setStatus(`delete failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, styles.pad]}>
      <View style={styles.buttons}>
        <Button title="List" onPress={list} />
        <Button title="Delete first" onPress={removeFirst} disabled={attachments.length === 0} />
      </View>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={attachments}
        keyExtractor={(a) => String(a.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.contentType} · {(item.size / 1024).toFixed(1)} KB
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, gap: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around' },
  status: { fontSize: 13, color: '#374151', paddingVertical: 4 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 15, color: '#111827', fontWeight: '600' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
