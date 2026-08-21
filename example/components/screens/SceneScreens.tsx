/**
 * Scenes example screens, one per official ArcGIS sample so each shipped 3D
 * capability has its own demo (mirrors the Esri samples app).
 */
import {
  ArcgisSceneView,
  type ArcgisSceneSource,
  type Camera,
  type GraphicSource,
} from 'expo-arcgis-maps-sdk';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Centered } from '../Centered';
import { type ScreenProps } from '../constants';
import { screenStyles } from '../styles';
import { useProvisionedZipFrames } from './provisioning';

/** Shared scene demo: renders a scene source and reports load status. */
function SceneDemo({ ready, scene }: ScreenProps & { scene: ArcgisSceneSource }) {
  const [info, setInfo] = useState('Loading 3D scene…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={scene}
        onSceneLoad={() => setInfo('Scene loaded.')}
        onSceneError={(e) => setInfo(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// Camera positions match the official ArcGIS Maps SDK for Swift samples 1:1.
const stuttgartCamera: Camera = {
  latitude: 48.84553,
  longitude: 9.16275,
  altitude: 350,
  heading: 0,
  pitch: 75,
};
const gironaCamera: Camera = {
  latitude: 41.9906,
  longitude: 2.8259,
  altitude: 200,
  heading: 190,
  pitch: 65,
};
// `Add scene layer from service` frames the Esri3D buildings over Portland, OR.
const cityCamera: Camera = {
  latitude: 45.517,
  longitude: -122.67,
  altitude: 175,
  heading: 215,
  pitch: 75,
};
const terrainCamera: Camera = {
  latitude: 46.75792,
  longitude: -119.9489,
  altitude: 3000,
  heading: 0,
  pitch: 75,
};

/** `Add 3D tiles layer` — an OGC 3D Tiles layer over Stuttgart. */
export function Add3DTilesLayerScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [
          {
            id: 'tiles',
            type: '3dTiles',
            url: 'https://tiles.arcgis.com/tiles/ZQgQTuoyBrtmoGdP/arcgis/rest/services/Stuttgart/3DTilesServer/tileset.json',
          },
        ],
        initialCamera: stuttgartCamera,
      }}
    />
  );
}

/** `Add integrated mesh layer` — an integrated mesh of Girona, Spain. */
export function IntegratedMeshLayerScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [
          {
            id: 'mesh',
            type: 'integratedMesh',
            url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Girona_Spain/SceneServer',
          },
        ],
        initialCamera: gironaCamera,
      }}
    />
  );
}

/** `Add scene layer from service` — an ArcGIS 3D object scene layer of buildings. */
export function SceneServiceLayerScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [
          {
            id: 'buildings',
            url: 'https://basemaps3d.arcgis.com/arcgis/rest/services/Esri3D_Buildings_v1/SceneServer',
          },
        ],
        initialCamera: cityCamera,
      }}
    />
  );
}

/** `Apply terrain exaggeration` — exaggerates the elevation surface 3×. */
export function TerrainExaggerationScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        terrainExaggeration: 3,
        initialCamera: terrainCamera,
      }}
    />
  );
}

/** `Set surface navigation constraint` — keeps the camera above the surface. */
export function SurfaceNavigationConstraintScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        surfaceNavigationConstraint: 'stayAbove',
        initialCamera: terrainCamera,
      }}
    />
  );
}

// `Set atmosphere effect in scene` looks up from the ground in Iceland.
const icelandCamera: Camera = {
  latitude: 64.416919,
  longitude: -14.483728,
  altitude: 0,
  heading: 318,
  pitch: 105,
};

/** `Set atmosphere effect in scene` — a realistic atmosphere around the globe. */
export function AtmosphereEffectScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        atmosphereEffect: 'realistic',
        initialCamera: icelandCamera,
      }}
    />
  );
}

// `Show realistic light and shadows` frames the DevA building shells, Portland.
const lightingCamera: Camera = {
  latitude: 45.54605,
  longitude: -122.69033,
  altitude: 500,
  heading: 0,
  pitch: 75,
};

