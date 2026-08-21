/**
 * Utility-network screens — trace variants, load report, topology validation,
 * associations, container contents, and UN-rule snapping. These use the official
 * Naperville Electric utility network (a signed-in user with access is required
 * to run them, so they are build-verified here).
 */
import {
  ArcgisMapView,
  getUtilityAssociations,
  traceUtilityNetwork,
  validateUtilityNetworkTopology,
  type ArcgisMapViewRef,
  type UtilityFeatureSelector,
  type UtilityTraceType,
} from 'expo-arcgis-maps-sdk';
import { useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const UN_SERVICE =
  'https://sampleserver7.arcgisonline.com/server/rest/services/UtilityNetwork/NapervilleElectric/FeatureServer';
const DEVICE_LAYER = `${UN_SERVICE}/0`;
// A starting device on the electric distribution network (the official sample's area).
const STARTING_POINT: UtilityFeatureSelector = {
  layerUrl: DEVICE_LAYER,
  whereClause: "assetgroup = 3 AND assettype = 7",
};
const NAPERVILLE = { latitude: 41.8, longitude: -88.15 };
const NAPERVILLE_EXTENT = {
  minLatitude: 41.79,
  minLongitude: -88.16,
  maxLatitude: 41.81,
  maxLongitude: -88.14,
};

/** A simple centered "run + status" screen used by the trace/validate demos. */
function ActionScreen({
  ready,
  label,
  initial,
  action,
}: ScreenProps & { label: string; initial: string; action: () => Promise<string> }) {
  const [status, setStatus] = useState(initial);
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={[screenStyles.fill, screenStyles.centered]}>
      <Text style={screenStyles.status}>{status}</Text>
      <View style={{ padding: 12 }}>
        <Button
          title={label}
          onPress={async () => {
            setStatus('Running…');
            try {
              setStatus(await action());
            } catch (error) {
              setStatus(`Failed: ${(error as { code?: string }).code ?? 'error'}`);
            }
          }}
        />
      </View>
    </View>
  );
}

function traceReport(byAssetGroup: Record<string, number>): string {
  const parts = Object.entries(byAssetGroup).map(([group, n]) => `${group}: ${n}`);
  return parts.length ? parts.join(' · ') : 'no elements';
}

async function runTrace(traceType: UtilityTraceType, barriers?: UtilityFeatureSelector[]) {
  const result = await traceUtilityNetwork({
    serviceUrl: UN_SERVICE,
    traceType,
    startingPoints: [STARTING_POINT],
    barriers,
  });
  return `${result.elementCount} element(s) — ${traceReport(result.byAssetGroup)}`;
}

/** `Trace utility network` — a connected trace from a starting device. */
export function TraceScreen(props: ScreenProps) {
  return <ActionScreen {...props} label="Run connected trace" initial="Tap to trace connected features." action={() => runTrace('connected')} />;
}

/** `Analyze network with subnetwork trace` — a subnetwork trace. */
export function SubnetworkTraceScreen(props: ScreenProps) {
  return <ActionScreen {...props} label="Run subnetwork trace" initial="Tap to trace the subnetwork." action={() => runTrace('subnetwork')} />;
}

/** `Run valve isolation trace` — an isolation trace stopped by a barrier. */
export function IsolationTraceScreen(props: ScreenProps) {
  const barrier: UtilityFeatureSelector = { layerUrl: DEVICE_LAYER, whereClause: "assetgroup = 3 AND assettype = 8" };
  return <ActionScreen {...props} label="Run isolation trace" initial="Tap to run an isolation trace." action={() => runTrace('isolation', [barrier])} />;
}

/** `Create load report` — a subnetwork trace summarized by asset group. */
export function LoadReportScreen(props: ScreenProps) {
  return (
    <ActionScreen
      {...props}
      label="Create load report"
      initial="Tap to build a load report from a subnetwork trace."
      action={async () => {
        const result = await traceUtilityNetwork({
          serviceUrl: UN_SERVICE,
          traceType: 'subnetwork',
          startingPoints: [STARTING_POINT],
        });
        return `Load report — ${traceReport(result.byAssetGroup)}`;
      }}
    />
  );
}

/** `Validate network topology` — validate the topology within an extent. */
export function ValidateTopologyScreen(props: ScreenProps) {
  return (
    <ActionScreen
      {...props}
      label="Validate topology"
      initial="Tap to validate the network topology."
      action={async () => {
        const result = await validateUtilityNetworkTopology({
          serviceUrl: UN_SERVICE,
          extent: NAPERVILLE_EXTENT,
        });
        return result.hasErrors ? 'Topology has dirty areas / errors.' : 'Topology is valid.';
      }}
    />
  );
}

/** `Show utility associations` — list connectivity/containment/attachment associations. */
export function AssociationsScreen(props: ScreenProps) {
  return (
    <ActionScreen
      {...props}
      label="Get associations"
      initial="Tap to fetch associations in the extent."
      action={async () => {
        const result = await getUtilityAssociations({ serviceUrl: UN_SERVICE, extent: NAPERVILLE_EXTENT });
        return `${result.associations.length} association(s).`;
      }}
    />
  );
}

/** `Display content of utility network container` — list a container's contents. */
export function ContainerContentsScreen(props: ScreenProps) {
  return (
    <ActionScreen
      {...props}
      label="Get container contents"
      initial="Tap to list containment associations."
      action={async () => {
        const result = await getUtilityAssociations({
          serviceUrl: UN_SERVICE,
          extent: NAPERVILLE_EXTENT,
          kind: 'containment',
        });
        return `${result.associations.length} contained item(s).`;
      }}
    />
  );
}

/** `Snap geometry edits with utility network rules` — edit with snapping enabled. */
export function UtilityNetworkSnapScreen({ ready }: ScreenProps) {
  const mapRef = useRef<ArcgisMapViewRef>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('Start editing; new vertices snap to nearby network features.');

  async function start() {
    try {
      await mapRef.current?.startGeometryEditor({ geometryType: 'polyline', tool: 'vertex', snapEnabled: true });
      setEditing(true);
      setStatus('Snapping is on — tap near a feature to snap the vertex to it.');
    } catch (error) {
      setStatus(`start failed: ${(error as { code?: string }).code ?? 'error'}`);
    }
  }
  async function finish() {
    await mapRef.current?.stopGeometryEditor();
    setEditing(false);
    setStatus('Finished the snapped edit.');
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
          basemap: 'arcGISStreetsNight',
          initialViewpoint: { center: NAPERVILLE, scale: 5_000 },
          layers: [{ id: 'devices', type: 'mapImage', url: UN_SERVICE }],
        }}
      />
      <View style={{ padding: 6, alignItems: 'center' }}>
        {editing ? <Button title="Finish" onPress={finish} /> : <Button title="Start snapped edit" onPress={start} />}
      </View>
      <Text style={screenStyles.status}>{status}</Text>
    </View>
  );
}
