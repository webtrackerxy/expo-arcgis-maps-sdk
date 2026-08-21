/**
 * Routing & Logistics example screens, one per official ArcGIS sample so each
 * shipped capability has its own demo screen (mirrors the Esri samples app).
 */
import {
  ArcgisMapView,
  findClosestFacilities,
  findClosestFacility,
  findServiceArea,
  findServiceAreas,
  solveRoute,
  solveRouteInNetwork,
  type ArcgisGeometry,
  type ArcgisSymbol,
  type GeographicPoint,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';

const STOP_A: GeographicPoint = { latitude: 34.056, longitude: -118.235 };
const STOP_B: GeographicPoint = { latitude: 34.14, longitude: -118.29 };
const BARRIER: ArcgisGeometry = {
  type: 'polygon',
  ring: [
    { latitude: 34.1, longitude: -118.248 },
    { latitude: 34.1, longitude: -118.228 },
    { latitude: 34.078, longitude: -118.228 },
    { latitude: 34.078, longitude: -118.248 },
  ],
};
const FACILITIES: GeographicPoint[] = [
  { latitude: 34.09, longitude: -118.19 },
  { latitude: 34.02, longitude: -118.29 },
  { latitude: 34.15, longitude: -118.25 },
];

const routeLine = { type: 'simpleLine', color: '#7C3AED', width: 4 } as const;
const stopMarker = { type: 'simpleMarker', color: '#111827', size: 12, style: 'circle' } as const;
const facilityMarker = {
  type: 'simpleMarker',
  color: '#2563EB',
  size: 11,
  style: 'square',
} as const;
const barrierFill = {
  type: 'simpleFill',
  color: '#DC262633',
  outline: { type: 'simpleLine', color: '#DC2626', width: 2 },
} as const;
const areaColors = ['#16A34A22', '#16A34A44', '#16A34A77'];

function marker(id: string, point: GeographicPoint, symbol: ArcgisSymbol): GraphicSource {
  return { id, geometry: { type: 'point', point }, symbol };
}
function line(id: string, path: GeographicPoint[]): GraphicSource {
  return { id, geometry: { type: 'polyline', path }, symbol: routeLine };
}
function areaFill(id: string, geometry: ArcgisGeometry, i: number): GraphicSource {
  return {
    id,
    geometry,
    symbol: {
      type: 'simpleFill',
      color: areaColors[Math.min(i, areaColors.length - 1)],
      outline: { type: 'simpleLine', color: '#166534', width: 1 },
    },
  };
}
const stops = [marker('a', STOP_A, stopMarker), marker('b', STOP_B, stopMarker)];

type RunResult = { status: string; graphics: GraphicSource[] };

/** Shared map demo: runs `run` once the SDK is ready and draws the result. */
function RoutingDemo({ ready, run }: ScreenProps & { run: () => Promise<RunResult> }) {
  const [graphics, setGraphics] = useState<GraphicSource[]>([]);
  const [status, setStatus] = useState('Solving…');

  useEffect(() => {
    if (!ready) return;
    let active = true;
    run()
      .then((r) => {
        if (!active) return;
        setStatus(r.status);
        setGraphics(r.graphics);
      })
      .catch((e) => {
        if (!active) return;
        const err = e as { code?: string; message?: string };
        setStatus(err?.message ? `${err.code ?? 'error'}: ${err.message}` : String(e));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <Text style={styles.status}>{status}</Text>
      <ArcgisMapView
        style={screenStyles.fill}
        map={{
          basemap: 'arcGISNavigation',
          initialViewpoint: { center: { latitude: 34.08, longitude: -118.25 }, scale: 400_000 },
          graphics,
        }}
      />
    </View>
  );
}

/** `Find route` — solves a simple A→B route and draws its path. */
export function FindRouteScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await solveRoute([STOP_A, STOP_B]);
        return { status: `Route: ${(r.distanceMeters / 1000).toFixed(1)} km`, graphics: [...stops, line('route', r.path)] };
      }}
    />
  );
}