/** `Show realistic light and shadows` — directional sunlight with cast shadows. */
export function RealisticLightingScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sunLighting: 'lightAndShadows',
        sceneLayers: [
          {
            id: 'buildings',
            url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/DevA_BuildingShells/SceneServer',
          },
        ],
        initialCamera: lightingCamera,
      }}
    />
  );
}

/**
 * `Orbit camera around object` — locks the camera into an orbit around a target;
 * dragging orbits the point instead of free-flying.
 *
 * The official sample orbits a 3D plane model (a `Graphic`) via an
 * `OrbitGeoElementCameraController`. This module exposes the location-based
 * `orbitLocation` controller, so here the camera orbits the Girona integrated
 * mesh's location; orbiting a graphic/geoelement is a later addition.
 */
export function OrbitCameraScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [
          {
            id: 'mesh',
            type: 'integratedMesh',
            url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Girona_Spain/SceneServer',
          },
        ],
        cameraController: {
          type: 'orbitLocation',
          target: { latitude: 41.9906, longitude: 2.8259, altitude: 50 },
          distanceMeters: 800,
        },
      }}
    />
  );
}

/** `Configure scene environment` — combines a realistic atmosphere and sun lighting. */
export function ConfigureSceneEnvironmentScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        atmosphereEffect: 'realistic',
        sunLighting: 'lightAndShadows',
        initialCamera: terrainCamera,
      }}
    />
  );
}

// `Style point with scene symbol` — six 3D primitives over the Champagne region,
// matching the official sample's camera, coordinates, and 200 m symbol sizes.
const sceneSymbolCamera: Camera = {
  latitude: 48.973,
  longitude: 4.92,
  altitude: 2082,
  heading: 60,
  pitch: 75,
};
const SCENE_SYMBOL_STYLES = [
  'cone',
  'cube',
  'cylinder',
  'diamond',
  'sphere',
  'tetrahedron',
] as const;
const SCENE_SYMBOL_COLORS = ['#D9534F', '#5CB85C', '#5BC0DE', '#F0AD4E', '#9B59B6', '#E67E22'];

/** `Style point with scene symbol` — one of each 3D marker primitive. */
export function SceneSymbolScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: sceneSymbolCamera,
        graphicsOverlays: [
          {
            id: 'scene-symbols',
            surfacePlacement: 'absolute',
            graphics: SCENE_SYMBOL_STYLES.map((style, i) => ({
              id: `symbol-${style}`,
              geometry: {
                type: 'point',
                point: { latitude: 49, longitude: 4.975 + 0.01 * i, altitude: 500 },
              },
              symbol: {
                type: 'simpleMarkerScene',
                style,
                color: SCENE_SYMBOL_COLORS[i],
                height: 200,
                width: 200,
                depth: 200,
              },
            })),
          },
        ],
      }}
    />
  );
}

// `Show extruded graphics` — a 6×4 grid of polygons extruded by a `[height]`
// attribute, matching the official sample's grid layout over Nepal.
const extrudedGraphicsCamera: Camera = {
  latitude: 28.4,
  longitude: 83,
  altitude: 20_000,
  heading: 10,
  pitch: 70,
};
const GRID_SQUARE = 0.01;
const GRID_SPACING = 0.01;

function extrudedGridGraphics(): GraphicSource[] {
  const startX = 83 - 0.01;
  const startY = 28.4 + 0.25;
  const graphics: GraphicSource[] = [];
  for (let col = 0; col < 6; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      const x = startX + col * (GRID_SQUARE + GRID_SPACING);
      const y = startY + row * (GRID_SQUARE + GRID_SPACING);
      // Deterministic heights (the official sample randomizes 0–10 000 m).
      const height = 1_000 + ((col * 4 + row) % 10) * 900;
      graphics.push({
        id: `cell-${col}-${row}`,
        geometry: {
          type: 'polygon',
          ring: [
            { latitude: y, longitude: x },
            { latitude: y + GRID_SQUARE, longitude: x },
            { latitude: y + GRID_SQUARE, longitude: x + GRID_SQUARE },
            { latitude: y, longitude: x + GRID_SQUARE },
          ],
        },
        symbol: { type: 'simpleFill', color: '#FF0000' },
        attributes: { height },
      });
    }
  }
  return graphics;
}

