import {
  startGenerateGeodatabaseJob,
  startSyncGeodatabaseJob,
  type JobProgressEvent,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { WILDFIRE_AREA, WILDFIRE_SYNC_SERVICE_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Exercises geodatabase generate + sync jobs against Esri's public WildfireSync
 * sample service. Generate replicates the service into a local `.geodatabase`;
 * Sync pushes/pulls edits. Both reuse the shared job abstraction.
 */
export function GeodatabaseScreen({ ready }: ScreenProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [info, setInfo] = useState('Generate a local geodatabase, then sync it.');
  const [path, setPath] = useState<string | null>(null);
  const busy = useRef(false);

  async function generate() {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setProgress(0);
    setInfo('Generating…');
    try {
      const job = await startGenerateGeodatabaseJob({
        featureServiceUrl: WILDFIRE_SYNC_SERVICE_URL,
        areaOfInterest: WILDFIRE_AREA,
      });
      const sub = job.onProgress((e: JobProgressEvent) => setProgress(e.progress));
      try {
        const result = await job.result;
        setPath(result.path);
        setInfo(`Generated: ${result.path}`);
      } finally {
        sub.remove();
      }
    } catch (error) {
      setInfo(`generate failed: ${(error as { code?: string }).code ?? 'error'}`);
    } finally {
      busy.current = false;
      setProgress(null);
    }
  }

  async function sync() {
    if (busy.current || !path) {
      return;
    }
    busy.current = true;
    setProgress(0);
    setInfo('Syncing…');
    try {
      const job = await startSyncGeodatabaseJob({
        featureServiceUrl: WILDFIRE_SYNC_SERVICE_URL,
        path,
      });
      const sub = job.onProgress((e: JobProgressEvent) => setProgress(e.progress));
      try {
        await job.result;
        setInfo('Sync complete.');
      } finally {
        sub.remove();
      }
    } catch (error) {
      setInfo(`sync failed: ${(error as { code?: string }).code ?? 'error'}`);
    } finally {
      busy.current = false;
      setProgress(null);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Generate" onPress={generate} disabled={progress !== null} />
        <Button title="Sync" onPress={sync} disabled={progress !== null || !path} />
      </View>
      <Centered text={progress === null ? 'Idle' : `${progress}%`} />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
});
