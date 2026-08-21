/**
 * Scene screens that load large local data packages (`.mspk`, `.slpk`). The
 * data is provisioned exactly like the official ArcGIS samples app: downloaded
 * once from its ArcGIS Online portal item into the app cache, then passed to the
 * native view as a filesystem path.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ArcgisSceneView, type Camera } from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** ArcGIS-Online portal-item data endpoint for a public item. */
function itemDataUrl(itemId: string): string {
  return `https://www.arcgis.com/sharing/rest/content/items/${itemId}/data`;
}

/** The native SDKs expect a plain filesystem path, not a `file://` URI. */
function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/**
 * Downloads a portal item's data to the app cache on first run and returns its
 * local filesystem path; reuses the cached file thereafter.
 */
function useProvisionedFile(itemId: string, filename: string) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing data…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, 'arcgis-scene-data');
        if (!dir.exists) dir.create();
        const file = new File(dir, filename);
        if (file.exists) {
          if (!cancelled) {
            setPath(toPath(file.uri));
            setStatus('Loading 3D scene…');
          }
          return;
        }
        setStatus('Downloading data (first run, ~130 MB)…');
        const downloaded = await File.downloadFileAsync(itemDataUrl(itemId), file);
        if (!cancelled) {
          setPath(toPath(downloaded.uri));
          setStatus('Loading 3D scene…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not download data: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, filename]);

  return { path, status, setStatus };
}

/** `Display scene from mobile scene package` — a scene from a local `.mspk`. */
export function MobileScenePackageScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedFile(
    '7dd2f97bb007466ea939160d0de96a9d',
    'philadelphia.mspk'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{ mobileScenePackagePath: path }}
        onSceneLoad={() => setStatus('Scene loaded.')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

// Frames the San Diego north Balboa point cloud (matches the official sample).
const pointCloudCamera: Camera = {
  latitude: 32.720195,
  longitude: -117.155593,
  altitude: 1050,
  heading: 23,
  pitch: 70,
};

/** `Add point cloud layer from file` — a point-cloud `.slpk` on an imagery scene. */
export function PointCloudLayerScreen({ ready }: ScreenProps) {
  const { path, status, setStatus } = useProvisionedFile(
    '34da965ca51d4c68aa9b3a38edb29e00',
    'sandiego-north-balboa-pointcloud.slpk'
  );
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!path) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISImagery',
          elevationEnabled: true,
          sceneLayers: [{ id: 'pointcloud', type: 'pointCloud', path }],
          initialCamera: pointCloudCamera,
        }}
        onSceneLoad={() => setStatus('Scene loaded.')}
        onSceneError={(e) => setStatus(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