/** `Show extruded graphics` — polygons raised into 3D volumes by an attribute. */
export function ExtrudedGraphicsScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: extrudedGraphicsCamera,
        graphicsOverlays: [
          {
            id: 'extruded',
            surfacePlacement: 'drapedBillboarded',
            renderer: {
              type: 'simple',
              symbol: {
                type: 'simpleFill',
                color: '#FF0000',
                outline: { type: 'simpleLine', color: '#FFFFFF', width: 1 },
              },
            },
            extrusion: { expression: '[height]', mode: 'baseHeight' },
            graphics: extrudedGridGraphics(),
          },
        ],
      }}
    />
  );
}

// `Show exploratory viewshed from point in scene` frames the Brest, France
// building scene layer over WorldElevation3D terrain — the exact data the
// official sample uses.
const brestBuildingsUrl =
  'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Buildings_Brest/SceneServer/layers/0';

const brestCamera: Camera = {
  latitude: 48.398,
  longitude: -4.503,
  altitude: 250,
  heading: 20,
  pitch: 70,
};

/** `Show exploratory viewshed from point in scene` — visible (green) vs obstructed (red). */
export function ViewshedScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            // Official location/perspective: Point(-4.50, 48.4, z 100).
            type: 'viewshed',
            location: { latitude: 48.4, longitude: -4.5, altitude: 100 },
            headingDegrees: 20,
            pitchDegrees: 70,
            horizontalAngleDegrees: 45,
            verticalAngleDegrees: 90,
            minDistanceMeters: 50,
            maxDistanceMeters: 1000,
          },
        ],
      }}
    />
  );
}

// `Show exploratory line of sight between points` uses WorldElevation3D terrain
// over the Andes in Patagonia (no building layer) — the official sample's data.
const patagoniaCamera: Camera = {
  latitude: -49.346,
  longitude: -73.087,
  altitude: 5046,
  heading: 11,
  pitch: 62,
};

/** `Show line of sight in scene` — the sight line's visible vs obstructed segments. */
export function LineOfSightScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        initialCamera: patagoniaCamera,
        analyses: [
          {
            // Observer on a ridge, target across the valley; terrain occludes the line.
            type: 'lineOfSight',
            observer: { latitude: -49.35, longitude: -73.1, altitude: 3000 },
            target: { latitude: -49.34, longitude: -73.06, altitude: 2000 },
          },
        ],
      }}
    />
  );
}

/**
 * `Show exploratory viewshed from camera in scene` — a viewshed pinned to the
 * camera, so it always shows what is visible from the current point of view as
 * you navigate the Brest buildings scene.
 */
export function CameraViewshedScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            type: 'cameraViewshed',
            horizontalAngleDegrees: 90,
            verticalAngleDegrees: 60,
            minDistanceMeters: 20,
            maxDistanceMeters: 1200,
          },
        ],
      }}
    />
  );
}

/**
 * `Show interactive viewshed with analysis overlay` — a viewshed you reposition
 * by tapping the scene; it starts over the Brest buildings and moves to each
 * tapped point.
 */
export function InteractiveViewshedScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            type: 'interactiveViewshed',
            location: { latitude: 48.4, longitude: -4.5, altitude: 100 },
            headingDegrees: 20,
            pitchDegrees: 70,
            horizontalAngleDegrees: 90,
            verticalAngleDegrees: 90,
            minDistanceMeters: 20,
            maxDistanceMeters: 1000,
          },
        ],
      }}
    />
  );
}

/**
 * `Show exploratory viewshed from geoelement in scene` — a viewshed carried by a
 * graphic (geoelement) placed over the Brest buildings, shading visible (green)
 * vs obstructed (red) from that observer.
 */
export function GeoElementViewshedScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            type: 'geoElementViewshed',
            location: { latitude: 48.4, longitude: -4.5, altitude: 100 },
            headingDegrees: 20,
            pitchDegrees: 70,
            horizontalAngleDegrees: 45,
            verticalAngleDegrees: 90,
            minDistanceMeters: 50,
            maxDistanceMeters: 1000,
          },
        ],
      }}
    />
  );
}