/** `Display route layer` — solves a route and shows the returned geometry as a route graphics layer. */
export function DisplayRouteLayerScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await solveRoute([STOP_A, STOP_B]);
        return { status: `Route layer drawn (${(r.distanceMeters / 1000).toFixed(1)} km)`, graphics: [...stops, line('route', r.path)] };
      }}
    />
  );
}

/** `Find route around barriers` — routes A→B avoiding a polygon roadblock. */
export function FindRouteBarriersScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await solveRoute([STOP_A, STOP_B], { polygonBarriers: [BARRIER] });
        return {
          status: `Detour: ${(r.distanceMeters / 1000).toFixed(1)} km`,
          graphics: [...stops, { id: 'barrier', geometry: BARRIER, symbol: barrierFill }, line('route', r.path)],
        };
      }}
    />
  );
}

/** `Find closest facility from point` — nearest facility to a single incident. */
export function FindClosestFacilityScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await findClosestFacility({ incident: STOP_A, facilities: FACILITIES });
        return {
          status: `Closest: #${r.facilityIndex} · ${(r.distanceMeters / 1000).toFixed(1)} km`,
          graphics: [
            marker('incident', STOP_A, stopMarker),
            ...FACILITIES.map((f, i) => marker(`fac-${i}`, f, facilityMarker)),
            line('route', r.path),
          ],
        };
      }}
    />
  );
}

/** `Find closest facility to multiple points` — nearest facility per incident. */
export function FindClosestFacilityMultiScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const incidents = [STOP_A, STOP_B];
        const routes = await findClosestFacilities(incidents, FACILITIES);
        return {
          status: `${routes.length} incident(s) routed to nearest facility`,
          graphics: [
            ...incidents.map((p, i) => marker(`inc-${i}`, p, stopMarker)),
            ...FACILITIES.map((f, i) => marker(`fac-${i}`, f, facilityMarker)),
            ...routes.map((r) => line(`route-${r.incidentIndex}`, r.path)),
          ],
        };
      }}
    />
  );
}

/** `Show service area` — drive-time areas around one facility. */
export function ShowServiceAreaScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await findServiceArea({ facility: STOP_A, breaksMinutes: [3, 5, 8] });
        return {
          status: `${r.polygons.length} drive-time areas (3/5/8 min)`,
          graphics: [
            ...r.polygons.map((geometry, i) => areaFill(`area-${i}`, geometry, i)),
            marker('facility', STOP_A, stopMarker),
          ],
        };
      }}
    />
  );
}

/** `Show service areas for multiple facilities` — drive-time areas around several facilities. */
export function ShowServiceAreasMultiScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const areas = await findServiceAreas(FACILITIES, [5, 10]);
        const total = areas.reduce((n, a) => n + a.polygons.length, 0);
        return {
          status: `${total} areas around ${areas.length} facilities (5/10 min)`,
          graphics: [
            ...areas.flatMap((a) => a.polygons.map((geometry, i) => areaFill(`sa-${a.facilityIndex}-${i}`, geometry, i))),
            ...FACILITIES.map((f, i) => marker(`fac-${i}`, f, facilityMarker)),
          ],
        };
      }}
    />
  );
}

/**
 * `Find route in transport network` — routes on a local transportation-network
 * geodatabase. Needs a bundled network dataset; without one the call reports a
 * stable error, which this screen surfaces.
 */
export function FindRouteNetworkScreen(props: ScreenProps) {
  return (
    <RoutingDemo
      {...props}
      run={async () => {
        const r = await solveRouteInNetwork('san_diego.geodatabase', 'Streets_ND', [STOP_A, STOP_B]);
        return { status: `Network route: ${(r.distanceMeters / 1000).toFixed(1)} km`, graphics: [...stops, line('route', r.path)] };
      }}
    />
  );
}

const styles = StyleSheet.create({
  status: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#374151' },
});
