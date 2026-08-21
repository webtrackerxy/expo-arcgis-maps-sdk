import * as Sdk from '../index';
import type {
  ArcadeEvaluationResult,
  ArcgisMapViewProps,
  ArcgisSceneSource,
  CoordinateFormats,
  ExportImageResult,
  NavigationOptions,
  NavigationStatusEventPayload,
  SceneGraphicsOverlay,
} from '../index';

// The public entry pulls in the native view wrapper; stub the native runtime so
// the module graph loads under Node without a device. `jest.mock` is hoisted
// above the import by babel-jest, so the stub is in place before `../index`
// evaluates.
jest.mock('expo', () => ({
  requireNativeView: () => () => null,
  requireNativeModule: () => ({ configure: jest.fn() }),
  registerWebModule: (klass: unknown) => klass,
  NativeModule: class {},
}));

describe('public exports', () => {
  it('exports the component and configuration function', () => {
    expect(typeof Sdk.ArcgisMapView).toBe('object'); // forwardRef object
    expect(typeof Sdk.configureArcgis).toBe('function');
  });

  it('exports the error contract helpers and codes', () => {
    expect(typeof Sdk.toArcgisError).toBe('function');
    expect(typeof Sdk.isArcgisError).toBe('function');
    expect(Sdk.ARCGIS_ERROR_CODES).toContain('E_UNSUPPORTED');
    expect(Sdk.ArcgisSdkError).toBeDefined();
  });

  it('exposes the exportImage result contract', () => {
    // Compile-time check that ExportImageResult is exported with the documented
    // shape; the value assertion keeps the type in use at runtime.
    const result: ExportImageResult = { uri: 'file:///map.png', width: 320, height: 240 };
    expect(result).toEqual({ uri: 'file:///map.png', width: 320, height: 240 });
  });

  it('exposes the Arcade evaluation result contract', () => {
    // Compile-time check that ArcadeEvaluationResult is exported with the
    // documented shape; the value assertion keeps the type in use at runtime.
    const result: ArcadeEvaluationResult = { sourceId: 'crimes', value: '42' };
    expect(result).toEqual({ sourceId: 'crimes', value: '42' });
  });

  it('accepts the declarative scaleBar prop', () => {
    // Compile-time check that `scaleBar` is part of the public props contract.
    const props: ArcgisMapViewProps = { map: { basemap: 'arcGISTopographic' }, scaleBar: true };
    expect(props.scaleBar).toBe(true);
  });

  it('accepts declarative map scale limits and a max extent', () => {
    // Compile-time check that scale/extent constraints are part of the map DTO.
    const props: ArcgisMapViewProps = {
      map: {
        basemap: 'arcGISTopographic',
        minScale: 10_000_000,
        maxScale: 1_000,
        referenceScale: 50_000,
        maxExtent: { minLatitude: 33, minLongitude: -119, maxLatitude: 35, maxLongitude: -117 },
      },
    };
    expect(props.map.maxScale).toBe(1_000);
  });

  it('accepts the declarative grid prop and map background color', () => {
    const props: ArcgisMapViewProps = {
      map: { basemap: 'arcGISTopographic', backgroundColor: '#101820' },
      grid: 'utm',
    };
    expect(props.grid).toBe('utm');
    expect(Sdk.isMapGrid('mgrs')).toBe(true);
    expect(Sdk.isMapGrid('nope')).toBe(false);
    expect(Sdk.MAP_GRIDS).toContain('latitudeLongitude');
  });

  it('accepts the declarative locationDisplay prop and onLocationUpdate event', () => {
    const props: ArcgisMapViewProps = {
      map: { basemap: 'arcGISTopographic' },
      locationDisplay: { enabled: true, autoPanMode: 'recenter', showAccuracy: true },
      onLocationUpdate: () => {},
    };
    expect(props.locationDisplay?.enabled).toBe(true);
    expect(typeof props.onLocationUpdate).toBe('function');
  });

  it('exports the coordinate formatter and its result type', () => {
    expect(typeof Sdk.formatCoordinates).toBe('function');
    const formats: CoordinateFormats = {
      decimalDegrees: '0N 0E',
      degreesMinutesSeconds: '0 0',
      usng: 'x',
      mgrs: 'x',
      utm: 'x',
    };
    expect(formats.utm).toBe('x');
  });

  it('accepts the onNavigationStatus event and its payload contract', () => {
    // Compile-time check that turn-by-turn navigation is part of the public
    // props/event contract with the documented payload shape.
    const payload: NavigationStatusEventPayload = {
      maneuver: 'Turn left',
      distanceRemainingMeters: 1200,
      timeRemainingMinutes: 3.5,
      isOnRoute: true,
    };
    const props: ArcgisMapViewProps = {
      map: { basemap: 'arcGISNavigation' },
      onNavigationStatus: () => {},
    };
    const options: NavigationOptions = { reroute: true };
    expect(payload.isOnRoute).toBe(true);
    expect(typeof props.onNavigationStatus).toBe('function');
    expect(options.reroute).toBe(true);
  });

  it('accepts a time offset on a feature layer source', () => {
    // Compile-time check that `timeOffset` is part of the feature-layer contract.
    const props: ArcgisMapViewProps = {
      map: {
        basemap: 'arcGISTopographic',
        featureLayers: [
          { id: 'a', url: 'https://x/FeatureServer/0', timeOffset: { value: -10, unit: 'years' } },
        ],
      },
    };
    expect(props.map.featureLayers?.[0].timeOffset?.unit).toBe('years');
  });

  it('exports basemap helpers and the WGS84 constant', () => {
    expect(Sdk.isBasemapStyle('arcGISTopographic')).toBe(true);
    expect(Sdk.isBasemapStyle('nope')).toBe(false);
    expect(Sdk.BASEMAP_STYLES.length).toBeGreaterThan(0);
    expect(Sdk.WGS84).toEqual({ wkid: 4326 });
  });

  it('exports the ArcgisSceneView component', () => {
    expect(typeof Sdk.ArcgisSceneView).toBe('object'); // forwardRef object
  });

  it('exports the ArcgisArView component and the isArSupported probe', () => {
    expect(typeof Sdk.ArcgisArView).toBe('object'); // forwardRef object
    expect(typeof Sdk.isArSupported).toBe('function');
  });

  it('accepts a 3D graphics overlay with a scene symbol and extrusion on a scene source', () => {
    // Compile-time check that scene graphics overlays, 3D scene symbols, and
    // extrusion are part of the public scene contract.
    const overlay: SceneGraphicsOverlay = {
      id: 'markers',
      surfacePlacement: 'absolute',
      renderer: { type: 'simple', symbol: { type: 'simpleFill', color: '#FF000080' } },
      extrusion: { expression: '[height]', mode: 'baseHeight' },
      graphics: [
        {
          id: 'g1',
          geometry: { type: 'point', point: { latitude: 49, longitude: 4.9 } },
          symbol: { type: 'simpleMarkerScene', style: 'sphere', color: '#00FF00', height: 200 },
          attributes: { height: 5000 },
        },
      ],
    };
    const scene: ArcgisSceneSource = { basemap: 'arcGISTopographic', graphicsOverlays: [overlay] };
    expect(scene.graphicsOverlays?.[0].graphics[0].symbol.type).toBe('simpleMarkerScene');
    expect(scene.graphicsOverlays?.[0].extrusion?.mode).toBe('baseHeight');
  });
});