/**
 * `Show exploratory line of sight between geoelements` — the sight line between
 * two graphics (geoelements), coloured by its visible vs obstructed segments as
 * the Brest buildings occlude it.
 */
export function GeoElementLineOfSightScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            type: 'geoElementLineOfSight',
            observer: { latitude: 48.3975, longitude: -4.505, altitude: 60 },
            target: { latitude: 48.4, longitude: -4.5, altitude: 40 },
          },
        ],
      }}
    />
  );
}

/**
 * `Measure distance in scene` — the direct/horizontal/vertical distance between
 * two points over the Brest buildings, drawn as a measurement line.
 */
export function DistanceMeasurementScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISImagery',
        elevationEnabled: true,
        sceneLayers: [{ id: 'buildings', url: brestBuildingsUrl }],
        initialCamera: brestCamera,
        analyses: [
          {
            type: 'distanceMeasurement',
            startLocation: { latitude: 48.3975, longitude: -4.505, altitude: 20 },
            endLocation: { latitude: 48.4, longitude: -4.5, altitude: 80 },
            unitSystem: 'metric',
          },
        ],
      }}
    />
  );
}

// `Apply scene property expressions` orients cone symbols by per-graphic
// HEADING/PITCH attributes over a topographic scene (matching the official
// sample's cone + heading/pitch controls).
const orientationCamera: Camera = {
  latitude: 51.9,
  longitude: 4.4,
  altitude: 800,
  heading: 20,
  pitch: 70,
};

/**
 * `Apply scene property expressions` — a renderer whose scene-property
 * expressions rotate each cone from its own `[HEADING]` / `[PITCH]` attributes.
 */
export function SceneOrientationScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: orientationCamera,
        graphicsOverlays: [
          {
            id: 'oriented-cones',
            surfacePlacement: 'absolute',
            renderer: {
              type: 'simple',
              symbol: {
                type: 'simpleMarkerScene',
                style: 'cone',
                color: '#FF3B30',
                height: 200,
                width: 80,
                depth: 80,
              },
            },
            // Each cone reads its own heading/pitch from these expressions.
            orientationExpressions: {
              headingExpression: '[HEADING]',
              pitchExpression: '[PITCH]',
            },
            graphics: [0, 1, 2, 3, 4].map((i) => ({
              id: `cone-${i}`,
              geometry: {
                type: 'point',
                point: { latitude: 51.91, longitude: 4.39 + 0.006 * i, altitude: 300 },
              },
              // Per-graphic symbol satisfies validation; the overlay renderer
              // (with its orientation expressions) is what actually draws them.
              symbol: {
                type: 'simpleMarkerScene',
                style: 'cone',
                color: '#FF3B30',
                height: 200,
                width: 80,
                depth: 80,
              },
              attributes: { HEADING: i * 45, PITCH: i * 20 },
            })),
          },
        ],
      }}
    />
  );
}

// `Animate images with image overlay` loops the official Pacific Southwest
// precipitation radar image frames over the region (portal item + extent from
// the Esri sample). The frames are provisioned (downloaded + unzipped) on first
// run.
const PACIFIC_SW_FRAMES_ITEM = '9465e8c02b294c69bdb42de056a23ab1';
const pacificSwExtent = {
  minLatitude: 32.06553304282765,
  minLongitude: -120.0724273439448,
  maxLatitude: 47.9739001080052,
  maxLongitude: -101.9057823429228,
};
const pacificSwCamera: Camera = {
  latitude: 34.0,
  longitude: -110.9,
  altitude: 2_500_000,
  heading: 0,
  pitch: 0,
};

/** `Animate images with image overlay` — an animated radar/precipitation loop. */
export function ImageOverlayScreen({ ready }: ScreenProps) {
  const { paths, status } = useProvisionedZipFrames(PACIFIC_SW_FRAMES_ITEM, 'pacific-sw-frames');
  const [info, setInfo] = useState('Loading 3D scene…');
  if (!ready) {
    return <Centered text="Waiting for configuration…" />;
  }
  if (!paths) {
    return <Centered text={status} />;
  }
  return (
    <View style={screenStyles.fill}>
      <ArcgisSceneView
        style={screenStyles.fill}
        scene={{
          basemap: 'arcGISOceans',
          elevationEnabled: true,
          initialCamera: pacificSwCamera,
          imageOverlays: [
            {
              id: 'radar',
              imagePaths: paths,
              extent: pacificSwExtent,
              framesPerSecond: 15,
              opacity: 0.65,
            },
          ],
        }}
        onSceneLoad={() => setInfo(`Animating ${paths.length} frames.`)}
        onSceneError={(e) => setInfo(`scene error: ${e.nativeEvent.code}`)}
      />
      <Text style={screenStyles.status}>{info}</Text>
    </View>
  );
}

