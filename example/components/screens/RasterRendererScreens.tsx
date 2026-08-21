/**
 * Raster-renderer screens that apply a renderer to a *local* raster file, matching
 * the official "Apply RGB renderer" and "Apply colormap renderer to raster" samples.
 *
 * The official samples ship the Shasta GeoTIFFs in the app bundle. We provision the
 * exact same data the way the other local-data screens do: download the raster's
 * ArcGIS Online portal item (a `.zip`) once into the app cache, extract it — keeping
 * the GeoTIFF's sidecar files (`.tfw`, `.aux.xml`, `.ovr`) next to it — and hand the
 * native view the extracted file path.
 */
import { unzipSync } from 'fflate';
import { Directory, File, Paths } from 'expo-file-system';
import { ArcgisMapView, type ArcgisLayerSource } from 'expo-arcgis-maps-sdk';
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
 * Downloads a portal item's raster `.zip` on first run, extracts every entry into a
 * cache subdirectory (preserving the archive layout so sidecar files stay beside the
 * GeoTIFF), and returns the local path of `mainEntry`. Reuses the extracted file
 * thereafter.
 */
function useProvisionedRaster(itemId: string, dirName: string, mainEntry: string) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing raster…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, dirName);
        const mainFile = new File(dir, mainEntry);
        if (mainFile.exists) {
          if (!cancelled) {
            setPath(toPath(mainFile.uri));
            setStatus('Loading raster…');
          }
          return;
        }
        if (!dir.exists) dir.create();
        setStatus('Downloading raster (first run, ~7–22 MB)…');
        const zipFile = new File(Paths.cache, `${dirName}.zip`);
        if (zipFile.exists) zipFile.delete();
        const downloaded = await File.downloadFileAsync(itemDataUrl(itemId), zipFile);

        if (cancelled) return;
        setStatus('Extracting raster…');
        const entries = unzipSync(await downloaded.bytes());
        for (const [name, data] of Object.entries(entries)) {
          if (name.endsWith('/') || data.length === 0) continue;
          const out = new File(dir, name);
          out.create({ intermediates: true, overwrite: true });
          out.write(data);
        }
        downloaded.delete();

        if (!cancelled) {
          setPath(toPath(mainFile.uri));
          setStatus('Loading raster…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not load raster: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, dirName, mainEntry]);

  return { path, status, setStatus };
}

// Both Shasta GeoTIFFs cover the same ~4.9 × 4.1 km scene near Redding, California.
const SHASTA_VIEWPOINT = { center: { latitude: 40.7623, longitude: -122.1627 }, scale: 50_000 };

function RasterScreen({
  ready,
  layer,
  status,
  setStatus,
}: ScreenProps & {
  layer: ArcgisLayerSource | null;
  status: string;
  setStatus: (s: string) => void;
}) {
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!layer) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImageryStandard',
          initialViewpoint: SHASTA_VIEWPOINT,
          layers: [layer],
        }}
        onMapLoad={() => setStatus('Raster loaded.')}
        onMapError={(e) => setStatus(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

/** `Apply RGB renderer` — a 3-band aerial GeoTIFF mapped to R/G/B with a percent-clip stretch. */
export function RgbRasterScreen(props: ScreenProps) {
  const { path, status, setStatus } = useProvisionedRaster(
    '7c4c679ab06a4df19dc497f577f111bd',
    'raster-rgb',
    'raster-file/Shasta.tif'
  );
  const layer: ArcgisLayerSource | null = path
    ? {
        id: 'shasta-rgb',
        type: 'raster',
        path,
        rgb: { bandIndices: [0, 1, 2], stretch: { type: 'percentClip', minPercent: 2, maxPercent: 2 } },
      }
    : null;
  return <RasterScreen {...props} layer={layer} status={status} setStatus={setStatus} />;
}

/** `Apply colormap renderer to raster` — a single-band GeoTIFF recoloured by a value→colour ramp. */
export function ColormapRasterScreen(props: ScreenProps) {
  const { path, status, setStatus } = useProvisionedRaster(
    'cc68728b5904403ba637e1f1cd2995ae',
    'raster-colormap',
    'ShastaBW.tif'
  );
  const layer: ArcgisLayerSource | null = path
    ? { id: 'shasta-colormap', type: 'raster', path, colormap: { colors: rainbow(256) } }
    : null;
  return <RasterScreen {...props} layer={layer} status={status} setStatus={setStatus} />;
}

/**
 * `Apply blend renderer to hillshade` — blends the Shasta colour GeoTIFF with a
 * hillshade computed from the single-band Shasta elevation GeoTIFF, giving the
 * imagery 3D shaded relief. Both rasters are the official Shasta data.
 */
export function BlendRasterScreen(props: ScreenProps) {
  const color = useProvisionedRaster(
    '7c4c679ab06a4df19dc497f577f111bd',
    'raster-rgb',
    'raster-file/Shasta.tif'
  );
  const elevation = useProvisionedRaster(
    'cc68728b5904403ba637e1f1cd2995ae',
    'raster-colormap',
    'ShastaBW.tif'
  );
  const layer: ArcgisLayerSource | null =
    color.path && elevation.path
      ? {
          id: 'shasta-blend',
          type: 'raster',
          path: color.path,
          blend: {
            elevationPath: elevation.path,
            altitudeDegrees: 45,
            azimuthDegrees: 315,
            zFactor: 1,
          },
        }
      : null;
  return (
    <RasterScreen
      {...props}
      layer={layer}
      status={color.path ? elevation.status : color.status}
      setStatus={elevation.setStatus}
    />
  );
}

/** A rainbow gradient of `n` hex colours (pixel value `i` → `colors[i]`). */
function rainbow(n: number): string[] {
  const hex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return Array.from({ length: n }, (_, i) => {
    const h = (i / n) * 300; // 0°(red) → 300°(magenta)
    const x = 1 - Math.abs(((h / 60) % 2) - 1);
    const [r, g, b] =
      h < 60
        ? [1, x, 0]
        : h < 120
          ? [x, 1, 0]
          : h < 180
            ? [0, 1, x]
            : h < 240
              ? [0, x, 1]
              : [x, 0, 1];
    return `#${hex(r * 255)}${hex(g * 255)}${hex(b * 255)}`;
  });
}
