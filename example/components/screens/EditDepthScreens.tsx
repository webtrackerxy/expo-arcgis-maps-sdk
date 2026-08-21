/**
 * Edit-depth screens — the reticle geometry-editor tool, branch versioning, and
 * feature-linked annotation editing.
 */
import {
  ArcgisMapView,
  createServiceVersion,
  getServiceVersions,
  type ArcgisMapViewRef,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

/** `Edit geometries with programmatic reticle tool` — drop vertices under a fixed reticle. */
export function ReticleEditorScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('Start the reticle editor, then tap to drop vertices.');

  async function start() {
    try {
      await mapRef.current?.startGeometryEditor({ geometryType: 'polygon', tool: 'reticle' });
      setEditing(true);
      setStatus('Move the map so the reticle is over a point, then tap to place it.');
    } catch (error) {
      setStatus(`start failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }
  async function finish() {
    try {
      const geometry = await mapRef.current?.stopGeometryEditor();
      setEditing(false);
      setStatus(geometry ? 'Captured a polygon with the reticle tool.' : 'Nothing was drawn.');
    } catch (error) {
      setStatus(`stop failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        ref={mapRef}
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISImagery',
          initialViewpoint: { center: { latitude: 34.056, longitude: -117.19 }, scale: 5_000 },
        }}
      />
      <View style={styles.row}>
        {editing ? (
          <Button title="Finish" onPress={finish} />
        ) : (
          <Button title="Start reticle editor" onPress={start} />
        )}
      </View>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}

// A branch-versioned feature service (needs a signed-in user with version
// privileges to actually create a version).
const BRANCH_SERVICE =
  'https://sampleserver7.arcgisonline.com/server/rest/services/DamageAssessment/FeatureServer';

/** `Edit with branch versioning` — create a new branch version and switch to it. */
/** `List geodatabase versions` — lists the branch versions of the service. */
export function ListVersionsScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Tap “List versions” (needs a signed-in named user).');

  async function run() {
    setStatus('Fetching versions…');
    try {
      const versions = await getServiceVersions(BRANCH_SERVICE);
      setStatus(
        versions.length === 0
          ? 'No versions returned.'
          : versions.map((v) => `${v.name} (${v.access})`).join('\n')
      );
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text style={screenStyles.status}>{status}</Text>
      <View style={{ padding: 12 }}>
        <Button title="List versions" onPress={run} />
      </View>
    </View>
  );
}

export function BranchVersionScreen({ ready }: ScreenProps) {
  const [status, setStatus] = useState('Tap “Create version” (needs a signed-in named user).');

  async function run() {
    setStatus('Creating branch version…');
    try {
      const result = await createServiceVersion({
        serviceUrl: BRANCH_SERVICE,
        versionName: `edits_${Date.now()}`,
        description: 'Created from the example app',
        access: 'private',
      });
      setStatus(`Switched to version "${result.versionName}".`);
    } catch (error) {
      setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text style={screenStyles.status}>{status}</Text>
      <View style={{ padding: 12 }}>
        <Button title="Create version" onPress={run} />
      </View>
    </View>
  );
}

// The official feature-linked annotation service: editing a feature moves its
// linked annotation automatically.
const FEATURE_LINKED_ANNOTATION =
  'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/LoudounAddresses/FeatureServer/0';
const FEATURE_LINKED_ANNOTATION_LAYER =
  'https://services2.arcgis.com/ZQgQTuoyBrtmoGdP/arcgis/rest/services/LoudounAddresses/FeatureServer/1';

/** `Edit features with feature-linked annotation` — annotation follows its feature. */
export function FeatureLinkedAnnotationScreen({ ready }: ScreenProps) {
  const [info, setInfo] = useState('Loading features + linked annotation…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISLightGray',
          initialViewpoint: { center: { latitude: 39.083, longitude: -77.65 }, scale: 2_000 },
          layers: [
            { id: 'addresses', type: 'annotation', url: FEATURE_LINKED_ANNOTATION_LAYER },
          ],
          featureLayers: [{ id: 'points', url: FEATURE_LINKED_ANNOTATION }],
        }}
        onMapLoad={() => setInfo('Editing a feature moves its linked annotation with it.')}
        onMapError={(e) => setInfo(`map error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6 },
});