// `Show extruded features` extrudes US states by population; the camera looks
// down from high altitude (matching the official sample).
const censusStatesUrl =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3';
const extrudedFeaturesCamera: Camera = {
  latitude: 20.513652,
  longitude: -99.659448,
  altitude: 12_940_924,
  heading: 0,
  pitch: 15,
};

/** `Show extruded features` — a feature layer extruded into 3D by an attribute. */
export function ExtrudedFeaturesScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: extrudedFeaturesCamera,
        featureLayers: [
          {
            id: 'states',
            url: censusStatesUrl,
            renderer: {
              type: 'simple',
              symbol: {
                type: 'simpleFill',
                color: '#3F7FBF',
                outline: { type: 'simpleLine', color: '#FFFFFF80', width: 1 },
              },
            },
            extrusion: { expression: '[POP2007] / 10', mode: 'baseHeight' },
          },
        ],
      }}
    />
  );
}

/**
 * `Show labels on layer in 3D` — loads the official New York City infrastructure
 * web scene and labels the "Gas Main" feature layer (nested in the "Gas" group)
 * with each pipe's installation date, exactly like the ArcGIS sample.
 */
export function Labels3DScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        webSceneItemId: '850dfee7d30f4d9da0ebca34a533c169',
        webSceneLayerLabels: [
          {
            layerPath: ['Gas', 'Gas Main'],
            labels: [
              {
                expression: 'Text($feature.INSTALLATIONDATE, `DD MMM YY`)',
                arcade: true,
                color: '#FFA500',
                size: 16,
                haloColor: '#FFFFFF',
                haloWidth: 2,
                placement: 'lineAboveAlong',
              },
            ],
          },
        ],
      }}
    />
  );
}

// `Apply renderers to scene layer` re-symbolizes the Helsinki buildings scene
// layer; the official sample frames the city centre from this camera.
const helsinkiSceneUrl =
  'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Helsinki_buildings/SceneServer';
const helsinkiCamera: Camera = {
  latitude: 60.17,
  longitude: 24.96,
  altitude: 387,
  heading: 308.9,
  pitch: 50.7,
};

/** `Apply renderers to scene layer` — tint a scene layer's 3D buildings via a mesh renderer. */
export function SceneLayerRendererScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: helsinkiCamera,
        sceneLayers: [
          {
            id: 'helsinki',
            url: helsinkiSceneUrl,
            // A single-symbol renderer recolours every building mesh.
            renderer: { type: 'simple', symbol: { type: 'meshFill', color: '#FF8C00' } },
          },
        ],
      }}
    />
  );
}

// `Set feature layer rendering mode on scene` drapes the Energy/Geology feature
// layers on a scene, forcing dynamic rendering (smoother during navigation).
const geologyBase =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Energy/Geology/FeatureServer';
const geologyCamera: Camera = {
  latitude: 34.36,
  longitude: -118.45,
  altitude: 3500,
  heading: 90,
  pitch: 65,
};

/** `Set feature layer rendering mode on scene` — feature layers rendered dynamically in 3D. */
export function SceneRenderingModeScreen(props: ScreenProps) {
  return (
    <SceneDemo
      {...props}
      scene={{
        basemap: 'arcGISTopographic',
        elevationEnabled: true,
        initialCamera: geologyCamera,
        featureLayers: [
          { id: 'geology-polygon', url: `${geologyBase}/0`, renderingMode: 'dynamic' },
          { id: 'geology-polyline', url: `${geologyBase}/8`, renderingMode: 'dynamic' },
          { id: 'geology-point', url: `${geologyBase}/9`, renderingMode: 'dynamic' },
        ],
      }}
    />
  );
}
