import {
  startOfflineMapJob,
  startPreplannedMapAreaJob,
  deleteOfflineMap,
  type OfflineMapJob,
  type JobProgressEvent,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { NAPERVILLE_AREA, OFFLINE_WEB_MAP_ITEM_ID, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Exercises the offline-map job: start, live progress, cancel, and delete the
 * generated package. Needs a key/account permitted to take the sample web map
 * offline.
 */
export function OfflineScreen({ ready }: ScreenProps) {
  const jobRef = useRef<OfflineMapJob | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [info, setInfo] = useState('Tap “Generate” to take the sample map offline.');
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function generatePreplanned() {
    if (jobRef.current) {
      return;
    }
    setProgress(0);
    setInfo('Finding preplanned area…');
    try {
      await runJob(() => startPreplannedMapAreaJob(OFFLINE_WEB_MAP_ITEM_ID, 0));
    } catch (error) {
      setInfo(`preplanned failed: ${(error as { code?: string }).code ?? 'error'}`);
      setProgress(null);
    }
  }

  async function runJob(makeJob: () => Promise<OfflineMapJob>) {
    const job = await makeJob();
    jobRef.current = job;
    const sub = job.onProgress((event: JobProgressEvent) => {
      setProgress(event.progress);
      setInfo(`Status: ${event.status}`);
    });
    try {
      const result = await job.result;
      setLastPath(result.path);
      setInfo(`Done: ${result.path}`);
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'error';
      setInfo(code === 'E_JOB_CANCELLED' ? 'Cancelled.' : `Failed: ${code}`);
    } finally {
      sub.remove();
      jobRef.current = null;
      setProgress(null);
    }
  }

  async function generate() {
    if (jobRef.current) {
      return;
    }
    setProgress(0);
    setInfo('Starting…');
    try {
      const job = await startOfflineMapJob({
        webMapItemId: OFFLINE_WEB_MAP_ITEM_ID,
        areaOfInterest: NAPERVILLE_AREA,
      });
      jobRef.current = job;
      const sub = job.onProgress((event: JobProgressEvent) => {
        setProgress(event.progress);
        setInfo(`Status: ${event.status}`);
      });
      try {
        const result = await job.result;
        setLastPath(result.path);
        setInfo(
          result.layerErrors.length
            ? `Done with ${result.layerErrors.length} layer error(s). First: ${result.layerErrors[0]}`
            : `Done: ${result.path}`
        );
      } catch (error) {
        const code = (error as { code?: string }).code ?? 'error';
        setInfo(code === 'E_JOB_CANCELLED' ? 'Cancelled.' : `Failed: ${code}`);
      } finally {
        sub.remove();
        jobRef.current = null;
        setProgress(null);
      }
    } catch (error) {
      setInfo(`start failed: ${(error as { code?: string }).code ?? 'error'}`);
      setProgress(null);
    }
  }

  async function cancel() {
    await jobRef.current?.cancel();
  }

  async function remove() {
    if (!lastPath) {
      return;
    }
    try {
      await deleteOfflineMap(lastPath);
      setInfo(`Deleted ${lastPath}`);
      setLastPath(null);
    } catch (error) {
      setInfo(`delete failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Generate" onPress={generate} disabled={progress !== null} />
        <Button title="Preplanned" onPress={generatePreplanned} disabled={progress !== null} />
        <Button title="Cancel" onPress={cancel} disabled={progress === null} />
        <Button title="Delete" onPress={remove} disabled={!lastPath} />
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
