/**
 * Shared helper for provisioning the official samples' local data. Many ArcGIS
 * sample datasets ship as a `.zip` on an ArcGIS Online portal item; this
 * downloads the item once into the app cache, extracts it (keeping the archive
 * layout so multi-file datasets like shapefiles stay together), and returns the
 * local path of a named entry. expo-file-system 57 has no unzip, so we use
 * `fflate` (a tiny pure-JS unzip).
 */
import { unzipSync } from 'fflate';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';

/** ArcGIS-Online portal-item data endpoint for a public item. */
function itemDataUrl(itemId: string): string {
  return `https://www.arcgis.com/sharing/rest/content/items/${itemId}/data`;
}

/** The native SDKs expect a plain filesystem path, not a `file://` URI. */
function toPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/**
 * Downloads a portal item whose data endpoint returns a single raw file (e.g. a
 * `.tpkx` tile package) into the app cache on first run and returns its local
 * path; reuses the cached file thereafter.
 */
export function useProvisionedFile(itemId: string, filename: string) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing data…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, 'arcgis-provisioned');
        if (!dir.exists) dir.create();
        const file = new File(dir, filename);
        if (file.exists) {
          if (!cancelled) {
            setPath(toPath(file.uri));
            setStatus('Loading…');
          }
          return;
        }
        setStatus('Downloading data (first run)…');
        const downloaded = await File.downloadFileAsync(itemDataUrl(itemId), file);
        if (!cancelled) {
          setPath(toPath(downloaded.uri));
          setStatus('Loading…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not load data: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, filename]);

  return { path, status, setStatus };
}

/**
 * Downloads a portal item's `.zip` on first run, extracts every entry into a
 * cache subdirectory, and returns the local path of `mainEntry`. Reuses the
 * extracted files thereafter.
 */
/**
 * Downloads a portal-item `.zip` of image frames, extracts every image entry
 * (png/gif/jpg) into the app cache on first run, and returns their local paths
 * sorted by name (the frame order). A `.frames.json` manifest records the order
 * so later runs reuse the cache without re-walking the tree. Used to feed a
 * scene image overlay's animation frames.
 */
export function useProvisionedZipFrames(itemId: string, dirName: string) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [status, setStatus] = useState('Preparing data…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, dirName);
        const manifest = new File(dir, '.frames.json');
        if (manifest.exists) {
          const names: string[] = JSON.parse(await manifest.text());
          if (!cancelled) {
            setPaths(names.map((name) => toPath(new File(dir, name).uri)));
            setStatus('Loading…');
          }
          return;
        }
        if (!dir.exists) dir.create();
        setStatus('Downloading data (first run)…');
        const zipFile = new File(Paths.cache, `${dirName}.zip`);
        if (zipFile.exists) zipFile.delete();
        const downloaded = await File.downloadFileAsync(itemDataUrl(itemId), zipFile);

        if (cancelled) return;
        setStatus('Extracting frames…');
        const entries = unzipSync(await downloaded.bytes());
        const names = Object.keys(entries)
          .filter((name) => /\.(png|gif|jpe?g)$/i.test(name) && entries[name].length > 0)
          .sort();
        for (const name of names) {
          const out = new File(dir, name);
          out.create({ intermediates: true, overwrite: true });
          out.write(entries[name]);
        }
        manifest.create({ overwrite: true });
        manifest.write(JSON.stringify(names));
        downloaded.delete();

        if (!cancelled) {
          setPaths(names.map((name) => toPath(new File(dir, name).uri)));
          setStatus('Loading…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not load data: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, dirName]);

  return { paths, status };
}

export function useProvisionedZip(itemId: string, dirName: string, mainEntry: string) {
  const [path, setPath] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing data…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dir = new Directory(Paths.cache, dirName);
        const mainFile = new File(dir, mainEntry);
        if (mainFile.exists) {
          if (!cancelled) {
            setPath(toPath(mainFile.uri));
            setStatus('Loading…');
          }
          return;
        }
        if (!dir.exists) dir.create();
        setStatus('Downloading data (first run)…');
        const zipFile = new File(Paths.cache, `${dirName}.zip`);
        if (zipFile.exists) zipFile.delete();
        const downloaded = await File.downloadFileAsync(itemDataUrl(itemId), zipFile);

        if (cancelled) return;
        setStatus('Extracting…');
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
          setStatus('Loading…');
        }
      } catch (error) {
        if (!cancelled) setStatus(`Could not load data: ${String(error)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, dirName, mainEntry]);

  return { path, status, setStatus };
}
