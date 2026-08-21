import {
  startExportVectorTilesJob,
  deleteOfflineMap,
  type ExportVectorTilesJob,
  type JobProgressEvent,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { VECTOR_TILE_AREA, VECTOR_TILE_SERVICE_URL, type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/**
 * Exercises the export-vector-tiles job: start, live progress, cancel, and
 * delete the generated `.vtpk` package. Needs a configured API key permitted to
 * export the ArcGIS basemap vector tiles.
 */
export function DownloadVectorTilesScreen({ ready }: ScreenProps) {
  const jobRef = useRef<ExportVectorTilesJob | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [info, setInfo] = useState('Tap “Export” to download vector tiles for central London.');
  const [lastPath, setLastPath] = useState<string | null>(null);

  async function exportTiles() {
    if (jobRef.current) {
      return;
    }
    setProgress(0);
    setInfo('Starting…');
    try {
      const job = await startExportVectorTilesJob({
        serviceUrl: VECTOR_TILE_SERVICE_URL,
        area: VECTOR_TILE_AREA,
        maxScale: 10000,
      });
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
        <Button title="Export" onPress={exportTiles} disabled={progress !== null} />
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
